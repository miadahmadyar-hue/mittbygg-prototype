import httpx
from fastapi import APIRouter, Query, HTTPException
from .matrikkel_enrichment import fetch_bygg

router = APIRouter()

KARTVERKET_URL = "https://ws.geonorge.no/adresser/v1/sok"

# In-process cache: prop_id → full address dict.
# Populated by address search; read by the property endpoint.
_property_cache: dict[str, dict] = {}


@router.get("/address/search")
async def search_address(q: str = Query(..., min_length=2)):
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            resp = await client.get(KARTVERKET_URL, params={
                "sok": q,
                "fuzzy": "true",
                "utkoordsys": "4258",
                "treffPerSide": 10,
                "sokemodus": "AND",
            })
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Kartverket unavailable: {exc}")

    data = resp.json()
    results = []

    for a in data.get("adresser", []):
        gnr = int(a.get("gardsnummer") or 0)
        bnr = int(a.get("bruksnummer") or 0)
        kommune = str(a.get("kommunenummer") or "0000")
        nummer  = str(a.get("nummer") or "")
        bokstav = a.get("bokstav") or ""
        street  = f"{a.get('adressenavn', '')} {nummer}{bokstav}".strip()
        punkt   = a.get("representasjonspunkt") or {}

        prop_id = f"k_{kommune}_{gnr}_{bnr}"

        # Fetch real building data; gracefully falls back to defaults
        bygg = await fetch_bygg(kommune, gnr, bnr)

        prop = {
            "id": prop_id,
            "street": street,
            "postal": a.get("postnummer") or "",
            "city": (a.get("kommunenavn") or "").title(),
            "coords": {"lat": punkt.get("lat", 0), "lon": punkt.get("lon", 0)},
            "matrikkel": {"gnr": gnr, "bnr": bnr, "kommune": kommune},
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

        _property_cache[prop_id] = prop
        results.append(prop)

    return {"results": results}


def get_cached_property(prop_id: str) -> dict | None:
    return _property_cache.get(prop_id)
