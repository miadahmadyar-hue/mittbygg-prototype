"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { downloadBlob } from "@/lib/documents";

type Case = { id: string; created: string; slug: string; address: string; contact: { name: string; email: string; phone: string }; status: string; notification: string };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const statuses: Record<string, string> = { new: "Ny", contacted: "Kontaktet", quoted: "Tilbud sendt", closed: "Avsluttet" };
export default function StaffCases() {
  const [key, setKey] = useState("");
  const [cases, setCases] = useState<Case[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${key}`);
    const response = await fetch(`${API}/api/staff/cases${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      if (response.status === 401) { setCases(null); throw new Error("Tilgang avvist. Kontroller medarbeidernøkkelen."); }
      throw new Error("Saksoversikten er utilgjengelig. Kontroller serveroppsettet og prøv igjen.");
    }
    return response;
  }
  async function load(next = offset) {
    setBusy(true); setError("");
    try { setCases(await (await request(`?offset=${next}`)).json()); setOffset(next); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function action(work: () => Promise<void>) {
    setBusy(true); setError("");
    try { await work(); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  function login(e: FormEvent) { e.preventDefault(); void load(0); }
  return <main className="mx-auto w-full max-w-4xl p-6 space-y-5">
    <h1 className="text-2xl font-semibold">Søknadsklar – mottatte saker</h1>
    <p>Privat oversikt for medarbeidere. Forespørsler er ikke byggesøknader eller betalte bestillinger.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!cases ? <form onSubmit={login} className="grid gap-3"><label>Medarbeidernøkkel<input className="block border rounded p-3 w-full" type="password" autoComplete="off" required value={key} onChange={e => setKey(e.target.value)} /></label><p>Nøkkelen lagres bare i minnet i denne fanen. Bruk aldri kundens demo-innlogging som medarbeidertilgang.</p><Button disabled={busy}>Åpne saksoversikt</Button></form> : <>
      <div className="flex gap-3"><Button disabled={busy} onClick={() => load()}>Oppdater</Button><Button variant="secondary" onClick={() => { setCases(null); setKey(""); setError(""); }}>Logg ut</Button></div>
      {cases.length === 0 && <p>Ingen saker på denne siden.</p>}
      {cases.map(c => <article key={c.id} className="panel p-5 space-y-3">
        <h2 className="font-semibold">{c.id} · {c.slug}</h2><p>{new Date(c.created).toLocaleString("nb-NO")} · {c.address}</p>
        <p>{c.contact.name} · {c.contact.email} · {c.contact.phone}</p>
        <p>E-postvarsel: {c.notification === "sent" ? "Sendt" : c.notification === "failed" ? "Feilet – saken er lagret" : "Venter"}</p>
        <label>Status <select className="border rounded p-2" value={c.status} disabled={busy} onChange={e => { const status = e.target.value; void action(async () => { await request(`/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); setCases(cases.map(row => row.id === c.id ? { ...row, status } : row)); }); }}>{Object.entries(statuses).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
        <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => action(async () => { const response = await request(`/${c.id}/package`); downloadBlob(await response.blob(), `${c.id}.zip`); })}>Last ned sak og vedlegg (ZIP)</Button>
        {c.notification !== "sent" && <Button variant="secondary" disabled={busy} onClick={() => action(async () => { await request(`/${c.id}/notify`, { method: "POST" }); await load(); })}>Prøv e-postvarsel igjen</Button>}</div>
      </article>)}
      <div className="flex gap-3"><Button disabled={busy || offset === 0} onClick={() => load(Math.max(0, offset - 50))}>Forrige</Button><Button disabled={busy || cases.length < 50} onClick={() => load(offset + 50)}>Neste</Button></div>
    </>}
  </main>;
}
