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
    spennvidde: float  # mm
    last: float        # kN/m


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
    bjelke: Bjelke
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


class TilbyggInput(BaseModel):
    type: Literal["tilbygg_1etasje", "ny_etasje", "innglasset_terrasse"]
    areal: float
    avstand: float


class FasadeInput(BaseModel):
    type: Literal["kledning", "farge", "vindu_storre", "terrasse", "dor"]
    verneverdig: bool


class TakInput(BaseModel):
    type: Literal["bytte_materiale", "endre_form", "bygge_loft"]
    verneverdig: bool
    etterisolere: bool


class SolcellerInput(BaseModel):
    type: Literal["integrert", "paamontering", "vegg"]
    areal: float
    verneverdig: bool


class AnneksInput(BaseModel):
    type: Literal["anneks", "uthus", "hagebod"]
    areal: float
    avstand: float


class LevegInput(BaseModel):
    hoyde: float
    lengde: float
    avstand: float


class VinduInput(BaseModel):
    type: Literal["skifte", "nytt_hull", "storre_apning"]
    brannvegg: bool


class BryggeInput(BaseModel):
    type: Literal["fast", "flytende", "stupebrett"]
    lengde: float
    bredde: float


class AndreInput(BaseModel):
    beskrivelse: str


class GeolograpportInput(BaseModel):
    type: Literal["nybygg", "tilbygg", "kjeller", "brygge", "annet"]
    timing: Literal["asap", "planlegging", "usikker"]
