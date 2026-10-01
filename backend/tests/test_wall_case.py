import io
import json
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from api import access, ai_architect, drawings

WALL = dict(type="ny_apning", baerende="ja", apning_bredde=2, etasje="ovre", etasjer_over=1, konstruksjon="mur_betong")

class WallCaseTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear(); access._requests.clear()
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        for module in (drawings, ai_architect):
            patcher = patch.object(module, "UPLOAD_DIR", directory.name)
            patcher.start(); self.addCleanup(patcher.stop)
        self.headers = self.session()

    def session(self):
        return {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}

    def test_professional_case_exports_original_evidence_and_brief(self):
        upload = self.client.post("/api/drawings/upload", headers=self.headers,
            files={"files": ("plan.pdf", b"%PDF-synthetic-evidence", "application/pdf")}).json()
        payload = dict(address="Demo Oslo", input=WALL, session_id=upload["session_id"], details={"unit": "H0301"})
        response = self.client.post("/api/vegg/handover", headers=self.headers, json=payload)
        self.assertEqual(response.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            self.assertTrue(archive.read("saksunderlag.pdf").startswith(b"%PDF-"))
            self.assertEqual(archive.read("vedlegg/01_plan.pdf"), b"%PDF-synthetic-evidence")
            self.assertIn("Ikke arbeidstegning", archive.read("prinsippskisse.svg").decode())
            case = json.loads(archive.read("kundeopplysninger.json"))
            self.assertEqual(case["details"]["unit"], "H0301")
            self.assertNotIn("session_id", case)
        self.assertEqual(self.client.post("/api/vegg/handover", headers=self.session(), json=payload).status_code, 403)

    def test_checklist_does_not_unlock_permit_generation(self):
        evaluation = self.client.post("/api/evaluate/vegg", json=WALL).json()
        self.assertEqual(evaluation["outcome"], "professional")
        self.assertEqual(self.client.post("/api/soknad/tiltak", headers=self.headers,
            json={"slug": "vegg", "result": evaluation, "address": "Demo"}).status_code, 409)

    def test_missing_evidence_can_be_handed_over_without_fake_approval(self):
        response = self.client.post("/api/vegg/handover", headers=self.headers, json={"address": "Demo", "input": WALL})
        self.assertEqual(response.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            self.assertFalse(any(name.startswith("vedlegg/") for name in archive.namelist()))
            self.assertEqual(json.loads(archive.read("kundeopplysninger.json"))["checklist"], {})

    def test_handover_requires_session(self):
        self.assertEqual(self.client.post("/api/vegg/handover", json={"address": "Demo", "input": WALL}).status_code, 401)
