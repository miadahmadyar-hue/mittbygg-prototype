"""Evidence handover for basement conversion, never a submission package."""
import base64
import io
import json
import zipfile
from pathlib import Path
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel, Field
from models import KjellerInput, BruksendringInput
from regulations.kjeller import evaluate_kjeller
from regulations.bruksendring import evaluate_bruksendring
from pdf.generic import _PDF
from .access import require_session
from .ai_architect import _load_drawings

router = APIRouter()


class CellarCaseRequest(BaseModel):
    address: str = Field(max_length=300)
    input: KjellerInput
    details: dict[str, str] = Field(default_factory=dict, max_length=10)
    checklist: dict[str, bool] = Field(default_factory=dict, max_length=10)
    architect: dict = Field(default_factory=dict)
    engineer: dict = Field(default_factory=dict)
    session_id: str | None = None


class ChangeUseCaseRequest(CellarCaseRequest):
    input: BruksendringInput


def create_brief(req: CellarCaseRequest | ChangeUseCaseRequest, filenames: list[str]) -> bytes:
    change_use = isinstance(req.input, BruksendringInput)
    result = evaluate_bruksendring(req.input) if change_use else evaluate_kjeller(req.input)
    pdf = _PDF()
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(True, 18)
    pdf.add_page()

    def paragraph(value):
        pdf.set_x(15)
        pdf.set_font("Sans", "", 10)
        pdf.multi_cell(180, 6, str(value)[:6000])
        pdf.ln(2)

    pdf.set_font("Sans", "B", 18)
    pdf.cell(180, 12, "Saksunderlag - bruksendring" if change_use else "Saksunderlag - bruksendring kjeller", ln=True)
    paragraph("UTKAST. Ikke en godkjent søknad eller arbeidstegning. Ingen innsending eller bestilling er utført.")
    paragraph(req.address)
    pdf.section_title("1. Kundens opplysninger")
    labels = {"room": "Oppgitt eksisterende bruk", "ny_bruk": "Ønsket bruk", "rental_use": "Utleiedel", "rom_areal": "Gulvareal (m²)", "takhoyde": "Takhøyde (m)", "vindu_bredde": "Fri vindusbredde (m)", "vindu_hoyde": "Fri vindushøyde (m)", "vindu_brystning": "Høyde fra gulv (m)", "radon": "Radon (Bq/m³)"}
    if change_use:
        labels = {"fra": "Godkjent bruk", "til": "Planlagt bruk", "areal": "Areal (m²)", "bolig_scope": "Boligens avgrensning", "plan_status": "Planstatus", "vern_status": "Vernestatus", "baerende_status": "Bærende inngrep"}
        paragraph("Prisindikasjon for bruksendringssaken: over 25 000 kr eks. mva. Endelig omfang og pris avtales særskilt. Saksunderlaget er gratis i demoen; ingen betaling eller bestilling er utført.")
    for key, label in labels.items():
        value = getattr(req.input, key)
        if key == "rental_use":
            value = {"same": "Del av samme bolig", "separate": "Planlagt separat boenhet", "unknown": "Ukjent"}[value] if req.input.ny_bruk == "hybel" else "Ikke valgt"
        if key == "takhoyde" and value is not None:
            value = value / 1000
        if change_use:
            value = {"naring": "Næring", "kontor": "Kontor", "garasje": "Garasje", "bod": "Bod / lager", "fritidsbolig": "Fritidsbolig", "annet": "Annet", "usikker": "Usikker", "rom": "Ekstra rom i boligen", "bolig": "Ny separat bolig", "hybel": "Utleie", "same": "Del av samme bolig", "separate": "Separat boenhet", "unknown": "Ukjent", "tillatt": "Oppgitt tillatt", "ikke_tillatt": "Oppgitt ikke tillatt", "ja": "Ja", "nei": "Nei"}.get(value, value)
        paragraph(f"{label}: {'Ikke oppgitt' if value is None else value}")
    for key, label in {"position": "Rommets plassering", "notes": "Beskrivelse", "applicantFirm": "Ønsket rådgiver / søker"}.items():
        paragraph(f"{label}: {req.details.get(key) or 'Ikke oppgitt'}")
    pdf.section_title("2. Foreløpig regelsjekk")
    for finding in result.findings:
        paragraph(f"{finding.t}: {finding.d}")
    pdf.section_title("3. Dokumentstatus - kundens egne avkryssinger")
    checklist_labels = {"plans": "Godkjente tegninger og vedtak", "measures": "Målsatt plan og snitt", "window": "Vinduer, dagslys og rømning", "moisture": "Fukt og ventilasjon", "radon": "Radonrapport / relevans avklart", "scope": "Eierforhold og omfang"}
    if change_use:
        checklist_labels.update(window="Tekniske krav for ny bruk", moisture="Plan og vernestatus", radon="Nødvendige fagrapporter", scope="Eierforhold, søknadsomfang og ansvar")
    for key, label in checklist_labels.items():
        paragraph(f"{label}: {'Oppgitt tilgjengelig / avklart' if req.checklist.get(key) else 'Gjenstår / ukjent'}")
    paragraph("Avkryssing er ikke faglig godkjenning og endrer ikke regelsjekken.")
    pdf.section_title("4. Foreløpige AI-vurderinger - ikke verifisert")
    for label, review, summary in [("Arkitekt", req.architect, "summary"), ("Ingeniør", req.engineer, "konklusjon")]:
        meta = review.get("meta") or {}
        paragraph(f"{label}: {meta.get('source', 'ikke utført') if isinstance(meta, dict) else 'ukjent'}")
        paragraph(review.get(summary) or "Ingen AI-vurdering er utført.")
        for key in ("items", "anbefalinger", "notater"):
            items = review.get(key)
            if isinstance(items, list):
                for item in items[:10]:
                    paragraph(item.get("text", "") if isinstance(item, dict) else item)
    pdf.section_title("5. Vedlegg og videre avklaring")
    paragraph(", ".join(filenames) if filenames else "Ingen opplastede vedlegg.")
    paragraph("Avklar manglende dokumentasjon med kommunen eller relevant rådgiver. Den som søker må kontrollere løsningen og behovet for ansvarlig foretak. Denne pakken er ikke en tillatelse til å utføre eller ta i bruk tiltaket.")
    paragraph("Kilder: dibk.no/bygge-eller-endre/hva-er-en-bruksendring og dibk.no/regelverk/sak/2/3/3-1/. Gjennomgått 01.10.2026." if change_use else "Kilder: dibk.no/bygge-eller-endre/bruksendring-i-eldre-boliger/ og dibk.no/regelverk/sak/2/2/2-2. Regelsjekk gjennomgått 01.10.2026.")
    return bytes(pdf.output())


@router.post("/kjeller/handover")
def handover(req: CellarCaseRequest, owner: str = Depends(require_session)):
    return build_handover(req, owner, "kjeller")


@router.post("/bruksendring/handover")
def change_use_handover(req: ChangeUseCaseRequest, owner: str = Depends(require_session)):
    return build_handover(req, owner, "bruksendring")


def build_handover(req, owner: str, slug: str):
    drawings = _load_drawings(req.session_id or "", owner)
    names = [Path(d["path"]).name for d in drawings]
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("saksunderlag.pdf", create_brief(req, names))
        archive.writestr("kundeopplysninger.json", json.dumps(req.model_dump(exclude={"session_id"}), ensure_ascii=False, indent=2))
        for drawing, name in zip(drawings, names):
            archive.writestr("vedlegg/" + name, base64.b64decode(drawing["data"]))
    return Response(out.getvalue(), media_type="application/zip", headers={"Content-Disposition": f'attachment; filename="{slug}-saksunderlag.zip"'})
