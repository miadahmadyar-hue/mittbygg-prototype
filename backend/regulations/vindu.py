from models import VinduInput, TiltakResult, Finding


def evaluate_vindu(inp: VinduInput) -> TiltakResult:
    findings = [Finding(
        type="warn", t="Omfang, utseende og vern må kontrolleres",
        d="Utskifting av ett eller noen få vinduer med samme størrelse, type og utseende er normalt vedlikehold. Ny eller større åpning er en fasadeendring; kommunen vurderer om bygningens karakter endres.",
        ref="DiBK: Eksempler på byggearbeid på vindu; PBL § 20-5 f",
    )]
    if inp.verneverdig is not False:
        findings.append(Finding(type="warn", t="Vernestatus må avklares", d="Kontroller vernestatus og lokale bestemmelser før vinduer eller dører endres.", ref="Gjeldende plan og vernebestemmelser"))
    findings.append(Finding(
        type="warn", t="Bæring og brannsikkerhet",
        d="En endret åpning kan påvirke bæring og brannskille. Nærhet til nabogrense avgjør ikke alene brannkravene. Glassklasse og konstruksjon må fastsettes for den konkrete veggen.",
        ref="TEK17 kap. 10 og 11",
    ))
    if inp.brannvegg is None:
        findings.append(Finding(type="warn", t="Brannskille er ikke avklart", d="Finn godkjente tegninger eller be en fagperson vurdere veggen.", ref="TEK17 kap. 11"))
    findings.append(Finding(type="warn", t="Tekniske krav vurderes etter arbeidets omfang", d="Energi, dagslys, rømning og tetting må vurderes der kravene er relevante. Veiviseren foreskriver ikke en bestemt U-verdi eller vindustype.", ref="TEK17 kap. 11, 13 og 14"))
    professional = inp.brannvegg is True
    return TiltakResult(
        status="amber", statusText="Faglig kontroll av brannskille nødvendig" if professional else "Vindusarbeidet må avklares",
        statusDesc="Last opp bilder og tegninger med mål før omfang, søknadsplikt og løsning fastsettes.",
        findings=findings, tiltak=[], lempninger=[], soknadstype="Må avklares - vindu og fasade",
        ansvarsrett=professional, tiltaksklasse=1, totalKostnad=0, input=inp.model_dump(),
    )
