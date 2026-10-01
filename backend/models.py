from typing import Literal, Optional, List
from pydantic import BaseModel, Field, computed_field


class Finding(BaseModel):
    type: Literal["ok", "warn", "fail"]
    t: str
    d: str
    ref: str


class Tiltak(BaseModel):
    name: str
    desc: str
    kostnad: int


class Lempning(BaseModel):
    regel: str
    tekst: str



class AssessmentResult(BaseModel):
    @computed_field
    @property
    def ruleVersion(self) -> int:
        return 20261001

    @computed_field
    @property
    def outcome(self) -> Literal["exempt", "professional", "clarify", "application"]:
        # Legacy rule engines retain their display wording; only this adapter
        # translates it. Clients consume a stable, language-independent outcome.
        text = self.soknadstype.lower()
        unclear = any(marker in text for marker in ("må avklares", "vurderes manuelt", "trolig"))
        if not unclear and text.startswith(("unntatt", "ikke oppdeling")):
            return "exempt"
        if self.ansvarsrett:
            return "professional"
        if unclear or self.status == "red":
            return "clarify"
        return "application"

# ── Kjeller ──────────────────────────────────────────────────────────────────

class KjellerInput(BaseModel):
    rental_use: Literal["same", "separate", "unknown"] = "unknown"
    propId: str
    byggeAar: Optional[int] = None
    room: str
    ny_bruk: Literal["soverom", "hybel", "stue", "kontor", "bad"]
    radon: Optional[float] = Field(default=None, ge=0)
    drenering: bool = False
    balansert_vent: bool = False
    bra: Optional[int] = None      # gross floor area — used for room derivation
    etasjer: Optional[int] = None  # floor count — used for room derivation
    rom_areal: Optional[float] = Field(default=None, ge=0)
    takhoyde: Optional[float] = Field(default=None, ge=0)  # mm, measured by the customer
    vindu_bredde: Optional[float] = Field(default=None, ge=0)  # m
    vindu_hoyde: Optional[float] = Field(default=None, ge=0)   # m
    vindu_brystning: Optional[float] = Field(default=None, ge=0)  # m above floor
    godkjent_bruk_bekreftet: bool = False
    drenering_status: Literal["ja", "nei", "usikker"] = "usikker"
    ventilasjon_status: Literal["ja", "nei", "usikker"] = "usikker"


class KjellerResult(AssessmentResult):
    status: Literal["green", "amber", "red"]
    statusText: str
    statusDesc: str
    findings: List[Finding]
    tiltak: List[Tiltak]
    lempninger: List[Lempning]
    eldre: bool
    soknadstype: str
    ansvarsrett: bool
    tiltaksklasse: Literal[1, 2]
    totalKostnad: int
    input: KjellerInput


# ── Vegg ─────────────────────────────────────────────────────────────────────

class VeggInput(BaseModel):
    type: Literal["fjerne_vegg", "ny_apning", "utvide_apning", "flytte_vegg", "endre_soyle"]
    baerende: Literal["ja", "nei", "usikker"]
    apning_bredde: Optional[float] = None  # approximate metres
    etasje: Literal["kjeller", "forste", "ovre"]
    etasjer_over: int = 0
    konstruksjon: Literal["tre", "mur_betong", "stal", "usikker"] = "usikker"


class Bjelke(BaseModel):
    b: int
    h: int
    type: str
    spennvidde: float
    last: float


class VeggResult(AssessmentResult):
    status: Literal["green", "amber", "red"]
    statusText: str
    statusDesc: str
    findings: List[Finding]
    tiltak: List[Tiltak]
    lempninger: List[Lempning]
    soknadstype: str
    ansvarsrett: bool
    tiltaksklasse: Literal[1, 2]
    totalKostnad: int
    bjelke: Optional[Bjelke] = None
    input: VeggInput


# ── Address search ────────────────────────────────────────────────────────────

class Coords(BaseModel):
    lat: float
    lon: float


class Matrikkel(BaseModel):
    gnr: int
    bnr: int
    kommune: str


class Bygg(BaseModel):
    byggeAar: Optional[int] = None
    BRA: Optional[int] = None
    etasjer: Optional[int] = None
    kjeller: Optional[bool] = None
    garasje: Optional[bool] = None
    tomt: Optional[int] = None
    regplan: Optional[str] = None
    byggegrenser: Optional[str] = None
    bygg_source: str = "default"


class AddressResult(BaseModel):
    id: str
    street: str
    postal: str
    city: str
    coords: Coords
    matrikkel: Matrikkel
    bygg: Bygg
    tidligereSaker: List[dict] = []


# Aliases used by newer regulation engines
TiltakFinding = Finding
TiltakTiltak = Tiltak

# ── Generic tiltak result (shared by the 10 simple wizards) ──────────────────

from typing import Any

class TiltakResult(AssessmentResult):
    status: Literal["green", "amber", "red"]
    statusText: str
    statusDesc: str
    findings: List[Finding]
    tiltak: List[Tiltak]
    lempninger: List[Lempning]
    soknadstype: str
    ansvarsrett: bool
    tiltaksklasse: Literal[1, 2]
    totalKostnad: int
    input: Any


class GarasjeInput(BaseModel):
    type: Literal["garasje", "carport", "bod"]
    areal: float = Field(gt=0, allow_inf_nan=False)
    avstand: float = Field(ge=0, allow_inf_nan=False)
    avstand_bygg: float = Field(default=1.0, ge=0, allow_inf_nan=False)
    overnatting: bool = False
    kjeller: bool = False
    etasjer: int = Field(default=1, ge=1, le=20)
    monehoyde: float = Field(default=4.0, gt=0, allow_inf_nan=False)
    gesimshoyde: float = Field(default=3.0, gt=0, allow_inf_nan=False)
    over_ledninger: Optional[bool] = None
    plan_ok: Optional[bool] = None


class TilbyggInput(BaseModel):
    type: Literal["tilbygg_1etasje", "ny_etasje", "innglasset_terrasse"]
    areal: float = Field(gt=0, allow_inf_nan=False)
    avstand: float = Field(ge=0, allow_inf_nan=False)
    bruk: Literal["bod", "terrasse", "veranda", "oppholdsrom", "bad", "annet"] = "oppholdsrom"
    plan_ok: Optional[bool] = None
    bya_ok: Optional[bool] = None
    pipe: bool = False
    samme_formaal: Optional[bool] = None
    understottet: Optional[bool] = None
    en_etasje: Optional[bool] = None
    egen_boenhet: Optional[bool] = None


class FasadeInput(BaseModel):
    type: Literal["skifte_vindu", "nytt_hull", "kledning", "farge", "vindu_storre", "terrasse", "dor"]
    verneverdig: Optional[bool] = None
    samme_utseende: bool = False
    karakterendring: Literal["nei", "ja", "usikker"] = "usikker"
    terrasse_hoyde: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    terrasse_dybde: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)
    terrasse_avstand: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    terrasse_overbygd: bool = False
    plan_ok: Optional[bool] = None
    terrasse_rekkverk: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)


class TakInput(BaseModel):
    type: Literal["bytte_materiale", "endre_form", "bygge_loft"]
    verneverdig: Optional[bool] = None
    etterisolere: bool
    samme_utseende: bool = False


class AnneksInput(BaseModel):
    type: Literal["anneks", "uthus", "hagebod"]
    areal: float = Field(gt=0, allow_inf_nan=False)
    avstand: float = Field(ge=0, allow_inf_nan=False)
    overnatting: bool = False
    avstand_bygg: float = Field(default=1.0, ge=0, allow_inf_nan=False)
    kjeller: bool = False
    etasjer: int = Field(default=1, ge=1, le=20)
    monehoyde: float = Field(default=4.0, gt=0, allow_inf_nan=False)
    gesimshoyde: float = Field(default=3.0, gt=0, allow_inf_nan=False)
    over_ledninger: Optional[bool] = None
    plan_ok: Optional[bool] = None


class LevegInput(BaseModel):
    hoyde: float = Field(gt=0, allow_inf_nan=False)
    lengde: float = Field(gt=0, allow_inf_nan=False)
    avstand: float = Field(ge=0, allow_inf_nan=False)
    plan_ok: Optional[bool] = None


class VinduInput(BaseModel):
    type: Literal["skifte", "nytt_hull", "storre_apning"]
    brannvegg: Optional[bool] = None
    verneverdig: Optional[bool] = None
    samme_utseende: Optional[bool] = None


class BryggeInput(BaseModel):
    type: Literal["fast", "flytende", "stupebrett"]
    lengde: float = Field(gt=0, allow_inf_nan=False)
    bredde: float = Field(gt=0, allow_inf_nan=False)
    arbeid: Literal["ny", "utvide", "erstatte", "vedlikehold"] = "ny"
    eier_strandgrunn: Optional[bool] = None
    plan_status: Literal["tillatt", "ikke_tillatt", "usikker"] = "usikker"


class AndreInput(BaseModel):
    beskrivelse: str = Field(min_length=20, max_length=2000)


class GeolograpportInput(BaseModel):
    type: Literal["nybygg", "tilbygg", "kjeller", "brygge", "annet"]
    timing: Literal["asap", "planlegging", "usikker"]


class BruksendringInput(BaseModel):
    fra: Literal["naring", "kontor", "garasje", "bod", "fritidsbolig", "annet", "usikker"]
    til: Literal["bolig", "hybel", "rom", "kontor", "naring"]
    areal: Optional[float] = Field(default=None, gt=0)
    verneverdig: bool = False  # retained for older clients; false does not mean verified
    godkjent_bruk_bekreftet: bool = False
    plan_status: Literal["tillatt", "ikke_tillatt", "usikker"] = "usikker"
    inngrep_baerende: bool = False
    vern_status: Literal["ja", "nei", "usikker"] = "usikker"
    baerende_status: Literal["ja", "nei", "usikker"] = "usikker"
    bolig_scope: Literal["same", "separate", "unknown"] = "unknown"


class TilleggsdelInput(BaseModel):
    godkjent_bruk_bekreftet: bool = False
    romtype: Literal["bod", "gang", "vaskerom", "garasje", "teknisk", "usikker"]
    areal: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)
    formaal: Literal["soverom", "stue", "kontor", "bad"]


class BoenhetInput(BaseModel):
    type: Literal["hybel", "sokkelleilighet", "tomannsbolig"]
    antall: int = Field(ge=1, le=100)
    areal: float = Field(gt=0, allow_inf_nan=False)
    hovedfunksjoner: Optional[bool] = None
    egen_inngang: Optional[bool] = None
    fysisk_adskilt: Optional[bool] = None
