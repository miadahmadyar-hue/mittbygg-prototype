import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File
from typing import List

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/mittbygg_drawings")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/drawings/upload")
async def upload_drawings(files: List[UploadFile] = File(...)):
    session_id = str(uuid.uuid4())[:12]
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    saved = []
    for upload in files:
        if not upload.filename:
            continue
        content = await upload.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            continue
        dest = os.path.join(session_dir, upload.filename)
        with open(dest, "wb") as f:
            f.write(content)
        saved.append({"name": upload.filename, "size": len(content)})

    return {"session_id": session_id, "files": saved}
