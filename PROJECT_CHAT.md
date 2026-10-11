# Project chat — first release

The project selection page now presents an expanded architect/engineer chat above the project cards. It responds in the selected Norwegian/English language and recommends only visible, available wizard routes. Unclear requests get follow-up questions. Customers review the description and confirm before navigation; handoff stores intake context without changing existing form answers or case records. Wall/basement chats can pick up this conversation when they have no existing conversation; existing chats are preserved. Descriptions are also available in the preparation flow.

Wall changes (`vegg`) and basement conversion (`kjeller`) have an optional Norwegian chat on the first wizard step. Architect and engineer roles share the conversation. Customers review proposed fields and their supporting quotes, confirm, then review the normal form before assessment.

Main-page and specialist chats accept PDF, PNG and JPG attachments (six files, 10 MB each, 20 MB total). Selecting a batch uploads it; sending a message supplies those files to the AI. Replace/remove controls affect future messages. Attachments are session-owned and can be reused explicitly in the later drawing-upload step, so existing document-review, ZIP and case-submission flows receive the same session. An authenticated status check detects missing/expired files before reuse. Reload/session renewal can require reuploading. This does not add durable pre-submission storage or delete previously processed files when removed from chat.

The chat does not size structural members, generate construction instructions, certify compliance, submit applications, or charge customers. Uploads and document review remain in the existing preparation flow. The confirmed, editable description is available there through “Ta med beskrivelsen i saken”; this explicitly merges it into case notes without overwriting existing notes. Those notes follow existing ZIP and quote-submission flows. Full chat transcripts are not automatically sent to staff.

## Configuration

`OPENAI_API_KEY` is required on the backend. Model priority: `OPENAI_CHAT_MODEL`, role-specific `OPENAI_ARCHITECT_MODEL` / `OPENAI_ENGINEER_MODEL`, `OPENAI_MODEL`, then the existing `gpt-6-astra` default. No frontend key. Missing configuration or provider failures return 503 and leave the form available.

`POST /api/ai/chat` uses existing anonymous sessions and AI rate limits (30 calls/IP/day, 300 globally/day, process-local). Each chat turn counts; a conversation allows up to 20 customer turns with a 30,000-character request limit. Both chat and existing document review share this budget. Multiple workers require shared rate-limit storage before scaling.

Responses use strict JSON schema and separate higher-priority instructions. Proposed fields are allowlisted, range checked and require a quote from the latest customer message. These checks cannot prove semantic accuracy: customer confirmation and professional review remain necessary. Approved-drawing confirmation cannot be set by AI. Missing wall floors are now explicitly unknown.

Browser drafts are scoped to the project/wizard path. Sending shares the conversation with the configured AI provider (`store: false`); this does not mean zero provider retention. The frontend explains browser storage and AI processing. No raw conversation logging or separate server transcript store is added.

## Validation

- Backend: `python -m unittest discover -s tests` (90 tests).
- Frontend: `npm test` (12 tests), `npm run lint`, `npm run build`.
- Local browser fixture checks: specialist switching, evidence review, unknown correction, AI outage with message preservation, confirmation before form transfer, case description handoff, basement unit display.
- Deployment requires both frontend and backend. Verify live provider responses after Render deployment; simulated responses are not evidence of live model availability.

## Follow-up scope

Extend specialist chat to other wizards only after customer feedback on these two. Future work may include translated specialist chat UI, cross-device conversation storage, and staff transcript access with appropriate consent and access control. Existing authentication and professional-review limitations continue to apply.
# Conversational forms across all wizards — 12 October 2026

Every one of the 15 wizard routes now offers conversational intake and a single editable review. The original step-by-step form remains available, with its existing draft retained separately. Main-page messages and attachments carry into the selected project's conversation; the first new message (or the explicit fill-from-history button) extracts earlier customer facts without asking the customer to repeat them.

`backend/api/intake.py` derives the review fields and bounds from the existing evaluator input models, with bilingual labels and conditional questions. The UI fills draft answers as chat replies arrive, shows evidence from the customer's text, accepts corrections and explicit unknowns, and retains the draft locally. `/api/ai/intake` shares existing session ownership, attachment validation and AI rate limits. Only allowed, bounded values with a quote from customer messages are accepted. The first extraction can use customer history; subsequent turns use only the latest customer message so an old answer cannot silently undo a review edit.

`POST /api/intake/{slug}/evaluate` requires explicit review confirmation and validates all active fields independently of the AI. Required values cannot silently fall back to evaluator defaults (including false booleans). Nullable facts can remain unknown. Required measurements with no unknown representation must be provided before assessment; the UI identifies these and preserves the draft for later clarification. Approved-drawing confirmation is a separate customer checkbox that the AI cannot set, and changing approved use resets it.

The confirmed review calls the same evaluator used by the original wizard, then continues through the existing result, professional preparation, attachments and quote-request screens. It does not order work, pay, submit an application, or certify engineering. The chat is an intake aid, not an engineering design tool. The case description is editable and explicitly saved when the review is confirmed.

Validation includes every wizard's configuration and evaluation against its existing engine; missing/defaulted fields; ranges and booleans; conditional branches; corrections; user-history handoff; protected fields; provider failures; and attachment expiry. Frontend tests cover required/unknown states, corrections, conditional fields and confirmation resets. Existing attachment session-expiry and local-draft limitations still apply.
