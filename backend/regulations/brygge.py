from models import BryggeInput, TiltakResult, Finding, Tiltak, Lempning

LABEL   = {"fast": "Fast brygge", "flytende": "Flytende brygge", "stupebrett": "Badebrygge / stupebrett"}
KOSTNAD = {"fast": 18_000, "flytende": 12_000, "stupebrett": 8_000}


def evaluate_brygge(inp: BryggeInput) -> TiltakResult:
    findings: list[Finding] = []
    tiltak:   list[Tiltak]  = []

    areal = inp.lengde * inp.bredde

    findings.append(Finding(
        type="fail", t="Alle brygger er søknadspliktige",
        d="Det finnes ingen unntaksregel for brygger. Alle bryggeprosjekter krever søknad etter PBL § 20-1 a.",
        ref="PBL § 20-1 a",
    ))
    findings.append(Finding(
        type="warn", t="100-metersbeltet langs sjø og vassdrag",
        d="Brygger i 100-metersbeltet fra sjøen vurderes etter PBL § 1-8: allmennhetens tilgang og naturmangfold.",
        ref="PBL § 1-8",
    ))
    findings.append(Finding(
        type="warn", t="Nabovarsel påkrevd",
        d="Søknad om brygge utløser nabovarsel (PBL § 21-3) med 2-ukers merknadsfrist.",
        ref="PBL § 21-3",
    ))

    if inp.type == "fast":
        findings.append(Finding(
            type="warn", t="Fast brygge — geoteknisk vurdering",
            d="Pælefundamentering krever geoteknisk rapport (TEK17 § 9-2). Typisk kostnad 30–50 000 kr.",
            ref="TEK17 § 9-2",
        ))
        tiltak.append(Tiltak(
            name=f"Fast brygge {inp.lengde:.0f} × {inp.bredde:.0f} m",
            desc="Stikkpæler, impregnert treverk, gangbane og rekkverk.",
            kostnad=int(areal * KOSTNAD["fast"]),
        ))
        tiltak.append(Tiltak(
            name="Geoteknisk rapport og pæleanbefaling",
            desc="Prøvetaking, rapport og dimensjoneringsanbefaling for pæler.",
            kostnad=35_000,
        ))

    elif inp.type == "flytende":
        tiltak.append(Tiltak(
            name=f"Flytende brygge {inp.lengde:.0f} × {inp.bredde:.0f} m",
            desc="Flytende pontong, gangbane og fortøyningssystem.",
            kostnad=int(areal * KOSTNAD["flytende"]),
        ))

    elif inp.type == "stupebrett":
        tiltak.append(Tiltak(
            name=f"Badebrygge {inp.lengde:.0f} × {inp.bredde:.0f} m",
            desc="Enkel trebrygge med stikkpæler, gangbane og evt. stige.",
            kostnad=int(areal * KOSTNAD["stupebrett"]),
        ))

    total = sum(t.kostnad for t in tiltak)

    return TiltakResult(
        status="red",
        statusText="Søknad påkrevd",
        statusDesc="Alle brygger krever byggesøknad — ingen unntak.",
        findings=findings, tiltak=tiltak, lempninger=[],
        soknadstype="PBL § 20-1 a (søknadspliktig — ingen unntak)",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=total,
        input=inp.model_dump(),
    )
