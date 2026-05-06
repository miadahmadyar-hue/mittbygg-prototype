from models import SolcellerInput, TiltakResult, Finding, Tiltak, Lempning

LABEL = {
    "integrert":    "Integrert i takflaten",
    "paamontering": "Påmontering på tak",
    "vegg":         "Veggmontert",
}


def evaluate_solceller(inp: SolcellerInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    findings.append(Finding(
        type="ok", t="Unntatt søknad siden 2021",
        d="Solcelleanlegg på eksisterende bygg er unntatt byggesøknad (SAK10 § 4-1 k, vedtatt 2021).",
        ref="SAK10 § 4-1 k",
    ))
    findings.append(Finding(
        type="ok", t="Nettilknytning — melding til nettselskap",
        d="Du må melde anlegget til ditt nettselskap (AMS-registrering). Ingen søknad til kommunen.",
        ref="Forskrift om elektriske forsyningsanlegg",
    ))
    findings.append(Finding(
        type="warn", t="Autorisert elektroinstallatør påkrevd",
        d="Elektrisk installasjon og tilkobling til strømnettet må utføres av autorisert elektroinstallatør.",
        ref="Forskrift om elektriske lavspenningsanlegg",
    ))

    if inp.verneverdig:
        findings.append(Finding(
            type="warn", t="Verneverdig bygning — særskilt vurdering",
            d="Synlige solceller på verneverdig bygning bør vurderes av kulturminnemyndigheten selv om tiltaket er unntatt søknad.",
            ref="Kulturminneloven + PBL § 31-1",
        ))

    kwp = round(inp.areal * 0.20, 1)
    arsprod = int(kwp * 900)

    tiltak.append(Tiltak(
        name=f"Solcellepaneler {inp.areal:.0f} m² ({kwp} kWp)",
        desc=f"Estimert årsproduksjon: {arsprod:,} kWh/år. Inkl. monteringskonstruksjon for {LABEL[inp.type].lower()}.",
        kostnad=int(inp.areal * 2_200),
    ))
    tiltak.append(Tiltak(
        name="Inverter og sikringsskap",
        desc="Strenginverter, overspenningsvern, AMS-tilpasset elmåler, kabling.",
        kostnad=18_000,
    ))

    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if inp.verneverdig:
        status, txt, desc = "amber", "Unntatt — vurder kulturminne", "Anbefales å kontakte kulturminnemyndigheten."
    else:
        status, txt, desc = "green", "Unntatt søknad", "Anlegget kan installeres uten byggesøknad. Meld til nettselskapet."

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype="Unntatt (SAK10 § 4-1 k) — melding til nettselskap",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
