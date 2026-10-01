"""Professional handover documents; deliberately separate from permit generation."""
import base64
import io
import json
import zipfile
from pathlib import Path
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel, Field
from models import VeggInput
from .access import require_session
from .ai_architect import _load_drawings
from pdf.generic import _PDF

router = APIRouter()

class WallCaseRequest(BaseModel):
    address: str = Field(max_length=300)
    input: VeggInput
    details: dict[str, str] = Field(default_factory=dict, max_length=30)
    checklist: dict[str, bool] = Field(default_factory=dict, max_length=20)
    architect: dict = Field(default_factory=dict)
    engineer: dict = Field(default_factory=dict)
    session_id: str | None = None

CHECKLIST = {
    "plans": "Godkjente eksisterende tegninger",
    "photos": "Bilder og mål fra stedet",
    "consent": "Samtykke fra eier/sameie/borettslag avklart",
    "survey": "Befaring, materialer og lastvei kontrollert av fagperson",
    "design": "Konstruksjonsberegninger og arbeidstegninger fra RIB",
    "fire": "Brann, lyd og tekniske installasjoner avklart",
    "applicant": "Ansvarlig søker og øvrige ansvarlige foretak engasjert",
    "application": "Søknadsvedlegg og erklæringer kontrollert av ansvarlig søker",
}
DETAILS = {"unit": "Leilighet / seksjon", "floor": "Etasje", "thickness": "Veggtykkelse (cm)",
           "height": "Åpningshøyde (m)", "position": "Plassering og rom", "notes": "Kundens beskrivelse",
           "engineerFirm": "Ønsket / kontaktet konstruksjonsforetak", "applicantFirm": "Ønsket / kontaktet ansvarlig søker"}

def create_brief(req: WallCaseRequest, filenames: list[str]) -> bytes:
    pdf = _PDF()
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(True, 18)
    pdf.add_page()
    def paragraph(text):
        pdf.set_x(15)
        pdf.set_font("Sans", "", 10)
        pdf.multi_cell(180, 6, str(text)[:6000])
        pdf.ln(2)
    pdf.set_font("Sans", "B", 18)
    pdf.cell(180, 12, "Saksunderlag til konstruksjonsingeniør", ln=True)
    paragraph("UTKAST - IKKE SØKNAD ELLER ARBEIDSTEGNING. Ingen fagperson er automatisk engasjert. Ingen innsending er utført.")
    pdf.section_title("1. Prosjekt og kundeopplysninger")
    paragraph(req.address)
    paragraph(f"Tiltak: {req.input.type}. Åpning: {req.input.apning_bredde or 'ukjent'} m. Bærende: {req.input.baerende}. Materiale: {req.input.konstruksjon}. Etasjer over: {req.input.etasjer_over}.")
    for key, label in DETAILS.items():
        paragraph(f"{label}: {req.details.get(key) or 'Ikke oppgitt'}")
    pdf.section_title("2. Dokumentstatus - oppgitt av kunden, ikke verifisert")
    for key, label in CHECKLIST.items():
        paragraph(f"{'Oppgitt som tilgjengelig' if req.checklist.get(key) else 'Gjenstår / ukjent'}: {label}")
    paragraph("Ansvarlig søker må kontrollere dokumentasjonen og avklare hvilke vedlegg, samtykker og eventuelle varsler som kreves. Avkryssing gjør ikke saken klar til innsending.")
    pdf.add_page()
    pdf.section_title("3. Foreløpig AI-gjennomgang")
    paragraph("AI-tekst er uverifisert. Ingen bjelkedimensjon, konstruksjonssikkerhet eller byggetillatelse er bekreftet.")
    for title, result, summary in [("Arkitekt", req.architect, "summary"), ("Ingeniør", req.engineer, "konklusjon")]:
        paragraph(f"{title} - {result.get('meta', {}).get('source', 'ikke utført')}")
        paragraph(result.get(summary, "Ingen AI-vurdering er utført."))
        for item in result.get("items", [])[:10]:
            paragraph(item.get("text", ""))
        for note in (result.get("anbefalinger", []) + result.get("notater", []))[:10]:
            paragraph(note)
    pdf.section_title("4. Vedlegg og neste steg")
    paragraph("Vedlagt i ZIP: " + (", ".join(filenames) if filenames else "Ingen opplastede tegninger eller bilder."))
    paragraph("Kontakt et kvalifisert konstruksjonsforetak for befaring og prosjektering. Avklar ansvarlig søker, utførende foretak, nødvendige samtykker og søknadsunderlag. Send selv denne pakken med vedlegg til valgt fagperson. Ikke start riving før nødvendige avklaringer og tillatelser foreligger.")
    return bytes(pdf.output())

@router.post("/vegg/handover")
def handover(req: WallCaseRequest, owner: str = Depends(require_session)):
    drawings = _load_drawings(req.session_id or "", owner)
    filenames = [Path(d["path"]).name for d in drawings]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("saksunderlag.pdf", create_brief(req, filenames))
        archive.writestr("kundeopplysninger.json", json.dumps(req.model_dump(exclude={"session_id"}), ensure_ascii=False, indent=2))
        for drawing, name in zip(drawings, filenames):
            archive.writestr("vedlegg/" + name, base64.b64decode(drawing["data"]))
        width = req.input.apning_bredde
        label = f"Oppgitt åpning: {width} m" if width else "Åpningsbredde ukjent"
        archive.writestr("prinsippskisse.svg", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320"><rect width="600" height="320" fill="white"/><g font-family="Arial" fill="#172334"><text x="25" y="30" font-size="18">Kundens ønskede åpning - ikke i målestokk</text><path d="M70 240V65H530V240H390V120H210V240Z" fill="#cbd5e1"/><path d="M210 265H390" stroke="#172334"/><text x="200" y="290">{label}</text><text x="25" y="312" font-size="12">Ikke arbeidstegning. Bjelke, opplegg og avstiving må prosjekteres av fagperson.</text></g></svg>''')
    return Response(out.getvalue(), media_type="application/zip", headers={"Content-Disposition": 'attachment; filename="vegg-saksunderlag.zip"'})
