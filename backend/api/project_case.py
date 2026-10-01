"""Downloadable preliminary evidence for all general wizards; never submits a case."""
import base64
import io
import json
import zipfile
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, ValidationError
from .access import require_session
from .ai_architect import _load_drawings
from .evaluate import EVALUATORS
from pdf.generic import _PDF

router = APIRouter()


class ProjectCaseRequest(BaseModel):
    slug: str = Field(max_length=30)
    address: str = Field(max_length=300)
    input: dict
    details: dict[str, str] = Field(default_factory=dict, max_length=10)
    checklist: dict[str, bool] = Field(default_factory=dict, max_length=10)
    checklist_labels: dict[str, str] = Field(default_factory=dict, max_length=10)
    architect: dict = Field(default_factory=dict)
    engineer: dict = Field(default_factory=dict)
    session_id: str | None = Field(default=None, max_length=100)


@router.post("/project/handover")
def handover(req: ProjectCaseRequest, owner: str = Depends(require_session)):
    if req.slug not in EVALUATORS:
        raise HTTPException(422, "Unknown wizard")
    if len(req.model_dump_json().encode()) > 250_000:
        raise HTTPException(413, "Case data too large")
    model, evaluate = EVALUATORS[req.slug]
    try:
        result = evaluate(model.model_validate(req.input))
    except ValidationError:
        raise HTTPException(422, "Kontroller svarene i veiviseren.")
    drawings = _load_drawings(req.session_id or "", owner)
    pdf = _PDF()
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(True, 18)
    pdf.add_page()

    def paragraph(value):
        pdf.set_x(15)
        pdf.set_font("Sans", "", 10)
        pdf.multi_cell(180, 6, str(value)[:6000], align="L")
        pdf.ln(2)

    def section(title):
        if pdf.get_y() > pdf.h - 45:
            pdf.add_page()
        pdf.section_title(title)

    section("Saksunderlag - " + req.slug)
    paragraph("UTKAST. Ikke en godkjent søknad, fagrapport eller arbeidstegning. Nedlasting sender ikke saken til Søknadsklar eller kommunen.")
    paragraph(req.address)
    section("1. Kundens opplysninger")
    labels = {"type": "Tiltak", "areal": "Areal (m²)", "avstand": "Til nabogrense (m)", "avstand_bygg": "Til annet bygg (m)", "overnatting": "Overnatting", "kjeller": "Kjeller", "etasjer": "Etasjer", "monehoyde": "Mønehøyde (m)", "gesimshoyde": "Gesimshøyde (m)", "over_ledninger": "Over ledninger", "plan_ok": "Plan kontrollert og fulgt", "bya_ok": "Utnyttelsesgrad kontrollert", "bruk": "Planlagt bruk", "pipe": "Pipe/skorstein", "samme_formaal": "Innenfor godkjent formål", "understottet": "Egen understøtting", "en_etasje": "Ett plan uten kjeller", "egen_boenhet": "Ny selvstendig boenhet", "verneverdig": "Vernet/bevaringsverdig", "samme_utseende": "Uendret utseende", "karakterendring": "Endret karakter", "terrasse_hoyde": "Terrassehøyde (m)", "terrasse_dybde": "Ut fra fasaden (m)", "terrasse_avstand": "Terrasse til nabogrense (m)", "terrasse_overbygd": "Overbygd terrasse", "terrasse_rekkverk": "Rekkverkshøyde (m)", "etterisolere": "Etterisolering", "brannvegg": "Brannskille", "hoyde": "Høyde (m)", "lengde": "Lengde (m)", "bredde": "Bredde (m)", "arbeid": "Arbeidsomfang", "eier_strandgrunn": "Rett til strandgrunnen", "plan_status": "Planstatus", "beskrivelse": "Prosjektbeskrivelse", "timing": "Ønsket oppfølging", "romtype": "Godkjent rombruk", "formaal": "Ny bruk", "godkjent_bruk_bekreftet": "Godkjent bruk kontrollert", "antall": "Antall nye deler", "hovedfunksjoner": "Alle hovedfunksjoner", "egen_inngang": "Separat inngang", "fysisk_adskilt": "Fysisk adskilt"}
    values = {"usikker": "Vet ikke", "tilbygg_1etasje": "Tilbygg på bakken", "ny_etasje": "Påbygg / ny etasje", "innglasset_terrasse": "Innglasset terrasse", "oppholdsrom": "Oppholdsrom", "nytt_hull": "Ny åpning", "storre_apning": "Større åpning", "bytte_materiale": "Skifte taktekking", "endre_form": "Endre takform", "bygge_loft": "Innrede loft", "asap": "Så snart som mulig; tidspunkt avtales", "planlegging": "I planleggingsfasen", "tillatt": "Oppgitt tillatt", "ikke_tillatt": "Ikke tillatt", "ja": "Ja", "nei": "Nei"}
    for key, value in result.model_dump()["input"].items():
        rendered = "Ikke oppgitt / ukjent" if value is None else "Ja" if value is True else "Nei" if value is False else values.get(str(value), str(value).replace("_", " "))
        paragraph(f"{labels.get(key, key.replace('_', ' ').capitalize())}: {rendered}")
    for key, label in {"position": "Plassering og eierforhold", "notes": "Prosjektbeskrivelse", "applicantFirm": "Ønsket oppfølging"}.items():
        paragraph(f"{label}: {req.details.get(key) or 'Ikke oppgitt'}")
    section("2. Foreløpig regelsjekk")
    paragraph(result.statusText + ": " + result.statusDesc)
    for finding in result.findings:
        paragraph(f"{finding.t}: {finding.d} ({finding.ref})")
    section("3. Dokumentstatus - kundens egne opplysninger")
    for key, label in req.checklist_labels.items():
        paragraph(f"{label}: {'Oppgitt avklart' if req.checklist.get(key) else 'Gjenstår / ukjent'}")
    paragraph("Avkryssing er ikke faglig godkjenning. Søknadsgrunnlaget må kontrolleres av den som skal søke.")
    section("4. Foreløpig AI-gjennomgang - ikke faglig verifisert")
    for label, review, summary in [("Arkitekt", req.architect, "summary"), ("Ingeniør", req.engineer, "konklusjon")]:
        paragraph(f"{label}: {review.get(summary) or 'Ingen vurdering utført'}")
        for key in ("items", "anbefalinger", "notater"):
            items = review.get(key)
            if isinstance(items, list):
                for item in items[:10]:
                    paragraph(item.get("text", "") if isinstance(item, dict) else item)
    section("5. Vedlegg og neste steg")
    paragraph(", ".join(Path(d["path"]).name for d in drawings) or "Ingen vedlegg lastet opp.")
    paragraph("Send en gratis tilbudsforespørsel i appen dersom du ønsker oppfølging. Omfang og pris avtales før betalt arbeid. Ingen kommunal innsending er utført.")
    out = io.BytesIO()
    evidence = req.model_dump(exclude={"session_id"})
    evidence["result"] = result.model_dump()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("saksunderlag.pdf", bytes(pdf.output()))
        archive.writestr("kundeopplysninger.json", json.dumps(evidence, ensure_ascii=False, indent=2))
        for drawing in drawings:
            archive.writestr("vedlegg/" + Path(drawing["path"]).name, base64.b64decode(drawing["data"]))
    return Response(out.getvalue(), media_type="application/zip", headers={"Cache-Control": "no-store", "Content-Disposition": f'attachment; filename="{req.slug}-saksunderlag.zip"'})
