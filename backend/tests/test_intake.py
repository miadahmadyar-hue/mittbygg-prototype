import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from main import app
from api import access
from api.evaluate import EVALUATORS
from api.intake import fields_for, active


class IntakeTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear()
        access._requests.clear()
        self.client = TestClient(app)
        self.headers = {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}

    def sample(self, slug):
        answers = {}
        for f in fields_for(slug):
            if f["manual"]: answers[f["key"]] = False
            elif f["choices"]: answers[f["key"]] = f["choices"][0]["value"]
            elif f["nullable"]: answers[f["key"]] = None
            elif f["type"] == "boolean": answers[f["key"]] = False
            elif f["type"] in ("number", "integer"): answers[f["key"]] = max(1, (f["min"] or 0) + 1)
            else: answers[f["key"]] = "Dette er en beskrivelse av et planlagt prosjekt."
        return answers

    def assess(self, slug, answers, **extra):
        return self.client.post(f"/api/intake/{slug}/evaluate", headers=self.headers,
                                json={"answers": answers, "confirmed": True, "property_id": "4", **extra})

    def chat(self, slug, updates, text="Mine opplysninger", **extra):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test"}), patch("api.intake.review", return_value={"reply": "Kontroller oversikten.", "updates": updates}) as provider:
            response = self.client.post("/api/ai/intake", headers=self.headers,
                                        json={"slug": slug, "messages": [{"role": "user", "content": text}], **extra})
        return response, provider

    def test_all_wizards_use_existing_engine_and_current_models(self):
        for slug, (model, evaluate) in EVALUATORS.items():
            with self.subTest(slug=slug):
                self.assertEqual(self.client.get(f"/api/intake/{slug}").status_code, 200)
                response = self.assess(slug, self.sample(slug))
                self.assertEqual(response.status_code, 200, response.text)
                result = response.json()
                expected = evaluate(model.model_validate(result["input"])).model_dump(mode="json")
                self.assertEqual(result, expected)

    def test_missing_required_fields_never_use_model_defaults(self):
        for slug in EVALUATORS:
            with self.subTest(slug=slug):
                response = self.assess(slug, {})
                self.assertEqual(response.status_code, 422)
                self.assertTrue(response.json()["detail"]["missing"])
        garage = self.sample("garasje")
        del garage["overnatting"]
        self.assertIn("overnatting", self.assess("garasje", garage).json()["detail"]["missing"])

    def test_confirmation_and_session_are_required(self):
        self.assertEqual(self.assess("vegg", self.sample("vegg"), confirmed=False).status_code, 422)
        response = self.client.post("/api/intake/vegg/evaluate", json={"answers": self.sample("vegg"), "confirmed": True, "property_id": "4"})
        self.assertEqual(response.status_code, 401)

    def test_unknowns_are_preserved_and_cannot_create_exemption(self):
        data = self.sample("garasje")
        data.update(areal=25, avstand=2, avstand_bygg=2, etasjer=1, monehoyde=3, gesimshoyde=2, plan_ok=None, over_ledninger=None)
        result = self.assess("garasje", data).json()
        self.assertIsNone(result["input"]["plan_ok"])
        self.assertNotEqual(result["outcome"], "exempt")

    def test_irrelevant_terrace_and_rental_fields_do_not_block(self):
        for slug in ("fasade", "kjeller", "bruksendring"):
            data = self.sample(slug)
            data = {f["key"]: data[f["key"]] for f in fields_for(slug) if active(f, data)}
            response = self.assess(slug, data)
            self.assertEqual(response.status_code, 200, response.text)

    def test_range_integer_and_boolean_validation(self):
        for key, value in (("antall", 1.5), ("antall", True), ("areal", -1), ("areal", "20")):
            data = self.sample("boenhet")
            data[key] = value
            self.assertEqual(self.assess("boenhet", data).status_code, 422)

    def test_ai_cannot_confirm_drawings_or_property_or_unevidenced_facts(self):
        updates = [{"key": k, "value": v, "evidence": "Mine opplysninger"} for k, v in (("godkjent_bruk_bekreftet", "true"), ("propId", "99"), ("room", "bod"), ("takhoyde", "2400"))]
        updates.append({"key": "rom_areal", "value": "30", "evidence": "not in message"})
        response, _ = self.chat("kjeller", updates)
        self.assertEqual([v["key"] for v in response.json()["updates"]], ["room", "takhoyde"])

    def test_boolean_false_and_explicit_unknown_are_not_dropped(self):
        response, _ = self.chat("garasje", [{"key": "overnatting", "value": "false", "evidence": "nei"}, {"key": "areal", "value": None, "evidence": "ukjent"}], "nei, arealet er ukjent")
        self.assertEqual([v["value"] for v in response.json()["updates"]], [False, None])
        response, _ = self.chat("vegg", [{"key": "baerende", "value": None, "evidence": "ukjent"}], "ukjent")
        self.assertEqual(response.json()["updates"][0]["value"], "usikker")

    def test_handoff_extracts_customer_history_not_assistant_claims(self):
        history = [{"role": "user", "content": "en åpning på 2 meter"}, {"role": "assistant", "content": "Konstruksjonen er betong"}]
        updates = [{"key": "apning_bredde", "value": "2", "evidence": "2 meter"}, {"key": "konstruksjon", "value": "mur_betong", "evidence": "betong"}]
        response, provider = self.chat("vegg", updates, hydrate=True, messages=history)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["updates"]), 1)
        self.assertIn("latest statement wins", provider.call_args.kwargs["instructions"])
        response, _ = self.chat("vegg", updates, messages=[*history, {"role": "user", "content": "bredden er ukjent"}])
        self.assertEqual(response.json()["updates"], [])

    def test_drawings_confirmation_resets_for_unknown_use(self):
        data = self.sample("kjeller")
        data.update(room="usikker", godkjent_bruk_bekreftet=True)
        self.assertFalse(self.assess("kjeller", data).json()["input"]["godkjent_bruk_bekreftet"])

    def test_expired_attachment_fails_without_calling_provider(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test"}), patch("api.intake._load_drawings", side_effect=__import__('fastapi').HTTPException(409)), patch("api.intake.review") as provider:
            response = self.client.post("/api/ai/intake", headers=self.headers, json={"slug": "vegg", "session_id": "abcdef123456", "messages": [{"role": "user", "content": "test"}]})
            self.assertEqual(response.status_code, 409)
            provider.assert_not_called()

    def test_provider_failure_keeps_error_generic(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test"}), patch("api.intake.review", side_effect=ValueError("secret")):
            response = self.client.post("/api/ai/intake", headers=self.headers, json={"slug": "vegg", "messages": [{"role": "user", "content": "test"}]})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("secret", response.text)
