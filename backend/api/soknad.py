import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any
from models import KjellerResult, TiltakResult
from pdf.kjeller import generate_kjeller_pdf
from pdf.generic import generate_generic_pdf

router = APIRouter()


class KjellerSoknadRequest(BaseModel):
    result: KjellerResult
    address: str = ""
    gnr: int = 0
    bnr: int = 0
    kommune: str = ""


@router.post("/soknad/kjeller")
def post_kjeller_soknad(req: KjellerSoknadRequest) -> StreamingResponse:
    pdf_bytes = generate_kjeller_pdf(
        result=req.result,
        address=req.address,
        gnr=req.gnr,
        bnr=req.bnr,
        kommune=req.kommune,
    )
    filename = f"mittbygg-soknad-{req.result.input.propId}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class TiltakSoknadRequest(BaseModel):
    slug: str
    result: TiltakResult
    address: str = ""
    gnr: int = 0
    bnr: int = 0
    kommune: str = ""
    architect: dict | None = None
    engineer: dict | None = None


@router.post("/soknad/tiltak")
def post_tiltak_soknad(req: TiltakSoknadRequest) -> StreamingResponse:
    pdf_bytes = generate_generic_pdf(
        slug=req.slug,
        result=req.result.model_dump(),
        address=req.address,
        gnr=req.gnr,
        bnr=req.bnr,
        kommune=req.kommune,
        architect=req.architect,
        engineer=req.engineer,
    )
    filename = f"mittbygg-soknad-{req.slug}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
