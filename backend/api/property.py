"""
Property endpoint — real data from Matrikkel enrichment + in-process cache.
Falls back to mock data for legacy numeric IDs used in test fixtures.
"""
from fastapi import APIRouter, HTTPException
from .address import get_cached_property
from .matrikkel_enrichment import fetch_bygg

router = APIRouter()

_MOCK_PROPERTIES: dict = {
    "1": {
        "id": "1",
        "street": "Solbakken 12",
        "postal": "0268",
        "city": "Oslo",
        "coords": {"lat": 59.9272, "lon": 10.6936},
        "matrikkel": {"gnr": 31, "bnr": 418, "kommune": "0301"},
        "bygg": {
            "byggeAar": 1968, "BRA": 189, "etasjer": 2,
            "kjeller": True, "garasje": True, "tomt": 632,
            "regplan": "S-4220 (Boliger Vinderen)",
            "byggegrenser": "4 m fra nabo, 15 m fra vassdrag",
            "bygg_source": "default",
        },
        "tidligereSaker": [
            {"aar": 2019, "type": "Fasadeendring", "status": "Godkjent"},
            {"aar": 2014, "type": "Terrasse",      "status": "Godkjent"},
        ],
    },
    "2": {
        "id": "2",
        "street": "Maridalsveien 87",
        "postal": "0461",
        "city": "Oslo",
        "coords": {"lat": 59.9479, "lon": 10.7648},
        "matrikkel": {"gnr": 75, "bnr": 112, "kommune": "0301"},
        "bygg": {
            "byggeAar": 1952, "BRA": 142, "etasjer": 2,
            "kjeller": True, "garasje": False, "tomt": 510,
            "regplan": "S-2255",
            "byggegrenser": "4 m fra nabo, 15 m fra vassdrag",
            "bygg_source": "default",
        },
        "tidligereSaker": [
            {"aar": 2021, "type": "Vindu", "status": "Godkjent"},
        ],
    },
}


@router.get("/property/{prop_id}")
async def get_property(prop_id: str):
    # 1. Cache hit — set by address search in same session
    cached = get_cached_property(prop_id)
    if cached:
        return cached

    # 2. Parse Kartverket-style ID: k_{kommunenummer}_{gnr}_{bnr}
    if prop_id.startswith("k_"):
        parts = prop_id.split("_", 3)
        if len(parts) == 4:
            _, kommunenummer, gnr_s, bnr_s = parts
            try:
                gnr, bnr = int(gnr_s), int(bnr_s)
            except ValueError:
                pass
            else:
                bygg = await fetch_bygg(kommunenummer, gnr, bnr)
                return {
                    "id": prop_id,
                    "street": f"Gnr {gnr} / Bnr {bnr}",
                    "postal": "",
                    "city": kommunenummer,
                    "coords": {"lat": 0, "lon": 0},
                    "matrikkel": {"gnr": gnr, "bnr": bnr, "kommune": kommunenummer},
                    "bygg": {
                        "byggeAar":    bygg["byggeAar"] or 1975,
                        "BRA":         bygg["BRA"],
                        "etasjer":     bygg["etasjer"],
                        "kjeller":     bygg["kjeller"],
                        "garasje":     bygg["garasje"],
                        "tomt":        None,
                        "regplan":     "Kommuneplan",
                        "byggegrenser": "4 m fra nabo, 15 m fra vassdrag",
                        "bygg_source": bygg["source"],
                    },
                    "tidligereSaker": [],
                }

    # 3. Legacy numeric IDs (test fixtures, demo data)
    prop = _MOCK_PROPERTIES.get(prop_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.get("/property/{prop_id}/rooms")
async def get_rooms(prop_id: str):
    from regulations.kjeller import get_kjeller_rooms

    prop = get_cached_property(prop_id) or _MOCK_PROPERTIES.get(prop_id)
    if prop:
        bygg = prop.get("bygg", {})
        rooms = get_kjeller_rooms(
            prop_id,
            bra=bygg.get("BRA"),
            etasjer=bygg.get("etasjer"),
            bygge_aar=bygg.get("byggeAar", 1975),
        )
    else:
        rooms = get_kjeller_rooms(prop_id)

    return {"rooms": rooms}
