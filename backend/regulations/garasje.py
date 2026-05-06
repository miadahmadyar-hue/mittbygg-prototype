from models import GarasjeInput, TiltakResult, Finding, Tiltak, Lempning

KOSTNAD = {"garasje": 8000, "carport": 4000, "bod": 5000}
LABEL   = {"garasje": "Garasje", "carport": "Carport", "bod": "Bod / uthus"}


def evaluate_garasje(inp: GarasjeInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    # Areal
    if inp.areal <= 50:
        findings.append(Finding(
            type="ok", t=f"Areal {inp.areal:.0f} m² — unntatt søknad",
            d="Frittliggende byggverk ≤ 50 m² er unntatt etter SAK10 § 4-1 b.",
            ref="SAK10 § 4-1 b",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Areal {inp.areal:.0f} m² — søknad påkrevd",
            d="Over 50 m² krever byggesøknad. Du trenger ansvarlig søker (TK1).",
            ref="PBL § 20-3",
        ))

    # Avstand
    if inp.avstand >= 1.0:
        findings.append(Finding(
            type="ok", t=f"Avstand {inp.avstand:.1f} m fra nabogrense OK",
            d="Minst 1 m fra nabogrense er påkrevd for frittstående bygg (SAK10 § 4-1 b).",
            ref="SAK10 § 4-1 b",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Avstand {inp.avstand:.1f} m — for nær nabogrense",
            d="Krav: minst 1,0 m fra nabogrense. Nærmere krever nabosamtykke eller dispensasjon.",
            ref="PBL § 29-4",
        ))

    findings.append(Finding(
        type="ok", t="Nabovarsel ikke påkrevd (unntatt tiltak)",
        d="Tiltak unntatt søknad trenger ikke nabovarsel etter PBL § 21-3.",
        ref="SAK10 § 4-1",
    ))

    # Kostnadsestimat
    enhetspris = KOSTNAD[inp.type]
    tiltak.append(Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc=f"Grunnmur/plate, stenderverksvegg, tretak. Enhetspris ca. {enhetspris:,} kr/m².",
        kostnad=int(inp.areal * enhetspris),
    ))
    tiltak.append(Tiltak(
        name="Grunnarbeider og betongplate",
        desc="Avgraving, grusfyll, armert betongplate 150 mm.",
        kostnad=40_000,
    ))

    fails = sum(1 for f in findings if f.type == "fail")
    total = sum(t.kostnad for t in tiltak)

    if fails == 0:
        status, txt, desc = "green", "Unntatt søknad", "Tiltaket er fritatt for byggesøknad etter SAK10 § 4-1."
    else:
        status, txt, desc = "red", "Søknad påkrevd", f"{fails} krav er ikke oppfylt — søknad må sendes."

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype="Unntatt (SAK10 § 4-1 b)" if fails == 0 else "PBL § 20-3 (med ansvarsrett)",
        ansvarsrett=(fails > 0),
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
