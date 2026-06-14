# MittBygg — web (frontend)

Next.js 16 frontend for MittBygg. See the **[root README](../README.md)** for the full
project overview, architecture, and setup.

## Quick start

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev          # http://localhost:3000
```

The backend must be running for live address search and the AI flow — see the
[root README](../README.md#running-locally).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Where things live

- `src/app/` — routes (App Router)
- `src/components/ui/` — UI primitives
- `src/components/wizards/` — the per-tiltak wizards + shared `SimpleWizard`/`ResultPhases`
- `src/lib/api/` — backend fetch clients
- `src/lib/regulations/` — TEK17/SAK10/PBL rule logic
- `src/lib/i18n/` — NO/EN language context
