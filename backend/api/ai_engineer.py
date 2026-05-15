"""
AI Engineer agent — generates technical calculations and structural notes per tiltak.
Falls back to realistic mock calculations when ANTHROPIC_API_KEY is not set.
"""
import os
import json

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SLUG_LABELS: dict[str, str] = {
    "kjeller":      "kjeller / underetasje",
    "garasje":      "garasje",
    "tilbygg":      "tilbygg",
    "fasade":       "fasadeendring",
    "tak":          "takarbeider",
    "anneks":       "anneks / uthus",
    "levegg":       "levegg / støyskjerm",
    "bruksendring": "bruksendring",
    "tilleggsdel":  "tilleggsdel",
    "boenhet":      "ny boenhet",
    "vegg":         "vegg / skille",
    "brygge":       "brygge",
    "andre":        "andre tiltak",
}

MOCK_BY_SLUG: dict[str, dict] = {
    "kjeller": {
        "tittel": "Teknisk redegjørelse — kjeller / underetasje",
        "beregninger": [
            {"type": "last",   "navn": "Nyttelast etasjeskille", "verdi": "3,5 kN/m²",    "referanse": "NS-EN 1991-1-1 tab. 6.1"},
            {"type": "last",   "navn": "Egenlast betongdekke",   "verdi": "5,0 kN/m²",    "referanse": "NS-EN 1991-1-1"},
            {"type": "grunn",  "navn": "Grunntrykk tillatt",      "verdi": "100 kN/m²",    "referanse": "NS-EN 1997-1"},
            {"type": "energi", "navn": "U-verdi gulv mot grunn",  "verdi": "0,10 W/m²K",  "referanse": "TEK17 §14-3"},
        ],
        "konklusjon": "Tiltaket kan gjennomføres innenfor gjeldende tekniske krav (TEK17). Utgraving forutsetter vurdering av grunnforhold.",
        "notater": ["Grunnsikring utføres av godkjent foretak (KPR)", "Drenering dokumenteres i søknad"],
    },
    "garasje": {
        "tittel": "Teknisk redegjørelse — garasje",
        "beregninger": [
            {"type": "last",   "navn": "Snølast (Oslo-sone)",     "verdi": "3,5 kN/m²",   "referanse": "NS-EN 1991-1-3"},
            {"type": "last",   "navn": "Vindlast referanse",      "verdi": "0,7 kN/m²",   "referanse": "NS-EN 1991-1-4"},
            {"type": "brann",  "navn": "Brannklasse",              "verdi": "BKL 1",        "referanse": "TEK17 §11-2"},
            {"type": "energi", "navn": "U-verdi yttervegg",       "verdi": "0,22 W/m²K",  "referanse": "TEK17 §14-3"},
        ],
        "konklusjon": "Garasje kan oppføres som frittstående konstruksjon etter TEK17. Enkel dokumentasjon tilstrekkelig ved BRA ≤ 50 m².",
        "notater": ["Takbæring dimensjoneres for lokal snølast", "El-anlegg følger NEK 400"],
    },
    "tilbygg": {
        "tittel": "Teknisk redegjørelse — tilbygg",
        "beregninger": [
            {"type": "last",   "navn": "Nyttelast bolig",         "verdi": "2,0 kN/m²",   "referanse": "NS-EN 1991-1-1"},
            {"type": "last",   "navn": "Snølast (Oslo-sone)",     "verdi": "3,5 kN/m²",   "referanse": "NS-EN 1991-1-3"},
            {"type": "energi", "navn": "U-verdi yttervegg",       "verdi": "0,18 W/m²K",  "referanse": "TEK17 §14-3"},
            {"type": "energi", "navn": "U-verdi tak",             "verdi": "0,13 W/m²K",  "referanse": "TEK17 §14-3"},
        ],
        "konklusjon": "Tilbygget kan kobles til eksisterende konstruksjon forutsatt dokumentert bæreevne i tilkoblingspunkt.",
        "notater": ["Dampsperre kontinueres gjennom tilkoblingssone", "Setningsforskjell vurderes ved løsmasse-grunn"],
    },
    "fasade": {
        "tittel": "Teknisk redegjørelse — fasadeendring",
        "beregninger": [
            {"type": "energi", "navn": "U-verdi ny kledning",     "verdi": "0,18 W/m²K",  "referanse": "TEK17 §14-3"},
            {"type": "energi", "navn": "Kuldebroer (normert)",    "verdi": "≤ 0,03 W/m²K","referanse": "TEK17 §14-3"},
            {"type": "brann",  "navn": "Brennbarhet kledning",    "verdi": "D-s2, d0",     "referanse": "TEK17 §11-9"},
        ],
        "konklusjon": "Fasadeendringen oppfyller energi- og brannkrav etter TEK17 ved bruk av godkjent kledning.",
        "notater": ["Vindsperre kontrolleres og utbedres om nødvendig", "Fargevalg kan kreve kommunal godkjenning i verneområder"],
    },
    "tak": {
        "tittel": "Teknisk redegjørelse — takarbeider",
        "beregninger": [
            {"type": "last",   "navn": "Snølast (Oslo-sone)",     "verdi": "3,5 kN/m²",   "referanse": "NS-EN 1991-1-3"},
            {"type": "last",   "navn": "Vindoppløft referanse",   "verdi": "0,5 kN/m²",   "referanse": "NS-EN 1991-1-4"},
            {"type": "energi", "navn": "U-verdi tak",             "verdi": "0,13 W/m²K",  "referanse": "TEK17 §14-3"},
            {"type": "brann",  "navn": "Takbelegg brannklasse",   "verdi": "BROOF(t2)",    "referanse": "TEK17 §11-9"},
        ],
        "konklusjon": "Takarbeider kan utføres etter TEK17. Eksisterende bærende konstruksjon forutsettes å tåle ny snølast.",
        "notater": ["Undertak bytttes ved total omlegging", "Membrandetaljer ved gjennomføringer dokumenteres"],
    },
}

DEFAULT_MOCK = {
    "tittel": "Teknisk redegjørelse",
    "beregninger": [
        {"type": "last",   "navn": "Dimensjonerende last",    "verdi": "2,0 kN/m²",   "referanse": "NS-EN 1991-1-1"},
        {"type": "energi", "navn": "U-verdi yttervegg",      "verdi": "0,18 W/m²K",  "referanse": "TEK17 §14-3"},
        {"type": "brann",  "navn": "Brannklasse",             "verdi": "BKL 1",        "referanse": "TEK17 §11-2"},
    ],
    "konklusjon": "Tiltaket kan gjennomføres innenfor gjeldende tekniske krav etter TEK17.",
    "notater": ["Utførelse dokumenteres av ansvarlig foretak", "Kontroll utføres etter NS 3420"],
}


class EngineerRequest(BaseModel):
    slug: str = "andre"
    address: str = ""
    gnr: int = 0
    bnr: int = 0
    bygg: dict[str, Any] = {}
    architect_summary: str = ""


def _call_claude(req: EngineerRequest) -> dict:
    import anthropic

    label = SLUG_LABELS.get(req.slug, req.slug)
    bygg_summary = (
        f"Byggeår: {req.bygg.get('byggeAar', '?')}, "
        f"BRA: {req.bygg.get('BRA') or '~130'} m², "
        f"Etasjer: {req.bygg.get('etasjer') or 2}"
    )

    prompt = f"""Du er en erfaren norsk konstruktørtekniker / RIB.

Eiendom: {req.address} (gnr {req.gnr}/bnr {req.bnr})
Bygg: {bygg_summary}
Tiltak: {label}
{f"Arkitektkommentar: {req.architect_summary}" if req.architect_summary else ""}

Generer tekniske beregninger og notater for byggesøknaden.
Svar KUN med gyldig JSON i dette formatet:
{{
  "tittel": "Teknisk redegjørelse — {label}",
  "beregninger": [
    {{"type": "last",   "navn": "Nyttelast",  "verdi": "2,0 kN/m²",  "referanse": "NS-EN 1991-1-1"}},
    {{"type": "energi", "navn": "U-verdi",    "verdi": "0,18 W/m²K", "referanse": "TEK17 §14-3"}}
  ],
  "konklusjon": "1–2 setninger om teknisk gjennomførbarhet",
  "notater": ["Notat 1", "Notat 2"]
}}
Bruk norsk. Maks 4 beregninger, 2 notater. Svar kun med JSON."""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(msg.content[0].text.strip())


@router.post("/ai/engineer")
def engineer_analyse(req: EngineerRequest) -> dict:
    if not ANTHROPIC_API_KEY:
        return MOCK_BY_SLUG.get(req.slug, DEFAULT_MOCK)
    try:
        return _call_claude(req)
    except Exception:
        return MOCK_BY_SLUG.get(req.slug, DEFAULT_MOCK)
