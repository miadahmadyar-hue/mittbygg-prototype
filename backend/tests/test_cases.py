import io
import os
import tempfile
import unittest
import uuid
import zipfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from api import access, cases, drawings, ai_architect
from main import app


class CasesTests(unittest.TestCase):
    def setUp(self):
        access._sessions.clear()
        access._requests.clear()
        self.tmp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"CASE_STORAGE_READY": "true", "CASE_STORAGE_DIR": self.tmp.name,
            "STAFF_API_KEY": "test-only-staff-secret-32-characters-long", "SMTP_HOST": "test.invalid", "SMTP_USER": "test", "SMTP_PASSWORD": "test", "CASE_EMAIL_FROM": "test@example.invalid", "CASE_NOTIFY_EMAIL": "staff@example.invalid"})
        self.env.start()
        self.mail = patch.object(cases.smtplib, "SMTP")
        self.smtp = self.mail.start()
        self.client = TestClient(app)
        self.headers = {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}
        self.staff = {"Authorization": "Bearer " + os.environ["STAFF_API_KEY"]}
        self.body = {"request_id": str(uuid.uuid4()), "slug": "bruksendring", "address": "TEST", "contact": {"name": "Test User", "email": "test@example.invalid", "phone": "12345678"}, "consent": True, "data": {"input": {"area": 40}, "architect": {"summary": "TEST <script>alert(1)</script>"}}}

    def tearDown(self):
        self.mail.stop()
        self.env.stop()
        self.tmp.cleanup()

    def test_closed_until_configured(self):
        with patch.dict(os.environ, {"CASE_STORAGE_READY": "false"}):
            self.assertFalse(self.client.get("/api/cases/availability").json()["available"])
            self.assertEqual(self.client.post("/api/cases", json=self.body, headers=self.headers).status_code, 503)

    def test_auth_consent_and_staff_isolation(self):
        self.assertEqual(self.client.post("/api/cases", json=self.body).status_code, 401)
        self.assertEqual(self.client.post("/api/cases", json={**self.body, "consent": False}, headers=self.headers).status_code, 422)
        self.assertEqual(self.client.get("/api/staff/cases", headers=self.headers).status_code, 401)
        self.assertEqual(self.client.get("/api/staff/cases/missing/package").status_code, 401)

    def test_durable_receipt_idempotency_and_zip(self):
        with patch.object(drawings, "UPLOAD_DIR", self.tmp.name), patch.object(ai_architect, "UPLOAD_DIR", self.tmp.name):
            uploaded = self.client.post("/api/drawings/upload", headers=self.headers, files={"files": ("test.pdf", b"%PDF-test", "application/pdf")}).json()
            payload = {**self.body, "session_id": uploaded["session_id"]}
            response = self.client.post("/api/cases", headers=self.headers, json=payload)
            self.assertEqual(response.status_code, 201, response.text)
            case_id = response.json()["case_id"]
            self.assertEqual(self.client.post("/api/cases", headers=self.headers, json=payload).json()["case_id"], case_id)
            self.assertEqual(self.client.post("/api/cases", headers=self.headers, json={**payload, "address": "changed"}).status_code, 409)
            # Re-open the database through a fresh client: not process-local storage.
            with TestClient(app) as fresh:
                rows = fresh.get("/api/staff/cases", headers=self.staff)
                self.assertEqual(rows.headers["cache-control"], "no-store")
                self.assertEqual(len(rows.json()), 1)
                package = fresh.get(f"/api/staff/cases/{case_id}/package", headers=self.staff)
                with zipfile.ZipFile(io.BytesIO(package.content)) as z:
                    self.assertTrue(any(n.startswith("vedlegg/") for n in z.namelist()))
                    self.assertNotIn(b"<script>", z.read("saksoversikt.html"))
                    self.assertNotIn(uploaded["session_id"].encode(), z.read("saksopplysninger.json"))
                self.assertEqual(fresh.patch(f"/api/staff/cases/{case_id}", headers=self.staff, json={"status": "contacted"}).status_code, 200)

    def test_upload_ownership_and_mail_failure(self):
        with patch.object(drawings, "UPLOAD_DIR", self.tmp.name), patch.object(ai_architect, "UPLOAD_DIR", self.tmp.name):
            upload = self.client.post("/api/drawings/upload", headers=self.headers, files={"files": ("plan.pdf", b"%PDF-test", "application/pdf")}).json()
            other = {"X-Session-Token": self.client.post("/api/auth/session").json()["token"]}
            self.assertEqual(self.client.post("/api/cases", json={**self.body, "session_id": upload["session_id"]}, headers=other).status_code, 403)
        self.smtp.side_effect = OSError("mail unavailable")
        result = self.client.post("/api/cases", json=self.body, headers=self.headers)
        self.assertEqual(result.status_code, 201)
        rows = self.client.get("/api/staff/cases", headers=self.staff).json()
        self.assertEqual(rows[0]["notification"], "failed")
        self.assertEqual(len(rows), 1)

    def test_all_wizards_and_body_limit(self):
        for slug in cases.SLUGS:
            cases.CaseRequest.model_validate({**self.body, "slug": slug})
        self.assertEqual(self.client.post("/api/cases", content=b"x" * 300001, headers=self.headers).status_code, 413)
        self.assertEqual(self.client.post("/api/cases", json={**self.body, "contact": {**self.body["contact"], "email": "bad"}}, headers=self.headers).status_code, 422)
