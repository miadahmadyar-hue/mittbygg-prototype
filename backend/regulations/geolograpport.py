from models import GeolograpportInput, TiltakResult, TiltakFinding


def evaluate_geolograpport(inp: GeolograpportInput) -> TiltakResult:
    findings: list[TiltakFinding] = []

    findings.append(TiltakFinding(
        type="warn",
        t="Behovet må vurderes for det konkrete tiltaket",
        d="Dokumentasjonen skal være tilpasset risiko, grunnforhold og fundamentering. En geoteknisk rapport er ikke automatisk nødvendig i alle saker.",
        ref="TEK17 § 9-2",
    ))

    if inp.type in ("nybygg", "brygge"):
        findings.append(TiltakFinding(
            type="warn",
            t="Kontroller grunnforhold og områdestabilitet",
            d="Kartdata, terreng og kjent grunnforhold avgjør om geoteknisk fagperson eller grunnundersøkelse bør kobles inn.",
            ref="NS-EN 1997 (Eurokode 7)",
        ))

    findings.append(TiltakFinding(
        type="warn",
        t="Avklar dokumentasjonsnivå før bestilling",
        d="Be kommunen eller ansvarlig prosjekterende beskrive hvilket grunnlag som trengs, slik at du ikke bestiller en større undersøkelse enn saken krever.",
        ref="SAK10 § 5-4",
    ))

    return TiltakResult(
        status="amber",
        statusText="Behov og omfang må avklares",
        statusDesc="Avklar risiko og dokumentasjonskrav før du bestiller fagrapport.",
        findings=findings,
        tiltak=[],
        lempninger=[],
        soknadstype="Må avklares - faglig dokumentasjon",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=0,
        input=inp.model_dump(),
    )
