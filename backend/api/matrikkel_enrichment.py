"""
Enrich address results with real building metadata.
Tries Kartverket REST API, then Geonorge eiendomsinfo, degrades to defaults.
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_MATRIKKEL_REST = "https://api.kartverket.no/matrikkel/v1"
_EIENDOMSINFO   = "https://ws.geonorge.no/eiendomsinfo/v1"


async def fetch_bygg(kommunenummer: str, gnr: int, bnr: int) -> dict:
    """
    Returns dict: byggeAar, BRA, etasjer, kjeller, garasje, bygningstype, source.
    'source': 'matrikkel' | 'eiendomsinfo' | 'default'
    """
    default = _default_bygg()

    async with httpx.AsyncClient(timeout=5.0) as client:
        # ── 1. Kartverket Matrikkel REST API ─────────────────────────────────
        try:
            url = f"{_MATRIKKEL_REST}/matrikkelenhet/{kommunenummer}/{gnr}/{bnr}/0/0"
            r = await client.get(url, headers={"Accept": "application/json"})
            if r.status_code == 200:
                parsed = _parse_matrikkel(r.json())
                if parsed.get("byggeAar"):
                    parsed["source"] = "matrikkel"
                    logger.info("Matrikkel hit: %s/%s/%s byggeAar=%s", kommunenummer, gnr, bnr, parsed["byggeAar"])
                    return parsed
        except Exception as exc:
            logger.debug("Matrikkel REST failed for %s/%s/%s: %s", kommunenummer, gnr, bnr, exc)

        # ── 2. Geonorge eiendomsinfo ─────────────────────────────────────────
        try:
            url = f"{_EIENDOMSINFO}/eiendom/{kommunenummer}/{gnr}/{bnr}"
            r = await client.get(url, headers={"Accept": "application/json"})
            if r.status_code == 200:
                parsed = _parse_eiendomsinfo(r.json())
                if parsed.get("byggeAar"):
                    parsed["source"] = "eiendomsinfo"
                    logger.info("Eiendomsinfo hit: %s/%s/%s", kommunenummer, gnr, bnr)
                    return parsed
        except Exception as exc:
            logger.debug("Eiendomsinfo failed for %s/%s/%s: %s", kommunenummer, gnr, bnr, exc)

    return default


def derive_rooms(bygge_aar: int, bra: Optional[int], etasjer: Optional[int]) -> list:
    """
    Derive basement room list from building metadata.
    Returns a list of room dicts compatible with the kjeller regulation engine.
    """
    floors = max(etasjer or 2, 1)
    total_bra = bra or 140
    basement_area = max(22, int(total_bra // floors))

    # Ceiling height by construction era (TEK requirements evolved over time)
    if bygge_aar < 1945:
        height = 2100
    elif bygge_aar < 1960:
        height = 2150
    elif bygge_aar < 1980:
        height = 2200
    elif bygge_aar < 1995:
        height = 2280
    else:
        height = 2400

    # Window presence by era
    if bygge_aar < 1955:
        main_vinduer = "Ingen"
    elif bygge_aar < 1975:
        main_vinduer = "Lite vindu (0,6×0,5 m)"
    else:
        main_vinduer = "Lite vindu (0,8×0,6 m)"

    fellesrom = max(14, int(basement_area * 0.45))
    vaskerom  = max(6,  int(basement_area * 0.20))
    bod       = max(6,  basement_area - fellesrom - vaskerom)

    return [
        {"id": "fellesrom", "name": "Fellesrom", "area": fellesrom, "height": height, "vinduer": main_vinduer},
        {"id": "vaskerom",  "name": "Vaskerom",  "area": vaskerom,  "height": height, "vinduer": "Ingen"},
        {"id": "bod",       "name": "Bod",        "area": bod,       "height": height, "vinduer": "Ingen"},
    ]


# ── Private helpers ────────────────────────────────────────────────────────────

def _default_bygg() -> dict:
    return {
        "byggeAar":    None,
        "BRA":         None,
        "etasjer":     None,
        "kjeller":     True,
        "garasje":     False,
        "bygningstype": None,
        "source":      "default",
    }


def _parse_matrikkel(data: dict) -> dict:
    out = _default_bygg()
    bygning_liste = data.get("bygningListe") or data.get("bygg") or []
    if bygning_liste:
        b = bygning_liste[0]
        out["byggeAar"] = _int(b.get("byggeaar") or b.get("byggeAar"))
        out["BRA"]      = _int(b.get("bruksarealTotalt") or b.get("bruksareal"))
        out["etasjer"]  = _int(b.get("antallEtasjer"))
        btype = b.get("bygningstype")
        if isinstance(btype, dict):
            out["bygningstype"] = str(btype.get("kode") or "")
        elif btype:
            out["bygningstype"] = str(btype)
        out["kjeller"] = _infer_kjeller(b)
        out["garasje"] = _infer_garasje(out["bygningstype"])
    return out


def _parse_eiendomsinfo(data: dict) -> dict:
    out = _default_bygg()
    b = data.get("bygning") or data.get("bygg") or data
    if isinstance(b, list):
        b = b[0] if b else {}
    out["byggeAar"] = _int(b.get("byggeaar") or b.get("byggeAar") or data.get("byggeaar"))
    out["BRA"]      = _int(b.get("bruksareal") or b.get("bra"))
    out["etasjer"]  = _int(b.get("antallEtasjer") or b.get("etasjer"))
    har_kjeller = b.get("harKjeller")
    out["kjeller"]  = bool(har_kjeller) if har_kjeller is not None else True
    out["garasje"]  = bool(b.get("harGarasje") or False)
    return out


def _infer_kjeller(b: dict) -> bool:
    if b.get("harKjeller") is not None:
        return bool(b["harKjeller"])
    for e in (b.get("etasjeplan") or []):
        if isinstance(e, dict) and str(e.get("etasjebetegnelse", "")).upper() in ("KJ", "U1", "U2", "KP"):
            return True
    return True  # safe default: most Norwegian houses have a basement


def _infer_garasje(bygningstype: Optional[str]) -> bool:
    return bool(bygningstype and bygningstype.startswith("18"))


def _int(v) -> Optional[int]:
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None
