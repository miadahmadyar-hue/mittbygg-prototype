from models import AnneksInput, TiltakResult, Finding, Tiltak, Lempning

LABEL   = {"anneks": "Anneks / gjestehytte", "uthus": "Uthus / verksted", "hagebod": "Hagebod"}
KOSTNAD = {"anneks": 22_000, "uthus": 12_000, "hagebod": 8_000}


def evaluate_anneks(inp: AnneksInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    if inp.areal <= 50:
        findings.append(Finding(
            type="ok", t=f"Areal {inp.areal:.0f} m² — unntatt søknad",
            d="Frittliggende byggverk ≤ 50 m² er unntatt etter SAK10 § 4-1 b.",
            ref="SAK10 § 4-1 b",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Areal {inp.areal:.0f} m² — søknad påkrevd",
            d="Over 50 m² krever byggesøknad. Ansvarlig søker og ansvarsrett er påkrevd.",
            ref="PBL § 20-3",
        ))

    if inp.avstand >= 1.0:
        findings.append(Finding(
            type="ok", t=f"Avstand {inp.avstand:.1f} m fra nabogrense OK",
            d="Krav: minst 1 m fra nabogrense for frittstående byggverk.",
            ref="SAK10 § 4-1 b",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Avstand {inp.avstand:.1f} m — for nær nabogrense",
            d="Krav: minst 1,0 m fra nabogrense. Krever nabosamtykke eller dispensasjon.",
            ref="PBL § 29-4",
        ))

    if inp.type == "anneks" and inp.areal > 15:
        findings.append(Finding(
            type="warn", t="Anneks med overnatting > 15 m² — sjekk kommuneplan",
            d="Overnattingsdelen bør sjekkes mot kommuneplanens arealdel for tillatt utbygging på eiendommen (BYA).",
            ref="PBL § 12-7",
        ))

    findings.append(Finding(
        type="ok", t="Nabovarsel ikke påkrevd (unntatt tiltak)",
        d="Unntatt søknad trenger ikke nabovarsel etter PBL § 21-3.",
        ref="SAK10 § 4-1",
    ))

    enhetspris = KOSTNAD[inp.type]
    tiltak.append(Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc="Grunnmur/plate, stenderverksvegg, isolert tak. Enhetspris inkl. grunnarbeider.",
        kostnad=int(inp.areal * enhetspris),
    ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails == 0 and warns == 0:
        status, txt, desc = "green", "Unntatt søknad", "Byggverket er fritatt for byggesøknad etter SAK10 § 4-1."
    elif fails == 0:
        status, txt, desc = "amber", "Unntatt — med merknad", "Sjekk kommuneplanen for BYA-grense."
    else:
        status, txt, desc = "red", "Søknad påkrevd", f"{fails} krav er ikke oppfylt."

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype="Unntatt (SAK10 § 4-1 b)" if fails == 0 else "PBL § 20-3",
        ansvarsrett=(fails > 0 and inp.areal > 50),
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
