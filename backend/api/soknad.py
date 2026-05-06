import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from models import KjellerResult
from pdf.kjeller import generate_kjeller_pdf

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
