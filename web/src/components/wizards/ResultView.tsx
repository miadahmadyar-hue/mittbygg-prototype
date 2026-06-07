"use client";

import { ReactNode } from "react";
import type { KjellerResult } from "@/lib/regulations/kjeller";
import type { VeggResult } from "@/lib/regulations/vegg";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { getPricing, formatKr, discountPct } from "@/lib/data/pricing";
import { useT } from "@/lib/i18n/context";


type AnyResult = KjellerResult | VeggResult;

const STATUS_CARDS: Record<
  AnyResult["status"],
  { bg: string; border: string; ic: string; icon: ReactNode }
> = {
  green: {
    bg: "bg-gradient-to-br from-[#d8ebe1] to-[#ebf6ef]",
    border: "border-[#c9e1d3]",
    ic: "text-green-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  amber: {
    bg: "bg-gradient-to-br from-[#fdf2d9] to-[#fef8e8]",
    border: "border-[#f3e0a8]",
    ic: "text-amber-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  red: {
    bg: "bg-gradient-to-br from-[#fde0e0] to-[#fef0f0]",
    border: "border-[#f5b7b7]",
    ic: "text-red-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
};

interface Props {
  r: AnyResult;
  slug?: string;
  onGenerateSoknad: () => void;
  onDownloadPdf?: () => Promise<void>;
  pdfLoading?: boolean;
  onRestart: () => void;
}

export function ResultView({ r, slug, onGenerateSoknad, onDownloadPdf, pdfLoading, onRestart }: Props) {
  const t = useT();
  const sCard = STATUS_CARDS[r.status];

  return (
    <>
      <Topbar
        title={t("Resultat", "Result")}
        right={
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center"
            aria-label={t("Last ned", "Download")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        }
      />
      <div className="view">
        <div
          className={`flex items-center gap-3 p-5 rounded-2xl border ${sCard.bg} ${sCard.border}`}
        >
          <div className={`w-12 h-12 rounded-2xl bg-white grid place-items-center shrink-0 ${sCard.ic}`}>
            {sCard.icon}
          </div>
          <div>
            <div className="text-lg font-bold">{r.statusText}</div>
            <div className="text-sm text-gray-700 mt-0.5">{r.statusDesc}</div>
          </div>
        </div>

        {r.lempninger.length > 0 && (
          <div className="bg-green-50 border border-[#c5dccd] rounded-xl p-5">
            <h4 className="text-green-700 font-semibold mb-2 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {t("Lempninger anvendt (PBL § 31-2)", "Exemptions applied (PBL § 31-2)")}
            </h4>
            <ul className="space-y-2">
              {r.lempninger.map((l, i) => (
                <li key={i} className="text-[13px]">
                  <strong>{l.regel}.</strong> {l.tekst}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SectionHead>{t("Regelsjekk", "Rule check")}</SectionHead>
        <ul className="space-y-2">
          {r.findings.map((f, i) => (
            <li
              key={i}
              className="flex gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl items-start"
            >
              <FindingIcon type={f.type} />
              <div className="flex-1">
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-[13px] text-gray-500 mt-0.5">{f.d}</div>
                <div className="text-[11px] text-gray-400 mt-1 font-mono">{f.ref}</div>
              </div>
            </li>
          ))}
        </ul>

        <SectionHead>{t("Søknadsplikt", "Permit requirement")}</SectionHead>
        <div className="bg-white border border-gray-100 rounded-xl">
          <KV k={t("Hjemmel", "Legal basis")} v={r.soknadstype} mono />
          <KV
            k={t("Ansvarsrett", "Pro liability")}
            v={r.ansvarsrett
              ? t("JA — krever ANS-foretak", "YES — needs a liable firm")
              : t("NEI — du står ansvarlig selv", "NO — you are responsible yourself")}
          />
          <KV k={t("Tiltaksklasse", "Work class")} v={`TK${r.tiltaksklasse}`} last />
        </div>

        <PricingCard slug={slug} />

        {"bjelke" in r && r.bjelke && (
          <>
            <SectionHead>{t("Bjelke-anbefaling", "Beam recommendation")}</SectionHead>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-xl grid place-items-center font-bold text-[11px] text-center p-1"
                  style={{
                    width: 70, height: 70,
                    background: "linear-gradient(135deg, #d6b88a, #b89968)",
                    color: "#5a4520",
                  }}
                >
                  {r.bjelke.b}×<br />{r.bjelke.h}
                </div>
                <div>
                  <div className="font-bold text-base">
                    {r.bjelke.b} × {r.bjelke.h} mm
                  </div>
                  <div className="text-sm text-gray-500">{r.bjelke.type}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {t("Spennvidde", "Span")} {r.bjelke.spennvidde} mm · {t("Last", "Load")} {r.bjelke.last} kN/m
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <SectionHead>{t("Tidslinje", "Timeline")}</SectionHead>
        <Timeline ansvarsrett={r.ansvarsrett} />

        <div className="mt-2 flex flex-col gap-2">
          {r.status === "red" ? (
            <>
              <Button variant="secondary" full disabled>
                {t("Søknad kan ikke lages — rett kritiske avvik først", "Application can't be created — fix critical issues first")}
              </Button>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 grid place-items-center shrink-0 text-amber-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-amber-900">{t("Får du ikke til søknaden selv?", "Can't manage the application yourself?")}</div>
                    <div className="text-xs text-amber-700 mt-0.5">{t("En rådgiver fra MittBygg kan hjelpe deg videre — selv med krevende tilfeller.", "A MittBygg advisor can help you — even with difficult cases.")}</div>
                  </div>
                </div>
                <a
                  href="mailto:hei@mittbygg.no?subject=Trenger hjelp med søknad"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl py-3 text-center transition-colors"
                >
                  {t("Kontakt en rådgiver", "Contact an advisor")}
                </a>
              </div>
              <Button variant="ghost" full onClick={onRestart}>
                {t("Start på nytt", "Start over")}
              </Button>
            </>
          ) : (
            <>
              {onDownloadPdf ? (
                <Button
                  size="lg"
                  full
                  disabled={pdfLoading}
                  onClick={onDownloadPdf}
                >
                  {pdfLoading ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  )}
                  {pdfLoading ? t("Genererer PDF…", "Generating PDF…") : t("Last ned søknadspakke (PDF)", "Download application package (PDF)")}
                </Button>
              ) : (
                <Button size="lg" full onClick={onGenerateSoknad}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  {t("Generer søknadspakke", "Generate application package")}
                </Button>
              )}
              <Button variant="ghost" full onClick={onRestart}>
                {t("Start på nytt", "Start over")}
              </Button>
              <a
                href="mailto:hei@mittbygg.no?subject=Trenger hjelp med søknad"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {t("Trenger du hjelp? Snakk med en rådgiver", "Need help? Talk to an advisor")}
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function FindingIcon({ type }: { type: "ok" | "warn" | "fail" }) {
  const cls =
    type === "ok"
      ? "bg-green-50 text-green-500"
      : type === "warn"
        ? "bg-amber-50 text-amber-500"
        : "bg-red-50 text-red-500";
  const icon =
    type === "ok" ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    ) : type === "warn" ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4M12 17h.01" />
        <path d="m10.3 3.86-8.58 14.86A2 2 0 0 0 3.44 22h17.12a2 2 0 0 0 1.72-3.28L13.7 3.86a2 2 0 0 0-3.4 0z" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  return (
    <div className={`w-[22px] h-[22px] rounded-full grid place-items-center shrink-0 mt-0.5 ${cls}`}>
      {icon}
    </div>
  );
}


function Timeline({ ansvarsrett }: { ansvarsrett: boolean }) {
  const tr = useT();
  const steps = [
    { t: tr("Regelsjekk fullført", "Rule check complete"), d: tr("Akkurat nå", "Just now"), state: "done" as const },
    { t: tr("Generer søknadspakke", "Generate application package"), d: tr("~3 minutter", "~3 minutes"), state: "current" as const },
    { t: tr("Nabovarsel + frist", "Neighbor notice + deadline"), d: tr("14 dager", "14 days"), state: "todo" as const },
    {
      t: tr("Kommunal saksbehandling", "Municipal processing"),
      d: ansvarsrett ? tr("12 uker", "12 weeks") : tr("3–12 uker", "3–12 weeks"),
      state: "todo" as const,
    },
    { t: tr("Igangsetting + utførelse", "Start + construction"), d: tr("Etter rammetillatelse", "After framework permit"), state: "todo" as const },
    { t: tr("Ferdigattest", "Completion certificate"), d: tr("3 uker etter ferdigmelding", "3 weeks after completion notice"), state: "todo" as const },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 relative">
          {i < steps.length - 1 && (
            <span
              className="absolute left-[13px] top-7 bottom-0 w-0.5"
              style={{
                background: s.state === "done" ? "var(--color-green-300)" : "var(--color-gray-200)",
              }}
            />
          )}
          <div
            className={`w-7 h-7 rounded-full grid place-items-center shrink-0 text-xs font-bold relative z-10 ${
              s.state === "done"
                ? "bg-green-500 text-white"
                : s.state === "current"
                  ? "bg-gray-800 text-white"
                  : "bg-green-50 text-green-500"
            }`}
          >
            {s.state === "done" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="font-semibold text-sm">{s.t}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <h3 className="text-[17px] font-semibold">{children}</h3>
      {right}
    </div>
  );
}

function KV({ k, v, last, mono }: { k: string; v: string; last?: boolean; mono?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className={`font-semibold ${mono ? "font-mono text-xs" : ""}`}>{v}</span>
    </div>
  );
}

function PricingCard({ slug }: { slug?: string }) {
  const t = useT();
  const p = getPricing(slug ?? "");
  const pct = discountPct(p);
  return (
    <>
      <SectionHead>{t("Søknadsprosess — hva koster det?", "The application process — what does it cost?")}</SectionHead>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">{t("Markedspris (arkitekt/konsulent)", "Market price (architect/consultant)")}</div>
            <div className="text-lg font-semibold text-gray-400 line-through">{formatKr(p.market)}</div>
          </div>
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{pct}%
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs text-gray-500 mb-1">{t("Din pris via MittBygg", "Your price via MittBygg")}</div>
          <div className="text-3xl font-extrabold tracking-tight">{formatKr(p.mittbygg)}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">{t("Du sparer", "You save")} {formatKr(p.market - p.mittbygg)}</div>
        </div>
        {p.note && <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">{p.note}</div>}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          {t("Kommunalt gebyr kommer i tillegg — varierer per kommune og tiltaksstørrelse.", "A municipal fee applies on top — varies by municipality and project size.")}
        </div>
      </div>
    </>
  );
}
