import os
import tempfile
import unittest
from unittest.mock import patch

# Test runs must never call a paid provider, even when a developer has a .env.
os.environ["OPENAI_API_KEY"] = ""

from fastapi.testclient import TestClient
from main import app
from api import access, ai_architect, ai_engineer, drawings
from models import KjellerInput
from regulations.kjeller import evaluate_kjeller

GARAGE = dict(type="garasje", areal=60, avstand=4, avstand_bygg=4,
              overnatting=False, kjeller=False, etasjer=1, monehoyde=4,
              gesimshoyde=3, over_ledninger=False, plan_ok=True)

class CustomerFlowTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear()
        access._requests.clear()
        self.client = TestClient(app, raise_server_exceptions=False)
        self.directory = tempfile.TemporaryDirectory()
        self.upload_patch = patch.object(drawings, "UPLOAD_DIR", self.directory.name)
        self.image_patch = patch.object(ai_architect, "UPLOAD_DIR", self.directory.name)
        self.upload_patch.start()
        self.image_patch.start()
        self.headers = self.session()

    def tearDown(self):
        self.upload_patch.stop()
        self.image_patch.stop()
        self.directory.cleanup()
        self.client.close()

    def session(self):
        response = self.client.post("/api/auth/session")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["identity_verified"])
        return {"X-Session-Token": response.json()["token"]}

    def assessment(self):
        response = self.client.post("/api/evaluate/garasje", json=GARAGE)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["outcome"], "application")
        return response.json()

    def test_resource_endpoints_require_a_session(self):
        self.assertEqual(self.client.post("/api/ai/engineer", json={}).status_code, 401)
        self.assertEqual(self.client.post("/api/drawings/upload", files={"files": ("a.png", b"example", "image/png")}).status_code, 401)

    def test_pdf_generation_returns_a_real_pdf(self):
        response = self.client.post("/api/soknad/tiltak", headers=self.headers,
            json={"slug": "garasje", "result": self.assessment(), "address": "Demo"})
        self.assertEqual(response.status_code, 200, response.text[:300] if response.status_code != 200 else "")
        self.assertTrue(response.content.startswith(b"%PDF-"))
        self.assertGreater(len(response.content), 1000)

    def test_pdf_generation_failure_does_not_return_success(self):
        with patch("api.soknad.generate_generic_pdf", side_effect=RuntimeError("test failure")):
            response = self.client.post("/api/soknad/tiltak", headers=self.headers,
                json={"slug": "garasje", "result": self.assessment()})
        self.assertEqual(response.status_code, 500)

    def test_document_generation_rechecks_answers(self):
        result = self.assessment()
        result["input"]["plan_ok"] = None
        result["outcome"] = "application"
        response = self.client.post("/api/soknad/tiltak", headers=self.headers,
            json={"slug": "garasje", "result": result})
        self.assertEqual(response.status_code, 409)

    def test_partial_upload_reports_rejected_files(self):
        response = self.client.post("/api/drawings/upload", headers=self.headers,
            files=[("files", ("plan.pdf", b"%PDF-demo", "application/pdf")),
                   ("files", ("bad.exe", b"x", "application/octet-stream"))])
        self.assertEqual(response.status_code, 200)
        self.assertEqual([f["name"] for f in response.json()["files"]], ["plan.pdf"])
        self.assertEqual(response.json()["rejected"][0]["name"], "bad.exe")

    def test_all_rejected_upload_is_an_error(self):
        response = self.client.post("/api/drawings/upload", headers=self.headers,
            files={"files": ("bad.exe", b"x", "application/octet-stream")})
        self.assertEqual(response.status_code, 400)

    def test_visitor_cannot_analyze_another_visitors_upload(self):
        upload = self.client.post("/api/drawings/upload", headers=self.headers,
            files={"files": ("plan.pdf", b"%PDF-demo", "application/pdf")}).json()
        response = self.client.post("/api/ai/architect", headers=self.session(),
            json={"slug": "garasje", "session_id": upload["session_id"], "project": GARAGE})
        self.assertEqual(response.status_code, 403)

    def test_project_answers_reach_architect(self):
        expected = ai_architect._fallback_assessment([], "test")
        with patch.object(ai_architect, "OPENAI_API_KEY", "test"), patch.object(ai_architect, "_call_openai", return_value=expected) as call:
            response = self.client.post("/api/ai/architect", headers=self.headers,
                json={"slug": "garasje", "project": GARAGE})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(call.call_args.args[-1], GARAGE)

    def test_missing_ai_returns_explicit_unavailable_assessment(self):
        with patch.object(ai_engineer, "OPENAI_API_KEY", ""):
            response = self.client.post("/api/ai/engineer", headers=self.headers,
                json={"slug": "garasje", "project": GARAGE})
        self.assertEqual(response.json()["meta"]["source"], "fallback")
        self.assertEqual(response.json()["beregninger"], [])

    def test_expired_session_is_rejected(self):
        access._sessions[self.headers["X-Session-Token"]] = (0, "testclient")
        self.assertEqual(self.client.post("/api/ai/engineer", headers=self.headers, json={}).status_code, 401)

    def test_session_creation_is_rate_limited(self):
        for _ in range(9):
            self.client.post("/api/auth/session")
        self.assertEqual(self.client.post("/api/auth/session").status_code, 429)

    def test_unknown_year_does_not_qualify_as_an_old_building(self):
        result = evaluate_kjeller(KjellerInput(propId="example", byggeAar=None, room="bod", ny_bruk="soverom", rom_areal=20, takhoyde=2300))
        self.assertFalse(result.eldre)
        self.assertEqual(result.outcome, "clarify")
        self.assertTrue(any(f.t == "Byggeår er ukjent" for f in result.findings))

if __name__ == "__main__":
    unittest.main()
