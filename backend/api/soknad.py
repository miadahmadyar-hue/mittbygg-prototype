import io
from .access import require_session
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ValidationError
from .evaluate import EVALUATORS
from models import KjellerResult, TiltakResult
from pdf.kjeller import generate_kjeller_pdf
from pdf.generic import generate_generic_pdf

router = APIRouter(dependencies=[Depends(require_session)])


class KjellerSoknadRequest(BaseModel):
    result: KjellerResult
    address: str = ""
    gnr: int = 0
    bnr: int = 0
    kommune: str = ""


@router.post("/soknad/kjeller")
def post_kjeller_soknad(req: KjellerSoknadRequest) -> StreamingResponse:
    current = EVALUATORS["kjeller"][1](req.result.input)
    if current.outcome != "application":
        raise HTTPException(409, "Project requires clarification before document generation")
    pdf_bytes = generate_kjeller_pdf(
        result=current,
        address=req.address,
        gnr=req.gnr,
        bnr=req.bnr,
        kommune=req.kommune,
    )
    filename = f"soknadsklar-{req.result.input.propId}.pdf"
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
    entry = EVALUATORS.get(req.slug)
    if entry is None:
        raise HTTPException(422, "Unknown project type")
    model, evaluate = entry
    try:
        current = evaluate(model.model_validate(req.result.input))
    except ValidationError as exc:
        raise HTTPException(422, "Invalid project answers") from exc
    if current.outcome != "application":
        raise HTTPException(409, "Project requires clarification before document generation")
    pdf_bytes = generate_generic_pdf(
        slug=req.slug,
        result=current.model_dump(),
        address=req.address,
        gnr=req.gnr,
        bnr=req.bnr,
        kommune=req.kommune,
        architect=req.architect,
        engineer=req.engineer,
    )
    filename = f"soknadsklar-{req.slug}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
