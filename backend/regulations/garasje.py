from models import GarasjeInput, TiltakResult, Finding, Tiltak


LABEL = {"garasje": "Garasje", "carport": "Carport", "bod": "Bod / uthus"}
KOSTNAD = {"garasje": 8000, "carport": 4000, "bod": 5000}


def evaluate_garasje(inp: GarasjeInput) -> TiltakResult:
    findings: list[Finding] = []
    blockers: list[str] = []

    conditions = [
        (not inp.overnatting, "Bygget skal ikke brukes til beboelse eller overnatting"),
        (not inp.kjeller, "Bygget har ikke kjeller"),
        (inp.etasjer == 1, "Bygget har én etasje"),
        (inp.monehoyde <= 4.0, "Mønehøyden er høyst 4,0 m"),
        (inp.gesimshoyde <= 3.0, "Gesimshøyden er høyst 3,0 m"),
        (inp.avstand >= 1.0, "Avstanden til nabogrensen er minst 1,0 m"),
        (inp.avstand_bygg >= 1.0, "Avstanden til andre bygg er minst 1,0 m"),
        (not inp.over_ledninger, "Bygget plasseres ikke over vann- eller avløpsledninger"),
    ]
    for ok, label in conditions:
        findings.append(Finding(
            type="ok" if ok else "fail",
            t=label if ok else f"Ikke oppfylt: {label.lower()}",
            d="Dette er et vilkår i unntaksregelen for frittliggende bygninger.",
            ref="SAK10 § 4-1 a",
        ))
        if not ok:
            blockers.append(label)

    if inp.plan_ok is None:
        findings.append(Finding(
            type="warn", t="Reguleringsplan og utnyttelsesgrad er ikke bekreftet",
            d="Unntaket kan bare brukes når plassering og størrelse er i samsvar med kommunale planer og tillatt BYA.",
            ref="PBL § 1-6",
        ))
    elif not inp.plan_ok:
        blockers.append("Tiltaket er ikke i samsvar med plan")
        findings.append(Finding(
            type="fail", t="Tiltaket er ikke i samsvar med plan",
            d="Det må søkes om tillatelse og eventuelt dispensasjon.", ref="PBL kap. 19",
        ))

    exempt = inp.areal <= 50 and not blockers and inp.plan_ok is True
    self_apply = inp.areal <= 70 and not inp.overnatting

    if exempt:
        status, text, desc = "green", "Unntatt søknad", "Alle registrerte vilkår for unntaket er oppfylt. Meld bygget til kommunen etter ferdigstillelse."
        soknadstype, ansvarsrett = "Unntatt (SAK10 § 4-1 a)", False
    elif inp.plan_ok is not True:
        status = "red" if inp.plan_ok is False else "amber"
        text = "Dispensasjon må avklares" if inp.plan_ok is False else "Plan og BYA må avklares"
        desc = "Søknadsløpet kan ikke avgjøres før byggegrense, planformål og utnyttelsesgrad er kontrollert."
        soknadstype, ansvarsrett = "Må avklares mot kommunal plan", False
    elif self_apply:
        status, text, desc = "amber", "Søknad kan sendes av tiltakshaver", "Prosjektet er ikke dokumentert som unntatt, men en frittliggende bygning inntil 70 m² kan normalt søkes av eieren selv."
        soknadstype, ansvarsrett = "PBL § 20-4 / SAK10 § 3-1 b", False
    else:
        status, text, desc = "red", "Krever ansvarlig foretak", "Bruk til beboelse/overnatting eller areal over 70 m² faller utenfor ordningen for egen søknad."
        soknadstype, ansvarsrett = "PBL § 20-3 (med ansvarsrett)", True

    tiltak = [Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc="Tidlig kostnadsindikasjon. Grunnforhold, standard og lokale priser må avklares.",
        kostnad=int(inp.areal * KOSTNAD[inp.type]),
    )]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak), input=inp.model_dump(),
    )
