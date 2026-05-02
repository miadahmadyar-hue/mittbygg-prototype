# MittBygg — Strategi & arkitektur

> Forbruker-app som gir alle norske husholdninger byggesøknader, tegninger og
> fagtjenester på én flate. Du logger inn med BankID, finner din eiendom, sier
> hva du vil gjøre — og appen tar deg fra idé til ferdig søknad.

## 1. Visjon i én setning

> *"Fra idé til ferdigattest — uten å åpne Word, ringe en arkitekt eller forstå PBL §31-2."*

## 2. Brukerne

| Segment | Smerten i dag | Hva MittBygg løser |
|---|---|---|
| **Boligeier (primær)** | Vet ikke om tiltaket er søknadspliktig, hva det koster, hvilke krav som gjelder, hvor man får tegninger. | Adresse → tiltak → svar på 60 sek + ferdig søknadspakke. |
| **Hytteeier** | Samme som over, pluss kommune-spesifikke regler (LNF, byggegrenser) | Lokal regelmotor pr. kommune. |
| **Borettslag-styre** | Skal håndtere fasade-endringer, balkong-utvidelser, vinduer for hele blokken. | Felles prosjekt-arbeidsflyt med flere boenheter. |
| **Lokal arkitekt / ANS-foretak** | Liten administrasjon-overhead på små saker (TK1) "spiser" lønnsom tid. | Marketplace: forbruker velger arkitekt for kvalitetssikring. Arkitekten får ferdig dossier å signere. |
| **Kommunens byggesaksavd.** | Dårlig kvalitet på innsendte søknader → mangelmelding → re-arbeid. | Strukturerte søknader fra MittBygg → kortere saksbehandling. |

Forretningsmodellen følger:
- **B2C abonnement** (gratis: regelsjekk; betalt: tegninger + søknadspakke; "premium": arkitekt-signert)
- **B2B for arkitekter** (provision på leads, white-label for foretak)
- **B2G**: lisens til kommuner som vil tilby strukturert innsending

## 3. Service-design — kunde-reisen

```
1. ENTRY        → Google-søk: "kan jeg gjøre om kjeller til soverom?" → MittBygg-artikkel
2. ONBOARDING   → BankID-login (Vipps Login) → Kartverket-adressesøk
3. EIENDOM      → Auto-henter: Matrikkel (gnr/bnr, BRA, byggeår, etasjer),
                  reguleringsplan, byggegrenser, tidligere byggesaker fra DiBK.
4. TILTAK       → Bibliotek av 30+ tiltak (bruksendring, fjern vegg, garasje,
                  tilbygg, fasade, vindu, tak, solceller, levegg, brygge,
                  anneks, ...). Hver med ikon, kort beskrivelse, "ofte
                  søknadspliktig?" hint.
5. WIZARD       → Tiltaksspesifikk skjema (3-7 steg). Ingen PBL-jargon. AI
                  spør oppfølgingsspørsmål når noe er uklart.
6. SVAR         → Innen 30 sek:
                    - Søknadsplikt (ja/nei/avhenger) + hjemmel
                    - Tiltaksklasse + om ansvarsrett trengs
                    - TEK17-sjekk (med PBL §31-2 lempninger for eldre bygg)
                    - Konkret tiltak-liste med kostnadsestimat
                    - Tidslinje: nabovarsel 14d → kommune 3-12 uker → IG → ferdig
7. PAKKE        → Hvis søknadspliktig, generer:
                    - Plantegninger FOR/ETTER
                    - Snitt og fasader
                    - Brannkonsept (om relevant)
                    - Energiberegning (om relevant)
                    - Søknadsskjema (DiBK 5153/5174)
                    - Nabovarsel (DiBK 5154) klar til distribusjon
8. KS / ARKITEKT → Velg fra marketplace: arkitekt går gjennom + signerer +
                  evt. lokale tilpasninger. Pris vises før commit.
9. INNSENDING   → Direkte til Altinn / DiBK Fellestjenester Bygg via API.
10. SAKSGANG    → Push-notifikasjoner: nabovarsel sendt, merknader,
                  rammetillatelse, IG, ferdigattest. Dokumenter arkivert
                  i appen.
```

## 4. Arkitektur

```
┌──────────────────────────────────────────────────────────┐
│                       FORBRUKER-APP                       │
│   iOS  •  Android  •  Web (mittbygg.no)                  │
│   React Native + Next.js (delt komponentbibliotek)        │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS (REST + WebSocket for status)
┌─────────────────────▼────────────────────────────────────┐
│                   API-GATEWAY (FastAPI)                   │
│   AuthN: Vipps Login / BankID via Signicat               │
│   AuthZ: pr. eiendom + pr. prosjekt                       │
└──┬──────────┬─────────┬─────────┬──────────┬─────────────┘
   │          │         │         │          │
   ▼          ▼         ▼         ▼          ▼
┌─────┐  ┌──────┐  ┌────────┐  ┌─────┐  ┌──────────┐
│CORE │  │ DRAW │  │REGULA- │  │ AI  │  │INTEGRA-  │
│MODEL│  │ ENG  │  │TIONS   │  │ ORCH│  │SJONER    │
└──┬──┘  └──┬───┘  └────┬───┘  └──┬──┘  └────┬─────┘
   │        │           │         │           │
   │  fra norsk_arkitekt_ai-pakken             │
   │  (Python — eksisterende IP)              │
   │                                          │
   ▼                                          ▼
┌─────────────────┐                  ┌──────────────────┐
│  POSTGRES       │                  │  EKSTERNE API    │
│  + S3 (PDF/DXF) │                  │  • Kartverket    │
│  + Redis (cache)│                  │  • Matrikkelen   │
│                 │                  │  • DiBK Felles-  │
│                 │                  │    tjenester     │
│                 │                  │  • Altinn        │
│                 │                  │  • Kommunenes    │
│                 │                  │    plandata      │
│                 │                  │  • Vipps / Stripe│
│                 │                  │  • Anthropic API │
└─────────────────┘                  └──────────────────┘
```

### Hva gjenbrukes fra `norsk_arkitekt_ai`

| Modul | Status | Gjenbruk i MittBygg |
|---|---|---|
| `core/` (Building-modell) | Solid | Som er. Trenger import fra DXF/IFC. |
| `regulations/` (TEK17/SAK10/PBL/lempninger/kjeller_wizard) | Den **virkelige IP-en** | Kjernen i regelmotoren. Wrappes som API-endpoint. |
| `drawing/` | Schematic, OK for tidlig fase | Bruk for forhåndsvisning. Kvalitets-tegninger genereres når arkitekt signerer. |
| `reports/` (.docx) | Nyttig | Beholdes for søknad-pakker. |
| `webapp/` (Flask) | Erstattes | Erstattes av FastAPI; UI flyttes til Next.js. |
| `ai/` (command_parser) | Stub | Bygges ut: AI tolker bruker-input, foreslår tiltak, fyller skjema. Bruk Claude med prompt caching. |

## 5. Implementeringsfaser

### Stage 0 — **Prototype** (denne uken)
**Mål:** klikkbar demo som viser hele forbrukerflyten.
- Single-file HTML med mocket Kartverket-søk og kjeller-wizard.
- 100% mock-data, ingen backend.
- Brukes til intern demo + tidlig brukertest med 5-10 boligeiere.

### Stage 1 — **MVP: kjellerbruksendring i Oslo** (4-8 uker)
**Mål:** ekte søknadspakke for én konkret use case i én kommune.
- Next.js frontend (ekte UI fra prototypen)
- FastAPI backend som wrapper `norsk_arkitekt_ai`
- Kartverket adresse-API (ekte)
- Matrikkel via egen integrasjon eller Geonorge
- Reguleringsplan-uttrekk for Oslo
- BankID via Signicat (sandbox)
- Generer PDF-pakke + .docx-rapport
- **Søknad sendes ikke ennå** — bruker laster ned + sender selv via Altinn
- Vipps-betaling for "premium" (arkitekt-KS)
- Pilot med 20-50 reelle boligeiere

**Beslutningspunkt:** vil folk faktisk betale for dette? KPI = conversion rate fra wizard til kjøp.

### Stage 2 — **Multi-tiltak + Altinn-innsending** (3-6 mnd)
- 5-7 tiltak utenom kjeller: fjern bærevegg, garasje, tilbygg ≤ 50 m², fasade-endring, vindu, levegg, anneks
- DiBK Fellestjenester Bygg (FTB) for direkte innsending
- Status-tracking via Altinn-meldinger
- Dekker Oslo, Bergen, Trondheim, Stavanger
- Marketplace v1: arkitekt-foretak kan registrere seg, by på saker
- Push-notifikasjoner

### Stage 3 — **Hele Norge + plattform** (6-12 mnd)
- Alle 357 kommuner (med kommune-spesifikke regler-overstyring)
- Hytteeiendommer (LNF, plan-bestemmelser)
- Borettslag-flyt (fellesvedtak, fasadeendring for hele blokken)
- B2B portal for ANS-foretak (white-label)
- Kommune-portal: byggesaksbehandlere ser rene, strukturerte saker
- B2G-pilot med 2-3 kommuner

### Stage 4 — **AI-først** (12+ mnd)
- Bruker beskriver tiltaket på norsk → Claude bygger Building-modellen, foreslår tiltak, fyller wizard
- Foto-til-tegning (LiDAR via iPhone Pro): scan kjelleren, app genererer plantegningen
- "Hva tror naboen?" — AI vurderer sannsynlighet for nabomerknader basert på historikk
- Saksbehandler-assistent for kommuner: AI sammenlikner søknad mot reguleringsplan + tidligere vedtak

## 6. Teknologi-stack

| Lag | Valg | Begrunnelse |
|---|---|---|
| Mobil | React Native + Expo | Én kodebase iOS+Android. Norsk marked er liten — to native apper er ikke verdt det. |
| Web | Next.js 15 + React Server Components | SEO for SEO-trafikk ("kan jeg gjøre om kjeller til soverom" → MittBygg-artikkel) |
| UI | Tailwind + shadcn/ui + Norske design-tokens | Rask, polert, lett å vedlikeholde. |
| API | FastAPI (Python) | Direkte gjenbruk av eksisterende `norsk_arkitekt_ai`. |
| AI | Anthropic Claude (Sonnet 4.6 / Haiku 4.5) | Beste norske språkforståelse. Prompt caching for regulatoriske kontekster. |
| DB | PostgreSQL + Postgres-PostGIS | Geometri-spørringer mot reguleringsplaner. |
| Filer | S3 (eller Bunny CDN) | Store tegningsfiler. |
| Auth | Vipps Login + BankID via Signicat | Standard for norsk forbruker. |
| Betaling | Vipps + Stripe (kort) | Vipps for B2C, Stripe for B2B. |
| Hosting | Hetzner (EU) eller Bekk Cloud | GDPR + datalagring i EU. |
| Observability | Sentry + Plausible (GDPR-vennlig analytics) | |
| Søknadsutsending | DiBK FTB API + Altinn 3.0 | Officielt for byggesak. |

## 7. Risikoer og mitigeringer

| Risiko | Sannsynlighet | Tiltak |
|---|---|---|
| **Kommunalt regelverk-mangfold** | Høy | Start med Oslo. Bygg regulering-pr-kommune som data, ikke kode. |
| **Feil regelsjekk = juridisk eksponering** | Middels | Disclaimers + arkitekt-KS som default for søknadspakker. Tegn ansvars-forsikring. |
| **DiBK FTB-tilgang krever sertifisering** | Middels | Stage 1: la bruker laste ned + sende selv. Stage 2: søk om FTB. |
| **GDPR + sensitiv eiendomsdata** | Middels | Kun lagre minimum. Krypter PII. EU-hosting. DPA-er på plass. |
| **Arkitekt-bransjen ser oss som trussel** | Middels-høy | Posisjoner som *verktøy for arkitekter*, ikke erstatning. Marketplace = inntekt for dem. |
| **AI hallusinerer regelverk** | Høy | All regel-output skal komme fra deterministisk Python-kode med paragraf-referanser. AI brukes kun til oversettelse / oppfølgingsspørsmål, aldri til regelvalg. |
| **Kartverket / Matrikkel API-kostnad** | Lav | Forhandle volumavtale ved Stage 2. |

## 8. KPI per stage

| Stage | Hovedmetrikk | Mål |
|---|---|---|
| 0 | Klare innsikter fra 5 brukertester | Validere flow |
| 1 | Konvertering wizard → betalt søknadspakke | > 8% |
| 2 | NPS fra fullførte søknader | > 40 |
| 3 | Markedsandel av TK1-søknader i Oslo | > 5% |
| 4 | Tid fra "starte søknad" til "innsendt" | < 30 min |

## 9. Hva ligger i denne prototypen (`index.html`)

- **Splash + BankID-mock**
- **Adresse-søk** (autocomplete på 20 norske mock-adresser i Oslo, Bergen, Trondheim, Tromsø, Stavanger)
- **Eiendomsdashboard** (mocket Matrikkel: gnr/bnr, byggeår, BRA, etasjer, kjeller, garasje, reguleringsplan, tidligere saker)
- **Tiltak-bibliotek** (12 vanligste tiltak)
- **Full kjellerbruksendring-wizard** (5 steg, replikerer `kjeller_wizard.py`-logikken i JS)
- **Fjern-vegg-wizard** (3 steg, forenklet)
- **Resultat-rapport** (regelsjekk + lempninger + tiltak + kostnad + søknadstype)
- **Søknadspakke-forhåndsvisning** (mocket tegnings-thumbnails)
- **Innsending-bekreftelse**

Hele prototypen er **én HTML-fil med vanilla JS**. Ingen build-step, ingen `npm install`. Dobbeltklikk for å åpne.

## 10. Hvordan kjøre prototypen

```
1. Åpne mittbygg-prototype/index.html i Chrome eller Edge
2. Klikk "Logg inn med BankID" → mocked, går rett gjennom
3. Søk f.eks. "Solbakken 12" → velg fra autocomplete
4. På eiendoms-dashbordet: "Hva vil du gjøre?"
5. Velg "Bruksendring kjeller"
6. Gå gjennom wizarden — får full rapport på slutten
```

## 11. Neste konkrete steg

1. **Brukertest prototypen** med 5 boligeiere denne uken (ikke arkitekter).
   Mål: hvor faller de av, hva er forvirrende, hvor mye er de villige til å betale.
2. Hvis test går OK → **Stage 1-arkitektur** kan startes uke 1: Next.js scaffold,
   FastAPI-wrapper rundt `norsk_arkitekt_ai`, Kartverket-integrasjon.
3. Søk om **Innovasjon Norge eller Forskningsrådet** for tilskudd
   (norsk byggeprosess-digitalisering er klart i deres mandat).
4. Søk om Signicat sandbox for BankID-login.
5. Få juridisk gjennomgang av regulations/-modulen før Stage 1 lanseres.