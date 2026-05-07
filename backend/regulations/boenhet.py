from backend.models import BoenhetInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_boenhet(inp: BoenhetInput) -> TiltakResult:
    findings: list[TiltakFinding] = []
    tiltak: list[TiltakTiltak] = []

    findings.append(TiltakFinding(
        type="fail",
        t="Søknadspliktig — krever ansvarlig foretak",
        d="Etablering av ny boenhet er søknadspliktig etter PBL § 20-1 og krever ansvarlig søker med ansvarsrett.",
        ref="PBL § 20-1, SAK10 § 9-3",
    ))
    findings.append(TiltakFinding(
        type="warn",
        t="Egen inngang og selvstendige funksjoner",
        d="Ny boenhet må ha egen inngang, kjøkken, bad og oppholdsrom. Felles inngang kan aksepteres i tomannsbolig.",
        ref="TEK17 § 12-2",
    ))
    findings.append(TiltakFinding(
        type="warn",
        t="Parkeringskrav",
        d="Reguleringsplanen kan kreve én ekstra parkeringsplass per ny boenhet. Sjekk kommuneplanens arealdel.",
        ref="PBL § 28-7",
    ))

    if inp.type == "tomannsbolig":
        findings.append(TiltakFinding(
            type="warn",
            t="Seksjonering kan være aktuelt",
            d="Tomannsbolig kan seksjoneres i to selveierseksjoner. Krever egen søknad til kommunen.",
            ref="Eierseksjonsloven § 11",
        ))

    if inp.antall > 1:
        findings.append(TiltakFinding(
            type="fail",
            t="Flere boenheter — høyere tiltaksklasse",
            d=f"{inp.antall} nye boenheter krever sannsynligvis tiltaksklasse 2 og ansvarlig prosjekterende.",
            ref="SAK10 § 9-4",
        ))

    findings.append(TiltakFinding(
        type="ok",
        t="Utleie øker boligens verdi",
        d="Godkjent utleieenhet gir lovlig leieinntekt og øker eiendommens markedsverdi.",
        ref="",
    ))

    tiltak.append(TiltakTiltak(
        name="Søknad om ny boenhet (ansvarlig søker)",
        desc="Innhenting av ansvarlig søker, utarbeidelse av søknad med situasjonsplan, plantegninger og teknisk dokumentasjon.",
        kostnad=25000,
    ))
    tiltak.append(TiltakTiltak(
        name="Bygningsmessige arbeider",
        desc="Innvendig tilpasning: kjøkken, bad, inngang, brannskille og lyddemping mellom enhetene.",
        kostnad=inp.areal * 5000,
    ))
    tiltak.append(TiltakTiltak(
        name="Elektro og VVS",
        desc="Separate målere, røropplegg og ventilasjon for ny boenhet.",
        kostnad=35000,
    ))

    tk: 1 | 2 = 2 if inp.antall > 1 else 1
    return TiltakResult(
        status="red",
        statusText="Søknadspliktig — krever ansvarlig foretak",
        statusDesc="Dette er et større tiltak som krever profesjonell hjelp og godkjenning fra kommunen.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="Søknad med ansvarsrett (SAK10 kap. 9)",
        ansvarsrett=True,
        tiltaksklasse=tk,
        totalKostnad=sum(t.kostnad for t in tiltak),
        input=inp.model_dump(),
    )
