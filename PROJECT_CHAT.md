# Project chat — first release

Wall changes (`vegg`) and basement conversion (`kjeller`) have an optional Norwegian text chat on the first wizard step. Architect and engineer roles share the conversation. Customers review proposed fields and their supporting quotes, confirm, then review the normal form before assessment.

The chat does not size structural members, generate construction instructions, certify compliance, submit applications, or charge customers. Uploads and document review remain in the existing preparation flow. The confirmed, editable description is available there through “Ta med beskrivelsen i saken”; this explicitly merges it into case notes without overwriting existing notes. Those notes follow existing ZIP and quote-submission flows. Full chat transcripts are not automatically sent to staff.

## Configuration

`OPENAI_API_KEY` is required on the backend. Model priority: `OPENAI_CHAT_MODEL`, role-specific `OPENAI_ARCHITECT_MODEL` / `OPENAI_ENGINEER_MODEL`, `OPENAI_MODEL`, then the existing `gpt-6-astra` default. No frontend key. Missing configuration or provider failures return 503 and leave the form available.

`POST /api/ai/chat` uses existing anonymous sessions and AI rate limits (30 calls/IP/day, 300 globally/day, process-local). Each chat turn counts; a conversation allows up to 20 customer turns with a 30,000-character request limit. Both chat and existing document review share this budget. Multiple workers require shared rate-limit storage before scaling.

Responses use strict JSON schema and separate higher-priority instructions. Proposed fields are allowlisted, range checked and require a quote from the latest customer message. These checks cannot prove semantic accuracy: customer confirmation and professional review remain necessary. Approved-drawing confirmation cannot be set by AI. Missing wall floors are now explicitly unknown.

Browser drafts are scoped to the project/wizard path. Sending shares the conversation with the configured AI provider (`store: false`); this does not mean zero provider retention. The frontend explains browser storage and AI processing. No raw conversation logging or separate server transcript store is added.

## Validation

- Backend: `python -m unittest discover -s tests` (85 tests).
- Frontend: `npm test` (11 tests), `npm run lint`, `npm run build`.
- Local browser fixture checks: specialist switching, evidence review, unknown correction, AI outage with message preservation, confirmation before form transfer, case description handoff, basement unit display.
- Deployment requires both frontend and backend. Verify live provider responses after Render deployment; simulated responses are not evidence of live model availability.

## Follow-up scope

Extend to other wizards only after customer feedback on these two. Future work may include inline uploads, translated chat UI, cross-device conversation storage, and staff transcript access with appropriate consent and access control. Existing authentication and professional-review limitations continue to apply.
