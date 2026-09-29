from models import BruksendringInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_bruksendring(inp: BruksendringInput) -> TiltakResult:
    findings: list[TiltakFinding] = []
    tiltak: list[TiltakTiltak] = []

    if not inp.godkjent_bruk_bekreftet:
        findings.append(TiltakFinding(
            type="warn",
            t="Dagens godkjente bruk må bekreftes",
            d="Kontroller siste godkjente tegninger i kommunens byggesaksarkiv. Faktisk bruk i dag er ikke alltid den lovlig godkjente bruken.",
            ref="PBL § 20-1 d",
        ))

    findings.append(TiltakFinding(
        type="warn",
        t="Bruksendringen må omsøkes",
        d="Den oppgitte overgangen mellom brukskategorier behandles som bruksendring etter PBL § 20-1 d.",
        ref="PBL § 20-1 d",
    ))

    if inp.til in ("bolig", "hybel"):
        findings.append(TiltakFinding(
            type="warn",
            t="TEK17-krav til ny boligbruk",
            d="Rommet må tilfredsstille krav til takhøyde (min. 2,2 m), dagslys, ventilasjon og brannsikring etter TEK17.",
            ref="TEK17 §§ 8-2, 13-2, 14-2",
        ))

    if inp.verneverdig:
        findings.append(TiltakFinding(
            type="fail",
            t="Verneverdig bygning — kulturminnevurdering kreves",
            d="Endring av bruk i verneverdig bygg krever uttalelse fra kulturminnemyndigheten.",
            ref="Kulturminneloven § 25",
        ))

    if inp.plan_status == "ikke_tillatt":
        findings.append(TiltakFinding(
            type="fail",
            t="Ny bruk er ikke i samsvar med planen",
            d="Det må vurderes dispensasjon før bruksendringen kan godkjennes.",
            ref="PBL § 19-2",
        ))
    elif inp.plan_status == "usikker":
        findings.append(TiltakFinding(
            type="warn",
            t="Planformålet må kontrolleres",
            d="Sjekk at reguleringsplan eller kommuneplan tillater den nye bruken.",
            ref="PBL § 12-7",
        ))

    if inp.fra in ("naring", "kontor") and inp.til in ("bolig", "hybel"):
        findings.append(TiltakFinding(
            type="warn",
            t="Reguleringsplan må tillate boligbruk",
            d="Sjekk at eiendommens reguleringsformål tillater bolig. Næringslokaler kan ha krav om opprettholdt næringsandel.",
            ref="PBL § 12-7",
        ))

    findings.append(TiltakFinding(
        type="warn",
        t="Behov for nabovarsel må avklares",
        d="Kommunen eller ansvarlig søker vurderer om saken skal nabovarsles og om et unntak kan brukes.",
        ref="PBL § 21-3",
    ))

    if inp.inngrep_baerende:
        findings.append(TiltakFinding(
            type="fail",
            t="Inngrep i bærekonstruksjon krever faglig prosjektering",
            d="En konstruksjonsingeniør må avklare lastvei, stabilitet og nødvendig ansvarsrett.",
            ref="PBL § 20-3 og TEK17 kap. 10",
        ))

    tiltak.append(TiltakTiltak(
        name="Søknad om bruksendring",
        desc="Utarbeidelse og innlevering av søknad med situasjonsplan, tegninger og teknisk dokumentasjon.",
        kostnad=12000,
    ))
    tiltak.append(TiltakTiltak(
        name="Teknisk dokumentasjon (TEK17)",
        desc="Dokumentasjon av at ny bruk oppfyller krav til lys, luft, brann og tilgjengelighet.",
        kostnad=8000,
    ))

    needs_professional = inp.verneverdig or inp.inngrep_baerende
    has_failure = needs_professional or inp.plan_status == "ikke_tillatt"
    status = "red" if has_failure else "amber"
    return TiltakResult(
        status=status,
        statusText="Krever faglig avklaring" if has_failure else "Søknadspliktig bruksendring",
        statusDesc="Søknadsgrunnlaget må dokumentere dagens godkjente bruk, planstatus og tekniske krav.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="Søknad med nabovarsel (SAK10 kap. 5)",
        ansvarsrett=needs_professional,
        tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak),
        input=inp.model_dump(),
    )
