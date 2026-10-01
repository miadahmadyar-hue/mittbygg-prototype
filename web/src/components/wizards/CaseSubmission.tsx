"use client";

import { useEffect, useState, type FormEvent } from "react";
import { sessionFetch } from "@/lib/api/session";
import { Button } from "@/components/ui/Button";
import { useDraftState } from "@/lib/projects";
import { downloadBlob } from "@/lib/documents";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export function CaseSubmission({ slug, address, data, sessionId }: {
  slug: string; address: string; data: Record<string, unknown>; sessionId?: string | null;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [savedReceipt, setSavedReceipt] = useDraftState("caseReceipt", { caseId: "", fingerprint: "" });
  const fingerprint = JSON.stringify({ slug, address, data });
  const receipt = savedReceipt.fingerprint === fingerprint ? savedReceipt.caseId : "";
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/cases/availability`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]), cache: "no-store" })
      .then(async r => setAvailable(r.ok && (await r.json()).available === true))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || receipt) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const payload = { slug, address, data, contact: { name: String(fields.get("name") ?? "").trim(), email: String(fields.get("email") ?? "").trim(), phone: String(fields.get("phone") ?? "").trim() }, consent: fields.get("consent") === "on" };
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload))))).map(v => v.toString(16).padStart(2, "0")).join("");
      const key = `case-request:${hash}`;
      const requestId = sessionStorage.getItem(key) ?? crypto.randomUUID();
      sessionStorage.setItem(key, requestId);
      const response = await sessionFetch(`${API}/api/cases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, request_id: requestId, session_id: sessionId ?? null }), signal: AbortSignal.timeout(60_000) });
      if (!response.ok) {
        if ([401, 403].includes(response.status)) throw new Error("Økten er utløpt. Last opp vedleggene på nytt før du sender.");
        if (response.status === 409) throw new Error("Vedlegg eller tidligere forespørsel må kontrolleres. Last opp vedlegg på nytt. Har du allerede fått saksnummer, kontakt oss med det før du sender igjen.");
        if (response.status === 503) throw new Error("Saksmottak er ikke tilgjengelig. Ingen mottaksbekreftelse er gitt. Prøv igjen senere.");
        throw new Error("Vi kunne ikke bekrefte mottak. Kontroller feltene og prøv igjen med de samme opplysningene.");
      }
      const result = await response.json();
      setSavedReceipt({ caseId: result.case_id, fingerprint });
    } catch (e) { setError(e instanceof Error ? e.message : "Mottak kunne ikke bekreftes. Prøv igjen med de samme opplysningene."); }
    finally { setBusy(false); }
  }

  return <section className="panel p-5 border-green-300">
    <h2 className="font-semibold text-lg">Send saken til oss for tilbud</h2>
    {receipt ? <div role="status"><p className="mt-3 font-semibold">Saken er mottatt av Søknadsklar.</p><p>Saksnummer: {receipt}</p><p className="mt-2">Vi gjennomgår underlaget og kontakter deg om videre avklaring og tilbud. Ta vare på saksnummeret. Du trenger ikke sende ZIP-filen til oss.</p><p className="mt-2">Ingen betaling er trukket og ingen byggesøknad er sendt til kommunen.</p><Button className="mt-3" variant="secondary" onClick={() => downloadBlob(new Blob([`Søknadsklar – mottaksbekreftelse\nSaksnummer: ${receipt}\nEiendom: ${address}\nTilbudsforespørsel mottatt. Vi kontakter deg om videre avklaring og tilbud.\nIngen betaling eller kommunal innsending.\nKontakt: post@soknadsklar.no`], { type: "text/plain;charset=utf-8" }), `${receipt}-kvittering.txt`)}>Last ned kvittering</Button></div> : <>
      {savedReceipt.caseId && <p className="mt-3 text-amber-900">Du har tidligere sendt sak {savedReceipt.caseId}. Opplysningene er nå endret. Kontakt post@soknadsklar.no med saksnummeret for å supplere den eksisterende saken.</p>}
      <p className="mt-2">Send svarene dine, tilgjengelige AI-vurderinger og vedleggene fra denne økten til Søknadsklar. Vi gjennomgår saken og kontakter deg med avklaringer og tilbud. Manglende dokumentasjon kan avklares sammen med oss.</p>
      <p className="mt-2 text-sm">Forespørselen er gratis og uforpliktende. Omfang og pris avtales før betalt arbeid starter. Dette sender ikke en byggesøknad til kommunen.</p>
      {available === null ? <p role="status" className="mt-3">Kontrollerer saksmottak…</p> : !available ? <div className="mt-3"><p role="status">Saksmottaket kan ikke nås akkurat nå. Svarene dine er beholdt. Du kan laste ned en kopi eller kontakte post@soknadsklar.no.</p><Button variant="secondary" className="mt-3" onClick={() => { setAvailable(null); setAttempt(attempt + 1); }}>Prøv tilkoblingen igjen</Button></div> : <form onSubmit={submit} className="mt-4 grid gap-3">
        <label>Navn<input className="block border rounded-lg p-3 w-full" name="name" autoComplete="name" minLength={2} maxLength={120} required disabled={busy} /></label>
        <label>E-post<input className="block border rounded-lg p-3 w-full" name="email" autoComplete="email" type="email" maxLength={254} required disabled={busy} /></label>
        <label>Telefon<input className="block border rounded-lg p-3 w-full" name="phone" autoComplete="tel" type="tel" minLength={5} maxLength={40} required disabled={busy} /></label>
        <label className="flex gap-3"><input type="checkbox" name="consent" required disabled={busy} /><span>Jeg ber Søknadsklar lagre og gjennomgå opplysningene og vedleggene for denne forespørselen, og kontakte meg om saken.</span></label>
        <p className="text-sm">Del bare dokumenter du har rett til å dele, og fjern unødvendige personopplysninger. Kontakt post@soknadsklar.no om innsyn eller sletting.</p>
        <Button full disabled={busy}>{busy ? "Sender saken…" : "Send saken til oss for tilbud"}</Button>
      </form>}
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </>}
  </section>;
}
