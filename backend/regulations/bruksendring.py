from backend.models import BruksendringInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_bruksendring(inp: BruksendringInput) -> TiltakResult:
    findings: list[TiltakFinding] = []
    tiltak: list[TiltakTiltak] = []

    findings.append(TiltakFinding(
        type="warn",
        t="Bruksendring er søknadspliktig",
        d="Endring av bruk fra en kategori til en annen krever søknad etter PBL § 20-1 d.",
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

    if inp.fra in ("naring", "kontor") and inp.til in ("bolig", "hybel"):
        findings.append(TiltakFinding(
            type="warn",
            t="Reguleringsplan må tillate boligbruk",
            d="Sjekk at eiendommens reguleringsformål tillater bolig. Næringslokaler kan ha krav om opprettholdt næringsandel.",
            ref="PBL § 12-7",
        ))

    findings.append(TiltakFinding(
        type="ok",
        t="Nabovarsel kreves",
        d="Søknad om bruksendring utløser nabovarsel med 2 ukers frist.",
        ref="SAK10 § 5-2",
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

    status = "red" if inp.verneverdig else "amber"
    return TiltakResult(
        status=status,
        statusText="Søknadspliktig bruksendring" if not inp.verneverdig else "Krever kulturminnevurdering",
        statusDesc="Søknad må sendes kommunen. Saksbehandlingstid normalt 3–12 uker.",
        findings=findings,
        tiltak=tiltak,
        lempninger=[],
        soknadstype="Søknad med nabovarsel (SAK10 kap. 5)",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak),
        input=inp.model_dump(),
    )
