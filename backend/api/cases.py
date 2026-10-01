"""Explicit quote requests. Enable only on a backed-up persistent volume.

Staff access is separate from anonymous demo sessions. Packages are never public.
"""
import base64
import hashlib
import hmac
import html
import io
import json
import os
import re
import smtplib
import sqlite3
import ssl
import uuid
import zipfile
from contextlib import contextmanager
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator
from .access import limit, require_session
from .ai_architect import _load_drawings

router = APIRouter()
SLUGS = {"kjeller", "bruksendring", "vegg", "garasje", "tilbygg", "fasade", "tak", "anneks", "levegg", "tilleggsdel", "boenhet", "brygge", "andre", "vindu", "geolograpport"}


def ready():
    return (os.getenv("CASE_STORAGE_READY") == "true" and bool(os.getenv("CASE_STORAGE_DIR"))
            and len(os.getenv("STAFF_API_KEY", "")) >= 32
            and all(os.getenv(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "CASE_EMAIL_FROM", "CASE_NOTIFY_EMAIL")))


@contextmanager
def database():
    if not ready():
        raise HTTPException(503, "Saksmottak er ikke aktivert. Ingenting er sendt. Prøv igjen senere.")
    root = Path(os.environ["CASE_STORAGE_DIR"])
    root.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(root / "cases.sqlite3", timeout=30)
    db.row_factory = sqlite3.Row
    db.execute("""CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY, request_key TEXT UNIQUE, owner TEXT, fingerprint TEXT,
        created TEXT, slug TEXT, contact TEXT, address TEXT, package BLOB,
        status TEXT DEFAULT 'new', notification TEXT DEFAULT 'pending')""")
    try:
        with db:
            yield db
    finally:
        db.close()


def staff(request: Request, authorization: str = Header(default="")):
    limit(f"staff:{request.client.host if request.client else 'unknown'}", 30)
    key = os.getenv("STAFF_API_KEY", "")
    if len(key) < 32 or not hmac.compare_digest(authorization.encode(), f"Bearer {key}".encode()):
        raise HTTPException(401, "Staff sign-in required")


class Contact(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=254)
    phone: str = Field(min_length=5, max_length=40)

    @field_validator("name", "email", "phone")
    @classmethod
    def clean(cls, value):
        value = value.strip()
        if not value or any(ord(c) < 32 for c in value):
            raise ValueError("Invalid contact information")
        return value

    @field_validator("email")
    @classmethod
    def email_valid(cls, value):
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Invalid email address")
        return value


class CaseRequest(BaseModel):
    request_id: uuid.UUID
    slug: str
    contact: Contact
    consent: Literal[True]
    address: str = Field(min_length=1, max_length=300)
    data: dict = Field(default_factory=dict)
    session_id: str | None = Field(default=None, max_length=100)

    @field_validator("slug")
    @classmethod
    def known_slug(cls, value):
        if value not in SLUGS:
            raise ValueError("Unknown wizard")
        return value

    @field_validator("data")
    @classmethod
    def bounded_data(cls, value):
        if len(json.dumps(value).encode()) > 250_000:
            raise ValueError("Case data too large")
        return value


def receipt(row):
    return {"case_id": row["id"], "created": row["created"], "status": row["status"]}


def notify(case_id):
    # Delivery is tracked separately: a mail failure must never lose a stored case.
    with database() as db:
        row = db.execute("SELECT notification FROM cases WHERE id=?", (case_id,)).fetchone()
        if not row or row["notification"] == "sent":
            return
        message = EmailMessage()
        message["From"] = os.environ["CASE_EMAIL_FROM"]
        message["To"] = os.environ["CASE_NOTIFY_EMAIL"]
        message["Subject"] = f"Ny tilbudsforespørsel {case_id}"
        message.set_content(f"En ny sak er lagret: {case_id}.\nÅpne den private saksoversikten på https://app.soknadsklar.no/staff/cases.\nIngen kundeopplysninger eller vedlegg sendes i denne e-posten.")
        try:
            with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "587")), timeout=15) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
                smtp.send_message(message)
            state = "sent"
        except Exception:
            state = "failed"
        db.execute("UPDATE cases SET notification=? WHERE id=?", (state, case_id))


@router.get("/cases/availability")
def availability():
    return {"available": bool(ready())}


@router.post("/cases", status_code=201)
async def submit(request: Request, background: BackgroundTasks, owner: str = Depends(require_session)):
    # Bound JSON before parsing; attachments are loaded from the owned upload session.
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 300_000:
            raise HTTPException(413, "Case data too large")
    try:
        case = CaseRequest.model_validate_json(body)
    except ValueError:
        raise HTTPException(422, "Kontroller kontaktopplysningene og samtykket.")
    owner_hash = hashlib.sha256(owner.encode()).hexdigest()
    fingerprint = hashlib.sha256(case.model_dump_json(exclude={"request_id", "session_id"}).encode()).hexdigest()
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        previous = db.execute("SELECT * FROM cases WHERE request_key=?", (str(case.request_id),)).fetchone()
        if previous:
            if previous["owner"] != owner_hash or previous["fingerprint"] != fingerprint:
                raise HTTPException(409, "Forespørselen er endret eller økten er utløpt. Kontroller tidligere kvittering før du sender på nytt.")
            return receipt(previous)
        limit(f"case:{request.client.host if request.client else 'unknown'}", 10, 86400)
        drawings = _load_drawings(case.session_id or "", owner)
        case_id = "SK-" + uuid.uuid4().hex[:16].upper()
        created = datetime.now(timezone.utc).isoformat()
        evidence = case.model_dump(mode="json", exclude={"session_id", "request_id"})
        evidence.update(case_id=case_id, created=created, notice="Tilbudsforespørsel. Kundeopplysninger og AI-vurderinger er ikke faglig verifisert. Ingen kommunal innsending, bestilling eller betaling.")
        if case.slug == "bruksendring":
            evidence["price_indication"] = "Over 25 000 kr eks. mva. Endelig omfang og pris avtales særskilt."
        out = io.BytesIO()
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
            readable = json.dumps(evidence, ensure_ascii=False, indent=2)
            archive.writestr("saksopplysninger.json", readable)
            archive.writestr("saksoversikt.html", '<!doctype html><html lang="no"><meta charset="utf-8"><title>Saksunderlag</title><h1>' + case_id + '</h1><p>Tilbudsforespørsel – ikke en innsendt byggesøknad.</p><pre style="white-space:pre-wrap">' + html.escape(readable) + '</pre></html>')
            for drawing in drawings:
                archive.writestr("vedlegg/" + Path(drawing["path"]).name, base64.b64decode(drawing["data"]))
        db.execute("INSERT INTO cases (id,request_key,owner,fingerprint,created,slug,contact,address,package) VALUES (?,?,?,?,?,?,?,?,?)",
                   (case_id, str(case.request_id), owner_hash, fingerprint, created, case.slug, case.contact.model_dump_json(), case.address, out.getvalue()))
    background.add_task(notify, case_id)
    return {"case_id": case_id, "created": created, "status": "new"}


@router.get("/staff/cases", dependencies=[Depends(staff)])
def cases(response: Response, offset: int = 0):
    response.headers["Cache-Control"] = "no-store"
    with database() as db:
        rows = db.execute("SELECT id,created,slug,contact,address,status,notification FROM cases ORDER BY created DESC LIMIT 50 OFFSET ?", (max(0, offset),)).fetchall()
        return [dict(row, contact=json.loads(row["contact"])) for row in rows]


@router.get("/staff/cases/{case_id}/package", dependencies=[Depends(staff)])
def package(case_id: str):
    with database() as db:
        row = db.execute("SELECT package FROM cases WHERE id=?", (case_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Case not found")
        return Response(row["package"], media_type="application/zip", headers={"Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="saksunderlag.zip"'})


class Update(BaseModel):
    status: Literal["new", "contacted", "quoted", "closed"]


@router.patch("/staff/cases/{case_id}", dependencies=[Depends(staff)])
def update(case_id: str, change: Update):
    with database() as db:
        if not db.execute("UPDATE cases SET status=? WHERE id=?", (change.status, case_id)).rowcount:
            raise HTTPException(404, "Case not found")
    return {"status": change.status}


@router.post("/staff/cases/{case_id}/notify", dependencies=[Depends(staff)])
def retry_notification(case_id: str, background: BackgroundTasks):
    with database() as db:
        if not db.execute("SELECT id FROM cases WHERE id=?", (case_id,)).fetchone():
            raise HTTPException(404, "Case not found")
    background.add_task(notify, case_id)
    return {"queued": True}
