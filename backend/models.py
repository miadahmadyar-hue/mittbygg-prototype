from typing import Literal, Optional, List
from pydantic import BaseModel


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


# ── Kjeller ──────────────────────────────────────────────────────────────────

class KjellerInput(BaseModel):
    propId: str
    byggeAar: int
    room: str
    ny_bruk: Literal["soverom", "hybel", "stue", "kontor", "bad"]
    radon: Optional[float] = None
    drenering: bool = True
    balansert_vent: bool = False
    bra: Optional[int] = None      # gross floor area — used for room derivation
    etasjer: Optional[int] = None  # floor count — used for room derivation
    rom_areal: Optional[float] = None
    takhoyde: Optional[float] = None  # mm, measured by the customer
    vindu_bredde: Optional[float] = None  # m
    vindu_hoyde: Optional[float] = None   # m
    vindu_brystning: Optional[float] = None  # m above floor
    godkjent_bruk_bekreftet: bool = False
    drenering_status: Literal["ja", "nei", "usikker"] = "usikker"
    ventilasjon_status: Literal["ja", "nei", "usikker"] = "usikker"


class KjellerResult(BaseModel):
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


class VeggResult(BaseModel):
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
    byggeAar: int
    BRA: Optional[int] = None
    etasjer: Optional[int] = None
    kjeller: bool = True
    garasje: bool = False
    tomt: Optional[int] = None
    regplan: str = "Kommuneplan"
    byggegrenser: str = "4 m fra nabo, 15 m fra vassdrag"
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

class TiltakResult(BaseModel):
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
    areal: float
    avstand: float
    avstand_bygg: float = 1.0
    overnatting: bool = False
    kjeller: bool = False
    etasjer: int = 1
    monehoyde: float = 4.0
    gesimshoyde: float = 3.0
    over_ledninger: bool = False
    plan_ok: Optional[bool] = None


class TilbyggInput(BaseModel):
    type: Literal["tilbygg_1etasje", "ny_etasje", "innglasset_terrasse"]
    areal: float
    avstand: float
    bruk: Literal["bod", "terrasse", "veranda", "oppholdsrom", "bad", "annet"] = "oppholdsrom"
    plan_ok: Optional[bool] = None
    bya_ok: Optional[bool] = None
    pipe: bool = False


class FasadeInput(BaseModel):
    type: Literal["skifte_vindu", "nytt_hull", "kledning", "farge", "vindu_storre", "terrasse", "dor"]
    verneverdig: bool
    samme_utseende: bool = False
    karakterendring: Literal["nei", "ja", "usikker"] = "usikker"
    terrasse_hoyde: Optional[float] = None
    terrasse_dybde: Optional[float] = None
    terrasse_avstand: Optional[float] = None
    terrasse_overbygd: bool = False


class TakInput(BaseModel):
    type: Literal["bytte_materiale", "endre_form", "bygge_loft"]
    verneverdig: bool
    etterisolere: bool
    samme_utseende: bool = False


class AnneksInput(BaseModel):
    type: Literal["anneks", "uthus", "hagebod"]
    areal: float
    avstand: float
    overnatting: bool = False
    avstand_bygg: float = 1.0
    kjeller: bool = False
    etasjer: int = 1
    monehoyde: float = 4.0
    gesimshoyde: float = 3.0
    over_ledninger: bool = False
    plan_ok: Optional[bool] = None


class LevegInput(BaseModel):
    hoyde: float
    lengde: float
    avstand: float
    plan_ok: Optional[bool] = None


class VinduInput(BaseModel):
    type: Literal["skifte", "nytt_hull", "storre_apning"]
    brannvegg: bool


class BryggeInput(BaseModel):
    type: Literal["fast", "flytende", "stupebrett"]
    lengde: float
    bredde: float
    arbeid: Literal["ny", "utvide", "erstatte", "vedlikehold"] = "ny"
    eier_strandgrunn: Optional[bool] = None
    plan_status: Literal["tillatt", "ikke_tillatt", "usikker"] = "usikker"


class AndreInput(BaseModel):
    beskrivelse: str


class GeolograpportInput(BaseModel):
    type: Literal["nybygg", "tilbygg", "kjeller", "brygge", "annet"]
    timing: Literal["asap", "planlegging", "usikker"]


class BruksendringInput(BaseModel):
    fra: Literal["naring", "kontor", "garasje", "bod", "fritidsbolig", "annet"]
    til: Literal["bolig", "hybel", "kontor", "naring"]
    areal: float
    verneverdig: bool
    godkjent_bruk_bekreftet: bool = False
    plan_status: Literal["tillatt", "ikke_tillatt", "usikker"] = "usikker"
    inngrep_baerende: bool = False


class TilleggsdelInput(BaseModel):
    romtype: Literal["bod", "gang", "vaskerom", "garasje", "teknisk"]
    areal: float
    formaal: Literal["soverom", "stue", "kontor", "bad"]


class BoenhetInput(BaseModel):
    type: Literal["hybel", "sokkelleilighet", "tomannsbolig"]
    antall: int
    areal: float
    hovedfunksjoner: bool = False
    egen_inngang: bool = False
    fysisk_adskilt: bool = False
