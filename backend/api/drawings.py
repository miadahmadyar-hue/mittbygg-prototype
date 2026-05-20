import os
import uuid
import re
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/mittbygg_drawings")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILES = 6

ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".pdf"}
ALLOWED_CONTENT_TYPES = {
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".png": {"image/png"},
    ".pdf": {"application/pdf"},
}
GENERIC_CONTENT_TYPES = {"", "application/octet-stream"}


def _safe_filename(filename: str, index: int) -> str:
    path = Path(filename)
    suffix = path.suffix.lower()
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", path.stem).strip("._")
    return f"{index:02d}_{stem or 'drawing'}{suffix}"


def _validate_upload(upload: UploadFile) -> str | None:
    if not upload.filename:
        return "missing filename"

    suffix = Path(upload.filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        return "unsupported file type"

    content_type = (upload.content_type or "").lower()
    allowed_types = ALLOWED_CONTENT_TYPES[suffix] | GENERIC_CONTENT_TYPES
    if content_type not in allowed_types:
        return "unsupported content type"

    return None


@router.post("/drawings/upload")
async def upload_drawings(files: List[UploadFile] = File(...)):
    session_id = uuid.uuid4().hex[:12]
    upload_root = Path(UPLOAD_DIR).resolve()
    session_dir = (upload_root / session_id).resolve()

    saved = []
    rejected = []

    for index, upload in enumerate(files[:MAX_FILES], start=1):
        validation_error = _validate_upload(upload)
        display_name = upload.filename or "unnamed"
        if validation_error:
            rejected.append({"name": display_name, "reason": validation_error})
            continue

        content = await upload.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            rejected.append({"name": display_name, "reason": "file too large"})
            continue

        os.makedirs(session_dir, exist_ok=True)
        filename = _safe_filename(upload.filename, index)
        dest = (session_dir / filename).resolve()
        if upload_root not in dest.parents:
            rejected.append({"name": display_name, "reason": "invalid destination"})
            continue

        with open(dest, "wb") as f:
            f.write(content)
        saved.append({"name": display_name, "stored_name": filename, "size": len(content)})

    if len(files) > MAX_FILES:
        rejected.append({"name": "extra files", "reason": f"maximum {MAX_FILES} files per upload"})

    if not saved:
        raise HTTPException(status_code=400, detail={"message": "No valid drawing files uploaded", "rejected": rejected})

    return {"session_id": session_id, "files": saved, "rejected": rejected}
