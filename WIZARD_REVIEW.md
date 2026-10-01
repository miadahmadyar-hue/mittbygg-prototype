# Wizard review — 1 October 2026

The customer journey now leads to a free quote request, followed by staff review and an agreed scope and price. Downloading a ZIP does not send a case. Submitting the contact form stores the case, notifies the configured staff mailbox and returns a case number. Neither action submits a municipal application or collects payment.

## Coverage and changes

| Wizard | Review outcome |
| --- | --- |
| Basement conversion | Retained measured/unknown inputs and specialist preparation; updated shared handoff and receipt persistence. |
| Structural wall | Retained professional preparation and conceptual drawing package. Removed the silent local assessment fallback when the API is unavailable. No structural sizing is generated. |
| Change of use | Retained approved-use questions and price above NOK 25,000 excluding VAT; updated shared preparation and receipts. |
| Room conversion | Added unknown approved use and optional area; stopped treating hallway/laundry as automatically ancillary space; removed generic height/daylight formulas and fabricated construction totals. |
| New dwelling | Replaced silent false defaults for all three division criteria with yes/no/unknown. Unknown criteria require clarification. |
| Garage/carport | Added unknown utility status, allowed zero boundary distances, corrected multiple-storey self-application routing; tailored site/access/fire documentation. |
| Annex/outbuilding | Cleared overnight use when changing from annex to shed; added unknown utility status, corrected multiple-storey routing; tailored use and site documentation. |
| Extension | Corrected the outdated exclusion of living rooms/wet rooms from the small-extension rule; added support, scope, existing approved use and separate-dwelling questions. Other configurations require clarification. |
| Facade/terrace | Added unknown heritage status and terrace plan/railing checks; prevented new openings from being treated as simple maintenance. |
| Window/door | Added fire/heritage/appearance uncertainty; removed unconditional exemption, prescribed EI30 glazing and a universal U-value. |
| Roof/attic | Unknown heritage status cannot produce a maintenance exemption; insulation is not classified as like-for-like maintenance. |
| Privacy wall | Retained the dimension/plan boundary checks and added tailored wind/foundation/site documentation. |
| Dock | Tightened positive-dimension validation and added plans, rights, shoreline and foundation evidence prompts. |
| Ground investigation | Removed implied booking, geotechnician connection and delivery-time promises. Added report-scope prompts and made this distinct service visible in the selector. |
| Other projects | Expanded the description allowance, added an accessible label and tailored manual-review preparation. |

## Shared improvements

- All general routes now collect project context before uploads and AI review, with relevant document hints and a customer-reported checklist.
- Every general route supports a draft PDF + JSON + original attachments ZIP, protected by upload-session ownership. Existing wall and conversion packages remain available.
- Consolidated the duplicated post-result code. Removed unused payment and fictitious Altinn preview components.
- Older assessments require a new review; stored answers remain available. Old yes/no switches that represented unknown facts are reset to unknown when migrating drafts.
- Receipts survive returning from downloads and reopening the draft. Customers can download a receipt, and the project list shows the case number.
- Availability checks time out and can be retried. Contact information points to post@soknadsklar.no.
- Staff can still retrieve stored cases if email configuration becomes unavailable.
- Selectable cards expose their selected state to assistive technology.

## Verification

- Backend: 68 unittest cases pass, including assessments and draft-package generation for all 15 slugs, numeric boundaries, unknown conditions, authenticated attachment ownership, receipt/idempotency, staff isolation and mail failure handling.
- Frontend: 7 tests pass for sequential AI review, failure handling, session renewal/concurrency and the approved change-of-use price.
- ESLint and Next.js production build pass.
- Browser: walked all 15 questionnaires through an assessment to preparation using the local app. Covered old-draft migration, unknown measurements, unknown heritage/fire/plan information and zero boundary distance.
- Local full journey: dwelling quote request returned a receipt; ZIP download and page reload preserved it. Local AI/email were mocked, not live professional reviews or live email delivery.
- PDF: rendered and visually inspected both pages of a representative general-wizard brief; corrected raw field names and orphaned section headings.

## Rule references used for corrections

- [DiBK SAK10 § 4-1](https://www.dibk.no/regelverk/sak/2/4/4-1): small extensions, terraces and exemption conditions.
- [DiBK SAK10 § 3-1](https://www.dibk.no/regelverk/sak/2/3/3-1/): owner applications for smaller projects.
- [DiBK window work examples](https://www.dibk.no/bygge-eller-endre/arbeid-pa-eksisterende-bygg/eksempler-pa-byggearbeid-pa-vindu/): maintenance and facade changes.
- [DiBK change of use](https://www.dibk.no/bygge-eller-endre/hva-er-en-bruksendring): approved use and room classification.

## Limits relevant to demonstrations and grants

This is a preliminary assessment and case-intake service. A complete local plan check, professional structural calculations, signed responsibility declarations, paid checkout and municipal/Altinn submission are not performed by the wizards. AI reviews identify missing evidence; they do not replace the responsible professional. Staff access currently uses the configured shared key. Drafts are browser-local; staff case records use the configured persistent volume. See CASE_INTAKE_SETUP.md for operational setup and backup considerations.
