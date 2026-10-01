"""Preliminary change-of-use assessment; document review is still required.
Sources: dibk.no/bygge-eller-endre/hva-er-en-bruksendring and
 dibk.no/regelverk/sak/2/3/3-1/ (reviewed 2026-10-01).
"""
from models import BruksendringInput, TiltakResult, TiltakFinding


def evaluate_bruksendring(inp: BruksendringInput) -> TiltakResult:
    findings = []
    def add(title, description, kind="warn", ref="Dokumentasjonsgrunnlag"):
        findings.append(TiltakFinding(type=kind, t=title, d=description, ref=ref))

    if not inp.godkjent_bruk_bekreftet or inp.fra in ("annet", "usikker"):
        add("Godkjent bruk må bekreftes", "Innhent siste godkjente tegninger og vedtak. Faktisk bruk er ikke nødvendigvis godkjent bruk.")
    if inp.areal is None:
        add("Areal er ikke målt", "Oppgi arealet som omfattes av endringen og vis avgrensningen på tegning.")
    if inp.fra == inp.til:
        add("Beskriv endringen innenfor samme brukskategori", "Like kategorier avklarer ikke søknadsplikten. Beskriv aktivitet, belastning, rombruk og eventuelle fysiske endringer.", ref="SAK10 § 2-1")
    else:
        add("Søknadsomfang må avklares", "Overgangen må vurderes ut fra godkjent bruk og den konkrete nye bruken. Avklar søknadsform og behov for ansvarlig foretak.", ref="SAK10 § 2-1 og § 3-1")
    housing = inp.til in ("rom", "bolig", "hybel")
    if housing:
        add("Ny boligbruk må dokumenteres", "Dokumenter blant annet romhøyde, dagslys, ventilasjon, brann, fukt og tilgjengelighet etter reglene som gjelder for tiltaket. Ingen universell takhøyde eller teknisk godkjenning er lagt til grunn.", ref="TEK17 og regler for eksisterende bygg")
        if inp.bolig_scope == "unknown":
            add("Boligens avgrensning er ukjent", "Avklar om arealet blir del av samme bolig eller en fysisk separat boenhet. Utleie alene avgjør ikke dette.", ref="SAK10 § 2-2")
    if inp.plan_status == "ikke_tillatt":
        add("Planavvik må avklares", "Avklar med kommunen om dispensasjon eller planendring er nødvendig. Ingen godkjenning er forutsatt.", "fail", "PBL kap. 19")
    elif inp.plan_status == "usikker":
        add("Planstatus er ukjent", "Innhent gjeldende plankart og bestemmelser for adressen. Appen har ikke kontrollert disse automatisk.")
    else:
        add("Planstatus må dokumenteres", "Du oppgir at planen tillater bruken. Legg ved aktuelle bestemmelser og planreferanse for kontroll.")
    structural = inp.baerende_status == "ja" or inp.inngrep_baerende
    if structural:
        add("Bærende inngrep må prosjekteres", "Avklar lastvei, stabilitet og ansvar med konstruksjonsingeniør før utførelse.", ref="TEK17 kap. 10")
    elif inp.baerende_status == "usikker":
        add("Bærende inngrep er uavklart", "Avklar om vegger, dekker eller søyler berøres. Usikker er ikke behandlet som nei.")
    if inp.vern_status == "ja" or inp.verneverdig:
        add("Vernestatus må undersøkes nærmere", "Innhent registrering og eventuelle vedtak eller planbestemmelser. Registrering alene avgjør ikke hvilke begrensninger som gjelder.")
    elif inp.vern_status == "usikker":
        add("Vernestatus er ukjent", "Kontroller kommunens kart, planbestemmelser og eventuelle vernevedtak.")
    add("Tegninger og øvrige vedlegg", "Samle eksisterende og foreslåtte planer og snitt. Avklar fasadeendringer, eierforhold, nabovarsel og nødvendige fagrapporter før innsending.")
    professional = structural or (housing and (inp.fra in ("naring", "kontor", "fritidsbolig") or inp.bolig_scope == "separate"))
    return TiltakResult(status="red" if structural or inp.plan_status == "ikke_tillatt" else "amber",
        statusText="Krever faglig avklaring" if professional else "Forhold må avklares",
        statusDesc="Samle dokumentasjon og forbered saken. Ingen søknad er bekreftet klar til innsending.",
        findings=findings, tiltak=[], lempninger=[],
        soknadstype="Må avklares - bruksendring", ansvarsrett=professional, tiltaksklasse=1,
        totalKostnad=0, input=inp.model_dump())
