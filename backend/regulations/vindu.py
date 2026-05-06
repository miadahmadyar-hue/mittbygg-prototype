from models import VinduInput, TiltakResult, Finding, Tiltak, Lempning

LABEL = {
    "skifte":         "Skifte vindu i eksisterende åpning",
    "nytt_hull":      "Nytt hull i fasaden",
    "storre_apning":  "Gjøre åpning større",
}


def evaluate_vindu(inp: VinduInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    if inp.type == "skifte":
        findings.append(Finding(
            type="ok", t="Skifte vindu i eksisterende åpning — unntatt",
            d="Bytte av vindu uten å endre åpningsstørrelse er vedlikehold, unntatt søknad.",
            ref="SAK10 § 4-1",
        ))
        tiltak.append(Tiltak(
            name="Nytt vindu (tre-alu, U ≤ 0,8)",
            desc="Tre-aluminiumsvindu med U-verdi ≤ 0,8 W/(m²K), inkl. montering og tetting.",
            kostnad=14_000,
        ))

    elif inp.type == "nytt_hull":
        findings.append(Finding(
            type="warn", t="Nytt hull i fasaden — trolig søknadspliktig",
            d="Ny åpning i fasaden regnes som fasadeendring (PBL § 20-1 e). Søknad anbefales.",
            ref="PBL § 20-1 e",
        ))
        tiltak.append(Tiltak(
            name="Nytt vindu inkl. hulltaking",
            desc="Hulltaking i fasade, ny karm, vindu tre-alu U ≤ 0,8, innvendig og utvendig ferdigstilling.",
            kostnad=22_000,
        ))

    elif inp.type == "storre_apning":
        findings.append(Finding(
            type="warn", t="Større åpning — søknadspliktig fasadeendring",
            d="Å utvide en eksisterende åpning er søknadspliktig fasadeendring (PBL § 20-1 e).",
            ref="PBL § 20-1 e",
        ))
        tiltak.append(Tiltak(
            name="Utvidet åpning og nytt vindu",
            desc="Hulltaking, evt. brannklassifisert lintel, nytt vindu og ferdigstilling.",
            kostnad=28_000,
        ))

    # Brannvegg
    if inp.brannvegg:
        findings.append(Finding(
            type="fail", t="Vindu i brannvegg / brannskille — søknad påkrevd",
            d="Vindu i vegg mot nabogrense (≤ 4 m) er søknadspliktig. Brannglassifisert glass EI 30 kreves (TEK17 § 11-6).",
            ref="TEK17 § 11-6 + PBL § 20-1 e",
        ))
        tiltak.append(Tiltak(
            name="Brannklassifisert vindu EI 30",
            desc="Stålkarm med brannlaminert glass, EI 30-klassifisering. Krever søknad og ansvarsrett.",
            kostnad=28_000,
        ))
    else:
        findings.append(Finding(
            type="ok", t="Ikke i brannvegg — enklere prosess",
            d="Veggen er ikke mot nabogrense (> 4 m). Krav til brannklassifisert glass gjelder ikke.",
            ref="TEK17 § 11-6",
        ))

    findings.append(Finding(
        type="ok", t="U-verdi krav TEK17",
        d="Nytt vindu bør ha U-verdi ≤ 0,80 W/(m²K) ved utskifting i eksisterende bygg.",
        ref="TEK17 § 14-3",
    ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails > 0:
        status, txt, desc = "red", "Søknad påkrevd", "Brannvegg krever søknad og brannklassifisert glass."
    elif warns > 0:
        status, txt, desc = "amber", "Trolig søknadspliktig", "Fasadeendring — avklar med kommunen."
    else:
        status, txt, desc = "green", "Unntatt søknad", "Vindusskifte er vedlikehold og trenger ikke søknad."

    soknadstype = (
        "PBL § 20-1 e + TEK17 § 11-6 (brannvegg)" if inp.brannvegg else
        "Unntatt (SAK10 § 4-1)" if inp.type == "skifte" else
        "PBL § 20-1 e (fasadeendring)"
    )

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype=soknadstype,
        ansvarsrett=inp.brannvegg,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
