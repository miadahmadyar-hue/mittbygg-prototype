from models import TilleggsdelInput, TiltakResult, Finding


def evaluate_tilleggsdel(inp: TilleggsdelInput) -> TiltakResult:
    findings = [Finding(
        type="warn", t="Kontroller godkjent bruk først",
        d="Godkjente tegninger og vedtak avgjør om rommet er hoveddel eller tilleggsdel. Gang og vaskerom kan allerede være hoveddel. Romnavnet alene avgjør ikke søknadsplikten.",
        ref="DiBK: Hva er en bruksendring?; SAK10 § 2-1",
    )]
    if inp.godkjent_bruk_bekreftet and inp.romtype in ("bod", "garasje", "teknisk"):
        findings.append(Finding(type="warn", t="Tilleggsdel til hoveddel krever søknad", d="Avklar om endringen skjer innenfor samme boenhet og hvilke tekniske krav som gjelder for den nye bruken.", ref="PBL § 20-1 d; SAK10 § 3-1 c"))
    else:
        findings.append(Finding(type="warn", t="Søknadsomfang er ikke fastsatt", d="Det må avklares om dette er bruksendring, endring innenfor hoveddel eller andre søknadspliktige arbeider.", ref="SAK10 § 2-1"))
    findings.append(Finding(type="warn", t="Dokumenter relevante tekniske forhold", d="Romhøyde, dagslys, rømning, ventilasjon, fukt og energi vurderes ut fra ny bruk og byggets forutsetninger. For eldre boliger kan særregler være aktuelle. Ingen generell høyde- eller dagslysformel er brukt her.", ref="TEK17 § 1-2 og kap. 11–14"))
    if inp.romtype == "garasje":
        findings.append(Finding(type="warn", t="Tidligere garasjebruk må undersøkes", d="Avklar gulv, fukt, eventuell forurensning, brannforhold og parkering. Tiltak må prosjekteres etter funn, ikke automatisk bestilles.", ref="TEK17 kap. 11 og 13; gjeldende plan"))
    return TiltakResult(
        status="amber", statusText="Godkjent bruk og tekniske krav må avklares",
        statusDesc="Samle tegninger, mål og beskrivelse før søknadsomfang og pris avtales.",
        findings=findings, tiltak=[], lempninger=[], soknadstype="Må avklares - endret rombruk",
        ansvarsrett=False, tiltaksklasse=1, totalKostnad=0, input=inp.model_dump(),
    )
