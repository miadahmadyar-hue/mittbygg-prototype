import io
import json
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from models import KjellerInput
from regulations.kjeller import evaluate_kjeller
from api import access, ai_architect, drawings

BASE = dict(propId="4", byggeAar=1932, room="bod", ny_bruk="soverom")


class CellarFlowTests(unittest.TestCase):
    def test_unknown_dimensions_never_use_demo_measurements(self):
        result = evaluate_kjeller(KjellerInput(**BASE))
        self.assertEqual(result.outcome, "clarify")
        self.assertTrue(any(f.t == "Takhøyde er ikke målt" for f in result.findings))
        self.assertFalse(any("2150" in f.d or "2280" in f.d for f in result.findings))
        self.assertEqual(result.tiltak, [])

    def test_window_opening_does_not_approve_daylight(self):
        result = evaluate_kjeller(KjellerInput(**BASE, rom_areal=10, takhoyde=2400, vindu_bredde=2, vindu_hoyde=2, vindu_brystning=0))
        self.assertFalse(any(f.t == "Dagslys OK" for f in result.findings))
        self.assertTrue(any(f.t == "Dagslys må dokumenteres" for f in result.findings))

    def test_rental_only_does_not_automatically_create_a_dwelling(self):
        values = {**BASE, "ny_bruk": "hybel"}
        for use, expected in [("same", "clarify"), ("unknown", "clarify"), ("separate", "professional")]:
            with self.subTest(use=use):
                self.assertEqual(evaluate_kjeller(KjellerInput(**values, rental_use=use)).outcome, expected)

    def test_zero_radon_is_not_unknown(self):
        result = evaluate_kjeller(KjellerInput(**BASE, radon=0))
        self.assertFalse(any(f.t == "Radon ikke målt" for f in result.findings))

    def test_handover_keeps_evidence_and_requires_ownership(self):
        access._sessions.clear()
        access._requests.clear()
        with tempfile.TemporaryDirectory() as directory, patch.object(drawings, "UPLOAD_DIR", directory), patch.object(ai_architect, "UPLOAD_DIR", directory), TestClient(app) as client:
            headers = {"X-Session-Token": client.post("/api/auth/session").json()["token"]}
            upload = client.post("/api/drawings/upload", headers=headers, files={"files": ("plan.pdf", b"%PDF-test-evidence", "application/pdf")}).json()
            payload = dict(address="Test Oslo", input=BASE, session_id=upload["session_id"], checklist={"plans": True})
            response = client.post("/api/kjeller/handover", headers=headers, json=payload)
            self.assertEqual(response.status_code, 200)
            with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
                self.assertEqual(archive.read("vedlegg/01_plan.pdf"), b"%PDF-test-evidence")
                self.assertTrue(archive.read("saksunderlag.pdf").startswith(b"%PDF"))
                self.assertNotIn("session_id", json.loads(archive.read("kundeopplysninger.json")))
                self.assertNotIn("prinsippskisse.svg", archive.namelist())
            self.assertEqual(client.post("/api/kjeller/handover", json=payload).status_code, 401)
            other = {"X-Session-Token": client.post("/api/auth/session").json()["token"]}
            self.assertEqual(client.post("/api/kjeller/handover", headers=other, json=payload).status_code, 403)
            result = client.post("/api/evaluate/kjeller", json=BASE).json()
            self.assertEqual(client.post("/api/soknad/tiltak", headers=headers, json=dict(slug="kjeller", result=result, address="Test Oslo")).status_code, 409)

    def test_negative_measurements_are_rejected(self):
        with TestClient(app) as client:
            self.assertEqual(client.post("/api/evaluate/kjeller", json={**BASE, "radon": -1}).status_code, 422)
