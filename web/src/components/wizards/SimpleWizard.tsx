"use client";

/**
 * Shared shell for the simple tiltak wizards.
 * `ResultPhases` owns every post-result phase (result →
 * project details → attachments → AI review → quote request) so the 13 simple wizards don't repeat it.
 * Each wizard provides its own step content via children.
 */

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultView } from "./ResultView";
import { CellarPreparation } from "./CellarPreparation";
import { WallPreparation } from "./WallPreparation";
import { useDraftState } from "@/lib/projects";
import { useT } from "@/lib/i18n/context";
import type { TiltakResult } from "@/lib/api/evaluate";
import { evalTiltak } from "@/lib/api/evaluate";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: number }
  | { kind: "loading" }
  | { kind: "result"; result: TiltakResult }
  | { kind: "betaling"; result: TiltakResult }
  | { kind: "sending"; result: TiltakResult }
  | { kind: "sent"; result: TiltakResult };

type NonWizardPhase = Exclude<Phase, { kind: "wizard" }>;

interface Props {
  p: Address;
  title: string;
  totalSteps: number;
  loadingText?: string;
  currentStep: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onEvaluate: () => Promise<TiltakResult>;
  children: ReactNode;
}

// Hook used internally — exported so wizard components can share phase state
export function useSimpleWizard() {
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const step = phase.kind === "wizard" ? phase.step : 0;
  const setStep = (s: number) => setPhase({ kind: "wizard", step: s });
  return { phase, setPhase, step, setStep };
}

export function SimpleWizard({
  title, totalSteps,
  currentStep, canProceed, onBack, onNext, children,
}: Props) {
  // This component is stateless re: phase — the parent wizard owns phase via useSimpleWizard.
  // We render the wizard shell here.
  const t = useT();
  return (
    <>
      <Topbar
        title={title}
        right={<span className="text-sm text-gray-500">{currentStep + 1}/{totalSteps}</span>}
      />
      <ProgressBar step={currentStep} total={totalSteps} />
      <div className="view">
        {children}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          {currentStep < totalSteps - 1 ? (
            <Button full disabled={!canProceed} onClick={onNext}>
              {t("Neste", "Next")} <ArrowRight />
            </Button>
          ) : (
            <Button size="lg" full disabled={!canProceed} onClick={onNext}>
              <BoltIcon /> {t("Beregn nå", "Calculate now")}
            </Button>
          )}
          <Button variant="ghost" full onClick={onBack}>{t("Tilbake", "Back")}</Button>
        </div>
      </div>
    </>
  );
}

// ── Non-wizard phases ─────────────────────────────────────────────────────────

interface ResultPhasesProps {
  onEdit: () => void;
  phase: Phase;
  setPhase: (p: NonWizardPhase) => void;
  p: Address;
  loadingText?: string;
  slug?: string;
}

export function ResultPhases({ phase, setPhase, p, loadingText, slug = "andre", onEdit }: ResultPhasesProps) {
  const router = useRouter();
  const t = useT();
  const [preparation, setPreparation] = useDraftState("wallPreparation", { open: false });
  if (phase.kind === "wizard") return null;
  if (phase.kind === "loading") return <><Topbar back={false} /><main className="view items-center justify-center text-center"><div className="spinner spinner-lg" /><h2 role="status">{loadingText ?? t("Sjekker svarene dine…", "Checking your answers…")}</h2><p className="text-sm text-gray-500">Foreløpig vurdering basert på svarene dine. Ingen søknad sendes.</p></main></>;
  const result = phase.result;
  if (result.availability !== "unavailable" && result.ruleVersion !== 20261001) return <><Topbar title="Oppdater vurderingen" onBack={onEdit} /><main className="view"><h1 className="text-xl font-semibold">Veiviseren er oppdatert</h1><p>Svarene dine er beholdt. Se gjennom dem, inkludert nye spørsmål, før du får en ny vurdering.</p><Button full onClick={() => { setPreparation({ open: false }); onEdit(); }}>Se gjennom svarene</Button></main></>;
  if (result.availability !== "unavailable" && (preparation.open || phase.kind !== "result")) {
    const back = () => { setPreparation({ open: false }); setPhase({ kind: "result", result }); };
    if (slug === "vegg" && ["professional", "clarify"].includes(result.outcome ?? "clarify")) {
      return <WallPreparation p={p} result={result} onBack={back} />;
    }
    return <CellarPreparation slug={slug} p={p} result={result} onBack={back} />;
  }
  return <ResultView r={result} slug={slug}
    onEdit={() => { setPreparation({ open: false }); onEdit(); }}
    onPrepareProfessional={() => setPreparation({ open: true })}
    onGenerateSoknad={() => setPreparation({ open: true })}
    onRetry={async () => {
      setPhase({ kind: "loading" });
      const updated = await evalTiltak(slug, result.input);
      setPhase({ kind: "result", result: updated });
    }}
    onRestart={() => router.push(`/property/${p.id}/tiltak`)} />;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

export function NumberField({
  value, onChange, placeholder, step = 1, unit, label,
}: {
  value: number; onChange: (v: number) => void;
  placeholder?: string; step?: number; unit?: string; label?: string;
}) {
  return (
    <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
      <input
        aria-label={label}
        min={0}
        type="number"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="min-w-0 w-full flex-1 bg-transparent outline-none text-base"
      />
      {unit && <span className="text-sm text-gray-400 shrink-0">{unit}</span>}
    </div>
  );
}

export function KV({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 px-5 py-3 text-sm ${last ? "" : "border-b border-gray-100"}`}>
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
