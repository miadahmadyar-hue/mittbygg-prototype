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


def get_kjeller_rooms(prop_id: str) -> list:
    return ROOMS_BY_PROP_ID.get(prop_id, DEFAULT_ROOMS)


def evaluate_kjeller(inp: KjellerInput) -> KjellerResult:
    krav = KJELLER_BRUK[inp.ny_bruk]
    rooms = get_kjeller_rooms(inp.propId)
    room = next((r for r in rooms if r["id"] == inp.room), rooms[0])
    eldre = inp.byggeAar < 2010

    findings: list[Finding] = []
    tiltak: list[Tiltak] = []
    lempninger: list[Lempning] = []

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
        findings.append(Finding(
            type="ok",
            t="Takhøyde OK",
            d=f"{room['height']} mm tilfredsstiller {'lempet' if eldre else 'vanlig'} krav ({min_h} mm).",
            ref="TEK17 § 12-7",
        ))
        if eldre and room["height"] < krav["takhoyde_min"]:
            lempninger.append(Lempning(
                regel="Takhøyde",
                tekst=f"{room['height']} mm aksepteres iht. PBL § 31-2 og DiBK HO-3/2016 "
                      f"(lempet krav 2200 mm for bygg fra {inp.byggeAar}).",
            ))

    # 2. RØMNINGSVINDU — TEK17 §11-13
    if krav["krav_romning"]:
        if "Lite" in room["vinduer"]:
            findings.append(Finding(
                type="fail",
                t="Mangler godkjent rømningsvindu",
                d="Eksisterende vindu er for lite. Krav: bredde ≥ 0,5 m, høyde ≥ 0,6 m, sum ≥ 1,5 m, sill ≤ 1,2 m fra gulv.",
                ref="TEK17 § 11-13 (alltid gjeldende)",
            ))
            tiltak.append(Tiltak(
                name="Bygge vindusbrønn + større vindu",
                desc="Prefabrikkert betongbrønn (ACO Self el. tilsv.) med stige og avløp i bunn. Nytt vindu 1,0 × 1,0 m.",
                kostnad=35_000,
            ))
        elif room["vinduer"] == "Ingen":
            findings.append(Finding(
                type="fail",
                t="Ingen vinduer i rommet",
                d="Soverom uten vindu er ikke godkjent. Må etablere rømningsvindu.",
                ref="TEK17 § 11-13",
            ))
            tiltak.append(Tiltak(
                name="Etablere vindusbrønn med rømningsvindu",
                desc="Krever utgraving og hulltaking i kjellervegg.",
                kostnad=65_000,
            ))
        else:
            findings.append(Finding(
                type="ok",
                t="Rømningsvindu OK",
                d="Eksisterende vindu tilfredsstiller TEK17 § 11-13.",
                ref="TEK17 § 11-13",
            ))

    # 3. DAGSLYS — TEK17 §13-7 + lempning §31-2
    if krav["krav_dagslys"] > 0:
        glass = 0.005 * room["area"] * 100 if "Lite" in room["vinduer"] else 1.0
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
                type="ok",
                t="Dagslys lempet (godkjent)",
                d=f"{pct:.1f}% godtas iht. PBL § 31-2.",
                ref="TEK17 § 13-7 + PBL § 31-2",
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
    if not inp.drenering:
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
    else:
        findings.append(Finding(
            type="ok",
            t="Drenering på plass",
            d="Forutsetning for å bruksendre er oppfylt.",
            ref="TEK17 § 13-13",
        ))

    if inp.ny_bruk != "bad":
        tiltak.append(Tiltak(
            name="Innvendig isolering av kjellervegg",
            desc="150 mm mineralull mellom stender, dampsperre, gips. Oppnår U ≤ 0,18 W/m²K.",
            kostnad=60_000,
        ))

    # 6. VENTILASJON
    if krav["krav_radon"] and not inp.balansert_vent:
        findings.append(Finding(
            type="warn",
            t="Anbefales: balansert ventilasjon",
            d="Kjeller-soverom bør ha balansert ventilasjon m/varmegjenvinning. Spesielt viktig for radonkontroll og fuktbalanse.",
            ref="TEK17 § 13-1",
        ))
        tiltak.append(Tiltak(
            name="Balansert ventilasjon m/varmegjenvinning",
            desc="Sentralt aggregat + kanaler. Anbefales for hele boligen samtidig.",
            kostnad=100_000,
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
    elif fails == 0:
        status, status_text, status_desc = (
            "amber", "Klar — med tiltak",
            f"{warns} forhold krever oppfølging, men kan dokumenteres i søknaden.",
        )
    else:
        status, status_text, status_desc = (
            "red", "Kritiske avvik",
            f"{fails} krav må rettes før søknad kan sendes.",
        )

    return KjellerResult(
        status=status,
        statusText=status_text,
        statusDesc=status_desc,
        findings=findings,
        tiltak=tiltak,
        lempninger=lempninger,
        eldre=eldre,
        soknadstype=krav["soknad"],
        ansvarsrett=krav["ansvarsrett"],
        tiltaksklasse=2 if inp.ny_bruk == "hybel" else 1,
        totalKostnad=total_kostnad,
        input=inp,
    )
