from models import AndreInput, TiltakResult, Finding, Tiltak, Lempning


def evaluate_andre(inp: AndreInput) -> TiltakResult:
    findings: list[Finding] = []

    findings.append(Finding(
        type="ok", t="Prosjektet er beskrevet",
        d=f"Grunnlag for videre avklaring: «{inp.beskrivelse[:120]}{'…' if len(inp.beskrivelse) > 120 else ''}»",
        ref="Opplysninger fra tiltakshaver",
    ))
    findings.append(Finding(
        type="warn", t="Automatisk regelsjekk ikke tilgjengelig",
        d="Prosjektet passer ikke i en automatisk regelsjekk. Avklar tiltakstype, gjeldende plan og søknadsplikt med kommunen eller en byggesaksrådgiver.",
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
        statusDesc="Ta med prosjektbeskrivelsen når du ber kommunen eller en rådgiver om en forhåndsavklaring.",
        findings=findings,
        tiltak=[],
        lempninger=[],
        soknadstype="Vurderes manuelt av rådgiver",
        ansvarsrett=False,
        tiltaksklasse=1,
        totalKostnad=0,
        input=inp.model_dump(),
    )
