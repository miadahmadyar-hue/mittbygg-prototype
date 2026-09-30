import base64
import json
import os
import tempfile
import unittest
import httpx
from unittest.mock import patch

os.environ["OPENAI_API_KEY"] = ""
from fastapi.testclient import TestClient
from main import app
from api import access, ai_architect, ai_engineer, drawings


class AIReviewTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear()
        access._requests.clear()
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        for module in (drawings, ai_architect):
            patcher = patch.object(module, "UPLOAD_DIR", directory.name)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.headers = self.session()

    def session(self):
        return {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}

    def upload(self):
        files = [("files", ("plan.pdf", b"%PDF-test-evidence", "application/pdf"))]
        files += [("files", (f"view{i}.png", b"image-evidence", "image/png")) for i in range(5)]
        response = self.client.post("/api/drawings/upload", headers=self.headers, files=files)
        self.assertEqual(response.status_code, 200)
        return response.json()["session_id"]

    def test_pdf_and_all_six_drawings_reach_both_providers(self):
        session = self.upload()
        responses = {
            "architect": {"feasible": False, "summary": "Span unknown", "items": [], "anbefalinger": []},
            "engineer": {"tittel": "Review", "konklusjon": "Measure span", "notater": [], "beregninger": [{"verdi": "unsafe invented value"}]},
        }
        for role, module in (("architect", ai_architect), ("engineer", ai_engineer)):
            with self.subTest(role=role), patch.object(module, "OPENAI_API_KEY", "test"), patch("api.openai_review.httpx.Client") as provider:
                provider.return_value.__enter__.return_value.post.return_value = httpx.Response(200,
                    request=httpx.Request("POST", "https://api.openai.com/v1/responses"),
                    json={"status": "completed", "output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(responses[role])}]}]})
                response = self.client.post(f"/api/ai/{role}", headers=self.headers, json={"session_id": session, "project": {"areal": 60}, "architect_summary": "Span unknown"})
                self.assertEqual(response.status_code, 200)
                request = provider.return_value.__enter__.return_value.post.call_args.kwargs["json"]
                self.assertEqual(request["model"], "gpt-6-astra")
                self.assertFalse(request["store"])
                self.assertTrue(request["text"]["format"]["strict"])
                content = request["input"][0]["content"]
                self.assertEqual(len(content), 7)
                self.assertEqual(content[1]["type"], "input_image")
                self.assertTrue(content[1]["image_url"].startswith("data:image/png;base64,"))
                self.assertEqual(content[0]["type"], "input_file")
                self.assertEqual(base64.b64decode(content[0]["file_data"].split(",", 1)[1]), b"%PDF-test-evidence")
                self.assertIn('"areal": 60', content[-1]["text"])
                self.assertEqual(response.json()["meta"]["drawings_reviewed"], 6)
                if role == "engineer":
                    self.assertIn("Span unknown", content[-1]["text"])
                    self.assertTrue(response.json()["meta"]["architect_context_received"])
                    self.assertEqual(response.json()["beregninger"], [])

    def test_engineer_cannot_access_another_visitors_drawings(self):
        session = self.upload()
        response = self.client.post("/api/ai/engineer", headers=self.session(), json={"session_id": session})
        self.assertEqual(response.status_code, 403)

    def test_missing_upload_is_explicit_error_for_both_roles(self):
        for role in ("architect", "engineer"):
            response = self.client.post(f"/api/ai/{role}", headers=self.headers, json={"session_id": "a" * 12})
            self.assertEqual(response.status_code, 409)

    def test_provider_failure_never_becomes_successful_assessment(self):
        for role, module in (("architect", ai_architect), ("engineer", ai_engineer)):
            with patch.object(module, "OPENAI_API_KEY", "test"), patch("api.openai_review.httpx.Client", side_effect=RuntimeError("provider offline")):
                response = self.client.post(f"/api/ai/{role}", headers=self.headers, json={})
                self.assertEqual(response.json()["meta"], {"source": "fallback", "reason": "ai_error"})

    def test_total_upload_limit_reports_files_that_were_not_accepted(self):
        files = [("files", (f"view{i}.png", b"x" * (8 * 1024 * 1024), "image/png")) for i in range(3)]
        response = self.client.post("/api/drawings/upload", headers=self.headers, files=files)
        self.assertEqual(len(response.json()["files"]), 2)
        self.assertIn("20 MB", response.json()["rejected"][0]["reason"])
