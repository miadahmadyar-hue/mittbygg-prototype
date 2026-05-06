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


class AddressResult(BaseModel):
    id: str
    street: str
    postal: str
    city: str
    coords: Coords
    matrikkel: Matrikkel
    bygg: Bygg
    tidligereSaker: List[dict] = []
