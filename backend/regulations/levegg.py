from models import LevegInput, TiltakResult, Finding, Tiltak, Lempning


def evaluate_levegg(inp: LevegInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    # Høyde
    if inp.hoyde <= 1.8:
        findings.append(Finding(
            type="ok", t=f"Høyde {inp.hoyde:.1f} m — unntatt (≤ 1,8 m)",
            d="Levegger og skjermer ≤ 1,8 m er unntatt søknad etter SAK10 § 4-1 e.",
            ref="SAK10 § 4-1 e",
        ))
    elif inp.hoyde <= 2.5:
        findings.append(Finding(
            type="warn", t=f"Høyde {inp.hoyde:.1f} m — trolig søknadspliktig",
            d="Levegger 1,8–2,5 m kan kreve søknad. Sjekk med kommunen.",
            ref="SAK10 § 4-1 e",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Høyde {inp.hoyde:.1f} m — søknad påkrevd",
            d="Levegger > 2,5 m er søknadspliktig (PBL § 20-1 a). Ansvarlig søker kreves.",
            ref="PBL § 20-1 a",
        ))

    # Lengde
    if inp.lengde <= 10.0:
        findings.append(Finding(
            type="ok", t=f"Lengde {inp.lengde:.1f} m — innenfor grense (≤ 10 m)",
            d="Levegger ≤ 10 m er unntatt søknad (SAK10 § 4-1 e).",
            ref="SAK10 § 4-1 e",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Lengde {inp.lengde:.1f} m — over grense",
            d="Levegger over 10 m sammenhengende lengde er søknadspliktig.",
            ref="SAK10 § 4-1 e",
        ))

    # Avstand til nabo
    if inp.avstand < 1.0:
        findings.append(Finding(
            type="warn", t=f"Avstand {inp.avstand:.1f} m — anbefal nabovarsel",
            d="Levegg tett på nabogrense anbefales nabovarslet, selv om tiltaket er unntatt søknad.",
            ref="PBL § 29-4",
        ))
    else:
        findings.append(Finding(
            type="ok", t=f"Avstand {inp.avstand:.1f} m fra nabogrense OK",
            d="God avstand til nabogrense. Nabovarsel ikke påkrevd.",
            ref="PBL § 29-4",
        ))

    tiltak.append(Tiltak(
        name=f"Levegg {inp.hoyde:.1f} m × {inp.lengde:.1f} m",
        desc="Betongfot, stenderverksrammer, trebehandlet kledning og overflatebehandling.",
        kostnad=int(inp.hoyde * inp.lengde * 1_800),
    ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails > 0:
        status, txt, desc = "red", "Søknad påkrevd", f"{fails} krav er ikke oppfylt."
    elif warns > 0:
        status, txt, desc = "amber", "Trolig unntatt — sjekk høyde", "Høyde 1,8–2,5 m: kontakt kommunen for avklaring."
    else:
        status, txt, desc = "green", "Unntatt søknad", "Leveggen er fritatt for byggesøknad etter SAK10 § 4-1 e."

    soknadstype = (
        "Unntatt (SAK10 § 4-1 e)" if inp.hoyde <= 1.8 and inp.lengde <= 10 else
        "PBL § 20-4 c" if inp.hoyde <= 2.5 else
        "PBL § 20-1 a (søknadspliktig)"
    )

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype=soknadstype,
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
