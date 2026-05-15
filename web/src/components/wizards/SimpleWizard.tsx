"use client";

/**
 * Shared shell for the 10 simple tiltak wizards.
 * Handles: phases, loading, ResultView, SoknadPreview/Sent.
 * Each wizard provides its own step content via children.
 */

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultView } from "./ResultView";
import { SoknadPreview, SoknadSent } from "./SoknadFlow";
import { BetalingModal } from "./BetalingModal";
import type { TiltakResult } from "@/lib/api/evaluate";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: number }
  | { kind: "loading" }
  | { kind: "result"; result: TiltakResult }
  | { kind: "betaling"; result: TiltakResult }
  | { kind: "preview"; result: TiltakResult }
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
export function useSimpleWizard(totalSteps: number) {
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const step = phase.kind === "wizard" ? phase.step : 0;
  const setStep = (s: number) => setPhase({ kind: "wizard", step: s });
  return { phase, setPhase, step, setStep };
}

export function SimpleWizard({
  p, title, totalSteps, loadingText,
  currentStep, canProceed, onBack, onNext, onEvaluate, children,
}: Props) {
  // This component is stateless re: phase — the parent wizard owns phase via useSimpleWizard.
  // We render the wizard shell here.
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
              Neste <ArrowRight />
            </Button>
          ) : (
            <Button size="lg" full disabled={!canProceed} onClick={onNext}>
              <BoltIcon /> Beregn nå
            </Button>
          )}
          <Button variant="ghost" full onClick={onBack}>Tilbake</Button>
        </div>
      </div>
    </>
  );
}

// ── Non-wizard phases ─────────────────────────────────────────────────────────

interface ResultPhasesProps {
  phase: Phase;
  setPhase: (p: NonWizardPhase) => void;
  p: Address;
  loadingText?: string;
  slug?: string;
}

export function ResultPhases({ phase, setPhase, p, loadingText, slug }: ResultPhasesProps) {
  const router = useRouter();

  if (phase.kind === "loading") {
    return (
      <>
        <Topbar back={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
          <div className="spinner spinner-lg" />
          <h3 className="text-base font-semibold">{loadingText ?? "Sjekker regelverk…"}</h3>
          <p className="text-sm text-gray-500">Henter fra Kartverket og DiBK…</p>
        </div>
      </>
    );
  }

  if (phase.kind === "sending") {
    return (
      <>
        <Topbar back={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
          <div className="spinner spinner-lg" />
          <h3 className="text-base font-semibold">Sender til Altinn / DiBK Fellestjenester Bygg…</h3>
        </div>
      </>
    );
  }

  if (phase.kind === "result") {
    return (
      <ResultView
        r={phase.result as never}
        slug={slug}
        onGenerateSoknad={() => setPhase({ kind: "preview", result: phase.result })}
        onDownloadPdf={async () => setPhase({ kind: "betaling", result: phase.result })}
        onRestart={() => router.push(`/property/${p.id}/tiltak`)}
      />
    );
  }

  if (phase.kind === "betaling") {
    return (
      <BetalingModal
        totalKostnad={phase.result.totalKostnad}
        slug={slug}
        onBetal={async () => setPhase({ kind: "preview", result: phase.result })}
        onBack={() => setPhase({ kind: "result", result: phase.result })}
      />
    );
  }

  if (phase.kind === "preview") {
    return (
      <SoknadPreview
        ansvarsrett={phase.result.ansvarsrett}
        onBack={() => setPhase({ kind: "result", result: phase.result })}
        onSend={() => {
          setPhase({ kind: "sending", result: phase.result });
          setTimeout(() => setPhase({ kind: "sent", result: phase.result }), 1800);
        }}
      />
    );
  }

  if (phase.kind === "sent") {
    return (
      <SoknadSent
        ansvarsrett={phase.result.ansvarsrett}
        onDone={() => router.push(`/property/${p.id}`)}
      />
    );
  }

  return null;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

export function NumberField({
  value, onChange, placeholder, step = 1, unit,
}: {
  value: number; onChange: (v: number) => void;
  placeholder?: string; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
      <input
        type="number"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-transparent outline-none text-base"
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
