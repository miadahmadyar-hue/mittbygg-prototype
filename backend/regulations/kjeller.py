"""
Kjellerbruksendring rule engine.
Python port of web/src/lib/regulations/kjeller.ts,
which mirrors norsk_arkitekt_ai/regulations/kjeller_wizard.py.
"""
from typing import Optional
from models import KjellerInput, KjellerResult, Finding, Tiltak, Lempning

KJELLER_BRUK = {
    "soverom": {
        "label": "Soverom",
        "takhoyde_min": 2400, "takhoyde_lempet": 2200,
        "krav_romning": True, "krav_dagslys": 0.10, "krav_radon": True,
        "ansvarsrett": False,
        "soknad": "PBL § 20-1 d (bruksendring)",
    },
    "hybel": {
        "label": "Hybel / utleie",
        "takhoyde_min": 2400, "takhoyde_lempet": 2400,
        "krav_romning": True, "krav_dagslys": 0.10, "krav_radon": True,
        "ansvarsrett": True,
        "soknad": "PBL § 20-3 (med ansvarsrett)",
    },
    "stue": {
        "label": "Stue / TV-rom",
        "takhoyde_min": 2400, "takhoyde_lempet": 2200,
        "krav_romning": False, "krav_dagslys": 0.10, "krav_radon": True,
        "ansvarsrett": False,
        "soknad": "PBL § 20-4 c (uten ansvarsrett)",
    },
    "kontor": {
        "label": "Hjemmekontor",
        "takhoyde_min": 2400, "takhoyde_lempet": 2200,
        "krav_romning": False, "krav_dagslys": 0.10, "krav_radon": True,
        "ansvarsrett": False,
        "soknad": "PBL § 20-4 c (uten ansvarsrett)",
    },
    "bad": {
        "label": "Bad / WC",
        "takhoyde_min": 2200, "takhoyde_lempet": 2200,
        "krav_romning": False, "krav_dagslys": 0, "krav_radon": False,
        "ansvarsrett": False,
        "soknad": "PBL § 20-4 c (uten ansvarsrett)",
    },
}

ROOMS_BY_PROP_ID = {
    "1": [
        {"id": "fellesrom", "name": "Fellesrom", "area": 24, "height": 2280, "vinduer": "Lite vindu (0,8×0,6 m)"},
        {"id": "bod",       "name": "Bod",       "area": 18, "height": 2280, "vinduer": "Ingen"},
        {"id": "vaskerom",  "name": "Vaskerom",  "area": 12, "height": 2280, "vinduer": "Lite vindu (0,6×0,4 m)"},
    ],
    "2": [
        {"id": "fellesrom", "name": "Fellesrom", "area": 28, "height": 2280, "vinduer": "Lite vindu (0,8×0,6 m)"},
        {"id": "teknisk",   "name": "Teknisk",   "area": 9,  "height": 2280, "vinduer": "Ingen"},
        {"id": "bod",       "name": "Bod",       "area": 14, "height": 2280, "vinduer": "Ingen"},
    ],
    "4": [
        {"id": "stue",  "name": "Stue (delvis innredet)", "area": 22, "height": 2150, "vinduer": "Lite vindu (0,6×0,5 m)"},
        {"id": "bod",   "name": "Bod",                    "area": 16, "height": 2150, "vinduer": "Ingen"},
    ],
    "5": [
        {"id": "fellesrom", "name": "Fellesrom", "area": 32, "height": 2310, "vinduer": "Lite vindu (0,9×0,6 m)"},
        {"id": "vaskerom",  "name": "Vaskerom",  "area": 11, "height": 2310, "vinduer": "Ingen"},
        {"id": "bod",       "name": "Bod",       "area": 19, "height": 2310, "vinduer": "Ingen"},
    ],
}

DEFAULT_ROOMS = [
    {"id": "fellesrom", "name": "Fellesrom", "area": 26, "height": 2280, "vinduer": "Lite vindu (0,8×0,6 m)"},
    {"id": "bod",       "name": "Bod",       "area": 16, "height": 2280, "vinduer": "Ingen"},
]


def get_kjeller_rooms(
    prop_id: str,
    bra: int | None = None,
    etasjer: int | None = None,
    bygge_aar: int = 1975,
) -> list:
    if prop_id in ROOMS_BY_PROP_ID:
        return ROOMS_BY_PROP_ID[prop_id]
    if bra or etasjer:
        from api.matrikkel_enrichment import derive_rooms
        return derive_rooms(bygge_aar, bra, etasjer)
    return DEFAULT_ROOMS


def evaluate_kjeller(inp: KjellerInput) -> KjellerResult:
    """Preliminary evidence review. Never substitute demo dimensions for unknowns.

    References reviewed 2026-10-01:
    https://www.dibk.no/bygge-eller-endre/bruksendring-i-eldre-boliger/
    https://www.dibk.no/regelverk/sak/2/2/2-2
    """
    findings: list[Finding] = []
    def add(title, description, ref="Dokumentasjonsgrunnlag", kind="warn"):
        findings.append(Finding(type=kind, t=title, d=description, ref=ref))

    separate = inp.ny_bruk == "hybel" and inp.rental_use == "separate"
    if inp.ny_bruk == "hybel":
        if separate:
            add("Planlagt separat boenhet", "Oppdeling, inngang, boligfunksjoner, brann og lyd må vurderes samlet av ansvarlig foretak.", "SAK10 § 2-2")
        elif inp.rental_use == "unknown":
            add("Utleiedelens avgrensning er ukjent", "Avklar inngang, intern forbindelse og boligfunksjoner. Utleie alene avgjør ikke om det opprettes en ny boenhet.", "SAK10 § 2-2")
        else:
            add("Utleie i eksisterende bolig", "Du oppgir at rommet er del av samme bolig. Godkjent bruk og den faktiske oppdelingen må fortsatt dokumenteres.", "SAK10 § 2-2", "ok")
    if not inp.godkjent_bruk_bekreftet or inp.room in ("usikker", "annet"):
        add("Godkjent bruk må avklares", "Finn siste godkjente plantegning og vedtak. Beskriv annen bruk dersom ingen av valgene passer.", "PBL § 20-1 d")
    if not inp.rom_areal:
        add("Gulvareal er ikke målt", "Oppgi faktisk areal. Ingen eksempelverdier er brukt.")
    if not inp.takhoyde:
        add("Takhøyde er ikke målt", "Mål romhøyden og dokumenter målepunkt og eventuell planlagt gulvoppbygging.")
    else:
        add("Takhøyde må vurderes for riktig regelsett", f"Oppgitt høyde er {inp.takhoyde / 1000:.2f} m. Avklar søknadsdato for boligen, rommets plassering innenfor boligen og forbindelse til oppholdsrom før aktuelle høydekrav vurderes.", "TEK17 § 1-2 og § 12-7")
    if inp.byggeAar is None:
        add("Byggeår er ukjent", "Innhent byggeår og dato for søknad om oppføring fra byggesaksarkivet.")
    if inp.ny_bruk != "bad":
        if not inp.vindu_bredde or not inp.vindu_hoyde or inp.vindu_brystning is None:
            add("Vindusmål mangler", "Dokumenter fri åpning, høyde fra gulv og muligheten til å komme ut. Alternativ rømningsløsning må vurderes dersom vindu mangler.", "TEK17 § 11-13")
        else:
            add("Vindusmål er registrert", f"Fri åpning er {inp.vindu_bredde:.2f} × {inp.vindu_hoyde:.2f} m, høyde fra gulv {inp.vindu_brystning:.2f} m. Målene alene bekrefter ikke trygg rømning; åpningsfunksjon, lysgrav og vei videre ut må kontrolleres.", "TEK17 § 11-13")
        add("Dagslys må dokumenteres", "Fri vindusåpning er ikke det samme som glassareal. Dokumenter vindu mot fri luft, skjerming og hvilket regelsett som gjelder. Ingen dagslysprosent er beregnet.", "TEK17 § 13-7 og § 1-2")
        if inp.radon is None:
            add("Radon ikke målt", "Innhent en målerapport som dokumenterer radonnivået for aktuell bruk. Tiltak velges ut fra forholdene, ikke automatisk.", "TEK17 § 13-5")
        elif inp.radon >= 200:
            add("Radonnivå må følges opp", f"Oppgitt nivå er {inp.radon:g} Bq/m³. Avklar egnede tiltak og dokumenter resultatet med ny måling.", "TEK17 § 13-5", "fail")
        else:
            add("Radonmåling er oppgitt", f"Oppgitt nivå er {inp.radon:g} Bq/m³. Målemetode, periode og rapport må kontrolleres; vurder behov for tiltak.", "TEK17 § 13-5")
    add("Fukt og drenering", "Kontroll er oppgitt utført. Legg ved dokumentasjonen." if inp.drenering_status == "ja" else "Tilstand og fuktsikring må undersøkes. At kontroll ikke er utført betyr ikke at dreneringen er defekt.", "TEK17 kapittel 13")
    add("Ventilasjon", "Dokumentasjon er oppgitt tilgjengelig. Legg ved rapport eller beskrivelse for ny bruk." if inp.ventilasjon_status == "ja" else "Dokumenter egnet ventilasjon for planlagt bruk. Ingen bestemt anleggstype er automatisk valgt.", "TEK17 § 13-1")
    add("Avklar omfang og søknadsgrunnlag", "Kontroller plassering innenfor boligen, eierforhold, brann, konstruksjon, eventuelle fasadeendringer og nødvendige tegninger. Kjellerbod utenfor leiligheten må vurderes særskilt.", "DiBK: Bruksendring i eldre boliger")
    count = sum(f.type != "ok" for f in findings)
    return KjellerResult(
        status="red" if any(f.type == "fail" for f in findings) else "amber",
        statusText="Forhold må avklares", statusDesc=f"{count} forhold må dokumenteres eller kontrolleres. Du kan forberede saksunderlaget nå.",
        findings=findings, tiltak=[], lempninger=[], eldre=inp.byggeAar is not None and inp.byggeAar < 2011,
        soknadstype="Må avklares - bruksendring / eventuell oppdeling", ansvarsrett=separate,
        tiltaksklasse=2 if separate else 1, totalKostnad=0, input=inp,
    )
