import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from api import address


def record(number=1, letter="", **changes):
    return {"kommunenummer": "0301", "kommunenavn": "OSLO", "poststed": "OSLO", "postnummer": "0155", "gardsnummer": 208, "bruksnummer": 619, "adressekode": 17059, "nummer": number, "bokstav": letter, "adressetekst": f"Storgata {number}{letter}", "representasjonspunkt": {"lat": 59.9, "lon": 10.7}, **changes}


def response(records, total=None):
    return {"adresser": records, "metadata": {"totaltAntallTreff": len(records) if total is None else total}}


class AddressSearchTests(unittest.TestCase):
    def setUp(self):
        address._property_cache.clear()
        self.client = TestClient(app)

    def test_all_result_pages_available_without_building_lookups(self):
        with patch.object(address, "query_registry", AsyncMock(return_value=response([record()], 45))) as query:
            result = self.client.get("/api/address/search", params={"q": "Storgata", "page": 1}).json()
        self.assertEqual(result["total"], 45)
        self.assertTrue(result["hasMore"])
        self.assertEqual(query.call_args.args[0]["side"], 1)
        self.assertEqual(query.call_args.args[0]["treffPerSide"], 20)
        self.assertIsNone(result["results"][0]["bygg"]["BRA"])

    def test_same_parcel_addresses_have_distinct_ids_and_postal_town(self):
        a = address.map_address(record(1, poststed="SANDVIKA", kommunenavn="BÆRUM"))
        b = address.map_address(record(2))
        self.assertNotEqual(a["id"], b["id"])
        self.assertEqual(a["city"], "Sandvika")
        self.assertEqual(a["municipality"], "Bærum")
        self.assertEqual(address.get_cached_property(a["id"])["street"], "Storgata 1")

    def test_exact_address_reloads_after_cache_loss(self):
        prop = address.map_address(record(12, "B"))
        address._property_cache.clear()
        with patch.object(address, "query_registry", AsyncMock(return_value=response([record(12, "B")]))) as query:
            r = self.client.get("/api/property/" + prop["id"])
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["street"], "Storgata 12B")
        self.assertEqual(query.call_args.args[0]["bokstav"], "B")

    def test_no_letter_address_is_not_another_entrance(self):
        with patch.object(address, "query_registry", AsyncMock(return_value=response([record(12, "B")]))) as query:
            r = self.client.get("/api/property/a_0301_17059_12_-")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(query.call_args.args[0]["bokstav"], "")

    def test_incomplete_street_prefix_and_typo_fallback(self):
        with patch.object(address, "query_registry", AsyncMock(side_effect=[response([]), response([record()])])) as query:
            r = self.client.get("/api/address/search", params={"q": "Storg"}).json()
        self.assertEqual(r["mode"], "prefix")
        self.assertEqual(query.call_args.args[0]["sok"], "Storg*")
        with patch.object(address, "query_registry", AsyncMock(side_effect=[response([]), response([]), response([record()])])) as query:
            r = self.client.get("/api/address/search", params={"q": "Strogata"}).json()
        self.assertEqual(r["mode"], "fuzzy")
        self.assertEqual(query.call_args.args[0]["fuzzy"], "true")

    def test_property_numbers_postcode_and_commas(self):
        self.assertEqual(address.search_params("0301/208/619"), {"kommunenummer": "0301", "gardsnummer": 208, "bruksnummer": 619})
        self.assertEqual(address.search_params("208/619 Oslo")["kommunenavn"], "Oslo")
        self.assertEqual(address.search_params("0155"), {"postnummer": "0155"})
        self.assertEqual(address.search_params("Storgata 1, Oslo")["sok"], "Storgata 1 Oslo")

    def test_matrikkel_address_recovers_official_text(self):
        item = record(adressekode=None, nummer=None, objtype="Matrikkeladresse", undernummer=2, adressetekst="208/619-2")
        prop = address.map_address(item)
        address._property_cache.clear()
        with patch.object(address, "query_registry", AsyncMock(return_value=response([item]))):
            r = self.client.get("/api/property/" + prop["id"])
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["street"], "208/619-2")

    def test_invalid_queries(self):
        for params in ({"q": "  "}, {"q": "a"}, {"q": "Oslo", "page": -1}):
            self.assertEqual(self.client.get("/api/address/search", params=params).status_code, 422)
