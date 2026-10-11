"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDraftState } from "@/lib/projects";
import { useLang, useT } from "@/lib/i18n/context";
import { sessionFetch } from "@/lib/api/session";
import type { Address } from "@/lib/data/addresses";
import { TILTAK } from "@/lib/data/tiltak";
import type { ChatMessage } from "@/lib/ai/chat";
import type { ChatAttachments } from "@/lib/ai/attachments";
import { activeFields, applyIntakeUpdates, missingFields, type IntakeAnswers, type IntakeField, type IntakeUpdate, type IntakeValue } from "@/lib/ai/intake";
import { ChatAttachmentPicker } from "@/components/ChatAttachmentPicker";
import { Button } from "@/components/ui/Button";
import { Topbar } from "@/components/ui/Topbar";
import { ResultPhases, type Phase } from "./SimpleWizard";

type Draft = { mode: "choose" | "chat" | "review" | "manual"; messages: ChatMessage[]; answers: IntakeAnswers; evidence: Record<string, string>; input: string; notes: string | null; hydrated: boolean; greeting: string; specialist: "architect" | "engineer"; assessmentInput: string | null };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function ConversationalWizard({ p, slug, children }: { p: Address; slug: string; children: ReactNode }) {
  const t = useT(); const { lang } = useLang(); const router = useRouter();
  const label = (pair: [string, string]) => t(...pair);
  const [draft, setDraft] = useDraftState<Draft>("intake", { mode: "choose", messages: [], answers: {}, evidence: {}, input: "", notes: null, hydrated: false, greeting: "", specialist: "architect", assessmentInput: null });
  const [entry, setEntry] = useDraftState<{ messages: ChatMessage[]; notes: string; attachments: ChatAttachments | null }>("entryChat", { messages: [], notes: "", attachments: null });
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [, setBrief] = useDraftState("chatBrief", { notes: "" });
  const [fields, setFields] = useState<IntakeField[] | null>(null);
  const [busy, setBusy] = useState(false); const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [error, setError] = useState(""); const [confirmed, setConfirmed] = useState(false);
  const [retryConfig, setRetryConfig] = useState(0);
  const active = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const messages = draft.messages.length ? draft.messages : entry.messages;
  const mode = draft.mode === "choose" && entry.messages.length ? "chat" : draft.mode;
  const collectedNotes = entry.notes
    ? [entry.notes, ...messages.slice(entry.messages.length).filter(m => m.role === "user").map(m => m.content)].join("\n\n")
    : messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");
  const notes = draft.notes ?? collectedNotes.slice(0, 2000);
  const missing = fields ? missingFields(fields, draft.answers) : [];
  const visible = fields ? activeFields(fields, draft.answers) : [];
  const approvedUse = draft.answers.room ?? draft.answers.fra ?? draft.answers.romtype;
  const atLimit = messages.length >= 38 || messages.reduce((n, m) => n + m.content.length, 0) + draft.input.length > 30000;
  const project = TILTAK.find(item => item.slug === slug);
  const title = project ? t(project.name, project.name_en) : t("Prosjekt", "Project");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/intake/${slug}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!Array.isArray(result.fields) || !result.fields.length) throw new Error();
      setFields(result.fields);
    }).catch(() => { if (!controller.signal.aborted) setError(t("Kunne ikke hente spørsmålene. Prøv igjen eller bruk trinnvis skjema.", "Could not load the questions. Retry or use the step-by-step form.")); });
    return () => controller.abort();
  }, [slug, retryConfig, t]);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => { if (messages.length && mode === "chat") end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length, mode]);

  async function send(hydrate = false) {
    if (!fields || busy || attachmentBusy || active.current || (!hydrate && (!draft.input.trim() || atLimit))) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setError(""); setConfirmed(false);
    const conversation: ChatMessage[] = hydrate ? messages : [...messages, { role: "user", content: draft.input.trim() }];
    try {
      const response = await sessionFetch(`${API}/api/ai/intake`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(90000)]),
        body: JSON.stringify({ slug, hydrate: hydrate || !draft.hydrated, language: lang, specialist: draft.specialist, answers: draft.answers, session_id: entry.attachments?.session_id ?? null, messages: conversation.map(({ role, content }) => ({ role, content })) }) });
      if ([403, 409].includes(response.status)) throw new Error(t("Last opp vedleggene på nytt eller fjern dem for å fortsette.", "Upload the attachments again or remove them to continue."));
      if (response.status === 429) throw new Error(t("Chatgrensen er nådd. Du kan fortsatt redigere og fullføre skjemaet i oversikten.", "The chat limit has been reached. You can still edit and complete the form in the review."));
      if (!response.ok) throw new Error();
      const answer = await response.json();
      if (typeof answer.reply !== "string" || !answer.reply.trim() || !Array.isArray(answer.updates)) throw new Error();
      if (controller.signal.aborted) return;
      const updates = answer.updates as IntakeUpdate[];
      const answers = applyIntakeUpdates(fields, draft.answers, updates);
      const evidence = { ...draft.evidence };
      for (const update of updates) if (Object.hasOwn(answers, update.key) && answers[update.key] === update.value) evidence[update.key] = update.evidence;
      setDraft({ ...draft, mode: "chat", hydrated: true, answers, evidence, input: hydrate ? draft.input : "", greeting: hydrate ? answer.reply : "",
        messages: hydrate ? conversation : [...conversation, { role: "assistant", content: answer.reply, specialist: draft.specialist }] });
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error && e.message && !["TypeError", "TimeoutError"].includes(e.name) ? e.message : t("Chatten er utilgjengelig. Meldingen er beholdt. Prøv igjen eller fullfør i oversikten.", "Chat is unavailable. Your message is saved. Retry or complete the review."));
    } finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }

  function edit(key: string, value: IntakeValue) {
    setConfirmed(false);
    setDraft(previous => ({ ...previous, answers: { ...previous.answers, [key]: value, ...(["room", "fra", "romtype"].includes(key) ? { godkjent_bruk_bekreftet: false } : {}) }, evidence: { ...previous.evidence, [key]: "" } }));
  }

  async function assess() {
    if (!fields || !confirmed || missing.length || busy || attachmentBusy || draft.input.trim()) return;
    setBusy(true); setError("");
    const controller = new AbortController(); active.current = controller;
    try {
      const response = await sessionFetch(`${API}/api/intake/${slug}/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        body: JSON.stringify({ answers: draft.answers, confirmed: true, property_id: p.id, byggeAar: p.bygg.byggeAar ?? null }) });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (controller.signal.aborted) return;
      setBrief({ notes }); setDraft(previous => ({ ...previous, assessmentInput: JSON.stringify(result.input) })); setPhase({ kind: "result", result }); setConfirmed(false);
    } catch { if (!controller.signal.aborted) setError(t("Vurderingen kunne ikke fullføres. Svarene er beholdt. Kontroller obligatoriske felt og prøv igjen.", "The assessment could not be completed. Your answers are saved. Check required fields and retry.")); }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }

  if (phase.kind !== "wizard") return <ResultPhases p={p} slug={slug} phase={phase} setPhase={setPhase} onEdit={() => {
    setConfirmed(false); setPhase({ kind: "wizard", step: 0 });
    setDraft({ ...draft, mode: "result" in phase && draft.assessmentInput === JSON.stringify(phase.result.input) ? "review" : "manual" });
  }} />;
  if (mode === "manual") return <><div className="px-5 py-2 border-b"><Button variant="ghost" onClick={() => setDraft({ ...draft, mode: "chat" })}>{t("Bytt til samtale og samlet oversikt", "Switch to conversation and single review")}</Button></div>{children}</>;

  return <><Topbar title={title} onBack={() => router.push(`/property/${p.id}/tiltak`)} /><main className="view">
    <div><p className="page-kicker">{t("Fortell → kontroller → fortsett", "Describe → review → continue")}</p><h1 className="text-2xl font-semibold mt-2">{mode === "review" ? t("Skjemaet ditt – samlet på ett sted", "Your form—all in one place") : t("Fortell oss om prosjektet", "Tell us about your project")}</h1><p className="text-sm text-gray-600 mt-2">{t("AI fyller ut et utkast fra svarene dine. Du retter og bekrefter én samlet oversikt før vurdering.", "AI fills a draft from your answers. Edit and confirm one review before the assessment.")}</p></div>
    {mode === "choose" && <section className="panel p-5 space-y-3"><Button full onClick={() => setDraft({ ...draft, mode: "chat" })}>{t("Fyll ut med en samtale", "Fill the form through conversation")}</Button><p className="text-sm">{t("Du kan også fylle ut alle svar direkte i oversikten.", "You can also enter all answers directly in the review.")}</p></section>}
    {mode === "chat" && <section className="panel p-4 space-y-4" aria-label={t("Prosjektsamtale", "Project conversation")}>
      <div className="flex gap-2">{(["architect", "engineer"] as const).map(role => <Button key={role} size="sm" disabled={busy} aria-pressed={draft.specialist === role} variant={draft.specialist === role ? "primary" : "secondary"} onClick={() => setDraft({ ...draft, specialist: role })}>{role === "architect" ? t("AI-arkitekt", "AI architect") : t("AI-ingeniør", "AI engineer")}</Button>)}</div>
      <div role="log" aria-live="polite" aria-label={t("Samtale", "Conversation")} className="max-h-96 overflow-y-auto space-y-3">
        {!messages.length && <p className="text-sm bg-green-50 rounded-lg p-3">{t("Hva ønsker du å gjøre? Ta gjerne med mål, dagens bruk og ønsket løsning. Si «vet ikke» når noe må avklares.", "What would you like to do? Include measurements, current use and your plans. Say ‘I don’t know’ when something needs clarification.")}</p>}
        {messages.map((m, i) => <div key={i} className={`p-3 rounded-lg text-sm ${m.role === "user" ? "bg-green-50 ml-4" : "bg-gray-50 mr-4"}`}><p className="font-semibold">{m.role === "user" ? t("Du", "You") : m.specialist === "engineer" ? t("AI-ingeniør", "AI engineer") : t("AI-arkitekt", "AI architect")}</p><p className="whitespace-pre-wrap break-words">{m.content}</p></div>)}
        {draft.greeting && <p className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{draft.greeting}</p>}<div ref={end} />
      </div>
      {!draft.hydrated && messages.length > 0 && <Button full disabled={busy || attachmentBusy || !fields} onClick={() => void send(true)}>{t("Fyll skjemaet fra samtalen hittil", "Fill the form from our conversation so far")}</Button>}
      <form onSubmit={e => { e.preventDefault(); void send(); }} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="intake-message">{t("Dine opplysninger", "Your project details")}</label><textarea id="intake-message" rows={3} maxLength={2000} disabled={busy} value={draft.input} onChange={e => { setConfirmed(false); setDraft({ ...draft, input: e.target.value }); }} className="w-full border rounded-lg p-3" />
        <ChatAttachmentPicker value={entry.attachments} disabled={busy} onBusy={setAttachmentBusy} onChange={attachments => setEntry(previous => ({ ...previous, attachments }))} />
        <Button type="submit" disabled={!fields || busy || attachmentBusy || atLimit || !draft.input.trim()}>{busy ? t("AI fyller ut …", "AI is filling the form …") : t("Send melding", "Send message")}</Button>
        {busy && <Button type="button" variant="ghost" onClick={() => { active.current?.abort(); active.current = null; setBusy(false); }}>{t("Avbryt", "Cancel")}</Button>}
      </form>
      <p className="text-xs text-gray-500">{t("Samtalen og utkastet lagres i denne nettleseren. Meldinger og vedlegg sendes til AI når du ber om svar. Unngå sensitive personopplysninger.", "The conversation and draft are saved in this browser. Messages and attachments are sent to AI when you request a response. Avoid sensitive personal information.")}</p>
      {atLimit && <p role="status" className="text-sm">{t("Samtalen er full. Du kan fullføre svarene i oversikten.", "This conversation is full. Complete any remaining answers in the review.")}</p>}
      {fields && <p role="status" className="text-sm text-green-800">{Object.keys(draft.answers).filter(k => visible.some(f => f.key === k && !f.manual)).length} {t("svar i utkastet", "answers in the draft")}. {missing.length ? `${missing.length} ${t("obligatoriske felt gjenstår", "required fields remain")}.` : t("Du kan kontrollere oversikten nå.", "You can review the form now.")}</p>}
    </section>}
    {mode !== "review" && <Button full variant="secondary" disabled={!fields || busy || attachmentBusy} onClick={() => { setConfirmed(false); setDraft({ ...draft, mode: "review" }); }}>{t("Kontroller utfylt skjema", "Review completed form")}</Button>}
    {mode === "review" && fields && <section className="panel p-5 space-y-5">
      <p className="text-sm">{t("Kontroller alle svar. Obligatoriske felt er merket *. Ukjente valg må avklares; AI har ikke godkjent prosjektet.", "Check every answer. Required fields are marked *. Unknown details need clarification; AI has not approved the project.")}</p>
      {visible.map(field => <IntakeControl key={field.key} field={field} value={draft.answers[field.key] ?? null} evidence={draft.evidence[field.key]} disabled={busy || (field.manual && (typeof approvedUse !== "string" || approvedUse === "usikker"))} onChange={value => edit(field.key, value)} />)}
      <label className="block text-sm font-semibold">{t("Beskrivelse til saken – rediger ved behov", "Case description—edit as needed")}<textarea className="w-full border rounded-lg p-3 mt-2 font-normal" rows={4} maxLength={2000} value={notes} disabled={busy} onChange={e => { setConfirmed(false); setDraft({ ...draft, notes: e.target.value }); }} /></label>
      {draft.notes === null && collectedNotes.length > 2000 && <p className="text-sm text-amber-800">{t("Beskrivelsen er forkortet til 2000 tegn. Kontroller at viktige rettelser er med.", "The description was shortened to 2,000 characters. Check that important corrections are included.")}</p>}
      {missing.length > 0 && <div role="status" className="rounded-lg bg-amber-50 p-3 text-sm"><p className="font-semibold">{t("Må fylles ut før vurdering:", "Required before assessment:")}</p><ul className="list-disc pl-5">{missing.map(f => <li key={f.key}>{label(f.label)}</li>)}</ul><p className="mt-2">{t("Svar i chatten eller rediger feltene over. Du kan lagre utkastet og komme tilbake når opplysningene er kjent.", "Answer in chat or edit above. Your draft is saved so you can return when the details are known.")}</p></div>}
      {draft.input.trim() && <p role="alert" className="text-sm text-amber-800">{t("Du har en usendt melding. Send den i chatten eller tøm skrivefeltet før du fortsetter.", "You have an unsent message. Send it in chat or clear the message before continuing.")}</p>}
      <label className="flex gap-3 text-sm items-start"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{t("Jeg har kontrollert svarene og beskrivelsen. Jeg ønsker en foreløpig vurdering.", "I have checked the answers and description. I want a preliminary assessment.")}</label>
      <Button full disabled={!confirmed || missing.length > 0 || busy || attachmentBusy || Boolean(draft.input.trim())} onClick={() => void assess()}>{busy ? t("Vurderer …", "Assessing …") : t("Bekreft og se vurdering", "Confirm and view assessment")}</Button>
      <Button full variant="secondary" disabled={busy} onClick={() => { setConfirmed(false); setDraft({ ...draft, mode: "chat" }); }}>{t("Fortsett samtalen", "Continue the conversation")}</Button>
    </section>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!fields && <Button variant="secondary" onClick={() => { setError(""); setRetryConfig(n => n + 1); }}>{t("Hent spørsmål på nytt", "Reload questions")}</Button>}
    <p className="text-xs text-gray-500">{t("Dette forbereder saken. Faglig kontroll, bestilling, betaling og innsending skjer separat og krever egne bekreftelser.", "This prepares your case. Professional review, ordering, payment and submission are separate steps requiring their own confirmation.")}</p>
    <details className="text-sm"><summary>{t("Vil du bruke trinnvis skjema?", "Prefer the step-by-step form?")}</summary><p className="my-2">{t("Tidligere svar i trinnvis skjema er beholdt separat. Samtaleutkastet beholdes også når du bytter.", "Previous step-by-step answers are kept separately. Your conversation draft is also kept when you switch.")}</p><Button variant="ghost" disabled={busy || attachmentBusy} onClick={() => setDraft({ ...draft, mode: "manual" })}>{t("Åpne trinnvis skjema", "Open step-by-step form")}</Button></details>
  </main></>;
}

function IntakeControl({ field, value, evidence, disabled, onChange }: { field: IntakeField; value: IntakeValue; evidence?: string; disabled: boolean; onChange: (value: IntakeValue) => void }) {
  const t = useT(); const label = t(...field.label); const id = `intake-${field.key}`;
  const className = "block w-full border rounded-lg p-3 mt-2 font-normal bg-white";
  const unknown = t("Ikke oppgitt / må avklares", "Not provided / needs clarification");
  if (field.manual) return <label className="flex gap-3 text-sm"><input type="checkbox" checked={value === true} disabled={disabled} onChange={e => onChange(e.target.checked)} />{label}</label>;
  return <div><label htmlFor={id} className="text-sm font-semibold">{label}{field.unit && ` (${field.unit})`}{!field.nullable && " *"}</label>
    {field.choices.length ? <select id={id} disabled={disabled} className={className} value={value == null ? "" : String(value)} onChange={e => onChange(e.target.value || null)}><option value="">{unknown}</option>{field.choices.map(c => <option key={c.value} value={c.value}>{t(...c.label)}</option>)}</select>
      : field.type === "boolean" ? <select id={id} disabled={disabled} className={className} value={value == null ? "" : String(value)} onChange={e => onChange(e.target.value === "" ? null : e.target.value === "true")}><option value="">{unknown}</option><option value="true">{t("Ja", "Yes")}</option><option value="false">{t("Nei", "No")}</option></select>
        : ["number", "integer"].includes(field.type) ? <input id={id} disabled={disabled} type="number" className={className} step={field.type === "integer" ? 1 : "any"} min={field.min ?? undefined} max={field.max ?? undefined} placeholder={unknown} value={typeof value === "number" ? value : ""} onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))} />
          : <textarea id={id} rows={3} disabled={disabled} className={className} maxLength={field.maxLength} value={typeof value === "string" ? value : ""} onChange={e => onChange(e.target.value || null)} />}
    {value === null && <p className="text-xs text-amber-800 mt-1">{field.nullable ? t("Kan avklares senere. Ingen verdi er antatt.", "Can be clarified later. No value has been assumed.") : t("Oppgi et svar, eller velg «vet ikke» hvis tilgjengelig.", "Provide an answer, or select unknown if available.")}</p>}
    {evidence && <p className="text-xs text-gray-500 mt-1 break-words">{t("Fra din melding:", "From your message:")} «{evidence}»</p>}
  </div>;
}
