"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Alert } from "@/components/ui/Alert";
import { Sheet } from "@/components/ui/Sheet";
import { useT } from "@/lib/i18n/context";
import type { Address, Tegning } from "@/lib/data/addresses";

export function PropertyDashboard({ p }: { p: Address }) {
  const t = useT();
  const [showArchive, setShowArchive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const cases = p.bygg.tidligereSaker ?? [];
  const drawings = p.bygg.tegninger ?? [];
  const archiveSources = Array.from(new Set(drawings.map((drawing) => drawing.kilde)));
  const hasRegistryData = p.bygg.bygg_source && p.bygg.bygg_source !== "default";
  const isKartverket = p.id.startsWith("k_");
  const area = p.bygg.BRA ?? (isKartverket && !hasRegistryData ? "~130" : "-");
  const floors = p.bygg.etasjer ?? (isKartverket && !hasRegistryData ? "2" : "-");

  return (
    <>
      <Topbar
        title={t("Eiendomsoversikt", "Property overview")}
        right={
          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
            aria-label={t("Varsler", "Notifications")}
          >
            <BellIcon />
          </button>
        }
      />

      <main className="view view-wide">
        <header className="flex flex-col gap-5 border-b border-gray-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="page-kicker">{t("Min eiendom", "My property")}</p>
            <h1 className="page-title mt-2">{p.street}</h1>
            <p className="mt-2 text-[15px] text-gray-500">{p.postal} {p.city} · {p.matrikkel.kommune}</p>
          </div>
          <Link href={`/property/${p.id}/tiltak`} className="primary-link">
            {t("Start nytt tiltak", "Start a new project")}
            <ArrowIcon />
          </Link>
        </header>

        <section className="property-summary" aria-label={t("Nøkkeltall", "Key figures")}>
          <div className="property-summary-copy">
            <p className="text-xs font-semibold uppercase text-white/60">{t("Registrert eiendom", "Registered property")}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-[28px]">{p.street}</h2>
            <p className="mt-1 text-sm text-white/65">Gnr/Bnr {p.matrikkel.gnr}/{p.matrikkel.bnr}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/70">
              <CheckIcon />
              {hasRegistryData
                ? t("Eiendomsdata hentet fra Matrikkelen", "Property data retrieved from the cadastre")
                : t("Eiendomsdata kontrolleres ved innsending", "Property data is verified on submission")}
            </div>
          </div>
          <div className="property-stats">
            <Stat value={area} label={t("m² BRA", "m² floor area")} />
            <Stat value={p.bygg.byggeAar} label={t("Byggeår", "Year built")} />
            <Stat value={`${floors}${p.bygg.kjeller ? "+K" : ""}`} label={t("Etasjer", "Floors")} />
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel overflow-hidden">
            <SectionHeader
              eyebrow={t("Grunnlag", "Property record")}
              title={t("Eiendomsinformasjon", "Property information")}
              action={
                <button type="button" onClick={() => setShowInfo(true)} className="text-link">
                  {t("Se komplett oversikt", "View full record")}
                </button>
              }
            />
            <dl className="divide-y divide-gray-100">
              <KV label="Gnr/Bnr" value={`${p.matrikkel.gnr}/${p.matrikkel.bnr}`} />
              <KV label={t("Kommune", "Municipality")} value={p.matrikkel.kommune} />
              <KV label={t("Tomteareal", "Plot area")} value={p.bygg.tomt ? `${p.bygg.tomt} m²` : t("Ikke registrert", "Not registered")} />
              <KV label={t("Byggegrense", "Building limit")} value={`${p.bygg.byggegrenser.nord} ${t("meter", "metres")}`} />
              <KV label={t("Reguleringsplan", "Zoning plan")} value={p.bygg.regplan} />
            </dl>
          </section>

          <aside className="panel project-status">
            <p className="page-kicker">{t("Aktive prosjekter", "Active projects")}</p>
            <div className="status-marker"><FolderIcon /></div>
            <h2 className="mt-5 text-xl font-semibold">{t("Ingen aktive tiltak", "No active projects")}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {t("Start et tiltak for å få dokumentkrav, fremdrift og innsending samlet på ett sted.", "Start a project to manage requirements, progress and submission in one place.")}
            </p>
            <Link href={`/property/${p.id}/tiltak`} className="secondary-link mt-6">
              {t("Opprett tiltak", "Create project")}
              <ArrowIcon />
            </Link>
          </aside>
        </div>

        <div className="dashboard-grid">
          <section className="panel overflow-hidden">
            <SectionHeader
              eyebrow={t("Historikk", "History")}
              title={t("Tidligere byggesaker", "Previous building cases")}
              meta={cases.length > 0 ? `${cases.length} ${t("saker", "cases")}` : undefined}
            />
            {cases.length === 0 ? (
              <EmptyState text={t("Ingen byggesaker er registrert i det digitale arkivet.", "No building cases are registered in the digital archive.")} />
            ) : (
              <div className="divide-y divide-gray-100">
                {cases.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.type}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.aar}</p>
                    </div>
                    <Pill variant={item.status === "Avslag" ? "red" : "green"}>{item.status}</Pill>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel overflow-hidden">
            <SectionHeader
              eyebrow={t("Dokumentasjon", "Documentation")}
              title={t("Tegninger i arkivet", "Archived drawings")}
              action={drawings.length > 0 ? (
                <button type="button" onClick={() => setShowArchive(true)} className="text-link">
                  {t("Se alle", "View all")} ({drawings.length})
                </button>
              ) : undefined}
            />
            {drawings.length === 0 ? (
              <EmptyState text={t("Ingen digitale tegninger ble funnet hos kommunen.", "No digital drawings were found at the municipality.")} />
            ) : (
              <div className="divide-y divide-gray-100">
                {drawings.slice(0, 3).map((drawing, index) => (
                  <DrawingRow key={`${drawing.title}-${index}`} drawing={drawing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Sheet open={showInfo} onClose={() => setShowInfo(false)}>
        <p className="page-kicker">{t("Eiendomsregister", "Property register")}</p>
        <h2 className="mt-2 text-2xl font-semibold">{p.street}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {t("Samlet eiendomsdata fra Matrikkelen og kommunale kartkilder.", "Combined property data from the cadastre and municipal map sources.")}
        </p>
        <dl className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
          <KV label={t("Adresse", "Address")} value={`${p.street}, ${p.postal} ${p.city}`} />
          <KV label="Gnr/Bnr" value={`${p.matrikkel.gnr}/${p.matrikkel.bnr}`} />
          <KV label={t("Kommune", "Municipality")} value={p.matrikkel.kommune} />
          <KV label={t("Tomt", "Plot")} value={p.bygg.tomt ? `${p.bygg.tomt} m²` : t("Ukjent", "Unknown")} />
          <KV label="BRA" value={p.bygg.BRA != null ? `${p.bygg.BRA} m²` : t("Ukjent", "Unknown")} />
          <KV label={t("Byggeår", "Year built")} value={String(p.bygg.byggeAar)} />
          <KV label={t("Etasjer", "Floors")} value={`${p.bygg.etasjer ?? "-"}${p.bygg.kjeller ? t(" + kjeller", " + basement") : ""}${p.bygg.garasje ? t(" + garasje", " + garage") : ""}`} />
          <KV label={t("Reguleringsplan", "Zoning plan")} value={p.bygg.regplan} />
          <KV label={t("Byggegrenser", "Building limits")} value={`N/S/Ø/V: ${p.bygg.byggegrenser.nord}/${p.bygg.byggegrenser.sor}/${p.bygg.byggegrenser.ost}/${p.bygg.byggegrenser.vest} m`} />
        </dl>
        <Button full className="mt-6" onClick={() => setShowInfo(false)}>{t("Lukk", "Close")}</Button>
      </Sheet>

      <Sheet open={showArchive} onClose={() => setShowArchive(false)}>
        <ArchiveSheet drawings={drawings} sources={archiveSources} />
        <Button full className="mt-5" onClick={() => setShowArchive(false)}>{t("Ferdig", "Done")}</Button>
      </Sheet>
    </>
  );
}

function ArchiveSheet({ drawings, sources }: { drawings: Tegning[]; sources: string[] }) {
  const t = useT();
  const grouped = new Map<string, { caseNumber: string; year: number; items: Tegning[] }>();
  for (const drawing of drawings) {
    const group = grouped.get(drawing.saksnr);
    if (group) group.items.push(drawing);
    else grouped.set(drawing.saksnr, { caseNumber: drawing.saksnr, year: drawing.year, items: [drawing] });
  }

  return (
    <>
      <p className="page-kicker">{t("Dokumentarkiv", "Document archive")}</p>
      <h2 className="mt-2 text-2xl font-semibold">{t("Tegninger på arkiv", "Archived drawings")}</h2>
      <div className="mt-4">
        <Alert><strong>{t("Kilde:", "Source:")}</strong> {sources.join(" · ")}</Alert>
      </div>
      <div className="mt-5 max-h-[52vh] space-y-5 overflow-y-auto pr-1">
        {Array.from(grouped.values()).sort((a, b) => b.year - a.year).map((group) => (
          <section key={group.caseNumber}>
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>{t("Sak", "Case")} {group.caseNumber}</span>
              <span>{group.year}</span>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-200">
              {group.items.map((drawing, index) => <DrawingRow key={`${drawing.title}-${index}`} drawing={drawing} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function SectionHeader({ eyebrow, title, action, meta }: { eyebrow: string; title: string; action?: React.ReactNode; meta?: string }) {
  return (
    <div className="flex min-h-[92px] items-end justify-between gap-4 border-b border-gray-100 px-5 py-5 md:px-6">
      <div>
        <p className="page-kicker">{eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {action ?? (meta ? <span className="text-xs font-medium text-gray-500">{meta}</span> : null)}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.2fr)] gap-4 px-5 py-3.5 text-sm md:px-6">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0 border-l border-white/15 pl-5 first:border-0 first:pl-0 md:pl-7">
      <div className="text-2xl font-semibold text-white md:text-[30px]">{value}</div>
      <div className="mt-1 text-xs text-white/60">{label}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-5 py-8 text-sm leading-6 text-gray-500 md:px-6">{text}</p>;
}

function DrawingRow({ drawing }: { drawing: Tegning }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 md:px-6">
      <div className="grid h-10 w-9 shrink-0 place-items-center border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600">{drawing.type}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{drawing.title}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{drawing.year} · {drawing.kilde} · {drawing.saksnr}</p>
      </div>
      <button type="button" className="grid h-8 w-8 shrink-0 place-items-center text-gray-400 hover:text-green-600" aria-label={`Last ned ${drawing.title}`}>
        <DownloadIcon />
      </button>
    </div>
  );
}

function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
}

function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>;
}

function FolderIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h5l2 2h11v10H3z" /><path d="M3 7V5h6l2 2" /></svg>;
}

function DownloadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
}
