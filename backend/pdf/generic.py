"""
Generic PDF søknadspakke — works for all TiltakResult-based tiltak.
"""
from fpdf import FPDF
from datetime import date
from pathlib import Path

_FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")

C_GREEN      = (34, 197, 94)
C_GREEN_DARK = (21, 128, 61)
C_AMBER      = (245, 158, 11)
C_RED        = (239, 68, 68)
C_DARK       = (17, 24, 39)
C_GRAY       = (107, 114, 128)
C_LIGHT      = (243, 244, 246)
C_SLATE      = (100, 116, 139)
C_WHITE      = (255, 255, 255)

STATUS_COLOR  = {"green": C_GREEN, "amber": C_AMBER, "red": C_RED}
FINDING_COLOR = {"ok": C_GREEN,    "warn": C_AMBER,  "fail": C_RED}
FINDING_LABEL = {"ok": "OK",       "warn": "ADVARSEL", "fail": "AVVIK"}

SLUG_TITLE = {
    "kjeller":      "Bruksendring kjeller",
    "vegg":         "Endring i bærekonstruksjon",
    "tilbygg":      "Tilbygg",
    "garasje":      "Garasje / carport",
    "fasade":       "Fasadeendring",
    "tak":          "Skifte tak",
    "anneks":       "Anneks / uthus",
    "levegg":       "Levegg / gjerde",
    "brygge":       "Brygge / sjøbod",
    "bruksendring": "Bruksendring",
    "tilleggsdel":  "Tilleggsdel til hoveddel",
    "boenhet":      "Etablere ny boenhet",
    "geolograpport":"Geolograpport",
    "andre":        "Annet tiltak",
}


class _PDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.add_font("Sans", "",   str(_FONT_DIR / "DejaVuSans.ttf"))
        self.add_font("Sans", "B",  str(_FONT_DIR / "DejaVuSans-Bold.ttf"))
        self.add_font("Sans", "I",  str(_FONT_DIR / "DejaVuSans.ttf"))

    def footer(self):
        self.set_y(-12)
        self.set_font("Sans", "I", 7)
        self.set_text_color(*C_GRAY)
        self.cell(0, 5,
            f"MittBygg.no  —  Automatisk generert dokumentasjon. Ikke juridisk bindende.  "
            f"Side {self.page_no()}", align="C")
        self.set_text_color(*C_DARK)

    def section_title(self, text: str):
        self.ln(3)
        self.set_fill_color(*C_GREEN_DARK)
        self.set_text_color(*C_WHITE)
        self.set_font("Sans", "B", 9)
        self.set_x(15)
        self.cell(180, 7, f"  {text}", fill=True, ln=True)
        self.set_text_color(*C_DARK)
        self.ln(2)

    def kv(self, key: str, value: str, shade: bool = False):
        if shade:
            self.set_fill_color(*C_LIGHT)
        self.set_font("Sans", "", 8.5)
        self.set_text_color(*C_GRAY)
        self.set_x(15)
        self.cell(55, 6.5, key, fill=shade)
        self.set_font("Sans", "B", 8.5)
        self.set_text_color(*C_DARK)
        self.cell(125, 6.5, value, fill=shade, ln=True)


def generate_generic_pdf(
    slug: str,
    result: dict,
    address: str = "",
    gnr: int = 0,
    bnr: int = 0,
    kommune: str = "",
    architect: dict | None = None,
    engineer: dict | None = None,
) -> bytes:
    title = SLUG_TITLE.get(slug, "Tiltak")
    pdf = _PDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=18)

    # ── PAGE 1: COVER ────────────────────────────────────────────────────────────
    pdf.add_page()

    pdf.set_fill_color(*C_GREEN)
    pdf.rect(0, 0, 210, 24, style="F")
    pdf.set_text_color(*C_WHITE)
    pdf.set_font("Sans", "B", 17)
    pdf.set_xy(15, 7)
    pdf.cell(130, 10, "MittBygg")
    pdf.set_font("Sans", "", 8)
    pdf.set_xy(100, 9)
    pdf.cell(95, 5, date.today().strftime("%d.%m.%Y"), align="R")
    pdf.set_text_color(*C_DARK)

    pdf.set_xy(15, 34)
    pdf.set_font("Sans", "B", 24)
    pdf.cell(180, 13, "Søknadspakke", ln=True)
    pdf.set_x(15)
    pdf.set_font("Sans", "", 13)
    pdf.set_text_color(*C_GRAY)
    pdf.cell(180, 8, title, ln=True)
    pdf.set_text_color(*C_DARK)

    status = result.get("status", "amber")
    sc = STATUS_COLOR.get(status, C_AMBER)
    pdf.ln(4)
    pdf.set_x(15)
    pdf.set_fill_color(*sc)
    pdf.set_text_color(*C_WHITE)
    pdf.set_font("Sans", "B", 11)
    pdf.cell(180, 11, f"  {result.get('statusText', '')}", fill=True, ln=True)
    pdf.set_x(15)
    darker = tuple(max(0, c - 40) for c in sc)
    pdf.set_fill_color(*darker)
    pdf.set_font("Sans", "", 9)
    pdf.cell(180, 8, f"  {result.get('statusDesc', '')}", fill=True, ln=True)
    pdf.set_text_color(*C_DARK)

    pdf.section_title("Eiendomsopplysninger")
    rows = [
        ("Adresse",       address or "—"),
        ("Gnr/Bnr",       f"{gnr}/{bnr}" if gnr else "—"),
        ("Kommune",       kommune or "—"),
        ("Søknadstype",   result.get("soknadstype", "—")),
        ("Tiltaksklasse", f"TK{result.get('tiltaksklasse', 1)}"),
        ("Ansvarsrett",   "Kreves" if result.get("ansvarsrett") else "Ikke påkrevd"),
    ]
    for i, (k, v) in enumerate(rows):
        pdf.kv(k, v, shade=(i % 2 == 0))

    # ── PAGE 2: REGELSJEKK ───────────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_y(15)
    pdf.section_title("Regelsjekk  —  TEK17 / SAK10 / PBL")

    for f in result.get("findings", []):
        ftype = f.get("type", "ok")
        fc = FINDING_COLOR.get(ftype, C_GREEN)
        fl = FINDING_LABEL.get(ftype, "OK")

        pdf.set_x(15)
        pdf.set_fill_color(*fc)
        pdf.set_text_color(*C_WHITE)
        pdf.set_font("Sans", "B", 7)
        pdf.cell(18, 5.5, fl, fill=True, align="C")
        pdf.set_text_color(*C_DARK)
        pdf.set_font("Sans", "B", 9)
        pdf.cell(162, 5.5, f"  {f.get('t', '')}", ln=True)

        pdf.set_x(33)
        pdf.set_font("Sans", "", 8)
        pdf.set_text_color(*C_GRAY)
        pdf.multi_cell(162, 4, f.get("d", ""))

        pdf.set_x(33)
        pdf.set_font("Sans", "I", 7.5)
        pdf.set_text_color(*C_SLATE)
        pdf.cell(162, 4, f"Ref: {f.get('ref', '')}", ln=True)
        pdf.set_text_color(*C_DARK)
        pdf.ln(3)

    lempninger = result.get("lempninger", [])
    if lempninger:
        pdf.section_title("Lempninger  —  PBL §31-2")
        for lem in lempninger:
            pdf.set_x(15)
            pdf.set_font("Sans", "B", 9)
            pdf.set_text_color(*C_GREEN_DARK)
            pdf.cell(180, 5, lem.get("regel", ""), ln=True)
            pdf.set_x(15)
            pdf.set_font("Sans", "", 8)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(180, 4, lem.get("tekst", ""))
            pdf.set_text_color(*C_DARK)
            pdf.ln(2)

    # ── PAGE 3: TILTAKSLISTE + NESTE STEG ───────────────────────────────────────
    tiltak_list = result.get("tiltak", [])
    if tiltak_list:
        pdf.add_page()
        pdf.set_y(15)
        pdf.section_title("Tiltaksliste og kostnadsestimat")

        for i, t in enumerate(tiltak_list, 1):
            pdf.set_x(15)
            pdf.set_fill_color(*C_GREEN)
            pdf.set_text_color(*C_WHITE)
            pdf.set_font("Sans", "B", 8)
            pdf.cell(7, 7, str(i), fill=True, align="C")
            pdf.set_text_color(*C_DARK)
            pdf.set_font("Sans", "B", 9)
            cost_str = _fmt_kr(t.get("kostnad", 0))
            pdf.cell(138, 7, f"  {t.get('name', '')}")
            pdf.set_text_color(*C_GREEN_DARK)
            pdf.cell(35, 7, cost_str, align="R", ln=True)
            pdf.set_x(22)
            pdf.set_font("Sans", "", 8)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(173, 4, t.get("desc", ""))
            pdf.set_text_color(*C_DARK)
            pdf.ln(2)

        total = result.get("totalKostnad", 0)
        if total:
            pdf.ln(3)
            pdf.set_x(15)
            pdf.set_fill_color(*C_DARK)
            pdf.set_text_color(*C_WHITE)
            pdf.set_font("Sans", "B", 10)
            pdf.cell(143, 10, "  Estimert totalkostnad (eks. mva)", fill=True)
            pdf.set_fill_color(*C_GREEN)
            pdf.cell(37, 10, _fmt_kr(total), fill=True, align="R", ln=True)
            pdf.set_text_color(*C_DARK)
            pdf.ln(4)
            pdf.set_x(15)
            pdf.set_font("Sans", "I", 7.5)
            pdf.set_text_color(*C_SLATE)
            pdf.multi_cell(180, 4,
                "Kostnadsestimater er veiledende, basert på gjennomsnittspriser for Oslo-regionen. "
                "Innhent anbud fra minimum tre håndverkere for bindende pristilbud.")
            pdf.set_text_color(*C_DARK)

    # ── AI ANALYSE ───────────────────────────────────────────────────────────────
    if architect or engineer:
        pdf.add_page()
        pdf.set_y(15)

        if architect:
            pdf.section_title("Arkitekt-vurdering  (AI-generert)")

            pdf.set_x(15)
            pdf.set_font("Sans", "", 9)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(180, 4.5, architect.get("summary", ""))
            pdf.set_text_color(*C_DARK)
            pdf.ln(3)

            ITEM_COLOR  = {"ok": C_GREEN, "warn": C_AMBER, "missing": C_GRAY}
            ITEM_LABEL  = {"ok": "OK", "warn": "ADVARSEL", "missing": "MANGLER"}
            for item in architect.get("items", []):
                itype = item.get("type", "ok")
                ic = ITEM_COLOR.get(itype, C_GRAY)
                il = ITEM_LABEL.get(itype, "–")
                pdf.set_x(15)
                pdf.set_fill_color(*ic)
                pdf.set_text_color(*C_WHITE)
                pdf.set_font("Sans", "B", 7)
                pdf.cell(18, 5.5, il, fill=True, align="C")
                pdf.set_text_color(*C_DARK)
                pdf.set_font("Sans", "", 9)
                pdf.cell(162, 5.5, f"  {item.get('text', '')}", ln=True)
                pdf.set_text_color(*C_DARK)
                pdf.ln(1)

            anbefalinger = architect.get("anbefalinger", [])
            if anbefalinger:
                pdf.ln(2)
                pdf.set_x(15)
                pdf.set_font("Sans", "B", 8.5)
                pdf.set_text_color(*C_AMBER)
                pdf.cell(180, 5, "Anbefalinger", ln=True)
                pdf.set_text_color(*C_DARK)
                for anbefaling in anbefalinger:
                    pdf.set_x(15)
                    pdf.set_font("Sans", "", 8.5)
                    pdf.set_text_color(*C_GRAY)
                    pdf.multi_cell(180, 4.5, f"→  {anbefaling}")
                    pdf.set_text_color(*C_DARK)

            pdf.ln(4)

        if engineer:
            pdf.section_title(f"Teknisk redegjørelse  (AI-generert)")

            TYPE_COLOR = {
                "last":   (249, 115, 22),
                "energi": C_GREEN,
                "brann":  C_RED,
                "grunn":  C_GRAY,
            }

            # Table header
            pdf.set_x(15)
            pdf.set_fill_color(*C_DARK)
            pdf.set_text_color(*C_WHITE)
            pdf.set_font("Sans", "B", 8)
            pdf.cell(18, 6, "Type",    fill=True, align="C")
            pdf.cell(75, 6, "  Beregning",  fill=True)
            pdf.cell(45, 6, "Verdi",   fill=True, align="C")
            pdf.cell(42, 6, "Referanse", fill=True, ln=True)
            pdf.set_text_color(*C_DARK)

            for i, b in enumerate(engineer.get("beregninger", [])):
                shade = i % 2 == 0
                if shade:
                    pdf.set_fill_color(*C_LIGHT)
                tc = TYPE_COLOR.get(b.get("type", ""), C_GRAY)
                pdf.set_x(15)
                pdf.set_fill_color(*tc)
                pdf.set_text_color(*C_WHITE)
                pdf.set_font("Sans", "B", 7)
                pdf.cell(18, 6, str(b.get("type", "")).upper(), fill=True, align="C")
                pdf.set_text_color(*C_DARK)
                if shade:
                    pdf.set_fill_color(*C_LIGHT)
                pdf.set_font("Sans", "", 8.5)
                pdf.cell(75, 6, f"  {b.get('navn', '')}", fill=shade)
                pdf.set_font("Sans", "B", 8.5)
                pdf.cell(45, 6, b.get("verdi", ""), fill=shade, align="C")
                pdf.set_font("Sans", "I", 7.5)
                pdf.set_text_color(*C_SLATE)
                pdf.cell(42, 6, b.get("referanse", ""), fill=shade, ln=True)
                pdf.set_text_color(*C_DARK)

            pdf.ln(3)
            pdf.set_x(15)
            pdf.set_font("Sans", "", 9)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(180, 4.5, engineer.get("konklusjon", ""))
            pdf.set_text_color(*C_DARK)

            notater = engineer.get("notater", [])
            if notater:
                pdf.ln(2)
                pdf.set_x(15)
                pdf.set_font("Sans", "B", 8.5)
                pdf.set_text_color(*C_GREEN_DARK)
                pdf.cell(180, 5, "Tekniske notater", ln=True)
                pdf.set_text_color(*C_DARK)
                for notat in notater:
                    pdf.set_x(15)
                    pdf.set_font("Sans", "", 8.5)
                    pdf.set_text_color(*C_GRAY)
                    pdf.multi_cell(180, 4.5, f"·  {notat}")
                    pdf.set_text_color(*C_DARK)

            pdf.ln(4)

    pdf.section_title("Neste steg")
    ansvarsrett = result.get("ansvarsrett", False)
    soknadstype = result.get("soknadstype", "søknad")
    steps: list[tuple[str, str, str]] = [
        ("1.", "Nabovarsel",
         "Send nabovarsel (DiBK skjema 5154). Naboer har 14 dagers merknadsfrist."),
        ("2.", "Søknad",
         f"Lever søknad til kommunen ({soknadstype}). Behandlingstid 3-12 uker."),
        ("3.", "Igangsettingstillatelse",
         "Vent på igangsettingstillatelse (IG) fra kommunen før arbeid starter."),
        ("4.", "Utførelse",
         "Gjennomfør tiltakene iht. godkjent søknad og vedlagte tiltaksliste."),
        ("5.", "Ferdigattest",
         "Søk om ferdigattest når alle arbeider er fullført og dokumentert."),
    ]
    if ansvarsrett:
        steps.insert(1, ("1b.", "Ansvarlig foretak",
            "Engasjer ansvarlig prosjekterende (PRO) og utførende (UTF) "
            "med godkjent ansvarsrett (SAK10 kap. 6-9)."))

    for num, step_title, desc in steps:
        pdf.set_x(15)
        pdf.set_font("Sans", "B", 9)
        pdf.set_text_color(*C_GREEN_DARK)
        pdf.cell(8, 5.5, num)
        pdf.set_text_color(*C_DARK)
        pdf.cell(172, 5.5, step_title, ln=True)
        pdf.set_x(23)
        pdf.set_font("Sans", "", 8)
        pdf.set_text_color(*C_GRAY)
        pdf.multi_cell(172, 4, desc)
        pdf.set_text_color(*C_DARK)
        pdf.ln(1.5)

    return bytes(pdf.output())


def _fmt_kr(amount: int) -> str:
    s = f"{amount:,}".replace(",", " ")
    return f"kr {s}"
