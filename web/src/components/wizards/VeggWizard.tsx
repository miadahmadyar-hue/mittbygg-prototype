"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultView } from "./ResultView";
import { SoknadPreview, SoknadSent } from "./SoknadFlow";
import { BetalingModal } from "./BetalingModal";
import type { VeggResult } from "@/lib/regulations/vegg";
import { evaluateVeggApi } from "@/lib/api/evaluate";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: 0 | 1 }
  | { kind: "loading" }
  | { kind: "result"; result: VeggResult }
  | { kind: "betaling"; result: VeggResult }
  | { kind: "preview"; result: VeggResult }
  | { kind: "sending"; result: VeggResult }
  | { kind: "sent"; result: VeggResult };

interface Data {
  spennvidde: number;
  last: number;
}

export function VeggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState<Data>({ spennvidde: 4500, last: 8 });
  const [pdfLoading, setPdfLoading] = useState(false);

  const evaluate = async () => {
    setPhase({ kind: "loading" });
    const result = await evaluateVeggApi({
      spennvidde: data.spennvidde,
      last: data.last,
    });
    setPhase({ kind: "result", result });
  };

  const handleGoToBetaling = async () => {
    if (phase.kind !== "result") return;
    setPhase({ kind: "betaling", result: phase.result });
  };

  const doDownloadAfterPayment = async () => {
    setPdfLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPdfLoading(false);
    if (phase.kind === "betaling")
      setPhase({ kind: "preview", result: phase.result });
  };

  if (phase.kind === "loading") {
    return <LoadingScreen text="Beregner bjelke iht. NS-EN 1995…" />;
  }
  if (phase.kind === "sending") {
    return <LoadingScreen text="Sender til Altinn / DiBK Fellestjenester Bygg…" />;
  }
  if (phase.kind === "result") {
    return (
      <ResultView
        r={phase.result}
        onGenerateSoknad={() => setPhase({ kind: "preview", result: phase.result })}
        onDownloadPdf={handleGoToBetaling}
        pdfLoading={pdfLoading}
        onRestart={() => router.push(`/property/${p.id}/tiltak`)}
      />
    );
  }
  if (phase.kind === "betaling") {
    return (
      <BetalingModal
        totalKostnad={phase.result.totalKostnad}
        onBetal={doDownloadAfterPayment}
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

function LoadingScreen({ text }: { text: string }) {
  return (
    <>
      <Topbar back={false} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
        <div className="spinner spinner-lg" />
        <h3 className="text-base font-semibold">{text}</h3>
        <p className="text-sm text-gray-500">Henter fra Kartverket og DiBK…</p>
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
