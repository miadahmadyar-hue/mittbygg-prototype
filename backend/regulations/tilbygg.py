from models import TilbyggInput, TiltakResult, Finding, Tiltak


LABEL = {
    "tilbygg_1etasje": "Tilbygg på bakken",
    "ny_etasje": "Ny etasje / påbygg",
    "innglasset_terrasse": "Innglasset terrasse / vinterhage",
}


def evaluate_tilbygg(inp: TilbyggInput) -> TiltakResult:
    findings: list[Finding] = []
    is_upper_storey = inp.type == "ny_etasje"

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
        scope_confirmed = inp.samme_formaal is True and inp.understottet is True and inp.en_etasje is True and inp.egen_boenhet is False
        plan_confirmed = inp.plan_ok is True and inp.bya_ok is True
        distance_ok = inp.avstand >= 4.0
        exempt = exempt_size and scope_confirmed and plan_confirmed and distance_ok and not inp.pipe

        if exempt:
            status, text = "green", "Unntatt søknad"
            desc = "Det mindre tilbygget er registrert innenfor unntaksvilkårene. Meld arealendringen etter ferdigstillelse."
            soknadstype, ansvarsrett = "Unntatt (SAK10 § 4-1)", False
        elif inp.areal > 50 or inp.pipe or inp.egen_boenhet is True:
            status, text = "red", "Krever ansvarlig foretak"
            desc = "Areal, pipe eller etablering av egen boenhet gjør at ansvarlige foretak må vurderes."
            soknadstype, ansvarsrett = "PBL § 20-3", True
        elif not plan_confirmed or not scope_confirmed:
            status = "red" if inp.plan_ok is False or inp.bya_ok is False else "amber"
            text = "Dispensasjon må avklares" if status == "red" else "Plan og BYA må avklares"
            desc = "Plan, utnyttelsesgrad, understøtting, etasjer og eventuell ny boenhet må avklares. Veiviseren dekker bare tilbygg i ett plan; andre løsninger vurderes konkret."
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
        if exempt_size:
            findings.append(Finding(
                type="warn", t="Små tilbygg kan også inneholde oppholdsrom",
                d="Rombruken må være tillatt i den eksisterende bygningen. Begge arealmål (BRA og BYA), understøtting, plan og øvrige vilkår må være oppfylt. En ny selvstendig boenhet er ikke omfattet.",
                ref="SAK10 § 4-1 b",
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
