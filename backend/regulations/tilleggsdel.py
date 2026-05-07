from models import TilleggsdelInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_tilleggsdel(inp: TilleggsdelInput) -> TiltakResult:
    findings: list[TiltakFinding] = []
    tiltak: list[TiltakTiltak] = []

    findings.append(TiltakFinding(
        type="warn",
        t="Søknadspliktig bruksendring",
        d="Endring fra tilleggsdel (bod, lager, teknisk rom) til hoveddel (oppholdsrom) krever søknad etter PBL § 20-1 d.",
        ref="PBL § 20-1 d",
    ))
    findings.append(TiltakFinding(
        type="warn",
        t=f"Takhøyde minimum 2,2 m i oppholdsrom",
        d=f"Rommet på {inp.areal} m² må ha fri takhøyde ≥ 2,2 m i minimum 50 % av gulvarealet og ≥ 1,9 m i øvrig areal.",
        ref="TEK17 § 8-2",
    ))
    findings.append(TiltakFinding(
        type="warn",
        t="Dagslys og ventilasjon",
        d="Oppholdsrom krever vindu med dagslysflate ≥ 10 % av gulvareal og mekanisk eller naturlig ventilasjon.",
        ref="TEK17 §§ 13-2, 14-2",
    ))

    if inp.romtype == "garasje":
        findings.append(TiltakFinding(
            type="fail",
            t="Garasje til bolig — brannskille kreves",
            d="Ombygging av garasje til oppholdsrom krever brannskille og særskilt vurdering av grunnforhold.",
            ref="TEK17 § 11-9",
        ))

    findings.append(TiltakFinding(
        type="ok",
        t="Matrikkelføring av arealendring",
        d="Etter godkjenning oppdateres matrikkelen med ny bruksareal (BRA) for hoveddelen.",
        ref="Matrikkelloven § 26",
    ))

    tiltak.append(TiltakTiltak(
        name="Søknad om bruksendring (tilleggsdel → hoveddel)",
        desc="Søknad med plantegninger som viser eksisterende og ny bruk, samt dokumentasjon av TEK17-oppfyllelse.",
        kostnad=10000,
    ))
    tiltak.append(TiltakTiltak(
        name="Bygningsmessige tilpasninger",
        desc="Vindusinnsetting, isolering, ventilasjon og evt. branntiltak for å nå TEK17-standard.",
        kostnad=inp.areal * 3500,
    ))

    status = "red" if inp.romtype == "garasje" else "amber"
    return TiltakResult(
        status=status,
        statusText="Søknadspliktig — krever teknisk oppgradering",
        statusDesc="Rommet må tilfredsstille TEK17 før kommunen godkjenner ny bruk.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="Søknad med nabovarsel (SAK10 kap. 5)",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak),
        input=inp.model_dump(),
    )
