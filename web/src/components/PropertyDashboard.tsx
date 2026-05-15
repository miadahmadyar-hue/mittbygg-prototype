"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Alert } from "@/components/ui/Alert";
import { Sheet } from "@/components/ui/Sheet";
import type { Address, Tegning } from "@/lib/data/addresses";

export function PropertyDashboard({ p }: { p: Address }) {
  const [showArkiv, setShowArkiv] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const sakerCount = p.bygg.tidligereSaker.length;
  const tegninger = p.bygg.tegninger ?? [];
  const tegningerCount = tegninger.length;
  const arkivKilder = Array.from(new Set(tegninger.map((t) => t.kilde)));

  return (
    <>
      <Topbar
        title="Min eiendom"
        right={
          <button className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center" aria-label="Varsler">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
          </button>
        }
      />
      <div className="view">
        <div
          className="text-white p-6 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0a4f3c, #052f24)" }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              top: -50, right: -50,
            }}
          />
          <h2 className="text-[22px] font-bold tracking-tight relative">{p.street}</h2>
          <p className="text-white/75 mt-1 relative">{p.postal} {p.city}</p>
          {(() => {
            const hasReal = p.bygg.bygg_source && p.bygg.bygg_source !== "default";
            const isKartverket = p.id.startsWith("k_");
            const braVal = p.bygg.BRA ?? (isKartverket && !hasReal ? "~130" : "—");
            const etasjerVal = p.bygg.etasjer ?? (isKartverket && !hasReal ? "2" : "—");
            const isEstimated = isKartverket && !hasReal && (p.bygg.BRA == null || p.bygg.etasjer == null);
            return (
              <>
                <div className="grid grid-cols-3 gap-4 mt-5 relative">
                  <Stat num={braVal} lbl="m² BRA" />
                  <Stat num={p.bygg.byggeAar} lbl="Byggeår" />
                  <Stat num={`${etasjerVal}${p.bygg.kjeller ? "+K" : ""}`} lbl="Etasjer" />
                </div>
                {hasReal ? (
                  <div className="mt-3 relative flex items-center gap-1.5 text-[11px] text-green-200/80">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>
                    Hentet fra Matrikkel
                  </div>
                ) : isEstimated ? (
                  <div className="mt-3 relative flex items-center gap-1.5 text-[11px] text-white/50">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                    Typiske verdier — registreres fra Matrikkelen ved innsending
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>

        <Link href={`/property/${p.id}/tiltak`} className="contents">
          <Button size="lg" full>
            Hva vil du gjøre?
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </Link>

        {/* Eiendomsinfo */}
        <SectionHead title="Eiendomsinfo" right={
          <button onClick={() => setShowInfo(true)} className="text-sm text-green-500 font-semibold">Se alt</button>
        } />
        <div className="bg-white border border-gray-100 rounded-xl">
          <KV k="Gnr/Bnr" v={`${p.matrikkel.gnr}/${p.matrikkel.bnr}`} />
          <KV k="Kommune" v={p.matrikkel.kommune} />
          <KV k="Tomt" v={p.bygg.tomt ? `${p.bygg.tomt} m²` : "Ukjent"} />
          <KV k="Byggegrenser" v={`${p.bygg.byggegrenser.nord} m fra alle sider`} />
          <KV k="Reguleringsplan" v={p.bygg.regplan} last align="right" />
        </div>

        {/* Tidligere saker */}
        <SectionHead
          title="Tidligere saker"
          right={sakerCount > 0 ? <Pill>{sakerCount} stk</Pill> : null}
        />
        {sakerCount === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl text-center py-6">
            <p className="text-sm text-gray-500">Ingen byggesaker registrert i DiBK-arkivet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {p.bygg.tidligereSaker.map((s, i, arr) => (
              <div
                key={i}
                className={`px-5 py-3.5 flex justify-between items-center ${
                  i < arr.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{s.type}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.aar} · {s.status}</div>
                </div>
                <Pill variant={s.status === "Avslag" ? "red" : "green"}>{s.status}</Pill>
              </div>
            ))}
          </div>
        )}

        {/* Tegninger på arkiv */}
        <SectionHead
          title="Tegninger på arkiv"
          right={tegningerCount > 0 ? (
            <button onClick={() => setShowArkiv(true)} className="text-sm text-green-500 font-semibold">
              Se alle ({tegningerCount})
            </button>
          ) : null}
        />
        {tegningerCount === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl text-center py-6 px-5">
            <p className="text-sm text-gray-500">Ingen digitale tegninger funnet i kommunens arkiv.</p>
            <p className="text-xs text-gray-500 mt-2">
              Du kan laste opp egne tegninger eller bestille originalene fra {p.matrikkel.kommune} kommune.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {tegninger.slice(0, 3).map((t, i, arr) => (
                <TegningRow key={i} t={t} last={i === arr.length - 1} />
              ))}
              {tegningerCount > 3 && (
                <div className="text-center py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => setShowArkiv(true)}
                    className="text-sm text-green-500 font-semibold"
                  >
                    + {tegningerCount - 3} flere tegninger
                  </button>
                </div>
              )}
            </div>
            <Alert>
              Hentet fra {arkivKilder.join(" og ")}. Lastes ned automatisk når du starter et tiltak.
            </Alert>
          </>
        )}

        <SectionHead title="Aktive prosjekter" />
        <div className="bg-white border border-gray-100 rounded-xl text-center py-6">
          <p className="text-sm text-gray-500">Ingen pågående prosjekter.</p>
          <Link href={`/property/${p.id}/tiltak`} className="contents">
            <Button variant="ghost" size="sm" className="mt-3">+ Nytt tiltak</Button>
          </Link>
        </div>
      </div>

      <Sheet open={showInfo} onClose={() => setShowInfo(false)}>
        <h2 className="text-[22px] font-bold">{p.street}</h2>
        <p className="text-sm text-gray-500 mt-2">
          Komplett eiendomsdata fra Matrikkelen og kommunens kart.
        </p>
        <div className="mt-4 space-y-0">
          <KV k="Adresse" v={`${p.street}, ${p.postal} ${p.city}`} />
          <KV k="Gnr/Bnr" v={`${p.matrikkel.gnr}/${p.matrikkel.bnr}`} />
          <KV k="Kommune" v={p.matrikkel.kommune} />
          <KV k="Tomt" v={p.bygg.tomt ? `${p.bygg.tomt} m²` : "Ukjent"} />
          <KV k="BRA" v={p.bygg.BRA != null ? `${p.bygg.BRA} m²` : "Ukjent"} />
          <KV k="Byggeår" v={String(p.bygg.byggeAar)} />
          <KV k="Etasjer" v={`${p.bygg.etasjer ?? "—"}${p.bygg.kjeller ? " + kjeller" : ""}${p.bygg.garasje ? " + garasje" : ""}`} />
          <KV k="Reguleringsplan" v={p.bygg.regplan} align="right" />
          <KV
            k="Byggegrenser"
            v={`N/S/Ø/V: ${p.bygg.byggegrenser.nord}/${p.bygg.byggegrenser.sor}/${p.bygg.byggegrenser.ost}/${p.bygg.byggegrenser.vest} m`}
            last
          />
        </div>
        <div className="mt-6">
          <Button full onClick={() => setShowInfo(false)}>Lukk</Button>
        </div>
      </Sheet>

      <Sheet open={showArkiv} onClose={() => setShowArkiv(false)}>
        <ArkivSheet tegninger={tegninger} kilder={arkivKilder} />
        <div className="mt-4">
          <Button full onClick={() => setShowArkiv(false)}>Ferdig</Button>
        </div>
      </Sheet>
    </>
  );
}

function ArkivSheet({ tegninger, kilder }: { tegninger: Tegning[]; kilder: string[] }) {
  // Group by saksnr for hierarchy
  const grouped = new Map<string, { saksnr: string; year: number; items: Tegning[] }>();
  for (const t of tegninger) {
    const g = grouped.get(t.saksnr);
    if (g) g.items.push(t);
    else grouped.set(t.saksnr, { saksnr: t.saksnr, year: t.year, items: [t] });
  }
  const groups = Array.from(grouped.values()).sort((a, b) => b.year - a.year);

  return (
    <>
      <h2 className="text-[22px] font-bold">Tegninger på arkiv</h2>
      <p className="text-sm text-gray-500 mt-2">Alt som ligger digitalt hos kommunen.</p>
      <div className="mt-3">
        <Alert>
          <strong>Kilde:</strong> {kilder.join(" · ")}<br />
          <span className="text-xs">
            I produksjon hentes tegningene live via kommunens saksinnsyn-API.
            Eldre saker må ofte bestilles manuelt fra kommunens arkiv.
          </span>
        </Alert>
      </div>
      <div className="mt-4 max-h-[55vh] overflow-y-auto -mx-2 px-2">
        {groups.map((g) => (
          <div key={g.saksnr} className="mb-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sak {g.saksnr}</h4>
              <span className="text-xs text-gray-500">{g.year}</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl">
              {g.items.map((t, i) => (
                <TegningRow key={i} t={t} last={i === g.items.length - 1} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TegningRow({ t, last, compact }: { t: Tegning; last: boolean; compact?: boolean }) {
  const palette = t.type === "PDF"
    ? { bg: "#fde0e0", fg: "#c53030" }
    : t.type === "IFC"
      ? { bg: "#e3edf7", fg: "#2156a8" }
      : { bg: "#fef3d6", fg: "#946800" };
  return (
    <div
      className={`flex items-center gap-3 ${compact ? "px-4 py-3" : "px-4 py-3"} ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <div
        className="rounded grid place-items-center shrink-0 text-[9px] font-extrabold tracking-wider"
        style={{
          width: compact ? 32 : 36,
          height: compact ? 40 : 44,
          background: palette.bg,
          color: palette.fg,
        }}
      >
        {t.type}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{t.title}</div>
        <div className="text-xs text-gray-500 truncate mt-0.5">
          {t.year} · {t.kilde} · {t.saksnr}
        </div>
      </div>
      <button
        type="button"
        className="text-gray-400 hover:text-green-500 p-1"
        aria-label={`Last ned ${t.title}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </button>
    </div>
  );
}

function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      {right}
    </div>
  );
}

function Stat({ num, lbl }: { num: string | number; lbl: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight">{num}</div>
      <div className="text-xs opacity-70 mt-0.5">{lbl}</div>
    </div>
  );
}

function KV({ k, v, last, align = "left" }: { k: string; v: string; last?: boolean; align?: "left" | "right" }) {
  return (
    <div
      className={`flex justify-between gap-3 px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className={`font-semibold ${align === "right" ? "text-right max-w-[60%]" : ""}`}>{v}</span>
    </div>
  );
}
