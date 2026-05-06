"""
Property endpoint — wraps mock Matrikkel data for Stage 1.
Stage 2: replace with real Geonorge / Matrikkel API calls.
"""
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Same mock data as web/src/lib/data/addresses.ts
MOCK_PROPERTIES: dict = {
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
        },
        "tidligereSaker": [
            {"aar": 2019, "type": "Fasadeendring", "status": "Godkjent"},
            {"aar": 2014, "type": "Terrasse", "status": "Godkjent"},
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
        },
        "tidligereSaker": [
            {"aar": 2021, "type": "Vindu", "status": "Godkjent"},
        ],
    },
}


@router.get("/property/{prop_id}")
def get_property(prop_id: str):
    prop = MOCK_PROPERTIES.get(prop_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.get("/property/{prop_id}/rooms")
def get_rooms(prop_id: str):
    from regulations.kjeller import get_kjeller_rooms
    return {"rooms": get_kjeller_rooms(prop_id)}
