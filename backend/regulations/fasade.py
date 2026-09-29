from models import FasadeInput, TiltakResult, Finding, Tiltak


LABEL = {
    "skifte_vindu": "Skifte vindu eller dør",
    "nytt_hull": "Ny åpning i fasaden",
    "kledning": "Ny ytterkledning",
    "farge": "Farge / overflate",
    "vindu_storre": "Større vindusåpning",
    "terrasse": "Terrasse",
    "dor": "Flytte ytterdør",
}


def evaluate_fasade(inp: FasadeInput) -> TiltakResult:
    findings: list[Finding] = []
    ansvarsrett = False

    if inp.type == "terrasse":
        complete = None not in (inp.terrasse_hoyde, inp.terrasse_dybde, inp.terrasse_avstand)
        exempt = (
            complete and inp.terrasse_hoyde <= 1.0 and inp.terrasse_dybde <= 4.0
            and inp.terrasse_avstand >= 1.0 and not inp.terrasse_overbygd
        )
        if exempt:
            status, text, desc = "green", "Unntatt søknad", "Terrassen er registrert innenfor høyde-, dybde- og avstandsvilkårene."
            soknadstype = "Unntatt (SAK10 § 4-1 d)"
        else:
            status, text, desc = "amber", "Terrassen må avklares", "Opplysninger mangler eller minst ett unntaksvilkår er ikke oppfylt."
            soknadstype = "Må avklares mot PBL og kommunal plan"
        findings.append(Finding(
            type="ok" if exempt else "warn", t="Terrassevilkår kontrollert",
            d="Unntaket krever høyde inntil 1,0 m, dybde inntil 4,0 m, minst 1,0 m til grensen og ingen overbygging.",
            ref="SAK10 § 4-1 d",
        ))
    else:
        structural_opening = inp.type in ("nytt_hull", "vindu_storre", "dor")
        clearly_maintenance = inp.type == "skifte_vindu" and inp.samme_utseende
        clearly_unchanged = inp.karakterendring == "nei" and inp.samme_utseende

        if inp.verneverdig:
            status, text, desc = "red", "Krever kulturminnefaglig avklaring", "Vernestatus og kommunale bestemmelser må kontrolleres før fasaden endres."
            soknadstype, ansvarsrett = "Søknad og kulturminnefaglig vurdering", True
        elif clearly_maintenance or clearly_unchanged:
            status, text, desc = "green", "Trolig unntatt søknad", "Arbeidet er oppgitt som utskifting uten endring av bygningens karakter."
            soknadstype = "Trolig unntatt - PBL § 20-5 f"
        else:
            status, text, desc = "amber", "Må avklares med kommunen", "Kommunen avgjør om fasadeendringen endrer bygningens karakter."
            soknadstype = "Må avklares - mulig fasadeendring"

        findings.append(Finding(
            type="warn" if structural_opening else ("ok" if status == "green" else "warn"),
            t=LABEL[inp.type],
            d="Like tiltak kan være søknadspliktige eller unntatt avhengig av bygningens karakter, planer og vern.",
            ref="PBL § 20-1 e og § 20-5 f",
        ))
        if structural_opening:
            findings.append(Finding(
                type="warn", t="Bæring og brannskille må kontrolleres",
                d="En ny eller større åpning kan påvirke bærende konstruksjon eller brannskille.",
                ref="TEK17 kap. 10 og 11",
            ))

    tiltak = [Tiltak(name=LABEL[inp.type], desc="Omfang og pris avklares etter tegninger og materialvalg.", kostnad=0)]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=1, totalKostnad=0,
        input=inp.model_dump(),
    )
