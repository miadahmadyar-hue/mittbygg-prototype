from fastapi import APIRouter
from models import (
    KjellerInput, KjellerResult, VeggInput, VeggResult, TiltakResult,
    GarasjeInput, TilbyggInput, FasadeInput, TakInput,
    AnneksInput, LevegInput, VinduInput, BryggeInput, AndreInput,
    GeolograpportInput, BruksendringInput, TilleggsdelInput, BoenhetInput,
)
from regulations.kjeller   import evaluate_kjeller
from regulations.vegg      import evaluate_vegg
from regulations.garasje   import evaluate_garasje
from regulations.tilbygg   import evaluate_tilbygg
from regulations.fasade    import evaluate_fasade
from regulations.tak       import evaluate_tak
from regulations.anneks    import evaluate_anneks
from regulations.levegg    import evaluate_levegg
from regulations.vindu     import evaluate_vindu
from regulations.brygge    import evaluate_brygge
from regulations.andre     import evaluate_andre
from regulations.geolograpport import evaluate_geolograpport
from regulations.bruksendring  import evaluate_bruksendring
from regulations.tilleggsdel   import evaluate_tilleggsdel
from regulations.boenhet       import evaluate_boenhet

router = APIRouter()


@router.post("/evaluate/kjeller",   response_model=KjellerResult)
def post_evaluate_kjeller(inp: KjellerInput)   -> KjellerResult:   return evaluate_kjeller(inp)

@router.post("/evaluate/vegg",      response_model=VeggResult)
def post_evaluate_vegg(inp: VeggInput)         -> VeggResult:      return evaluate_vegg(inp)

@router.post("/evaluate/garasje",   response_model=TiltakResult)
def post_evaluate_garasje(inp: GarasjeInput)   -> TiltakResult:    return evaluate_garasje(inp)

@router.post("/evaluate/tilbygg",   response_model=TiltakResult)
def post_evaluate_tilbygg(inp: TilbyggInput)   -> TiltakResult:    return evaluate_tilbygg(inp)

@router.post("/evaluate/fasade",    response_model=TiltakResult)
def post_evaluate_fasade(inp: FasadeInput)     -> TiltakResult:    return evaluate_fasade(inp)

@router.post("/evaluate/tak",       response_model=TiltakResult)
def post_evaluate_tak(inp: TakInput)           -> TiltakResult:    return evaluate_tak(inp)

@router.post("/evaluate/anneks",    response_model=TiltakResult)
def post_evaluate_anneks(inp: AnneksInput)     -> TiltakResult:    return evaluate_anneks(inp)

@router.post("/evaluate/levegg",    response_model=TiltakResult)
def post_evaluate_levegg(inp: LevegInput)      -> TiltakResult:    return evaluate_levegg(inp)

@router.post("/evaluate/vindu",     response_model=TiltakResult)
def post_evaluate_vindu(inp: VinduInput)       -> TiltakResult:    return evaluate_vindu(inp)

@router.post("/evaluate/brygge",    response_model=TiltakResult)
def post_evaluate_brygge(inp: BryggeInput)     -> TiltakResult:    return evaluate_brygge(inp)

@router.post("/evaluate/andre",        response_model=TiltakResult)
def post_evaluate_andre(inp: AndreInput)           -> TiltakResult:    return evaluate_andre(inp)

@router.post("/evaluate/geolograpport", response_model=TiltakResult)
def post_evaluate_geolograpport(inp: GeolograpportInput) -> TiltakResult: return evaluate_geolograpport(inp)

@router.post("/evaluate/bruksendring",  response_model=TiltakResult)
def post_evaluate_bruksendring(inp: BruksendringInput)   -> TiltakResult: return evaluate_bruksendring(inp)

@router.post("/evaluate/tilleggsdel",   response_model=TiltakResult)
def post_evaluate_tilleggsdel(inp: TilleggsdelInput)     -> TiltakResult: return evaluate_tilleggsdel(inp)

@router.post("/evaluate/boenhet",       response_model=TiltakResult)
def post_evaluate_boenhet(inp: BoenhetInput)             -> TiltakResult: return evaluate_boenhet(inp)
