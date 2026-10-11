"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, useT } from "@/lib/i18n/context";
import { saveChatEntry, useDraftState } from "@/lib/projects";
import { sessionFetch } from "@/lib/api/session";
import { TILTAK } from "@/lib/data/tiltak";
import type { ChatMessage } from "@/lib/ai/chat";
import { Button } from "./ui/Button";

type Draft = { messages: ChatMessage[]; input: string; specialist: "architect" | "engineer"; suggested: string | null; notes: string | null };

export function ProjectEntryChat({ propertyId }: { propertyId: string }) {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const [draft, setDraft] = useDraftState<Draft>("entry", { messages: [], input: "", specialist: "architect", suggested: null, notes: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const suggestion = TILTAK.find(item => item.slug === draft.suggested && item.available && !item.hidden);
  const description = draft.messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");
  const notes = draft.notes ?? description.slice(0, 2000);
  // Leave room for the specialist conversation inside the selected wizard.
  const atLimit = draft.messages.length >= 12 || draft.messages.reduce((n, m) => n + m.content.length, 0) + draft.input.length > 20000;

  async function send() {
    if (active.current || busy || atLimit || !draft.input.trim()) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setError(""); setConfirmed(false);
    const messages: ChatMessage[] = [...draft.messages, { role: "user", content: draft.input.trim() }];
    try {
      const response = await sessionFetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/ai/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(90_000)]),
        body: JSON.stringify({ slug: "start", language: lang, specialist: draft.specialist, messages: messages.map(({ role, content }) => ({ role, content })) }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? t("Chatgrensen er nådd. Velg et tiltak nedenfor, eller prøv senere.", "The chat limit has been reached. Choose a project below or try later.") : t("Chatten er utilgjengelig. Prøv igjen eller velg et tiltak nedenfor. Meldingen er beholdt.", "Chat is unavailable. Retry or choose a project below. Your message is saved."));
      const answer = await response.json() as { reply: string; suggested_slug: string | null };
      if (typeof answer.reply !== "string" || !answer.reply.trim()) throw new Error(t("Ugyldig svar. Prøv igjen.", "Invalid response. Please retry."));
      if (controller.signal.aborted) return;
      setDraft({ ...draft, input: "", notes: null, suggested: answer.suggested_slug, messages: [...messages, { role: "assistant", content: answer.reply, specialist: draft.specialist }] });
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error && !["TypeError", "TimeoutError"].includes(e.name) ? e.message : t("Kunne ikke nå chatten. Meldingen er beholdt; prøv igjen eller velg et tiltak nedenfor.", "Could not reach chat. Your message is saved; retry or choose a project below."));
    } finally { if (!controller.signal.aborted) setBusy(false); if (active.current === controller) active.current = null; }
  }

  function continueToWizard() {
    if (!suggestion?.slug || !confirmed || busy) return;
    try {
      saveChatEntry(propertyId, suggestion.slug, { messages: draft.messages, notes });
      router.push(`/property/${propertyId}/tiltak/${suggestion.slug}`);
    } catch { setError(t("Nettleseren kunne ikke lagre samtalen. Kopier beskrivelsen før du velger tiltak nedenfor.", "Your browser could not save the conversation. Copy your description before choosing a project below.")); }
  }

  return <section aria-labelledby="entry-chat-title" className="panel border-green-200 overflow-hidden">
    <div className="bg-green-50 p-5 sm:p-6 border-b border-green-100">
      <p className="page-kicker">{t("Start med en samtale", "Start with a conversation")}</p>
      <h2 id="entry-chat-title" className="text-xl sm:text-2xl font-semibold mt-2">{t("Snakk med AI-arkitekten og AI-ingeniøren", "Chat with the AI architect and AI engineer")}</h2>
      <p className="text-sm text-gray-600 mt-2">{t("Beskriv hva du vil gjøre. Vi hjelper deg å finne riktig veiviser — du trenger ikke velge tiltak først.", "Describe what you want to do. We will help you find the right wizard—you do not need to choose a project type first.")}</p>
    </div>
    <div className="p-5 sm:p-6 space-y-4">
      <div role="group" aria-label={t("Velg AI-rolle", "Choose AI role")} className="flex flex-wrap gap-2">
        {(["architect", "engineer"] as const).map(role => <Button key={role} type="button" disabled={busy} variant={draft.specialist === role ? "primary" : "secondary"} aria-pressed={draft.specialist === role} onClick={() => setDraft({ ...draft, specialist: role })}>
          {role === "architect" ? t("AI-arkitekt", "AI architect") : t("AI-ingeniør", "AI engineer")}</Button>)}
      </div>
      <p className="text-xs text-gray-500">{t("Begge følger samme samtale. AI hjelper med forberedelse; fagperson må kontrollere tekniske løsninger og søknaden.", "Both share the conversation. AI helps with preparation; a professional must review technical designs and the application.")}</p>
      {draft.messages.length > 0 && <div role="log" aria-label={t("Samtale", "Conversation")} aria-live="polite" className="space-y-3 max-h-80 overflow-y-auto">
        {draft.messages.map((m, i) => <div key={i} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-green-50 ml-4" : "bg-gray-50 mr-4"}`}>
          <p className="font-semibold mb-1">{m.role === "user" ? t("Du", "You") : m.specialist === "engineer" ? t("AI-ingeniør", "AI engineer") : t("AI-arkitekt", "AI architect")}</p>
          <p className="whitespace-pre-wrap break-words">{m.content}</p></div>)}
      </div>}
      <form onSubmit={e => { e.preventDefault(); void send(); }} className="space-y-3">
        <label htmlFor="entry-message" className="block text-sm font-semibold">{t("Hva ønsker du å gjøre?", "What would you like to do?")}</label>
        <textarea id="entry-message" maxLength={2000} rows={3} disabled={busy} value={draft.input} onChange={e => { setDraft({ ...draft, input: e.target.value }); setConfirmed(false); }} className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder={t("For eksempel: Jeg vil åpne veggen mellom kjøkken og stue …", "For example: I want to open the wall between my kitchen and living room …")} />
        <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy || atLimit || !draft.input.trim()}>{busy ? t("AI svarer …", "AI is replying …") : t("Send melding", "Send message")}</Button>
          {busy && <Button type="button" variant="ghost" onClick={() => { active.current?.abort(); active.current = null; setBusy(false); }}>{t("Avbryt", "Cancel")}</Button>}</div>
        <p className="text-xs text-gray-500">{t("Samtalen lagres i denne nettleseren og behandles av AI-tjenesten når du sender. Unngå sensitive personopplysninger. Ingen bestilling eller søknad sendes her.", "Your conversation is saved in this browser and processed by the AI service when you send. Avoid sensitive personal information. No order or application is submitted here.")}</p>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {atLimit && <p className="text-sm" role="status">{t("Fortsett til foreslått veiviser eller velg et tiltak nedenfor.", "Continue to the suggested wizard or choose a project below.")}</p>}
      {suggestion && <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold">{t("Foreslått startpunkt", "Suggested starting point")}: {t(suggestion.name, suggestion.name_en)}</h3>
        <label className="block text-sm">{t("Beskrivelse som følger saken — kontroller og rediger", "Description to carry forward—review and edit")}
          <textarea rows={3} maxLength={2000} disabled={busy} className="w-full border rounded-lg p-3 mt-2" value={notes} onChange={e => { setDraft({ ...draft, notes: e.target.value }); setConfirmed(false); }} /></label>
        {description.length > 2000 && draft.notes === null && <p className="text-sm text-amber-800">{t("Beskrivelsen er forkortet. Kontroller at viktige opplysninger er med.", "The description was shortened. Check that important details are included.")}</p>}
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{t("Dette passer prosjektet mitt, og jeg har kontrollert beskrivelsen.", "This fits my project, and I have checked the description.")}</label>
        {draft.input.trim() && <p className="text-xs text-amber-800">{t("Usendt melding er ikke med i beskrivelsen.", "The unsent message is not included in the description.")}</p>}
        <Button disabled={!confirmed || busy} onClick={continueToWizard}>{t("Fortsett til", "Continue to")} {t(suggestion.name, suggestion.name_en)}</Button>
      </div>}
      <p className="text-sm text-gray-600">{t("Foretrekker du å velge selv? Tiltakene ligger nedenfor.", "Prefer to choose yourself? Browse the projects below.")}</p>
    </div>
  </section>;
}
