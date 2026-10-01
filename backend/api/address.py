"""Fast national address search. Building facts are not part of this open API."""
import re
from collections import OrderedDict
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()
KARTVERKET_URL = "https://ws.geonorge.no/adresser/v1/sok"
_property_cache: OrderedDict[str, dict] = OrderedDict()


async def query_registry(params: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(KARTVERKET_URL, params={"utkoordsys": "4258", **params})
            response.raise_for_status()
            data = response.json()
            if not isinstance(data.get("adresser"), list):
                raise ValueError("Invalid registry response")
            return data
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "Adressesøket er midlertidig utilgjengelig. Prøv igjen.")


def map_address(a: dict) -> dict:
    kommune = str(a.get("kommunenummer") or "")
    gnr, bnr = int(a.get("gardsnummer") or 0), int(a.get("bruksnummer") or 0)
    fnr = int(a.get("festenummer") or 0)
    if a.get("adressekode") is not None and a.get("nummer") is not None:
        prop_id = f"a_{kommune}_{a['adressekode']}_{a['nummer']}_{a.get('bokstav') or '-'}"
    else:
        prop_id = f"m_{kommune}_{gnr}_{bnr}_{fnr}_{a.get('undernummer') or 0}"
    point = a.get("representasjonspunkt") or {}
    prop = {
        "id": prop_id,
        "street": a.get("adressetekst") or f"Gnr {gnr} / Bnr {bnr}",
        "postal": a.get("postnummer") or "",
        "city": (a.get("poststed") or a.get("kommunenavn") or "").title(),
        "municipality": (a.get("kommunenavn") or "").title(),
        "coords": {"lat": point.get("lat", 0), "lon": point.get("lon", 0)},
        "matrikkel": {"gnr": gnr, "bnr": bnr, "kommune": kommune, "fnr": fnr},
        "bygg": {"byggeAar": None, "BRA": None, "etasjer": None, "kjeller": None,
                 "garasje": None, "tomt": None, "regplan": None, "byggegrenser": None,
                 "bygg_source": "default"},
        "tidligereSaker": [],
    }
    _property_cache[prop_id] = prop
    _property_cache.move_to_end(prop_id)
    while len(_property_cache) > 2000:
        _property_cache.popitem(last=False)
    return prop


def search_params(q: str) -> dict:
    q = " ".join(q.replace(",", " ").split())
    # Explicit property numbers avoid interpreting 208/619 as an ordinary street.
    match = re.fullmatch(r"(?:(\d{4})/)?(\d+)/(\d+)(?: (.+))?", q)
    if match:
        kommune, gnr, bnr, place = match.groups()
        params = {"gardsnummer": int(gnr), "bruksnummer": int(bnr)}
        if kommune:
            params["kommunenummer"] = kommune
        if place:
            params["kommunenummer" if re.fullmatch(r"\d{4}", place) else "kommunenavn"] = place
        return params
    if re.fullmatch(r"\d{4}", q):
        return {"postnummer": q}
    return {"sok": q, "sokemodus": "AND", "fuzzy": "false"}


@router.get("/address/search")
async def search_address(q: str = Query(..., min_length=2, max_length=200), page: int = Query(0, ge=0, le=10000)):
    if len(q.strip()) < 2:
        raise HTTPException(422, "Skriv minst to tegn.")
    params = {**search_params(q), "treffPerSide": 20, "side": page}
    data = await query_registry(params)
    mode = "exact"
    # Only broaden a zero-hit query; never mix approximate and exact result pages.
    if not data.get("metadata", {}).get("totaltAntallTreff") and "sok" in params and "*" not in params["sok"]:
        if params["sok"][-1].isalpha():
            data = await query_registry({**params, "sok": params["sok"] + "*"})
            mode = "prefix"
        if not data.get("metadata", {}).get("totaltAntallTreff"):
            data = await query_registry({**params, "fuzzy": "true"})
            mode = "fuzzy"
    results = [map_address(a) for a in data["adresser"]]
    total = int(data.get("metadata", {}).get("totaltAntallTreff", len(results)))
    return {"results": results, "total": total, "page": page, "hasMore": (page + 1) * 20 < total, "mode": mode}


def get_cached_property(prop_id: str) -> dict | None:
    return _property_cache.get(prop_id)


async def resolve_address(prop_id: str) -> dict | None:
    cached = get_cached_property(prop_id)
    if cached:
        return cached
    match = re.fullmatch(r"a_(\d{4})_(\d+)_(\d+)_([A-Za-zÆØÅæøå-])", prop_id)
    if match:
        kommune, code, number, letter = match.groups()
        params = {"kommunenummer": kommune, "adressekode": code, "nummer": number, "bokstav": "" if letter == "-" else letter}
    else:
        match = re.fullmatch(r"m_(\d{4})_(\d+)_(\d+)_(\d+)_(\d+)", prop_id)
        if match:
            kommune, gnr, bnr, fnr, under = match.groups()
            params = {"kommunenummer": kommune, "gardsnummer": gnr, "bruksnummer": bnr, "festenummer": fnr, "undernummer": under, "objtype": "Matrikkeladresse"}
        else:
            return None
    data = await query_registry({**params, "treffPerSide": 20})
    for address in data["adresser"]:
        prop = map_address(address)
        if prop["id"] == prop_id:
            return prop
    return None
