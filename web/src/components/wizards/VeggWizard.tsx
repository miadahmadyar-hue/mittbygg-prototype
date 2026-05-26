"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultView } from "./ResultView";
import { SoknadSent } from "./SoknadFlow";
import { BetalingModal } from "./BetalingModal";
import { DrawingUpload } from "./DrawingUpload";
import { AiAnalyse } from "./AiAnalyse";
import type { VeggResult } from "@/lib/regulations/vegg";
import { evaluateVeggApi } from "@/lib/api/evaluate";
import { downloadTiltakSoknad } from "@/lib/api/soknad";
import { callArchitectAgent, type ArchitectAssessment } from "@/lib/api/aiArchitect";
import { callEngineerAgent, type EngineerAssessment } from "@/lib/api/aiEngineer";
import { FALLBACK_ARCHITECT, FALLBACK_ENGINEER } from "@/lib/ai/fallbacks";
import type { TiltakResult } from "@/lib/api/evaluate";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: 0 | 1 }
  | { kind: "loading" }
  | { kind: "result"; result: VeggResult }
  | { kind: "betaling"; result: VeggResult }
  | { kind: "sending"; result: VeggResult }
  | { kind: "sent"; result: VeggResult };

type AiPhaseLocal =
  | { kind: "loading"; result: VeggResult }
  | { kind: "done"; result: VeggResult; architect: ArchitectAssessment; engineer: EngineerAssessment };

interface Data {
  spennvidde: number;
  last: number;
}

export function VeggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState<Data>({ spennvidde: 4500, last: 8 });
  const [uploadPending, setUploadPending] = useState<VeggResult | null>(null);
  const [aiPhase, setAiPhase] = useState<AiPhaseLocal | null>(null);
  const [pendingAiResults, setPendingAiResults] = useState<{
    result: VeggResult; architect: ArchitectAssessment; engineer: EngineerAssessment;
  } | null>(null);

  const evaluate = async () => {
    setPhase({ kind: "loading" });
    const result = await evaluateVeggApi({
      spennvidde: data.spennvidde,
      last: data.last,
    });
    setPhase({ kind: "result", result });
  };

  if (phase.kind === "loading") {
    return <LoadingScreen text="Beregner bjelke iht. NS-EN 1995…" />;
  }
  if (phase.kind === "sending") {
    return <LoadingScreen text="Genererer søknadspakke…" />;
  }

  if (aiPhase?.kind === "loading") {
    return <LoadingScreen text="AI-arkitekt analyserer…" subtext="Vurderer tegninger og regelverk" />;
  }

  if (aiPhase?.kind === "done") {
    const { result, architect, engineer } = aiPhase;
    return (
      <AiAnalyse
        architect={architect}
        engineer={engineer}
        onContinue={() => {
          setPendingAiResults({ result, architect, engineer });
          setAiPhase(null);
        }}
      />
    );
  }

  if (uploadPending) {
    return (
      <DrawingUpload
        onContinue={async (sessionId) => {
          const result = uploadPending;
          setUploadPending(null);
          setAiPhase({ kind: "loading", result });
          const reqBase = {
            slug: "vegg",
            address: p.street,
            gnr: Number(p.matrikkel.gnr),
            bnr: Number(p.matrikkel.bnr),
            kommune: p.matrikkel.kommune,
            bygg: p.bygg as Record<string, unknown>,
          };
          const [architect, engineer] = await Promise.all([
            callArchitectAgent({ ...reqBase, session_id: sessionId }).catch(() => null),
            callEngineerAgent(reqBase).catch(() => null),
          ]);
          setAiPhase({
            kind: "done",
            result,
            architect: architect ?? FALLBACK_ARCHITECT,
            engineer:  engineer  ?? FALLBACK_ENGINEER,
          });
        }}
      />
    );
  }

  if (phase.kind === "result") {
    return (
      <ResultView
        r={phase.result}
        onGenerateSoknad={() => { setPhase({ kind: "betaling", result: phase.result }); setUploadPending(phase.result); }}
        onDownloadPdf={async () => { setPhase({ kind: "betaling", result: phase.result }); setUploadPending(phase.result); }}
        onRestart={() => router.push(`/property/${p.id}/tiltak`)}
      />
    );
  }
  if (phase.kind === "betaling") {
    return (
      <BetalingModal
        totalKostnad={phase.result.totalKostnad}
        slug="vegg"
        onBetal={async () => {
          const ai = pendingAiResults;
          setPendingAiResults(null);
          setPhase({ kind: "sending", result: phase.result });
          await downloadTiltakSoknad(
            "vegg",
            phase.result as unknown as TiltakResult,
            p.street,
            Number(p.matrikkel.gnr),
            Number(p.matrikkel.bnr),
            p.matrikkel.kommune,
            ai?.architect as unknown as Record<string, unknown>,
            ai?.engineer as unknown as Record<string, unknown>,
          ).catch(() => {});
          setPhase({ kind: "sent", result: phase.result });
        }}
        onBack={() => {
          if (pendingAiResults) {
            setAiPhase({ kind: "done", ...pendingAiResults });
          } else {
            setPhase({ kind: "result", result: phase.result });
          }
        }}
      />
    );
  }
  if (phase.kind === "sent") {
    return (
      <SoknadSent
        onDone={() => router.push(`/property/${p.id}`)}
      />
    );
  }

  const step = phase.step;
  const back = () => {
    if (step === 0) router.push(`/property/${p.id}/tiltak`);
    else setPhase({ kind: "wizard", step: 0 });
  };

  return (
    <>
      <Topbar
        title="Fjern bærevegg"
        right={<span className="text-sm text-gray-500">{step + 1}/2</span>}
      />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hvor stor åpning?</h2>
              <p className="text-sm text-gray-500 mt-2">
                Spennvidde = avstand mellom de gjenværende veggene/søylene.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Spennvidde (mm)
              </label>
              <NumberField
                value={data.spennvidde}
                placeholder="4500"
                onChange={(v) => setData({ ...data, spennvidde: v || 4500 })}
              />
              <p className="text-xs text-gray-500 mt-2">
                Vanlig åpning i bolig: 3000–6000 mm
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last ovenfra (kN/m)
              </label>
              <NumberField
                value={data.last}
                step={0.5}
                onChange={(v) => setData({ ...data, last: v || 8 })}
              />
              <p className="text-xs text-gray-500 mt-2">
                Boligetasje + tak: 6–10 kN/m. Ekstra etasje over: +5 kN/m.
              </p>
            </div>

            <Alert variant="amber">
              <strong>Krever ansvarsrett.</strong> Fjerning av bærevegg utløser alltid
              søknad med ansvarsrett (PBL § 20-3). Endelig dimensjon må signeres av PRO-RIB.
            </Alert>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full onClick={() => setPhase({ kind: "wizard", step: 1 })}>
                Neste
                <ArrowRight />
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Bekreft</h2>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="Spennvidde" v={`${data.spennvidde} mm`} />
              <KV k="Last" v={`${data.last} kN/m`} />
              <KV k="Bjelketype" v="Limtre GL30c" last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Foreslå bjelke
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function NumberField({
  value, onChange, placeholder, step,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  step?: number;
}) {
  return (
    <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
      <input
        type="number"
        value={value}
        step={step ?? 1}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 bg-transparent outline-none text-base"
      />
    </div>
  );
}

function LoadingScreen({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <>
      <Topbar back={false} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
        <div className="spinner spinner-lg" />
        <h3 className="text-base font-semibold">{text}</h3>
        <p className="text-sm text-gray-500">{subtext ?? "Henter fra Kartverket og DiBK…"}</p>
      </div>
    </>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function KV({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
