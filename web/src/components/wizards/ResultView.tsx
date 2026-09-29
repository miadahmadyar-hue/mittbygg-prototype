"use client";

import { ReactNode } from "react";
import type { TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { getPricing, formatKr } from "@/lib/data/pricing";
import { useT } from "@/lib/i18n/context";


type AnyResult = TiltakResult;

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

export function ResultView({ r, slug, onGenerateSoknad, onRestart }: Props) {
  const t = useT();
  const sCard = STATUS_CARDS[r.status];
  const applicationType = r.soknadstype.toLowerCase();
  const needsClarification = applicationType.includes("må avklares") || applicationType.includes("vurderes manuelt") || applicationType.includes("trolig");
  const isExempt = !needsClarification && (applicationType.startsWith("unntatt") || applicationType.startsWith("ikke oppdeling"));
  const needsProfessional = r.ansvarsrett;
  const canBuildPackage = !isExempt && !needsProfessional && !needsClarification && r.status !== "red";
  const outcome = isExempt ? "exempt" : needsProfessional ? "professional" : needsClarification || r.status === "red" ? "clarify" : "application";

  return (
    <>
      <Topbar title={t("Resultat", "Result")} />
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
              {t("Mulige unntak for eksisterende bygg", "Possible exceptions for existing buildings")}
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
              ? t("Ja - ansvarlig foretak må vurderes", "Yes - a responsible firm must be considered")
              : t("Ikke identifisert som krav", "Not identified as required")}
          />
          <KV k={t("Tiltaksklasse", "Work class")} v={`TK${r.tiltaksklasse}`} last />
        </div>

        {canBuildPackage && <PricingCard slug={slug} />}

        <SectionHead>{t("Anbefalt vei videre", "Recommended next steps")}</SectionHead>
        <Timeline outcome={outcome} />

        <div className="mt-2 flex flex-col gap-2">
          {isExempt ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
                <strong>{t("Neste steg:", "Next step:")}</strong>{" "}
                {t("Ta vare på vurderingen, kontroller kommunal plan og meld tiltaket til kommunen etter ferdigstillelse når det kreves.", "Keep the assessment, verify the municipal plan and notify the municipality after completion when required.")}
              </div>
              <Button size="lg" full onClick={onRestart}>
                {t("Ferdig — tilbake til tiltak", "Done — back to projects")}
              </Button>
            </>
          ) : needsProfessional || needsClarification || r.status === "red" ? (
            <>
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
                    <div className="font-semibold text-sm text-amber-900">{t("Faglig avklaring er neste steg", "Professional clarification is the next step")}</div>
                    <div className="text-xs text-amber-700 mt-0.5">{t("Vi lager ikke en søknadspakke før manglende forhold er dokumentert eller ansvarlig foretak er valgt.", "We do not create an application package until the missing facts are documented or a responsible firm is engaged.")}</div>
                  </div>
                </div>
                <a
                  href="mailto:hei@soknadsklar.no?subject=Trenger hjelp med søknad"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl py-3 text-center transition-colors"
                >
                  {t("Be om faglig vurdering", "Request professional assessment")}
                </a>
              </div>
              <Button variant="ghost" full onClick={onRestart}>
                {t("Start på nytt", "Start over")}
              </Button>
            </>
          ) : canBuildPackage ? (
            <>
              <Button size="lg" full onClick={onGenerateSoknad}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                {t("Fortsett med søknadsgrunnlaget", "Continue with the application documents")}
              </Button>
              <Button variant="ghost" full onClick={onRestart}>
                {t("Start på nytt", "Start over")}
              </Button>
              <a
                href="mailto:hei@soknadsklar.no?subject=Trenger hjelp med søknad"
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
          ) : null}
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


function Timeline({ outcome }: { outcome: "exempt" | "professional" | "clarify" | "application" }) {
  const tr = useT();
  const paths = {
    exempt: [
      [tr("Regelsjekk fullført", "Rule check complete"), tr("Basert på svarene dine", "Based on your answers")],
      [tr("Kontroller plan og plassering", "Verify plan and placement"), tr("Dokumenter at alle vilkår er oppfylt", "Document that every condition is met")],
      [tr("Utfør og dokumenter tiltaket", "Build and document the work"), tr("Meld fra til kommunen etterpå når det kreves", "Notify the municipality afterward when required")],
    ],
    professional: [
      [tr("Regelsjekk fullført", "Rule check complete"), tr("Saken trenger faglig prosjektering", "The case needs professional design")],
      [tr("Engasjer riktig fagperson", "Engage the right professional"), tr("Avklar ansvar, tegninger og teknisk løsning", "Clarify responsibility, drawings and technical design")],
      [tr("Avklar søknadsstrategi", "Clarify the application strategy"), tr("Ansvarlig søker vurderer dokumenter og videre prosess", "The responsible applicant assesses documents and process")],
    ],
    clarify: [
      [tr("Foreløpig regelsjekk fullført", "Preliminary rule check complete"), tr("Ett eller flere forhold mangler", "One or more facts are missing")],
      [tr("Hent dokumentasjon", "Collect documentation"), tr("Plan, godkjente tegninger, mål eller faglig vurdering", "Plan, approved drawings, measurements or professional review")],
      [tr("Be om konkret avklaring", "Request a case-specific clarification"), tr("Kontakt kommunen eller relevant fagperson før bestilling", "Contact the municipality or a relevant professional before ordering")],
    ],
    application: [
      [tr("Regelsjekk fullført", "Rule check complete"), tr("Søknadsbehov er identifisert", "The application need is identified")],
      [tr("Fullfør søknadsgrunnlaget", "Complete the application documents"), tr("Tegninger, planstatus og teknisk dokumentasjon", "Drawings, plan status and technical documentation")],
      [tr("Varsle naboer når det kreves", "Notify neighbors when required"), tr("Kontroller unntak og merknader i den konkrete saken", "Check exemptions and comments for this case")],
      [tr("Send til kommunen", "Submit to the municipality"), tr("Vent på tillatelse før søknadspliktig arbeid starter", "Wait for permission before application work starts")],
    ],
  } as const;
  const steps = paths[outcome].map(([title, description], index) => ({
    t: title,
    d: description,
    state: index === 0 ? "done" as const : index === 1 ? "current" as const : "todo" as const,
  }));

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
  return (
    <>
      <SectionHead>{t("Søknadsprosess — hva koster det?", "The application process — what does it cost?")}</SectionHead>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500 mb-1">{t("Demo", "Demo")}</div>
          <div className="text-xs text-gray-500 mb-1">{t("Eksempelpris for søknadspakke", "Example price for an application package")}</div>
          <div className="text-3xl font-extrabold tracking-tight">{formatKr(p.mittbygg)}</div>
        </div>
        {p.note && <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">{p.note}</div>}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          {t("Dette er en demonstrasjon. Ingen betaling gjennomføres. Kommunalt gebyr og eventuell fagbistand kommer i tillegg.", "This is a demonstration. No payment is processed. Municipal fees and professional services are additional.")}
        </div>
      </div>
    </>
  );
}
