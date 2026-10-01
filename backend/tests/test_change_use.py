import io
import json
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from models import BruksendringInput
from regulations.bruksendring import evaluate_bruksendring
from api import access, ai_architect, drawings

BASE = dict(fra="bod", til="rom", areal=None, bolig_scope="same")


class ChangeUseTests(unittest.TestCase):
    def test_unknown_answers_block_application(self):
        result = evaluate_bruksendring(BruksendringInput(**BASE))
        self.assertEqual(result.outcome, "clarify")
        self.assertTrue(any(f.t == "Areal er ikke målt" for f in result.findings))
        self.assertTrue(any(f.t == "Bærende inngrep er uavklart" for f in result.findings))
        self.assertTrue(any(f.t == "Vernestatus er ukjent" for f in result.findings))

    def test_commercial_to_home_requires_professional_route(self):
        result = evaluate_bruksendring(BruksendringInput(fra="naring", til="bolig", areal=40))
        self.assertEqual(result.outcome, "professional")
        self.assertNotIn("2,2", " ".join(f.d for f in result.findings))
        self.assertEqual(result.totalKostnad, 0)

    def test_same_category_is_not_automatically_exempt(self):
        result = evaluate_bruksendring(BruksendringInput(fra="kontor", til="kontor"))
        self.assertEqual(result.outcome, "clarify")
        self.assertTrue(any("samme brukskategori" in f.t for f in result.findings))

    def test_invalid_area_is_rejected_but_unknown_is_valid(self):
        with TestClient(app) as client:
            self.assertEqual(client.post("/api/evaluate/bruksendring", json=BASE).status_code, 200)
            self.assertEqual(client.post("/api/evaluate/bruksendring", json={**BASE, "areal": -1}).status_code, 422)

    def test_package_preserves_evidence_and_never_unlocks_submission(self):
        access._sessions.clear()
        access._requests.clear()
        with tempfile.TemporaryDirectory() as directory, patch.object(drawings, "UPLOAD_DIR", directory), patch.object(ai_architect, "UPLOAD_DIR", directory), TestClient(app) as client:
            headers = {"X-Session-Token": client.post("/api/auth/session").json()["token"]}
            upload = client.post("/api/drawings/upload", headers=headers, files={"files": ("plan.pdf", b"%PDF-test", "application/pdf")}).json()
            payload = dict(address="Test", input=BASE, session_id=upload["session_id"])
            response = client.post("/api/bruksendring/handover", headers=headers, json=payload)
            self.assertEqual(response.status_code, 200)
            with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
                self.assertEqual(archive.read("vedlegg/01_plan.pdf"), b"%PDF-test")
                self.assertNotIn("session_id", json.loads(archive.read("kundeopplysninger.json")))
                self.assertTrue(archive.read("saksunderlag.pdf").startswith(b"%PDF"))
            self.assertEqual(client.post("/api/bruksendring/handover", json=payload).status_code, 401)
            other = {"X-Session-Token": client.post("/api/auth/session").json()["token"]}
            self.assertEqual(client.post("/api/bruksendring/handover", headers=other, json=payload).status_code, 403)
            result = client.post("/api/evaluate/bruksendring", json=BASE).json()
            result.update(outcome="application", status="green", soknadstype="Søknad")
            self.assertEqual(client.post("/api/soknad/tiltak", headers=headers, json=dict(slug="bruksendring", result=result, address="Test")).status_code, 409)
