from models import LevegInput, TiltakResult, Finding, Tiltak


def evaluate_levegg(inp: LevegInput) -> TiltakResult:
    near_boundary = inp.avstand < 1.0
    max_length = 5.0 if near_boundary else 10.0
    dimension_exempt = inp.hoyde <= 1.8 and inp.lengde <= max_length
    exempt = dimension_exempt and inp.plan_ok is True

    findings = [
        Finding(
            type="ok" if inp.hoyde <= 1.8 else "warn",
            t=f"Høyde {inp.hoyde:.1f} m",
            d="Unntaksgrensen er 1,8 m.", ref="SAK10 § 4-1 e",
        ),
        Finding(
            type="ok" if inp.lengde <= max_length else "warn",
            t=f"Lengde {inp.lengde:.1f} m - grense {max_length:.0f} m",
            d="Nærmere enn 1,0 m fra nabogrensen er maksimal lengde 5,0 m. Ellers er den 10,0 m.",
            ref="SAK10 § 4-1 e",
        ),
    ]

    if inp.plan_ok is None:
        findings.append(Finding(
            type="warn", t="Kommunal plan er ikke kontrollert",
            d="Leveggen må være i samsvar med byggegrenser, frisikt og eventuelle lokale bestemmelser.",
            ref="PBL § 1-6",
        ))
    elif inp.plan_ok is False:
        findings.append(Finding(
            type="fail", t="Leveggen er ikke i samsvar med planen",
            d="Avklar endret plassering eller dispensasjon med kommunen.",
            ref="PBL kap. 19",
        ))

    if exempt:
        status, text, desc = "green", "Unntatt søknad", "Høyde, lengde og avstand ligger innenfor unntaksregelen."
        soknadstype = "Unntatt (SAK10 § 4-1 e)"
    elif not dimension_exempt:
        status, text, desc = "amber", "Søknad eller avklaring nødvendig", "Minst ett av målene er utenfor unntaksregelen."
        soknadstype = "PBL § 20-4 - avklar med kommunen"
    else:
        status = "red" if inp.plan_ok is False else "amber"
        text, desc = "Planstatus må avklares", "Målene er innenfor unntaksregelen, men kommunal plan og frisikt er ikke bekreftet."
        soknadstype = "Må avklares mot kommunal plan"

    tiltak = [Tiltak(
        name=f"Levegg {inp.hoyde:.1f} m x {inp.lengde:.1f} m",
        desc="Kostnadsindikasjon for fundamentering og trekonstruksjon.",
        kostnad=int(inp.hoyde * inp.lengde * 1_800),
    )]
    return TiltakResult(
        status=status, statusText=text, statusDesc=desc, findings=findings,
        tiltak=tiltak, lempninger=[], soknadstype=soknadstype,
        ansvarsrett=False, tiltaksklasse=1,
        totalKostnad=sum(t.kostnad for t in tiltak), input=inp.model_dump(),
    )
