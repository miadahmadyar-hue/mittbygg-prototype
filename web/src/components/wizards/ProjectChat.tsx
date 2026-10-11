"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftState } from "@/lib/projects";
import { sessionFetch } from "@/lib/api/session";
import { CHAT_FIELDS, chatPatch, displayFact, validFact, type ChatFact, type ChatMessage, type ChatSlug } from "@/lib/ai/chat";
import { Button } from "@/components/ui/Button";

type Draft = { messages: ChatMessage[]; facts: ChatFact[]; specialist: "architect" | "engineer"; input: string };

export function ProjectChat({ slug, onApply }: { slug: ChatSlug; onApply: (patch: Record<string, unknown>) => void }) {
  const [savedDraft, setDraft] = useDraftState<Draft>("chat", { messages: [], facts: [], specialist: "architect", input: "" });
  const [entry] = useDraftState<{ messages: ChatMessage[] }>("entryChat", { messages: [] });
  const draft = savedDraft.messages.length ? savedDraft : { ...savedDraft, messages: entry.messages };
  const [, setBrief] = useDraftState("chatBrief", { notes: "" });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => { if (open && draft.messages.length) end.current?.scrollIntoView({ block: "nearest" }); }, [open, draft.messages.length]);
  const facts = draft.facts.filter(f => validFact(slug, f));
  const customerText = draft.messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");
  const brief = notes ?? customerText.slice(0, 2000);
  const atLimit = draft.messages.length >= 40 || draft.messages.reduce((n, m) => n + m.content.length, 0) + draft.input.length > 30000;

  async function send() {
    const content = draft.input.trim();
    if (!content || busy || active.current || atLimit) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(""); setConfirmed(false);
    const messages: ChatMessage[] = [...draft.messages, { role: "user", content }];
    try {
      const response = await sessionFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/ai/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(90_000)]),
        body: JSON.stringify({ slug, specialist: draft.specialist, messages: messages.map(({ role, content }) => ({ role, content })) }),
      });
      if (!response.ok) throw new Error(response.status === 429
        ? "Chatgrensen er nådd. Prøv senere eller fortsett i skjemaet. Svarene dine er beholdt."
        : "AI-chatten er utilgjengelig akkurat nå. Prøv igjen eller bruk skjemaet. Meldingen din er beholdt.");
      const answer = await response.json() as { reply: string; updates: ChatFact[] };
      if (typeof answer.reply !== "string" || !answer.reply.trim() || !Array.isArray(answer.updates)) throw new Error("Ugyldig svar. Prøv igjen eller bruk skjemaet.");
      if (controller.signal.aborted) return;
      const merged = new Map(facts.map(f => [f.key, f]));
      for (const fact of answer.updates) if (validFact(slug, fact)) merged.set(fact.key, fact);
      setDraft({ ...draft, input: "", messages: [...messages, { role: "assistant", content: answer.reply, specialist: draft.specialist }], facts: [...merged.values()] });
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error && e.name !== "TimeoutError" && e.name !== "TypeError" ? e.message : "Chatten kunne ikke nås. Prøv igjen eller bruk skjemaet. Meldingen din er beholdt.");
    } finally { if (!controller.signal.aborted) setBusy(false); if (active.current === controller) active.current = null; }
  }

  if (!open) return <section className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
    <h2 className="font-semibold">Fortell oss hva du vil gjøre</h2>
    <p className="text-sm text-gray-600">AI-arkitekt og AI-ingeniør hjelper deg å samle opplysninger. Du kontrollerer svarene før de brukes.</p>
    <Button variant="secondary" full onClick={() => setOpen(true)}>{draft.messages.length ? "Fortsett samtalen" : "Start med en samtale"}</Button>
    <p className="text-xs text-gray-500">Du kan også fylle ut skjemaet nedenfor.</p>
  </section>;

  return <section aria-label="Prosjektsamtale" className="rounded-xl border border-green-200 bg-white p-4 space-y-4">
    <div><h2 className="text-lg font-semibold">Din prosjektassistent</h2><p className="text-sm text-gray-600 mt-1">To AI-roller, én samtale. Faglige beregninger og godkjenning må avklares med fagperson.</p></div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Velg AI-rolle">
      {(["architect", "engineer"] as const).map(role => <Button key={role} size="sm" disabled={busy} variant={draft.specialist === role ? "primary" : "secondary"} aria-pressed={draft.specialist === role}
        onClick={() => setDraft({ ...draft, specialist: role })}>{role === "architect" ? "AI-arkitekt" : "AI-ingeniør"}</Button>)}
    </div>
    <p className="text-xs text-gray-500">{draft.specialist === "architect" ? "Arkitekten hjelper med ønsket bruk og planløsning." : "Ingeniøren hjelper med mål, materialer og dokumentasjon."}</p>
    <div role="log" aria-label="Samtale" aria-live="polite" aria-relevant="additions" className="max-h-96 overflow-y-auto space-y-3">
      {!draft.messages.length && <p className="rounded-lg bg-gray-50 p-3 text-sm">{slug === "vegg" ? "Hvilken vegg vil du endre, og hva ønsker du å oppnå? Fortell gjerne om bredde og materiale hvis du vet." : "Hva ønsker du å bruke kjelleren til, og vet du hva rommet er godkjent som i dag?"}</p>}
      {draft.messages.map((m, i) => <div key={i} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-green-50 ml-5" : "bg-gray-50 mr-5"}`}>
        <p className="font-semibold mb-1">{m.role === "user" ? "Du" : m.specialist === "engineer" ? "AI-ingeniør" : "AI-arkitekt"}</p>
        <p className="whitespace-pre-wrap break-words">{m.content}</p></div>)}<div ref={end} />
    </div>
    <form onSubmit={e => { e.preventDefault(); void send(); }} className="space-y-2">
      <label htmlFor="project-chat-message" className="block text-sm font-semibold">Fortell om prosjektet</label>
      <textarea id="project-chat-message" rows={3} maxLength={2000} disabled={busy} className="w-full rounded-lg border border-gray-300 p-3 text-sm" value={draft.input} onChange={e => setDraft({ ...draft, input: e.target.value })} placeholder="Jeg ønsker å …" />
      <p className="text-xs text-gray-500">Samtalen lagres i denne nettleseren og sendes til AI-tjenesten når du trykker Send. Unngå sensitive personopplysninger. Tegninger lastes opp senere.</p>
      <Button full type="submit" disabled={busy || !draft.input.trim() || atLimit}>{busy ? "AI svarer …" : "Send melding"}</Button>
    </form>
    {busy && <p role="status" className="text-sm">Samler opplysningene dine. Dette kan ta omtrent ett minutt.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {atLimit && <p role="status" className="text-sm">Denne samtalen er full. Fortsett med svarene i skjemaet.</p>}
    {draft.messages.length > 0 && <div className="border-t pt-4 space-y-3">
      <h3 className="font-semibold">Kontroller det vi har forstått</h3>
      <p className="text-sm text-gray-600">Bare forslagene nedenfor endrer skjemasvar. Fjern feil forslag, eller skriv en rettelse i chatten. Resten fyller du ut i skjemaet.</p>
      {facts.length ? <dl className="space-y-3">{facts.map(f => <div key={f.key} className="border-b pb-2">
        <dt className="text-sm font-semibold">{CHAT_FIELDS[slug][f.key].label}</dt><dd className="text-sm">{displayFact(slug, f)}</dd>
        <dd className="text-xs text-gray-500 break-words">Du skrev: «{f.evidence}»</dd>
        <dd><button disabled={busy} type="button" className="text-sm underline min-h-9" onClick={() => { setDraft({ ...draft, facts: facts.filter(item => item.key !== f.key) }); setConfirmed(false); }}>Fjern forslag: {CHAT_FIELDS[slug][f.key].label}</button></dd>
      </div>)}</dl> : <p className="text-sm">Ingen skjemaforslag ennå. Beskrivelsen kan likevel tas med videre.</p>}
      <label className="block text-sm font-semibold">Beskrivelse til saken (kan redigeres)
        <textarea rows={4} maxLength={2000} disabled={busy} className="w-full border rounded-lg p-3 mt-1 font-normal" value={brief} onChange={e => { setNotes(e.target.value); setConfirmed(false); }} /></label>
      {customerText.length > 2000 && notes === null && <p className="text-sm text-amber-800">Beskrivelsen er forkortet til 2000 tegn. Kontroller at viktige opplysninger og rettelser er med.</p>}
      <label className="flex gap-2 text-sm items-start"><input type="checkbox" disabled={busy} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Jeg har kontrollert forslagene og beskrivelsen. Jeg vil se gjennom skjemaet før vurdering.</label>
      {draft.input.trim() && <p className="text-sm text-amber-800">Meldingen i skrivefeltet er ikke behandlet og blir ikke overført. Ta eventuelle viktige opplysninger med i beskrivelsen.</p>}
      <Button full disabled={!confirmed || busy} onClick={() => { setBrief({ notes: brief }); onApply(chatPatch(slug, facts)); setOpen(false); setConfirmed(false); }}>Bruk svarene og kontroller skjemaet</Button>
    </div>}
    <Button full variant="ghost" onClick={() => { active.current?.abort(); active.current = null; setBusy(false); setOpen(false); }}>Bruk skjemaet uten å overføre svar</Button>
  </section>;
}
