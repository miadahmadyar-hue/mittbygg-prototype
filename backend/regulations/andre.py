from models import AndreInput, TiltakResult, Finding, Tiltak, Lempning


def evaluate_andre(inp: AndreInput) -> TiltakResult:
    findings: list[Finding] = []

    findings.append(Finding(
        type="ok", t="Beskrivelse mottatt",
        d=f"Vi har mottatt beskrivelsen din: «{inp.beskrivelse[:120]}{'…' if len(inp.beskrivelse) > 120 else ''}»",
        ref="MittBygg",
    ))
    findings.append(Finding(
        type="warn", t="Automatisk regelsjekk ikke tilgjengelig",
        d="Dette tiltaket krever manuell vurdering av en byggesaksrådgiver. Svar innen 1 virkedag.",
        ref="PBL generelt",
    ))
    findings.append(Finding(
        type="ok", t="Alternativ: ring kommunen direkte",
        d="Plan- og bygningsetaten har veiledningsplikt. Ring kommunens byggesaksavdeling for rask avklaring.",
        ref="PBL § 21-1",
    ))

    return TiltakResult(
        status="amber",
        statusText="Vurderes manuelt",
        statusDesc="En rådgiver gjennomgår tiltaket og svarer innen 1 virkedag.",
        findings=findings,
        tiltak=[Tiltak(
            name="Rådgivning via MittBygg",
            desc="Byggerettsekspert gjennomgår tiltaket og leverer skriftlig vurdering av søknadsplikt.",
            kostnad=1_500,
        )],
        lempninger=[],
        soknadstype="Vurderes manuelt av rådgiver",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=1_500,
        input=inp.model_dump(),
    )
