from models import TilbyggInput, TiltakResult, Finding, Tiltak


LABEL = {
    "tilbygg_1etasje": "Tilbygg på bakken",
    "ny_etasje": "Ny etasje / påbygg",
    "innglasset_terrasse": "Innglasset terrasse / vinterhage",
}


def evaluate_tilbygg(inp: TilbyggInput) -> TiltakResult:
    findings: list[Finding] = []
    is_upper_storey = inp.type == "ny_etasje"
    permanent_use = inp.bruk in ("oppholdsrom", "bad")

    if is_upper_storey:
        findings.append(Finding(
            type="fail", t="Ny etasje er et påbygg",
            d="Påbygg omfattes ikke av arealunntaket for små tilbygg og må prosjekteres med ansvarlige foretak.",
            ref="PBL § 20-3",
        ))
        status, text = "red", "Krever ansvarlig foretak"
        desc = "Bæreevne, høyde, brann, plan og visuelle virkninger må prosjekteres."
        soknadstype, ansvarsrett = "PBL § 20-3 (påbygg)", True
    else:
        exempt_size = inp.areal <= 15
        exempt_use = not permanent_use
        plan_confirmed = inp.plan_ok is True and inp.bya_ok is True
        distance_ok = inp.avstand >= 4.0
        exempt = exempt_size and exempt_use and plan_confirmed and distance_ok and not inp.pipe

        if exempt:
            status, text = "green", "Unntatt søknad"
            desc = "Det mindre tilbygget er registrert innenfor unntaksvilkårene. Meld arealendringen etter ferdigstillelse."
            soknadstype, ansvarsrett = "Unntatt (SAK10 § 4-1)", False
        elif inp.areal > 50 or inp.pipe:
            status, text = "red", "Krever ansvarlig foretak"
            desc = "Tilbygg over 50 m² eller tilbygg med pipe krever ansvarlige foretak."
            soknadstype, ansvarsrett = "PBL § 20-3", True
        elif not plan_confirmed:
            status = "red" if inp.plan_ok is False or inp.bya_ok is False else "amber"
            text = "Dispensasjon må avklares" if status == "red" else "Plan og BYA må avklares"
            desc = "Søknadsløpet kan ikke avgjøres før byggegrense, planformål og utnyttelsesgrad er kontrollert."
            soknadstype, ansvarsrett = "Må avklares mot kommunal plan", False
        elif inp.areal <= 50:
            status, text = "amber", "Søknad uten ansvarlig foretak"
            desc = "Du kan normalt søke selv for et tilbygg inntil 50 m². Plan, BYA og avstand må dokumenteres."
            soknadstype, ansvarsrett = "PBL § 20-4 / SAK10 § 3-1 a", False

        findings.extend([
            Finding(
                type="ok" if distance_ok else "warn",
                t="Avstand til nabogrense er avklart" if distance_ok else "Avstand under 4 meter må avklares",
                d=f"Oppgitt avstand er {inp.avstand:.1f} m. Kommunal plan eller nabosamtykke kan påvirke kravet.",
                ref="PBL § 29-4",
            ),
            Finding(
                type="ok" if plan_confirmed else "warn",
                t="Plan og BYA er bekreftet" if plan_confirmed else "Plan og utnyttelsesgrad må kontrolleres",
                d="Et tiltak er ikke unntatt dersom det bryter byggegrense, planformål eller tillatt utnyttelsesgrad.",
                ref="PBL § 1-6",
            ),
        ])
        if exempt_size and permanent_use:
            findings.append(Finding(
                type="warn", t="Rom for varig opphold faller utenfor småtilbygg-unntaket",
                d="Areal alene er ikke nok til å være unntatt når tilbygget skal brukes som oppholdsrom eller bad.",
                ref="SAK10 § 4-1",
            ))

    tiltak = [Tiltak(
        name=f"{LABEL[inp.type]} ({inp.areal:.0f} m²)",
        desc="Tidlig kostnadsindikasjon. Standard, grunnforhold og tilkobling til eksisterende bygg må prosjekteres.",
        kostnad=int(inp.areal * 18_000),
    )]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak), input=inp.model_dump(),
    )
