from models import FasadeInput, TiltakResult, Finding, Tiltak, Lempning

LABEL = {
    "kledning":      "Ny ytterkledning",
    "farge":         "Farge / overflatebehandling",
    "vindu_storre":  "Større vindusåpning",
    "terrasse":      "Terrasse",
    "dor":           "Ny dør",
}


def evaluate_fasade(inp: FasadeInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    if inp.verneverdig:
        findings.append(Finding(
            type="fail", t="Verneverdig / antikvarisk bygning",
            d="Endringer på verneverdig bygning krever søknad og kulturminnefaglig vurdering. Kontakt Plan- og bygningsetaten.",
            ref="PBL § 20-1 + Kulturminneloven",
        ))

    if inp.type in ("kledning", "farge"):
        findings.append(Finding(
            type="ok", t=f"{LABEL[inp.type]} — unntatt søknad",
            d="Skifte av kledning/overflate uten å endre form er unntatt søknadsplikt.",
            ref="SAK10 § 4-1",
        ))
        tiltak.append(Tiltak(name="Ny ytterkledning", desc="Fjerning av gammel kledning, ny vindsperre, ny kledning og maling.", kostnad=120_000))

    elif inp.type == "vindu_storre":
        findings.append(Finding(
            type="warn", t="Større vindusåpning — trolig søknadspliktig",
            d="Å lage ny eller større åpning i fasaden regnes som fasadeendring etter PBL § 20-1 e.",
            ref="PBL § 20-1 e",
        ))
        tiltak.append(Tiltak(name="Ny/utvidet vindusåpning", desc="Hulltaking i fasade, ny karm og vindusbeslag.", kostnad=35_000))

    elif inp.type == "terrasse":
        findings.append(Finding(
            type="warn", t="Terrasse — sjekk høyde og areal",
            d="Terrasse > 0,5 m over terreng eller > 10 m² er søknadspliktig (PBL § 20-1 a).",
            ref="PBL § 20-1 a",
        ))
        tiltak.append(Tiltak(name="Terrasse", desc="Betongfundament, stenderverksrammer, trykkimpregnert tredekk, rekkverk.", kostnad=65_000))

    elif inp.type == "dor":
        findings.append(Finding(
            type="ok", t="Ny dør i eksisterende åpning — unntatt",
            d="Skifte av dør uten å endre åpningsstørrelse er vedlikehold, unntatt søknad.",
            ref="SAK10 § 4-1",
        ))
        tiltak.append(Tiltak(name="Ny ytterdør", desc="Standard utvendig dør inkl. montering og tetting.", kostnad=15_000))

    if not inp.verneverdig:
        findings.append(Finding(
            type="ok", t="Ikke verneverdig — enklere prosess",
            d="Bygningen er ikke registrert som verneverdig. Kulturminneloven krever ikke særskilt vurdering.",
            ref="Kulturminneloven",
        ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails > 0:
        status, txt, desc = "red", "Søknad påkrevd", "Verneverdig bygning krever søknad og særskilt vurdering."
    elif warns > 0:
        status, txt, desc = "amber", "Trolig søknadspliktig", "Sjekk med kommunen om tiltaket er søknadspliktig."
    else:
        status, txt, desc = "green", "Unntatt søknad", "Tiltaket kan gjennomføres uten søknad."

    soknadstype = "Søknad + kulturminnefaglig vurdering" if inp.verneverdig else (
        "PBL § 20-1 e" if inp.type in ("vindu_storre", "terrasse") else "Unntatt (SAK10 § 4-1)"
    )

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype=soknadstype,
        ansvarsrett=inp.verneverdig,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
