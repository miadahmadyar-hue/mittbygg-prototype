# Quote-request intake

All 15 wizard routes use the shared handover. A request is not a payment, a professional approval, or a municipal application. The customer explicitly submits contact details, answers, preliminary AI reviews, and the current upload session's attachments. A receipt is returned only after the SQLite transaction commits. Downloads alone do not submit a request.

## Production activation (required)

The intake is deliberately closed until all required configuration is present. Do not point case storage at Render's ephemeral filesystem or `/tmp`.

1. Attach persistent storage to the backend, for example mounted at `/var/data`. Configure `CASE_STORAGE_DIR=/var/data/soknadsklar-cases`. Use one service instance with this SQLite implementation. Provision a shared database/object store before horizontal scaling.
2. Establish a backup and restore procedure for `cases.sqlite3`. The database contains contact details and attachment ZIPs. Keep it private, restrict filesystem access, monitor storage capacity, and verify a restore before activation. Configure `CASE_STORAGE_READY=true` only after this is done.
3. The owner must set a strong, randomly generated `STAFF_API_KEY` (at least 32 characters) through Render's secret environment controls. Never commit, paste into chat, or put it in a `NEXT_PUBLIC_*` variable. Share it only with authorized staff through a password manager. This initial staff dashboard uses a shared access key; per-person accounts, MFA and audit logging are follow-up requirements for a larger team. Rotate the key when staff access changes.
4. Configure a verified SMTP sender: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASSWORD`, `CASE_EMAIL_FROM`, and the owner's chosen `CASE_NOTIFY_EMAIL`. SMTP requires STARTTLS with certificate verification. Email contains only the case reference and a dashboard link, not contact details or attachments.
5. Confirm the published privacy notice, retention period and who handles customer access/deletion requests. The current contact displayed is `hei@soknadsklar.no`. Do not claim a customer email receipt: confirmation is displayed in the app.
6. Deploy, submit a clearly labelled test request, confirm it in the dashboard, confirm notification delivery, download its attachments and verify persistence after a restart. Only then open intake to real customers.

## Staff workflow

Open `https://app.soknadsklar.no/staff/cases` and enter the staff key. It remains only in the current tab's memory; log out when finished. Each case shows name, email, phone, address, wizard type, status and notification delivery state. Download the ZIP to read `saksoversikt.html`, raw `saksopplysninger.json`, and original files under `vedlegg/`. Submitted facts and AI output remain unverified evidence. Existing specialist PDF downloads stay available separately to customers.

Contact the customer, agree scope and send a quote. Mark a case contacted, quoted or closed as appropriate. A status change sends no customer message and takes no payment. The Bruksendring price indication remains over NOK 25,000 excluding VAT.

Email failure does not lose the stored case. Failed or pending notifications remain visible in the dashboard; use “Prøv e-postvarsel igjen” after correcting mail configuration. Check the dashboard routinely, including after service restarts: background notifications interrupted by a restart remain pending.

## Reliability and boundaries

- Request IDs prevent duplicate cases on a same-session retry. Reuse with a changed payload or owner is rejected. After an expired session, check any prior receipt before resubmitting.
- Anonymous demo sessions do not verify customer identity. Staff access uses a separate secret; knowing a case number does not grant package access.
- Uploads must belong to the submitting session. Submission copies original attachments into durable storage; it does not rely on the temporary upload directory afterward.
- Case details and downloads use authenticated endpoints and `Cache-Control: no-store`. Public availability exposes no customer data.
- Request bodies, upload sizes and request rates are bounded. Rate limits are process-local in this prototype.
- No automatic deletion policy is implemented. Agree retention and a controlled deletion process before production activation; “closed” is a workflow status, not erasure.
