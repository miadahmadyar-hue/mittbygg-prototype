from models import AnneksInput, TiltakResult, Finding, Tiltak


LABEL = {"anneks": "Anneks / gjestehytte", "uthus": "Uthus / verksted", "hagebod": "Hagebod"}
KOSTNAD = {"anneks": 22000, "uthus": 12000, "hagebod": 8000}


def evaluate_anneks(inp: AnneksInput) -> TiltakResult:
    overnight = inp.overnatting or inp.type == "anneks"
    findings: list[Finding] = []

    if overnight:
        findings.append(Finding(
            type="fail", t="Overnatting omfattes ikke av 50 m²-unntaket",
            d="Unntaket for frittliggende bygning gjelder bare bygg som ikke skal brukes til beboelse eller overnatting.",
            ref="SAK10 § 4-1 a",
        ))
        status, text = "red", "Søknad med ansvarlig foretak"
        desc = "Et anneks for overnatting må vurderes som bolig-/fritidsformål og mot gjeldende plan."
        soknadstype, ansvarsrett = "PBL § 20-3 (overnatting)", True
    else:
        conditions = [
            inp.areal <= 50, inp.avstand >= 1.0, inp.avstand_bygg >= 1.0,
            not inp.kjeller, inp.etasjer == 1, inp.monehoyde <= 4.0,
            inp.gesimshoyde <= 3.0, not inp.over_ledninger, inp.plan_ok is True,
        ]
        if all(conditions):
            status, text = "green", "Unntatt søknad"
            desc = "Vilkårene for frittliggende uthus er registrert som oppfylt. Meld bygget til kommunen etter ferdigstillelse."
            soknadstype, ansvarsrett = "Unntatt (SAK10 § 4-1 a)", False
        elif inp.plan_ok is not True:
            status = "red" if inp.plan_ok is False else "amber"
            text = "Dispensasjon må avklares" if inp.plan_ok is False else "Plan og BYA må avklares"
            desc = "Byggegrense, planformål og utnyttelsesgrad må kontrolleres før søknadsløpet kan bestemmes."
            soknadstype, ansvarsrett = "Må avklares mot kommunal plan", False
        elif inp.areal <= 70:
            status, text = "amber", "Søknad kan sendes av tiltakshaver"
            desc = "Prosjektet er ikke dokumentert som unntatt, men kan normalt søkes av eieren selv når det ikke brukes til beboelse."
            soknadstype, ansvarsrett = "PBL § 20-4 / SAK10 § 3-1 b", False
        else:
            status, text = "red", "Krever ansvarlig foretak"
            desc = "Frittliggende bygg over 70 m² krever ansvarlig søker."
            soknadstype, ansvarsrett = "PBL § 20-3", True

        findings.append(Finding(
            type="ok" if all(conditions) else "warn",
            t="Kontroll av vilkårene for frittliggende bygg",
            d="Areal, høyde, etasjer, kjeller, avstander, ledninger, plan og utnyttelsesgrad må alle være avklart.",
            ref="SAK10 §§ 3-1 og 4-1",
        ))

    tiltak = [Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc="Tidlig kostnadsindikasjon, ikke pristilbud.",
        kostnad=int(inp.areal * KOSTNAD[inp.type]),
    )]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak), input=inp.model_dump(),
    )
