from models import TilbyggInput, TiltakResult, Finding, Tiltak, Lempning

LABEL = {
    "tilbygg_1etasje":      "Tilbygg i 1. etasje",
    "ny_etasje":            "Ny etasje",
    "innglasset_terrasse":  "Innglasset terrasse",
}


def evaluate_tilbygg(inp: TilbyggInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []
    lempninger: list[Lempning] = []

    # Areal
    if inp.areal <= 15:
        findings.append(Finding(
            type="ok", t=f"Areal {inp.areal:.0f} m² — unntatt søknad",
            d="Tilbygg ≤ 15 m² er unntatt etter SAK10 § 4-1 d.",
            ref="SAK10 § 4-1 d",
        ))
    elif inp.areal <= 50:
        findings.append(Finding(
            type="warn", t=f"Areal {inp.areal:.0f} m² — søknad uten ansvarsrett",
            d="15–50 m²: søknadspliktig uten ansvarsrett (tiltakshaver kan søke selv), TK1.",
            ref="PBL § 20-4 c",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Areal {inp.areal:.0f} m² — ansvarsrett påkrevd",
            d="Over 50 m² krever søknad med ansvarlig søker og ansvarsrett.",
            ref="PBL § 20-3",
        ))

    # Avstand
    if inp.avstand >= 4.0:
        findings.append(Finding(
            type="ok", t=f"Avstand {inp.avstand:.1f} m fra nabogrense OK",
            d="Minst 4 m fra nabogrense er tilfredsstilt.",
            ref="PBL § 29-4",
        ))
    else:
        findings.append(Finding(
            type="fail", t=f"Avstand {inp.avstand:.1f} m — for nær nabogrense",
            d="Krav: minst 4 m fra nabogrense. Krever nabosamtykke eller dispensasjon.",
            ref="PBL § 29-4",
        ))

    # Ny etasje — ekstra høydekrav
    if inp.type == "ny_etasje":
        findings.append(Finding(
            type="warn", t="Ny etasje — sjekk høyde i reguleringsplan",
            d="Mønehøyde og gesimshøyde er regulert i kommuneplanens arealdel og reguleringsplan. Sjekk tillatt høyde.",
            ref="PBL § 29-4 + kommuneplan",
        ))

    # BYA check
    findings.append(Finding(
        type="warn", t="Sjekk BYA i reguleringsplan",
        d="Bebygd areal (BYA) etter tilbygg må holde seg innenfor planens tillatte utnyttingsgrad (ofte 30–40 %).",
        ref="PBL § 12-7",
    ))

    # Kostnader
    tiltak.append(Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc="Inkl. fundament, yttervegger, tak, vinduer og innvendig overflate.",
        kostnad=int(inp.areal * 18_000),
    ))
    tiltak.append(Tiltak(
        name="Tilkobling til eksisterende hus",
        desc="Åpne vegg, sikre bærende konstruksjon, tette mot eksisterende tak.",
        kostnad=35_000,
    ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails == 0 and warns == 0:
        status, txt, desc = "green", "Unntatt søknad", "Tiltaket kan gjennomføres uten søknad."
    elif fails == 0:
        status, txt, desc = "amber", "Søknad — uten ansvarsrett", "Du kan søke selv. Se neste steg."
    else:
        status, txt, desc = "red", "Søknad med ansvarsrett", f"{fails} krav må avklares."

    soknadstype = (
        "Unntatt (SAK10 § 4-1 d)" if inp.areal <= 15 and inp.avstand >= 4 else
        "PBL § 20-4 c (uten ansvarsrett)" if inp.areal <= 50 else
        "PBL § 20-3 (med ansvarsrett)"
    )

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=lempninger,
        soknadstype=soknadstype,
        ansvarsrett=(inp.areal > 50),
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
