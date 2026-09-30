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
    krav = KJELLER_BRUK[inp.ny_bruk]
    has_measured_room = bool(inp.rom_areal and inp.takhoyde)
    if has_measured_room:
        room = {
            "id": inp.room,
            "name": inp.room.replace("_", " ").title(),
            "area": inp.rom_areal,
            "height": inp.takhoyde,
            "vinduer": "Målt" if inp.vindu_bredde and inp.vindu_hoyde else "Ukjent",
        }
    else:
        rooms = get_kjeller_rooms(inp.propId, bra=inp.bra, etasjer=inp.etasjer, bygge_aar=inp.byggeAar or 2010)
        room = next((r for r in rooms if r["id"] == inp.room), rooms[0])
    eldre = inp.byggeAar is not None and inp.byggeAar < 2010

    findings: list[Finding] = []
    tiltak: list[Tiltak] = []
    lempninger: list[Lempning] = []

    if inp.byggeAar is None:
        findings.append(Finding(type="warn", t="Byggeår er ukjent", d="Bekreft byggeåret før eventuelle unntak for eldre bygg vurderes.", ref="Dokumentasjonsgrunnlag"))
    if not has_measured_room:
        findings.append(Finding(
            type="warn",
            t="Rommet er ikke målt",
            d="Areal, takhøyde og vinduer må måles eller dokumenteres fra godkjente tegninger før resultatet kan brukes i en søknad.",
            ref="Dokumentasjonskrav",
        ))
    if not inp.godkjent_bruk_bekreftet:
        findings.append(Finding(
            type="warn",
            t="Godkjent bruk er ikke bekreftet",
            d="Siste godkjente plantegning må vise hva rommet lovlig brukes som i dag.",
            ref="PBL § 20-1 d",
        ))

    # 1. TAKHØYDE — TEK17 §12-7 + lempning §31-2
    min_h = krav["takhoyde_lempet"] if eldre else krav["takhoyde_min"]
    if room["height"] < min_h:
        findings.append(Finding(
            type="fail",
            t="Takhøyde for lav",
            d=f"{room['height']} mm — krav {min_h} mm. Gulvet må graves ut, eller velg annen bruk.",
            ref="TEK17 § 12-7",
        ))
        tiltak.append(Tiltak(
            name="Senke gulv (utgraving)",
            desc="Krever RIB-vurdering av fundament og dreneringsomlegging.",
            kostnad=150_000,
        ))
    else:
        if eldre and room["height"] < krav["takhoyde_min"]:
            findings.append(Finding(
                type="warn",
                t="Takhøyden krever konkret vurdering",
                d=f"Oppgitt høyde er {room['height']} mm. For eksisterende bolig kan kommunen vurdere unntak, men løsningen er ikke automatisk godkjent.",
                ref="TEK17 § 12-7 og PBL § 31-4",
            ))
            lempninger.append(Lempning(
                regel="Mulig unntak for takhøyde",
                tekst=f"For bygg fra {inp.byggeAar} kan kommunen gjøre en konkret vurdering av eksisterende forhold. Dette må begrunnes og dokumenteres i søknaden.",
            ))
        else:
            findings.append(Finding(
                type="ok",
                t="Takhøyde tilfredsstiller utgangspunktet",
                d=f"Oppgitt takhøyde er {room['height']} mm.",
                ref="TEK17 § 12-7",
            ))

    # 2. RØMNINGSVINDU — TEK17 §11-13
    if krav["krav_romning"]:
        has_window_measurements = all(v is not None for v in (
            inp.vindu_bredde, inp.vindu_hoyde, inp.vindu_brystning,
        ))
        if not has_window_measurements:
            findings.append(Finding(
                type="warn", t="Rømningsvindu må måles",
                d="Oppgi fri bredde, fri høyde og høyde fra gulv. Uten disse målene kan rømningskravet ikke avgjøres.",
                ref="TEK17 § 11-13",
            ))
        else:
            escape_ok = (
                inp.vindu_bredde >= 0.5 and inp.vindu_hoyde >= 0.6
                and inp.vindu_bredde + inp.vindu_hoyde >= 1.5
                and inp.vindu_brystning <= 1.2
            )
            findings.append(Finding(
                type="ok" if escape_ok else "fail",
                t="Rømningsvindu oppfyller målene" if escape_ok else "Rømningsvindu oppfyller ikke målene",
                d=f"Oppgitt fri åpning {inp.vindu_bredde:.2f} × {inp.vindu_hoyde:.2f} m og brystning {inp.vindu_brystning:.2f} m.",
                ref="TEK17 § 11-13",
            ))

    # 3. DAGSLYS — TEK17 §13-7 + lempning §31-2
    if krav["krav_dagslys"] > 0:
        glass = (
            inp.vindu_bredde * inp.vindu_hoyde
            if inp.vindu_bredde and inp.vindu_hoyde else 0
        )
        pct = (glass / room["area"]) * 100
        target_pct = krav["krav_dagslys"] * 100
        lempet_pct = 7
        if pct < lempet_pct:
            findings.append(Finding(
                type="warn",
                t="Lite dagslys",
                d=f"Kun ~{pct:.1f}% glassflate. Mål: {target_pct}% (kan lempes til {lempet_pct}% for eldre bolig).",
                ref="TEK17 § 13-7",
            ))
        elif eldre and pct < target_pct:
            lempninger.append(Lempning(
                regel="Dagslys",
                tekst=f"{pct:.1f}% godtas iht. PBL § 31-2 (lempet ned mot 7 % for bestående bygg "
                      "når funksjonelt dagslys er prosjektert iht. NS-EN 17037).",
            ))
            findings.append(Finding(
                type="warn",
                t="Dagslys krever nærmere dokumentasjon",
                d=f"Beregnet glassflate er omtrent {pct:.1f} %. Dagslys må dokumenteres for den konkrete løsningen, og eventuelt unntak avgjøres av kommunen.",
                ref="TEK17 § 13-7 og PBL § 31-4",
            ))
        else:
            findings.append(Finding(
                type="ok",
                t="Dagslys OK",
                d=f"{pct:.1f}% glassflate.",
                ref="TEK17 § 13-7",
            ))

    # 4. RADON — TEK17 §13-5
    if krav["krav_radon"]:
        if inp.radon is None:
            findings.append(Finding(
                type="warn",
                t="Radon ikke målt",
                d="Bestill langtidsmåling (≥ 60 dager). Resultatet avgjør om aktivt radonanlegg trengs.",
                ref="TEK17 § 13-5",
            ))
            tiltak.append(Tiltak(
                name="Radonsperre under nytt gulv",
                desc="Diffusjonstett membran + sugerør under sperren. Aktivt anlegg installeres kun hvis måling viser > 100 Bq/m³.",
                kostnad=18_000,
            ))
        elif inp.radon > 200:
            findings.append(Finding(
                type="fail",
                t=f"Radon {inp.radon} Bq/m³ over grense",
                d="Aktivt radonanlegg er pålagt før bruksendring kan godkjennes.",
                ref="TEK17 § 13-5",
            ))
            tiltak.append(Tiltak(
                name="Aktivt radonanlegg",
                desc="Vifte + radonsperre + sugerør under gulv.",
                kostnad=28_000,
            ))
        elif inp.radon > 100:
            findings.append(Finding(
                type="warn",
                t=f"Radon {inp.radon} Bq/m³ over tiltaksgrense",
                d="Tiltak anbefales (passivt sugesystem klargjøres).",
                ref="TEK17 § 13-5",
            ))
            tiltak.append(Tiltak(
                name="Passivt radonanlegg",
                desc="Sugerør under sperren, klargjort for aktivering hvis måling stiger.",
                kostnad=15_000,
            ))
        else:
            findings.append(Finding(
                type="ok",
                t=f"Radon OK ({inp.radon} Bq/m³)",
                d="Under tiltaksgrense.",
                ref="TEK17 § 13-5",
            ))

    # 5. FUKT / DRENERING
    drenering_status = inp.drenering_status if inp.drenering_status != "usikker" else ("ja" if inp.drenering else "usikker")
    if drenering_status == "nei":
        findings.append(Finding(
            type="fail",
            t="Mangler fungerende drenering",
            d="PBL § 31-3: sikkerhetsnivået må ikke bli verre. Drenering er forutsetning før kjelleren bruksendres.",
            ref="TEK17 § 13-13/14 + PBL § 31-3",
        ))
        tiltak.append(Tiltak(
            name="Renovere drenering rundt grunnmur",
            desc="Utgraving, ny knastefolie, drensrør (DN 100), returfylling.",
            kostnad=80_000,
        ))
    elif drenering_status == "ja":
        findings.append(Finding(
            type="ok",
            t="Drenering på plass",
            d="Forutsetning for å bruksendre er oppfylt.",
            ref="TEK17 § 13-13",
        ))
    else:
        findings.append(Finding(
            type="warn",
            t="Drenering og fuktsikring må undersøkes",
            d="Alder, tilstand og tegn til fukt må avklares før rommet prosjekteres for varig opphold.",
            ref="TEK17 § 13-13/14",
        ))

    if inp.ny_bruk != "bad":
        tiltak.append(Tiltak(
            name="Innvendig isolering av kjellervegg",
            desc="150 mm mineralull mellom stender, dampsperre, gips. Oppnår U ≤ 0,18 W/m²K.",
            kostnad=60_000,
        ))

    # 6. VENTILASJON
    ventilation_confirmed = inp.ventilasjon_status == "ja" or inp.balansert_vent
    if krav["krav_radon"] and not ventilation_confirmed:
        findings.append(Finding(
            type="warn",
            t="Ventilasjon må dokumenteres",
            d="Nødvendig luftmengde og løsning må prosjekteres for den nye bruken. Balansert ventilasjon er én mulig løsning, ikke et automatisk krav.",
            ref="TEK17 § 13-1",
        ))

    # 7. HYBEL
    if inp.ny_bruk == "hybel":
        findings.append(Finding(
            type="warn",
            t="Hybel utløser strenge krav",
            d="Egen branncelle (EI 60), egen utgang, eget brannvarslingsanlegg, R'w ≥ 55 dB lyd mellom etasjer.",
            ref="TEK17 § 11 + § 13-9",
        ))
        tiltak.extend([
            Tiltak(name="Branncellevegg EI 60 mot hovedboenhet",
                   desc="Skille i etasjeskille og evt. felles vegg.", kostnad=45_000),
            Tiltak(name="Egen inngang fra ute",
                   desc="Trapp eller dør utvides/etableres.", kostnad=70_000),
            Tiltak(name="Eget brannvarslingsanlegg",
                   desc="Separat sentral, røyk- og varmevarsler.", kostnad=12_000),
            Tiltak(name="Lydisolasjon mellom etasjer",
                   desc="Etasjeskille bygges om til R'w ≥ 55 dB.", kostnad=55_000),
        ])

    # ENERGI-LEMPNING
    if eldre:
        lempninger.append(Lempning(
            regel="Energi (TEK17 § 14)",
            tekst="Krav til U-verdi gjelder kun nye/endrede bygningsdeler — ikke hele bygget. "
                  "Eksisterende konstruksjoner som ikke endres er ikke belastet.",
        ))

    fails = sum(1 for f in findings if f.type == "fail")
    warns = sum(1 for f in findings if f.type == "warn")
    total_kostnad = sum(t.kostnad for t in tiltak)

    if fails == 0 and warns == 0:
        status, status_text, status_desc = (
            "green", "Klar til søknad",
            "Alle TEK17-krav er oppfylt. Du kan generere søknadspakke.",
        )
        soknadstype = krav["soknad"]
    elif fails == 0:
        status, status_text, status_desc = (
            "amber", "Forhold må avklares",
            f"{warns} forhold krever dokumentasjon eller faglig vurdering før søknadsgrunnlaget er klart.",
        )
        soknadstype = f"Må avklares - {krav['soknad']}"
    else:
        status, status_text, status_desc = (
            "red", "Kritiske avvik",
            f"{fails} krav må rettes før søknad kan sendes.",
        )
        soknadstype = f"Må avklares - {krav['soknad']}"

    return KjellerResult(
        status=status,
        statusText=status_text,
        statusDesc=status_desc,
        findings=findings,
        tiltak=tiltak,
        lempninger=lempninger,
        eldre=eldre,
        soknadstype=soknadstype,
        ansvarsrett=krav["ansvarsrett"],
        tiltaksklasse=2 if inp.ny_bruk == "hybel" else 1,
        totalKostnad=total_kostnad,
        input=inp,
    )
