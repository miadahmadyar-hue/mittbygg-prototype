"""
AI Architect agent — analyses uploaded drawings + property data with Claude.
Falls back to a rule-based assessment when ANTHROPIC_API_KEY is not set.
"""
import os
import base64
import glob as glob_mod
import logging
import re

from .json_extract import parse_model_json
from copy import deepcopy
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/mittbygg_drawings")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_ARCHITECT_MODEL = os.getenv(
    "ANTHROPIC_ARCHITECT_MODEL",
    os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
)

SLUG_LABELS: dict[str, str] = {
    "kjeller":      "kjeller / underetasje",
    "garasje":      "garasje",
    "tilbygg":      "tilbygg",
    "fasade":       "fasadeendring",
    "tak":          "takarbeider",
    "anneks":       "anneks / uthus",
    "levegg":       "levegg / støyskjerm",
    "bruksendring": "bruksendring",
    "tilleggsdel":  "tilleggsdel",
    "boenhet":      "ny boenhet",
    "vegg":         "vegg / skille",
    "brygge":       "brygge",
    "andre":        "andre tiltak",
}

MOCK_ASSESSMENT = {
    "feasible": True,
    "summary": (
        "Tiltaket ser gjennomførbart ut basert på tilgjengelig eiendomsdata. "
        "En fullstendig vurdering forutsetter godkjente tegninger."
    ),
    "items": [
        {"type": "ok",      "text": "Tiltaket er innenfor normalt omfang for denne eiendommen"},
        {"type": "ok",      "text": "Ingen åpenbare konflikt med reguleringsplan"},
        {"type": "warn",    "text": "Nabovarsel må sendes minst 2 uker før byggestart"},
        {"type": "missing", "text": "Situasjonsplan i målestokk 1:500 anbefales"},
    ],
    "anbefalinger": [
        "Last opp situasjonsplan og plantegning for en komplett søknad",
        "Kontroller avstand til nabogrense i henhold til PBL § 29-4",
    ],
}


class ArchitectRequest(BaseModel):
    session_id: str | None = None
    slug: str = "andre"
    address: str = ""
    gnr: int = 0
    bnr: int = 0
    kommune: str = ""
    bygg: dict[str, Any] = Field(default_factory=dict)


def _fallback_assessment(images: list[dict], reason: str) -> dict:
    assessment = deepcopy(MOCK_ASSESSMENT)
    if not images:
        assessment["items"] = [
            *MOCK_ASSESSMENT["items"][:3],
            {"type": "missing", "text": "Ingen tegninger lastet opp - situasjonsplan anbefales"},
        ]
    assessment["meta"] = {"source": "fallback", "reason": reason}
    return assessment


def _load_images(session_id: str) -> list[dict]:
    """Return list of base64 image dicts for Claude vision."""
    if not session_id:
        return []

    if not re.fullmatch(r"[0-9a-f-]{12}", session_id):
        logger.warning("Rejected invalid drawing session id: %s", session_id)
        return []

    upload_root = Path(UPLOAD_DIR).resolve()
    session_dir = (upload_root / session_id).resolve()
    if upload_root not in session_dir.parents:
        logger.warning("Rejected drawing session outside upload root: %s", session_id)
        return []

    if not session_dir.exists():
        return []

    images = []
    for ext in ("*.jpg", "*.jpeg", "*.png"):
        for path in glob_mod.glob(str(session_dir / ext)):
            try:
                data = base64.standard_b64encode(Path(path).read_bytes()).decode()
                media = "image/jpeg" if path.lower().endswith((".jpg", ".jpeg")) else "image/png"
                images.append({"path": path, "data": data, "media": media})
            except OSError:
                pass
    return images[:4]  # cap at 4 images to control token usage


def _call_claude(slug: str, address: str, gnr: int, bnr: int, bygg: dict, images: list[dict]) -> dict:
    import anthropic  # lazy import — only needed when key is present

    label = SLUG_LABELS.get(slug, slug)
    bygg_summary = (
        f"Byggeår: {bygg.get('byggeAar', '?')}, "
        f"BRA: {bygg.get('BRA') or '~130'} m², "
        f"Etasjer: {bygg.get('etasjer') or 2}"
    )

    prompt = f"""Du er en erfaren norsk arkitekt som vurderer en byggesøknad.

Eiendom: {address} (gnr {gnr}/bnr {bnr})
Bygg: {bygg_summary}
Tiltak: {label}
{"Tegninger er lastet opp og vedlagt." if images else "Ingen tegninger er lastet opp ennå."}

Gi en kort faglig vurdering av tiltaket. Svar KUN med gyldig JSON i dette formatet:
{{
  "feasible": true,
  "summary": "1–2 setninger om gjennomførbarhet",
  "items": [
    {{"type": "ok",      "text": "Noe som ser bra ut"}},
    {{"type": "warn",    "text": "Noe som bør sjekkes"}},
    {{"type": "missing", "text": "Noe som mangler"}}
  ],
  "anbefalinger": ["Anbefaling 1", "Anbefaling 2"]
}}
Bruk norsk. Maks 3 items og 2 anbefalinger. Svar kun med JSON, ingen annen tekst."""

    content: list[dict] = []
    for img in images:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": img["media"], "data": img["data"]},
        })
    content.append({"type": "text", "text": prompt})

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=ANTHROPIC_ARCHITECT_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": content}],
    )
    result = parse_model_json(msg.content[0].text)
    result["meta"] = {"source": "claude", "model": ANTHROPIC_ARCHITECT_MODEL}
    return result


@router.post("/ai/architect")
def architect_analyse(req: ArchitectRequest) -> dict:
    images = _load_images(req.session_id or "")

    if not ANTHROPIC_API_KEY:
        return _fallback_assessment(images, "missing_api_key")

    try:
        return _call_claude(req.slug, req.address, req.gnr, req.bnr, req.bygg, images)
    except Exception:
        logger.exception("Architect AI analysis failed for slug=%s session_id=%s", req.slug, req.session_id)
        return _fallback_assessment(images, "ai_error")
