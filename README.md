# Søknadsklar

Production domains:

- `soknadsklar.no` — public website
- `app.soknadsklar.no` — application entry point

**From idea to building permit.** A consumer app for Norwegian building applications
(*byggesøknader*): search an address → pick what you want to build (*tiltak*) → get a
regulation check against TEK17 / SAK10 / PBL → upload drawings for an AI architect +
engineer assessment → buy and download a complete application package (PDF).

Mobile-first, Norwegian-first (with an EN toggle for demos).

---

## Architecture

```
┌─────────────┐      HTTPS/JSON      ┌──────────────┐
│   web/      │ ───────────────────► │  backend/    │
│  Next.js 16 │                      │  FastAPI     │
│  (Netlify)  │ ◄─────────────────── │  (Render)    │
└─────────────┘                      └──────┬───────┘
                                            │
                  ┌─────────────────────────┼───────────────────────┐
                  ▼                         ▼                        ▼
            Kartverket API          Anthropic Claude          DiBK forms
          (address/matrikkel)    (architect + engineer       (PDF via fpdf2)
                                   agents, with rule-
                                   based fallbacks)
```

- **Frontend** — Next.js 16 (App Router, React 19, Tailwind 4). All screens are client
  components; property data flows via `localStorage` + backend fallback.
- **Backend** — FastAPI (Python 3.12). Thin routers per domain under `backend/api/`.
  The regulation logic and PDF generation live here.
- **AI agents** — two Claude-backed endpoints (architect = vision over uploaded drawings,
  engineer = structural/technical calcs). Both **fall back to rule-based output** when no
  `ANTHROPIC_API_KEY` is set, so the app works fully offline-of-Claude.

---

## Repo layout

```
mittbygg-prototype/
├── web/                     # Next.js frontend
│   └── src/
│       ├── app/             # routes (App Router): /, /address, /bankid, /property/[id]/...
│       ├── components/      # UI primitives + wizards (one per tiltak)
│       │   ├── ui/          # Button, Topbar, Alert, LangToggle, ...
│       │   └── wizards/     # SimpleWizard shell + ResultPhases + per-tiltak wizards
│       └── lib/
│           ├── api/         # fetch clients (evaluate, soknad, drawings, aiArchitect, ...)
│           ├── data/        # static data (tiltak list, pricing, addresses, ...)
│           ├── regulations/ # TEK17/SAK10/PBL rule logic (core IP)
│           └── i18n/        # NO/EN language context
├── backend/                 # FastAPI backend
│   ├── api/                 # routers: address, evaluate, soknad, drawings,
│   │                        #          ai_architect, ai_engineer, auth, property
│   ├── main.py              # app + CORS + router wiring
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml       # runs the backend locally
└── render.yaml              # Render blueprint
```

---

## Running locally

You need two terminals: one for the backend, one for the frontend.

### 1. Backend (FastAPI) — http://localhost:8000

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env             # then edit .env (see below) — ANTHROPIC_API_KEY is optional
uvicorn main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

> Prefer Docker? From the repo root: `docker compose up` (uses `backend/.env`).

### 2. Frontend (Next.js) — http://localhost:3000

```bash
cd web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000 and walk the flow: **address → property → tiltak → wizard →
result → upload → AI analysis → payment → PDF**.

> The frontend works without the backend for the hardcoded test addresses (`/property/1`,
> `/property/2`); live address search needs the backend (or falls back to Kartverket directly).

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | no* | — | Enables real Claude analysis. Without it, agents use rule-based fallbacks. |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Model for both AI agents. |
| `ANTHROPIC_ARCHITECT_MODEL` | no | falls back to `ANTHROPIC_MODEL` | Override architect agent only. |
| `ANTHROPIC_ENGINEER_MODEL` | no | falls back to `ANTHROPIC_MODEL` | Override engineer agent only. |
| `CORS_ORIGINS` | no | localhost + Netlify URL | Comma-separated allowed origins. |
| `KARTVERKET_BASE_URL` | no | `https://ws.geonorge.no` | Address/matrikkel data source. |
| `UPLOAD_DIR` | no | `/tmp/mittbygg_drawings` | Where uploaded drawings are stored. |
| `PORT` | no | `8000` | Set by the host (Render) in production. |

\* Optional for development — the app runs fully without it via fallbacks.

### Frontend (`web/.env.local`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:8000` | Base URL of the backend. |

---

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/address/search?q=` | Address autocomplete (Kartverket + enrichment) |
| `GET` | `/api/property/{id}` | Full property data for a matrikkel id |
| `POST` | `/api/evaluate/{tiltak}` | Regulation check per tiltak (kjeller, tilbygg, …) |
| `POST` | `/api/drawings/upload` | Upload drawings → returns a `session_id` |
| `POST` | `/api/ai/architect` | Claude vision assessment of drawings + property |
| `POST` | `/api/ai/engineer` | Claude technical/structural assessment |
| `POST` | `/api/soknad/tiltak` | Generate the application-package PDF |
| `GET` | `/health` | Liveness probe |

Full schema at `/docs` (Swagger) when the backend is running.

---

## Scripts

**Frontend** (`cd web`):

| Command | Does |
|---|---|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

**Backend** (`cd backend`): `uvicorn main:app --reload --port 8000`

---

## Deployment

- **Frontend → Netlify** — auto-deploys from `main`. Build: `npm ci && npm run build`
  (config in `netlify.toml`). Set `NEXT_PUBLIC_API_URL` in the Netlify dashboard.
- **Backend → Render** — Docker service (`backend/Dockerfile`). Set `ANTHROPIC_API_KEY`,
  `CORS_ORIGINS`, etc. in the Render dashboard.

> ⚠️ **Two known deploy gotchas** (June 2026):
> 1. The live Render service is named **`mittbygg-prototype`** (not `mittbygg-api` from
>    `render.yaml`). Env vars/deploys must target `mittbygg-prototype`.
> 2. Render's GitHub auto-deploy is currently disconnected — pushes need a **Manual Deploy**.

---

## Current state & known limitations

This is a **working prototype** under active development. Honest status:

- ✅ Stage 1 complete: address search, property dashboard, 15 tiltak wizards with
  regulation checks, application-package PDF, NO/EN toggle.
- ✅ Stage 2 live: drawing upload + AI architect/engineer agents (real Claude in prod).
- ✅ Automated regulation and API integration tests, frontend session tests, and CI checks.
- ⚠️ Payment (Vipps) and BankID login are **simulated** (demo mode), not real integrations.
- ⚠️ In EN mode, deep legal/AI-generated text stays Norwegian by design; 3 of 15 wizards are
  fully translated.
- ⏳ Stage 2 remaining: Altinn submission (needs Maskinporten credentials).

See the issue tracker / team notes for the prioritized backlog.

---

## Tech stack

**Frontend:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4
**Backend:** FastAPI, Python 3.12, Pydantic 2, httpx, fpdf2, Anthropic SDK
**Infra:** Netlify (web), Render (api), Anthropic Claude, Kartverket/Geonorge APIs


## Customer-flow reliability

- Draft answers and wizard steps are saved per property and project type in this browser only. There is one draft per project type; this is not an account-backed project database. Storage failures are shown explicitly.
- Generated PDFs are kept in IndexedDB and can be downloaded from the property dashboard. Clearing browser data removes local drafts and documents.
- Missing property facts remain unknown. Customer corrections are stored separately with a confirmation timestamp. Older property caches are intentionally discarded.
- Outages have retry/edit controls. Rejected drawing files must be acknowledged; PDF success requires a valid PDF response and local save. Uploaded drawings are not embedded in the generated PDF.
- Results expose a stable `outcome` field. The PDF endpoint re-evaluates submitted answers before creating an application draft.
- BankID/payment/submission remain demo-only. No verified customer identity or municipal submission is claimed.
- AI requests include the project answers. Engineer output is a preliminary documentation review, not generated structural calculations. Invalid model responses use the explicit unavailable state.

### API sessions and limits

Before calling AI, upload or document endpoints, request `POST /api/auth/session` and send the returned token in `X-Session-Token`. Sessions expire after one hour and do not verify identity. Drawing analysis requires the session that uploaded the files. The frontend renews expired sessions; expired drawings must be uploaded again.

Session creation is limited to 10/minute per direct client IP. Resource calls are limited to 20/minute per IP; AI calls also have a 30/day per-IP limit and a 300/day process-wide limit. These counters and sessions are process-local, reset on restart, and are intended for the single-worker demo deployment. Configure a shared session store and gateway limits before scaling to multiple workers or exposing paid production accounts. Reverse-proxy client-IP handling must be configured by the host; the app does not trust arbitrary forwarded headers.

Deploy the backend and frontend together: the frontend expects the session endpoint and result outcome field. Netlify may deploy automatically on push; the Render service may require a manual deployment (see Deployment above).

### Verification

- Frontend (Node 24): `cd web`, then `npm test`, `npm run lint`, `npm run build`.
- Backend: `cd backend`, then `python -m unittest discover -s tests -v`.
- PDF generation uses DejaVu fonts on Linux or Arial on Windows. Set `PDF_FONT_DIR` to a directory containing DejaVuSans.ttf and DejaVuSans-Bold.ttf if needed.
- Browser regression: create a garage draft, reload on step two, use header Back, retry an unavailable backend, simulate a failed PDF request, generate a PDF, return to the dashboard and download it again.
