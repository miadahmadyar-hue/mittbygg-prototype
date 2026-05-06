import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

KARTVERKET_URL = "https://ws.geonorge.no/adresser/v1/sok"


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

    for i, a in enumerate(data.get("adresser", [])):
        gnr = a.get("gardsnummer") or 0
        bnr = a.get("bruksnummer") or 0
        kommune = a.get("kommunenummer") or "0000"
        nummer = str(a.get("nummer") or "")
        bokstav = a.get("bokstav") or ""
        street = f"{a.get('adressenavn', '')} {nummer}{bokstav}".strip()
        punkt = a.get("representasjonspunkt") or {}
        adressekode = a.get("adressekode") or i

        results.append({
            "id": f"k_{adressekode}_{gnr}_{bnr}",
            "street": street,
            "postal": a.get("postnummer") or "",
            "city": (a.get("kommunenavn") or "").title(),
            "coords": {
                "lat": punkt.get("lat", 0),
                "lon": punkt.get("lon", 0),
            },
            "matrikkel": {
                "gnr": gnr,
                "bnr": bnr,
                "kommune": kommune,
            },
            # Matrikkel property data will be fetched in Stage 2.
            # For now we return sensible defaults so the UI renders.
            "bygg": {
                "byggeAar": 1975,
                "BRA": None,
                "etasjer": None,
                "kjeller": True,
                "garasje": False,
                "tomt": None,
                "regplan": "Kommuneplan",
                "byggegrenser": "4 m fra nabo, 15 m fra vassdrag",
            },
            "tidligereSaker": [],
        })

    return {"results": results}
