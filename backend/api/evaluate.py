from fastapi import APIRouter
from models import KjellerInput, KjellerResult, VeggInput, VeggResult
from regulations.kjeller import evaluate_kjeller
from regulations.vegg import evaluate_vegg

router = APIRouter()


@router.post("/evaluate/kjeller", response_model=KjellerResult)
def post_evaluate_kjeller(inp: KjellerInput) -> KjellerResult:
    return evaluate_kjeller(inp)


@router.post("/evaluate/vegg", response_model=VeggResult)
def post_evaluate_vegg(inp: VeggInput) -> VeggResult:
    return evaluate_vegg(inp)
