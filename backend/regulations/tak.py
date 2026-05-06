from models import TakInput, TiltakResult, Finding, Tiltak, Lempning

LABEL = {
    "bytte_materiale": "Bytte tekkemateriale",
    "endre_form":      "Endre takform",
    "bygge_loft":      "Bygge ut loft",
}


def evaluate_tak(inp: TakInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    if inp.type == "bytte_materiale":
        findings.append(Finding(
            type="ok", t="Bytte tekkemateriale — unntatt søknad",
            d="Skifte av taktekkemateriale uten å endre takform er unntatt søknad etter SAK10 § 4-1.",
            ref="SAK10 § 4-1",
        ))
        tiltak.append(Tiltak(name="Ny taktekking", desc="Fjerning av gammelt materiale, ny undertak, ny taktekking.", kostnad=180_000))

    elif inp.type == "endre_form":
        findings.append(Finding(
            type="warn", t="Endre takform — søknadspliktig",
            d="Endring av takform (vinkel, gesims, mønehøyde) er søknadspliktig. Sjekk reguleringsplan for tillatte takformer.",
            ref="PBL § 20-1 e",
        ))
        findings.append(Finding(
            type="warn", t="Sjekk tillatt mønehøyde i reguleringsplan",
            d="Reguleringsplan og kommuneplanens arealdel setter maksimal mønehøyde og gesimshøyde.",
            ref="PBL § 29-4 + kommuneplan",
        ))
        tiltak.append(Tiltak(name="Ny takform og taktekking", desc="Riving av eksisterende tak, ny konstruksjon med endret form, taktekking.", kostnad=280_000))

    elif inp.type == "bygge_loft":
        findings.append(Finding(
            type="warn", t="Bygge ut loft — søknadspliktig",
            d="Innredning av loft til oppholdsrom er bruksendring og søknadspliktig (PBL § 20-1 d).",
            ref="PBL § 20-1 d",
        ))
        findings.append(Finding(
            type="warn", t="Takhøyde og lysforhold — sjekk TEK17",
            d="Krav: takhøyde ≥ 2,4 m i minst halvparten av rommet (§ 12-7), dagslys ≥ 10 % av gulvflate (§ 13-7).",
            ref="TEK17 § 12-7 + § 13-7",
        ))
        tiltak.append(Tiltak(name="Innredning av loft", desc="Isolering, dampsperre, gypsplate-innkledning, vinduer, trapp.", kostnad=350_000))

    findings.append(Finding(
        type="ok", t="Brannklasse taktekkemateriale",
        d="Nytt taktekkemateriale må oppfylle klasse BROOF(t2) for brannmotstand (TEK17 § 11-9).",
        ref="TEK17 § 11-9",
    ))

    if inp.verneverdig:
        findings.append(Finding(
            type="warn", t="Verneverdig bygning — rådfør deg med antikvar",
            d="Endringer på verneverdig bygning bør meldes til kulturminnemyndigheten, selv om tiltaket er unntatt søknad.",
            ref="PBL § 31-1 + Kulturminneloven",
        ))

    if inp.etterisolere:
        tiltak.append(Tiltak(
            name="Etterisolering av tak",
            desc="Tilleggsisolering 100–200 mm over eksisterende sperrer, ny dampsperre.",
            kostnad=120_000,
        ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total = sum(t.kostnad for t in tiltak)

    if fails > 0:
        status, txt, desc = "red", "Søknad påkrevd", "Kritiske avvik må rettes."
    elif warns > 0:
        status, txt, desc = "amber", "Trolig søknadspliktig", "Sjekk reguleringsplan og meld til kommunen."
    else:
        status, txt, desc = "green", "Unntatt søknad", "Tiltaket kan gjennomføres uten søknad."

    soknadstype = (
        "Unntatt (SAK10 § 4-1)" if inp.type == "bytte_materiale" else
        "PBL § 20-1 e (fasadeendring)" if inp.type == "endre_form" else
        "PBL § 20-1 d (bruksendring)"
    )

    return TiltakResult(
        status=status, statusText=txt, statusDesc=desc,
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype=soknadstype,
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
