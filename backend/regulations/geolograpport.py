from backend.models import GeolograpportInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_geolograpport(inp: GeolograpportInput) -> TiltakResult:
    findings: list[TiltakFinding] = []
    tiltak: list[TiltakTiltak] = []

    findings.append(TiltakFinding(
        type="ok",
        t="Grunnundersøkelse anbefales ved nybygg og tilbygg",
        d="TEK17 § 9-2 krever at grunnforhold dokumenteres før byggestart for alle søknadspliktige tiltak.",
        ref="TEK17 § 9-2",
    ))

    if inp.type in ("nybygg", "brygge"):
        findings.append(TiltakFinding(
            type="warn",
            t="Setningsskader — vanlig risiko i Oslo-regionen",
            d="Leirgrunn under Oslo kan gi setningsskader ved feil fundamentering. Grunnundersøkelse sikrer riktig fundamenttype.",
            ref="NS-EN 1997 (Eurokode 7)",
        ))

    findings.append(TiltakFinding(
        type="ok",
        t="Geolog tilgjengelig via MittBygg-markedsplassen",
        d="Vi kobler deg med sertifisert geotekniker innen 2 virkedager. Rapport normalt klar på 5–10 dager.",
        ref="NGF Melding nr. 2",
    ))
    findings.append(TiltakFinding(
        type="ok",
        t="Rapport kreves av kommunen ved søknad",
        d="Mange kommuner krever geoteknisk rapport som vedlegg til byggesøknaden. MittBygg inkluderer rapporten automatisk i søknadspakken.",
        ref="SAK10 § 5-4",
    ))

    tiltak.append(TiltakTiltak(
        name="Geoteknisk rapport (grunnundersøkelse)",
        desc="Prøvetaking (dreietrykksondering + prøvegrop), laboratorieanalyse, geoteknisk rapport med fundamentanbefalinger.",
        kostnad=28000,
    ))
    tiltak.append(TiltakTiltak(
        name="Tillegg: radonmåling i grunn",
        desc="Kombineres gjerne med geoundersøkelse. Resultater inngår i søknadspakken.",
        kostnad=4500,
    ))

    return TiltakResult(
        status="green",
        statusText="Bestill grunnundersøkelse",
        statusDesc="Geotekniker kontakter deg innen 2 virkedager.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="Fagtjeneste — ikke søknadspliktig i seg selv",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak),
        input=inp.model_dump(),
    )
