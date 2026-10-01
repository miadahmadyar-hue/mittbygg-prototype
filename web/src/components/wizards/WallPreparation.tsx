"use client";

import { useState } from "react";
import { useDraftState } from "@/lib/projects";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { CaseSubmission } from "./CaseSubmission";
import { DrawingUpload } from "./DrawingUpload";
import { callArchitectAgent, type ArchitectAssessment } from "@/lib/api/aiArchitect";
import { callEngineerAgent, type EngineerAssessment } from "@/lib/api/aiEngineer";
import { runAiReview } from "@/lib/ai/review";
import { FALLBACK_ARCHITECT, FALLBACK_ENGINEER } from "@/lib/ai/fallbacks";
import { sessionFetch } from "@/lib/api/session";
import { saveDocument, downloadBlob } from "@/lib/documents";
import type { Address } from "@/lib/data/addresses";
import type { TiltakResult } from "@/lib/api/evaluate";
import type { VeggInput } from "@/lib/regulations/vegg";

const checks = {
  plans: "Godkjente eksisterende tegninger",
  photos: "Bilder og mål fra stedet",
  consent: "Samtykke fra eier/sameie/borettslag avklart",
  survey: "Befaring, materialer og lastvei kontrollert av fagperson",
  design: "Konstruksjonsberegninger og arbeidstegninger fra RIB",
  fire: "Brann, lyd og tekniske installasjoner avklart",
  applicant: "Ansvarlig søker og øvrige ansvarlige foretak engasjert",
  application: "Søknadsvedlegg og erklæringer kontrollert av ansvarlig søker",
};
const fields = {
  unit: "Leilighetsnummer / seksjon", floor: "Etasje (for eksempel 3. etasje)",
  thickness: "Veggtykkelse i cm, hvis kjent", height: "Ønsket åpningshøyde i meter, hvis kjent",
  position: "Hvor i leiligheten? Hvilke rom forbindes?", notes: "Beskriv ønsket endring og det du er usikker på",
  engineerFirm: "Ønsket / kontaktet konstruksjonsforetak (valgfritt)",
  applicantFirm: "Ønsket / kontaktet ansvarlig søker (valgfritt)",
};
type Review = { architect: ArchitectAssessment; engineer: EngineerAssessment; fingerprint: string; session: string | null };
type Case = { details: Record<string, string>; checklist: Record<string, boolean>; review: Review | null; screen: "details" | "upload" | "summary" };

export function WallPreparation({ p, result, onBack }: { p: Address; result: TiltakResult; onBack: () => void }) {
  const [draft, setDraft] = useDraftState<Case>("professionalCase", { details: {}, checklist: {}, review: null, screen: "details" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const input = result.input as VeggInput;
  const fingerprint = JSON.stringify({ input, details: draft.details, address: p.street, bygg: p.bygg });
  const review = draft.review?.fingerprint === fingerprint ? draft.review : null;
  const screen = draft.screen === "summary" && !review ? "details" : draft.screen;
  const changeScreen = (screen: Case["screen"]) => { setError(""); setSaved(false); setDraft({ ...draft, screen }); };

  async function analyse(session: string | null) {
    setError(""); setBusy("AI-arkitekt gjennomgår tegningene…");
    const base = { slug: "vegg", address: p.street, gnr: Number(p.matrikkel.gnr), bnr: Number(p.matrikkel.bnr), kommune: p.matrikkel.kommune,
      bygg: p.bygg as Record<string, unknown>, project: { ...input, apartment: draft.details }, session_id: session };
    try {
      const reviewed = await runAiReview(() => callArchitectAgent(base), (architect_summary) => callEngineerAgent({ ...base, architect_summary }),
        { architect: FALLBACK_ARCHITECT, engineer: FALLBACK_ENGINEER }, () => setBusy("AI-ingeniør gjennomgår arkitektens funn og originalvedlegg…"));
      setDraft({ ...draft, screen: "summary", review: { ...reviewed, fingerprint, session } });
    } finally { setBusy(""); }
  }

  async function download() {
    if (!review) return;
    setBusy("Lager saksunderlag med vedlegg…"); setError(""); setSaved(false);
    try {
      const response = await sessionFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/vegg/handover`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({ address: `${p.street}, ${p.matrikkel.kommune}`, input, details: draft.details, checklist: draft.checklist,
          architect: review.architect, engineer: review.engineer, session_id: review.session }),
      });
      if ([401, 403, 409].includes(response.status)) throw new Error("Vedleggene er ikke lenger tilgjengelige i denne økten. Velg «Last opp på nytt» og legg til filene igjen. Saksopplysningene er beholdt.");
      if (!response.ok) throw new Error("Saksunderlaget kunne ikke lages. Prøv igjen.");
      const blob = await response.blob();
      if (new Uint8Array(await blob.slice(0, 2).arrayBuffer()).join(",") !== "80,75") throw new Error("Ugyldig dokumentpakke mottatt. Prøv igjen.");
      await saveDocument(blob, "vegg-saksunderlag.zip");
      downloadBlob(blob, "vegg-saksunderlag.zip"); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke lagre pakken på denne enheten. Prøv igjen."); }
    finally { setBusy(""); }
  }

  if (busy) return <><Topbar title="Forbereder saken" back={false} /><main className="view"><div className="spinner" /><h2 role="status">{busy}</h2><p>Dette kan ta opptil et par minutter. Ingen søknad sendes.</p></main></>;
  if (screen === "upload") return <DrawingUpload onBack={() => changeScreen("details")} onContinue={analyse} />;
  const missing = Object.entries(checks).filter(([key]) => !draft.checklist[key]);
  const degraded = review && (review.architect.meta?.source === "fallback" || review.engineer.meta?.source === "fallback");
  return <><Topbar title="Forbered saken til ingeniør" onBack={screen === "details" ? onBack : () => changeScreen("details")} />
    <main className="view">
      <div className="panel p-4 bg-amber-50"><h1 className="text-xl font-semibold">{screen === "details" ? "Fortell om leiligheten" : "Saksunderlag til fagperson"}</h1>
        <p className="text-sm mt-2">Dette er forberedelse til faglig prosjektering. Ingen bjelke dimensjoneres, ingen fagperson engasjeres automatisk, og ingen søknad sendes.</p></div>
      <p className="text-sm">{p.street} · Ønsket åpning: {input.apning_bredde ?? "ukjent"} m · {input.konstruksjon.replaceAll("_", "/")}</p>
      {error && <p role="alert" className="panel p-4 border-red-300">{error}</p>}
      {screen === "details" ? <>
        <p>La felt stå tomme hvis du ikke vet. Ta med plantegninger, snitt, bilder og eventuelle tidligere beregninger i neste steg.</p>
        {Object.entries(fields).map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}
          <textarea rows={key === "notes" ? 3 : 1} maxLength={2000} className="block w-full border rounded-xl p-3 mt-1 font-normal" value={draft.details[key] ?? ""}
            onChange={(e) => setDraft({ ...draft, review: null, details: { ...draft.details, [key]: e.target.value } })} /></label>)}
        <p className="text-xs text-gray-500">Foretaksnavn er dine egne notater, ikke en bestilling eller bekreftet ansvarsrett. Utkastet lagres kun i denne nettleseren.</p>
        <Button full onClick={() => changeScreen("upload")}>Neste: tegninger og AI-gjennomgang</Button>
      </> : review && <>
        {degraded && <p role="alert" className="panel p-4">Én eller begge AI-vurderinger er utilgjengelige. Du kan prøve igjen eller laste ned et underlag som tydelig viser mangelen.</p>}
        <section className="panel p-4"><h2 className="font-semibold">Arkitektens foreløpige gjennomgang</h2><p className="mt-2">{review.architect.summary}</p>
          <ul className="list-disc pl-5 mt-3">{review.architect.items.map((item, i) => <li key={i}>{item.text}</li>)}{review.architect.anbefalinger.map((item, i) => <li key={`a${i}`}>{item}</li>)}</ul></section>
        <section className="panel p-4"><h2 className="font-semibold">Ingeniørens foreløpige gjennomgang</h2><p className="mt-2">{review.engineer.konklusjon}</p>
          <ul className="list-disc pl-5 mt-3">{review.engineer.notater.map((item, i) => <li key={i}>{item}</li>)}</ul></section>
        <section className="panel p-4"><h2 className="font-semibold">Ønsket åpning – prinsippskisse</h2>
          <svg viewBox="0 0 500 230" role="img" aria-label={`Skjematisk ønsket åpning ${input.apning_bredde ?? "ukjent"} meter, ikke en dimensjonert konstruksjon`}><path d="M35 180V30H465V180H325V80H175V180Z" fill="#cbd5e1"/><path d="M175 200H325" stroke="currentColor"/><text x="250" y="225" textAnchor="middle" fontSize="15">{input.apning_bredde ?? "Ukjent"} m åpning</text></svg>
          <p className="text-xs">Ikke i målestokk. Ingen bjelke, opplegg eller avstiving er prosjektert. ZIP-pakken inneholder skissen som SVG.</p></section>
        <section className="panel p-4"><h2 className="font-semibold">Hva gjenstår?</h2><p className="text-sm mt-2">{missing.length} av {Object.keys(checks).length} punkter er ikke markert tilgjengelige. Status oppgis av deg og er ikke faglig verifisert.</p>
          {Object.entries(checks).map(([key, label]) => <label key={key} className="flex gap-3 mt-4 text-sm"><input type="checkbox" checked={draft.checklist[key] ?? false} onChange={(e) => { setSaved(false); setDraft({ ...draft, checklist: { ...draft.checklist, [key]: e.target.checked } }); }} />{label}</label>)}
          <p className="mt-4 font-semibold">Ikke klar til innsending – ansvarlig søker må kontrollere og godkjenne saken.</p></section>
        <CaseSubmission slug={"vegg"} address={`${p.street}, ${p.matrikkel.kommune}`} sessionId={review.session}
          data={{ result, property: p, details: draft.details, checklist: draft.checklist, architect: review.architect, engineer: review.engineer }} />
        <p className="text-sm">ZIP inneholder PDF-brief, kundeopplysninger, prinsippskisse og filene lastet opp i denne økten. Last ned før du lukker siden; vedlegg må lastes opp igjen etter øktutløp.</p>
        <Button full variant="secondary" onClick={download}>Last ned en kopi med vedlegg (ZIP)</Button>
        {saved && <p role="status">Pakken er lagret under Mine prosjekter på denne enheten. Nedlasting er startet. Denne nedlastingen sender ikke saken.</p>}
        <Button full variant="ghost" onClick={() => changeScreen("upload")}>Last opp på nytt / prøv AI igjen</Button>
        <Button full variant="ghost" onClick={() => changeScreen("details")}>Endre saksopplysninger</Button>
      </>}
    </main></>;
}
