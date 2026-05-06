"""
PDF søknadspakke generator — kjellerbruksendring.
Uses fpdf2 with built-in Helvetica (WIN-1252 covers æøå).
"""
from fpdf import FPDF
from datetime import date
from pathlib import Path
from models import KjellerResult

_FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")

# ── Palette ───────────────────────────────────────────────────────────────────
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
NY_BRUK_LABEL = {
    "soverom": "Soverom",
    "hybel":   "Hybel / utleie",
    "stue":    "Stue / TV-rom",
    "kontor":  "Hjemmekontor",
    "bad":     "Bad / WC",
}


class _PDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        regular = str(_FONT_DIR / "DejaVuSans.ttf")
        bold    = str(_FONT_DIR / "DejaVuSans-Bold.ttf")
        self.add_font("Sans", "",   regular)
        self.add_font("Sans", "B",  bold)
        self.add_font("Sans", "I",  regular)   # no oblique in core package
        self.add_font("Sans", "BI", bold)

    def footer(self):
        self.set_y(-12)
        self.set_font("Sans", "I", 7)
        self.set_text_color(*C_GRAY)
        self.cell(
            0, 5,
            f"MittBygg.no  —  Automatisk generert dokumentasjon. Ikke juridisk bindende.  "
            f"Side {self.page_no()}",
            align="C",
        )
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


def generate_kjeller_pdf(
    result: KjellerResult,
    address: str = "",
    gnr: int = 0,
    bnr: int = 0,
    kommune: str = "",
) -> bytes:
    pdf = _PDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=18)

    # ── PAGE 1: COVER + EIENDOM ───────────────────────────────────────────────
    pdf.add_page()

    # Top green bar
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

    # Title block
    pdf.set_xy(15, 34)
    pdf.set_font("Sans", "B", 24)
    pdf.cell(180, 13, "Søknadspakke", ln=True)
    pdf.set_x(15)
    pdf.set_font("Sans", "", 13)
    pdf.set_text_color(*C_GRAY)
    pdf.cell(180, 8, "Kjellerbruksendring", ln=True)
    pdf.set_text_color(*C_DARK)

    # Status banner
    sc = STATUS_COLOR[result.status]
    pdf.ln(4)
    pdf.set_x(15)
    pdf.set_fill_color(*sc)
    pdf.set_text_color(*C_WHITE)
    pdf.set_font("Sans", "B", 11)
    pdf.cell(180, 11, f"  {result.statusText}", fill=True, ln=True)
    pdf.set_x(15)
    darker = tuple(max(0, c - 40) for c in sc)
    pdf.set_fill_color(*darker)
    pdf.set_font("Sans", "", 9)
    pdf.cell(180, 8, f"  {result.statusDesc}", fill=True, ln=True)
    pdf.set_text_color(*C_DARK)

    # Property table
    pdf.section_title("Eiendomsopplysninger")
    radon_str = (f"{int(result.input.radon)} Bq/m³"
                 if result.input.radon is not None else "Ikke utført")
    rows = [
        ("Adresse",               address or "—"),
        ("Gnr/Bnr",               f"{gnr}/{bnr}" if gnr else "—"),
        ("Kommune",               kommune or "—"),
        ("Byggeår",               str(result.input.byggeAar)),
        ("Eldre bygg",            "Ja — lempninger gjelder" if result.eldre else "Nei"),
        ("Ny bruk",               NY_BRUK_LABEL.get(result.input.ny_bruk, result.input.ny_bruk)),
        ("Søknadstype",           result.soknadstype),
        ("Tiltaksklasse",         f"TK{result.tiltaksklasse}"),
        ("Ansvarsrett",           "Kreves" if result.ansvarsrett else "Ikke påkrevd"),
        ("Radonmåling",           radon_str),
        ("Drenering",             "Ja" if result.input.drenering else "Nei"),
        ("Balansert ventilasjon", "Ja" if result.input.balansert_vent else "Nei"),
    ]
    for i, (k, v) in enumerate(rows):
        pdf.kv(k, v, shade=(i % 2 == 0))

    # ── PAGE 2: REGELSJEKK ───────────────────────────────────────────────────
    pdf.add_page()
    pdf.set_y(15)
    pdf.section_title("Regelsjekk  —  TEK17 / SAK10 / PBL")

    for f in result.findings:
        fc = FINDING_COLOR[f.type]
        fl = FINDING_LABEL[f.type]

        # Badge + title on same line
        pdf.set_x(15)
        pdf.set_fill_color(*fc)
        pdf.set_text_color(*C_WHITE)
        pdf.set_font("Sans", "B", 7)
        pdf.cell(18, 5.5, fl, fill=True, align="C")
        pdf.set_text_color(*C_DARK)
        pdf.set_font("Sans", "B", 9)
        pdf.cell(162, 5.5, f"  {f.t}", ln=True)

        # Description
        pdf.set_x(33)
        pdf.set_font("Sans", "", 8)
        pdf.set_text_color(*C_GRAY)
        pdf.multi_cell(162, 4, f.d)

        # Paragraph reference
        pdf.set_x(33)
        pdf.set_font("Sans", "I", 7.5)
        pdf.set_text_color(*C_SLATE)
        pdf.cell(162, 4, f"Ref: {f.ref}", ln=True)

        pdf.set_text_color(*C_DARK)
        pdf.ln(3)

    # Lempninger
    if result.lempninger:
        pdf.section_title("Lempninger  —  PBL §31-2")
        for lem in result.lempninger:
            pdf.set_x(15)
            pdf.set_font("Sans", "B", 9)
            pdf.set_text_color(*C_GREEN_DARK)
            pdf.cell(180, 5, lem.regel, ln=True)
            pdf.set_x(15)
            pdf.set_font("Sans", "", 8)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(180, 4, lem.tekst)
            pdf.set_text_color(*C_DARK)
            pdf.ln(2)

    # ── PAGE 3: TILTAKSLISTE + NESTE STEG ────────────────────────────────────
    if result.tiltak:
        pdf.add_page()
        pdf.set_y(15)
        pdf.section_title("Tiltaksliste og kostnadsestimat")

        for i, t in enumerate(result.tiltak, start=1):
            # Number bullet
            pdf.set_x(15)
            pdf.set_fill_color(*C_GREEN)
            pdf.set_text_color(*C_WHITE)
            pdf.set_font("Sans", "B", 8)
            pdf.cell(7, 7, str(i), fill=True, align="C")

            # Name + cost
            pdf.set_text_color(*C_DARK)
            pdf.set_font("Sans", "B", 9)
            cost_str = _fmt_kr(t.kostnad)
            pdf.cell(138, 7, f"  {t.name}")
            pdf.set_text_color(*C_GREEN_DARK)
            pdf.cell(35, 7, cost_str, align="R", ln=True)

            # Description
            pdf.set_x(22)
            pdf.set_font("Sans", "", 8)
            pdf.set_text_color(*C_GRAY)
            pdf.multi_cell(173, 4, t.desc)
            pdf.set_text_color(*C_DARK)
            pdf.ln(2)

        # Total bar
        pdf.ln(3)
        pdf.set_x(15)
        pdf.set_fill_color(*C_DARK)
        pdf.set_text_color(*C_WHITE)
        pdf.set_font("Sans", "B", 10)
        pdf.cell(143, 10, "  Estimert totalkostnad (eks. mva)", fill=True)
        pdf.set_fill_color(*C_GREEN)
        pdf.cell(37, 10, _fmt_kr(result.totalKostnad), fill=True, align="R", ln=True)
        pdf.set_text_color(*C_DARK)

        pdf.ln(4)
        pdf.set_x(15)
        pdf.set_font("Sans", "I", 7.5)
        pdf.set_text_color(*C_SLATE)
        pdf.multi_cell(
            180, 4,
            "Kostnadsestimater er veiledende, basert på gjennomsnittspriser for Oslo-regionen. "
            "Innhent anbud fra minimum tre håndverkere for bindende pristilbud.",
        )
        pdf.set_text_color(*C_DARK)

    # Neste steg
    pdf.section_title("Neste steg")

    steps: list[tuple[str, str, str]] = [
        ("1.", "Nabovarsel",
         "Send nabovarsel (DiBK skjema 5154). Naboer har 14 dagers merknadsfrist."),
        ("2.", "Søknad",
         f"Lever søknad til kommunen ({result.soknadstype}). Behandlingstid 3-12 uker."),
        ("3.", "Igangsettingstillatelse",
         "Vent på igangsettingstillatelse (IG) fra kommunen før arbeid starter."),
        ("4.", "Utførelse",
         "Gjennomfør tiltakene iht. godkjent søknad og vedlagte tiltaksliste."),
        ("5.", "Ferdigattest",
         "Søk om ferdigattest når alle arbeider er fullført og dokumentert."),
    ]
    if result.ansvarsrett:
        steps.insert(
            1,
            ("1b.", "Ansvarlig foretak",
             "Engasjer ansvarlig prosjekterende (PRO) og utførende (UTF) "
             "med godkjent ansvarsrett (SAK10 kap. 6-9)."),
        )

    for num, title, desc in steps:
        pdf.set_x(15)
        pdf.set_font("Sans", "B", 9)
        pdf.set_text_color(*C_GREEN_DARK)
        pdf.cell(8, 5.5, num)
        pdf.set_text_color(*C_DARK)
        pdf.cell(172, 5.5, title, ln=True)
        pdf.set_x(23)
        pdf.set_font("Sans", "", 8)
        pdf.set_text_color(*C_GRAY)
        pdf.multi_cell(172, 4, desc)
        pdf.set_text_color(*C_DARK)
        pdf.ln(1.5)

    return bytes(pdf.output())


def _fmt_kr(amount: int) -> str:
    """Format integer as Norwegian currency: kr 213 000"""
    s = f"{amount:,}".replace(",", " ")  # non-breaking space
    return f"kr {s}"
