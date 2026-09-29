from models import TakInput, TiltakResult, Finding, Tiltak


def evaluate_tak(inp: TakInput) -> TiltakResult:
    findings: list[Finding] = []

    if inp.verneverdig:
        status, text = "red", "Krever kulturminnefaglig avklaring"
        desc, soknadstype, ansvarsrett = "Takarbeidet må vurderes mot vern og kommunale planer.", "Søknad og kulturminnefaglig vurdering", True
    elif inp.type == "bytte_materiale" and inp.samme_utseende:
        status, text = "green", "Vedlikehold - normalt uten søknad"
        desc, soknadstype, ansvarsrett = "Lik taktekking med uendret utseende regnes normalt som vedlikehold.", "Unntatt - vedlikehold", False
    elif inp.type == "bytte_materiale":
        status, text = "amber", "Mulig fasadeendring"
        desc, soknadstype, ansvarsrett = "Annet materiale eller utseende kan endre bygningens karakter og må avklares.", "Må avklares - fasadeendring", False
    elif inp.type == "endre_form":
        status, text = "red", "Krever ansvarlig foretak"
        desc, soknadstype, ansvarsrett = "Endret takform berører normalt bærende konstruksjon og høydebestemmelser.", "PBL § 20-3 (takform)", True
    else:
        status, text = "amber", "Bruksendring og tekniske krav må avklares"
        desc, soknadstype, ansvarsrett = "Loft til oppholdsrom krever kontroll av godkjent bruk, høyde, dagslys, rømning, trapp og eventuell bæring.", "Må avklares - bruksendring", False

    findings.append(Finding(
        type="ok" if status == "green" else "warn",
        t="Takarbeidet er klassifisert etter faktisk omfang",
        d="Lik utskifting, endret utseende, konstruksjonsendring og loftsutbygging følger ulike løp.",
        ref="PBL § 20-1 og § 20-5",
    ))
    if inp.etterisolere:
        findings.append(Finding(
            type="warn", t="Etterisolering påvirker detaljprosjekteringen",
            d="Fuktsikkerhet, lufting og tilslutninger må dokumenteres.", ref="TEK17 kap. 13 og 14",
        ))

    tiltak = [Tiltak(name="Takarbeid", desc="Kostnad fastsettes etter oppmåling, oppbygning og materialvalg.", kostnad=0)]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=1, totalKostnad=0,
        input=inp.model_dump(),
    )
