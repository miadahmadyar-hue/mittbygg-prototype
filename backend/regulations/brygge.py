from models import BryggeInput, TiltakResult, Finding


LABEL = {
    "fast": "fast brygge",
    "flytende": "flytebrygge",
    "stupebrett": "badeplattform",
}


def evaluate_brygge(inp: BryggeInput) -> TiltakResult:
    findings: list[Finding] = []
    is_maintenance = inp.arbeid == "vedlikehold"

    if is_maintenance:
        findings.append(Finding(
            type="warn",
            t="Vedlikehold må avgrenses mot nytt tiltak",
            d="Vanlig vedlikehold uten endret størrelse, plassering eller konstruksjon kan vurderes annerledes enn ny eller utvidet brygge. Kommunen bør bekrefte grensen i denne saken.",
            ref="PBL § 20-1",
        ))
    else:
        findings.append(Finding(
            type="warn",
            t="Avklar søknad og tillatelser med kommunen",
            d=f"Ny, utvidet eller erstattet {LABEL[inp.type]} berører normalt plan- og bygningsloven. Tiltaket kan også kreve tillatelse etter havne- og farvannsloven.",
            ref="PBL § 20-1 og havne- og farvannsloven",
        ))

    if inp.plan_status == "ikke_tillatt":
        findings.append(Finding(
            type="fail",
            t="Tiltaket er ikke i samsvar med planen",
            d="Det må vurderes dispensasjon før en byggesøknad kan godkjennes.",
            ref="PBL §§ 19-2 og 1-8",
        ))
    elif inp.plan_status == "usikker":
        findings.append(Finding(
            type="warn",
            t="Plangrunnlaget må undersøkes",
            d="Sjekk byggegrense mot sjø, arealformål og eventuelle bestemmelser for brygger. Tiltak i strandsonen vurderes særlig strengt.",
            ref="PBL §§ 1-8 og 12-7",
        ))
    else:
        findings.append(Finding(
            type="ok",
            t="Oppgitt å være i samsvar med plan",
            d="Kommunen må fortsatt kontrollere tiltakets størrelse, plassering og øvrige tillatelser.",
            ref="Gjeldende arealplan",
        ))

    if inp.eier_strandgrunn is not True:
        findings.append(Finding(
            type="warn",
            t="Rett til strandgrunnen må dokumenteres",
            d="Avklar eierskap eller skriftlig samtykke før prosjektet går videre.",
            ref="Privatrettslig grunnlag",
        ))

    if inp.type == "fast":
        findings.append(Finding(
            type="warn",
            t="Fundamenteringen må prosjekteres",
            d="Behovet for grunnundersøkelse og geoteknisk bistand avgjøres ut fra grunnforhold og valgt fundamentering. Det er ikke automatisk krav om en bestemt rapport.",
            ref="TEK17 kap. 7 og 10",
        ))

    has_failure = any(item.type == "fail" for item in findings)
    status = "red" if has_failure else "amber"
    status_text = "Dispensasjon må avklares" if has_failure else "Kommunal avklaring nødvendig"

    return TiltakResult(
        status=status,
        statusText=status_text,
        statusDesc="Send mål, kartplassering og bilder til kommunen for en konkret vurdering før prosjektering eller bestilling.",
        findings=findings,
        tiltak=[],
        lempninger=[],
        soknadstype="Må avklares med kommunen",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=0,
        input=inp.model_dump(),
    )
