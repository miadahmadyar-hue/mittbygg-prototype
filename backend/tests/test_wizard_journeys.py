import io
import json
import unittest
import zipfile
import tempfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from api import access, drawings, ai_architect


EXAMPLES = {
    "kjeller": {"propId": "test", "room": "bod", "ny_bruk": "soverom"},
    "vegg": {"type": "fjerne_vegg", "baerende": "usikker", "etasje": "forste"},
    "bruksendring": {"fra": "usikker", "til": "rom"},
    "garasje": {"type": "garasje", "areal": 30, "avstand": 1},
    "anneks": {"type": "uthus", "areal": 20, "avstand": 2},
    "tilbygg": {"type": "tilbygg_1etasje", "areal": 15, "avstand": 4, "bruk": "oppholdsrom"},
    "fasade": {"type": "terrasse", "terrasse_hoyde": 0.8, "terrasse_dybde": 3, "terrasse_avstand": 1},
    "tak": {"type": "bytte_materiale", "samme_utseende": True, "etterisolere": False},
    "vindu": {"type": "skifte"},
    "tilleggsdel": {"romtype": "usikker", "formaal": "soverom"},
    "boenhet": {"type": "hybel", "antall": 1, "areal": 40},
    "brygge": {"type": "fast", "lengde": 4, "bredde": 2},
    "levegg": {"hoyde": 1.8, "lengde": 5, "avstand": 0},
    "geolograpport": {"type": "nybygg", "timing": "usikker"},
    "andre": {"beskrivelse": "TEST: ønsker avklaring av et byggeprosjekt på eiendommen."},
}


class WizardJourneyTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear()
        access._requests.clear()
        self.client = TestClient(app)
        self.headers = {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}

    def evaluate(self, slug, **changes):
        response = self.client.post(f"/api/evaluate/{slug}", json={**EXAMPLES[slug], **changes})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_every_wizard_evaluates_and_downloads_preliminary_evidence(self):
        for slug, answers in EXAMPLES.items():
            with self.subTest(slug=slug):
                result = self.evaluate(slug)
                self.assertEqual(result["ruleVersion"], 20261001)
                self.assertNotEqual(result["outcome"], "exempt", "Unknown conditions must not imply an exemption")
                response = self.client.post("/api/project/handover", headers=self.headers, json={
                    "slug": slug, "address": "TEST ONLY", "input": answers,
                    "details": {"notes": "Customer context"}, "checklist": {"plan": False},
                    "checklist_labels": {"plan": "Plan status"},
                })
                self.assertEqual(response.status_code, 200, response.text[:200] if response.status_code != 200 else "")
                self.assertEqual(response.headers["cache-control"], "no-store")
                with zipfile.ZipFile(io.BytesIO(response.content)) as package:
                    self.assertTrue(package.read("saksunderlag.pdf").startswith(b"%PDF"))
                    evidence = json.loads(package.read("kundeopplysninger.json"))
                    self.assertNotIn("session_id", evidence)
                    self.assertEqual(evidence["result"]["outcome"], result["outcome"])
                    self.assertEqual(evidence["details"]["notes"], "Customer context")

    def test_new_extension_rules_and_unknown_conditions(self):
        known = dict(plan_ok=True, bya_ok=True, understottet=True, en_etasje=True, egen_boenhet=False, samme_formaal=True)
        for use in ("bod", "oppholdsrom", "bad"):
            self.assertEqual(self.evaluate("tilbygg", bruk=use, **known)["outcome"], "exempt")
        for field in known:
            self.assertNotEqual(self.evaluate("tilbygg", **{**known, field: None})["outcome"], "exempt")
        self.assertNotEqual(self.evaluate("tilbygg", **{**known, "egen_boenhet": True})["outcome"], "exempt")

    def test_terrace_plan_and_railing_are_required(self):
        self.assertEqual(self.evaluate("fasade", plan_ok=True, terrasse_rekkverk=1.2)["outcome"], "exempt")
        self.assertEqual(self.evaluate("fasade", plan_ok=None, terrasse_rekkverk=1.2)["outcome"], "clarify")
        self.assertEqual(self.evaluate("fasade", plan_ok=True, terrasse_rekkverk=1.3)["outcome"], "clarify")

    def test_unknown_boenhet_does_not_mean_no(self):
        self.assertEqual(self.evaluate("boenhet")["outcome"], "clarify")
        self.assertEqual(self.evaluate("boenhet", hovedfunksjoner=True, egen_inngang=True, fysisk_adskilt=True)["outcome"], "professional")

    def test_windows_and_rooms_do_not_prescribe_unverified_design(self):
        window = self.evaluate("vindu", brannvegg=True)
        self.assertEqual(window["outcome"], "professional")
        self.assertNotIn("EI 30", json.dumps(window))
        self.assertEqual(window["totalKostnad"], 0)
        for room in ("gang", "vaskerom", "bod", "usikker"):
            result = self.evaluate("tilleggsdel", romtype=room)
            self.assertEqual(result["outcome"], "clarify")
            self.assertEqual(result["tiltak"], [])

    def test_roof_unknown_heritage_or_insulation_blocks_maintenance_clearance(self):
        self.assertEqual(self.evaluate("tak")["outcome"], "clarify")
        self.assertEqual(self.evaluate("tak", verneverdig=False)["outcome"], "exempt")
        self.assertNotEqual(self.evaluate("tak", verneverdig=False, etterisolere=True)["outcome"], "exempt")

    def test_invalid_dimensions_rejected_and_boundary_zero_allowed(self):
        for slug, field in (("garasje", "areal"), ("tilbygg", "areal"), ("brygge", "lengde"), ("levegg", "hoyde"), ("boenhet", "antall")):
            response = self.client.post(f"/api/evaluate/{slug}", json={**EXAMPLES[slug], field: -1})
            self.assertEqual(response.status_code, 422)
        self.assertNotEqual(self.evaluate("garasje", avstand=0)["outcome"], "exempt")

    def test_general_package_requires_auth_and_valid_input(self):
        payload = {"slug": "andre", "address": "TEST", "input": EXAMPLES["andre"]}
        self.assertEqual(self.client.post("/api/project/handover", json=payload).status_code, 401)
        self.assertEqual(self.client.post("/api/project/handover", headers=self.headers, json={**payload, "slug": "unknown"}).status_code, 422)
        self.assertEqual(self.client.post("/api/project/handover", headers=self.headers, json={**payload, "input": {}}).status_code, 422)

    def test_general_package_preserves_owned_attachments_only(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(drawings, "UPLOAD_DIR", folder), patch.object(ai_architect, "UPLOAD_DIR", folder):
            upload = self.client.post("/api/drawings/upload", headers=self.headers, files={"files": ("plan.pdf", b"%PDF-test", "application/pdf")}).json()
            payload = {"slug": "brygge", "address": "TEST", "input": EXAMPLES["brygge"], "session_id": upload["session_id"]}
            other = {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}
            self.assertEqual(self.client.post("/api/project/handover", headers=other, json=payload).status_code, 403)
            response = self.client.post("/api/project/handover", headers=self.headers, json=payload)
            self.assertEqual(response.status_code, 200)
            with zipfile.ZipFile(io.BytesIO(response.content)) as package:
                attachment = next(name for name in package.namelist() if name.startswith("vedlegg/"))
                self.assertEqual(package.read(attachment), b"%PDF-test")


if __name__ == "__main__":
    unittest.main()
