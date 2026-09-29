from models import BoenhetInput, TiltakResult, TiltakFinding, TiltakTiltak


def evaluate_boenhet(inp: BoenhetInput) -> TiltakResult:
    criteria = [inp.hovedfunksjoner, inp.egen_inngang, inp.fysisk_adskilt]
    is_new_unit = all(criteria)

    findings = [
        TiltakFinding(
            type="ok" if inp.hovedfunksjoner else "warn",
            t="Alle hovedfunksjoner" if inp.hovedfunksjoner else "Ikke alle hovedfunksjoner",
            d="Enheten vurderes etter om den kan inneholde stue, kjøkken, soveplass, bad og toalett.", ref="SAK10 § 2-2 a",
        ),
        TiltakFinding(
            type="ok" if inp.egen_inngang else "warn",
            t="Egen inngang" if inp.egen_inngang else "Ingen egen inngang",
            d="Egen separat inngang er ett av tre kumulative vilkår.", ref="SAK10 § 2-2 b",
        ),
        TiltakFinding(
            type="ok" if inp.fysisk_adskilt else "warn",
            t="Fysisk adskilt" if inp.fysisk_adskilt else "Intern forbindelse beholdes",
            d="En låst intern dør betyr at delene ikke er fysisk adskilt etter regelen.", ref="SAK10 § 2-2 c",
        ),
    ]

    if is_new_unit:
        status, text = "red", "Søknadspliktig oppdeling"
        desc = "Alle tre kriteriene for en ny boenhet er oppfylt. Ansvarlig søker må vurdere plan, brann, lyd, tilgjengelighet og parkering."
        soknadstype, ansvarsrett = "PBL § 20-3 / SAK10 § 2-2", True
        tiltak = [TiltakTiltak(
            name="Forprosjekt med ansvarlig søker",
            desc="Kontroll av lovlig bruk, plan, brann, lyd, tilgjengelighet og nødvendig tegningsgrunnlag.",
            kostnad=25_000,
        )]
    else:
        status, text = "green", "Ikke klassifisert som ny boenhet"
        desc = "Alle tre vilkårene er ikke oppfylt. Utleie i seg selv utløser ikke søknadspliktig oppdeling, men bruksendring eller andre byggearbeider kan fortsatt kreve søknad."
        soknadstype, ansvarsrett = "Ikke oppdeling - vurder eventuell bruksendring", False
        tiltak = []

    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=ansvarsrett, tiltaksklasse=2 if is_new_unit and inp.antall > 1 else 1,
        totalKostnad=sum(t.kostnad for t in tiltak), input=inp.model_dump(),
    )
