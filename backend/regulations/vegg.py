"""Customer-safe assessment for changes to walls, beams and columns."""

from models import VeggInput, VeggResult, Finding, Tiltak


TYPE_LABELS = {
    "fjerne_vegg": "Fjerne hele veggen",
    "ny_apning": "Lage en ny åpning",
    "utvide_apning": "Utvide en eksisterende åpning",
    "flytte_vegg": "Flytte veggen",
    "endre_soyle": "Endre eller fjerne søyle",
}


def evaluate_vegg(inp: VeggInput) -> VeggResult:
    findings: list[Finding] = []
    tiltak: list[Tiltak] = []

    if inp.baerende == "nei":
        findings.append(Finding(
            type="ok",
            t="Ingen bærende funksjon oppgitt",
            d="Innvendig arbeid på en ikke-bærende vegg kan normalt utføres uten søknad dersom brann- eller lydskille ikke berøres.",
            ref="SAK10 § 4-1",
        ))
        findings.append(Finding(
            type="warn",
            t="Brann- og lydskille må bekreftes",
            d="Vegger mellom boenheter og brannceller kan ikke endres som vanlig lettveggarbeid.",
            ref="TEK17 kap. 11 og 13",
        ))
        status = "green"
        status_text = "Trolig unntatt søknad"
        status_desc = "Bekreft at veggen verken er bærende eller del av et brann- eller lydskille før arbeidet starter."
        soknadstype = "Trolig unntatt - må bekreftes"
        ansvarsrett = False
    else:
        if inp.baerende == "usikker":
            findings.append(Finding(
                type="warn",
                t="Bærende funksjon er ikke avklart",
                d="En konstruksjonsingeniør må kontrollere godkjente tegninger og konstruksjonen på stedet før veggen endres.",
                ref="PBL § 20-1",
            ))
            status_text = "Må vurderes av konstruksjonsingeniør"
            status_desc = "Ikke start riving før veggens funksjon og lastvei er dokumentert."
            soknadstype = "Må avklares av ansvarlig foretak"
        else:
            findings.append(Finding(
                type="fail",
                t="Inngrep i bærende konstruksjon krever søknad",
                d="Endring av bærevegg, bjelke eller søyle er en vesentlig endring. Ansvarlig prosjekterende konstruksjon må dokumentere løsningen.",
                ref="PBL § 20-3",
            ))
            status_text = "Krever konstruksjonsingeniør"
            status_desc = "Tiltaket må prosjekteres og søkes med ansvarlig foretak."
            soknadstype = "PBL § 20-3 (med ansvarsrett)"

        findings.append(Finding(
            type="warn",
            t="Ingen bjelkedimensjon beregnes her",
            d="Dimensjon av bjelke, søyler, opplegg og midlertidig avstiving krever tegninger, materialkontroll og stedlige laster.",
            ref="TEK17 § 10-2",
        ))
        tiltak.append(Tiltak(
            name="Konstruksjonsfaglig forundersøkelse",
            desc="Gjennomgang av tegninger, befaring og avklaring av lastvei før prosjektering.",
            kostnad=15_000,
        ))
        status = "amber"
        ansvarsrett = True

    width = f"ca. {inp.apning_bredde:.1f} m" if inp.apning_bredde else "ikke oppgitt"
    findings.append(Finding(
        type="ok",
        t=f"Omfang registrert: {TYPE_LABELS[inp.type]}",
        d=f"Åpningsbredde {width}, {inp.etasjer_over} etasje(r) over, konstruksjon: {inp.konstruksjon.replace('_', '/')}.",
        ref="Kundeopplysninger",
    ))

    return VeggResult(
        status=status,
        statusText=status_text,
        statusDesc=status_desc,
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype=soknadstype,
        ansvarsrett=ansvarsrett,
        tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak),
        bjelke=None,
        input=inp,
    )
