"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, KV } from "./SimpleWizard";
import { evaluateAndreApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };

export function AndreWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ beskrivelse: "" });

  const evaluate = async () => {
    if (!data.beskrivelse.trim()) return;
    setPhase({ kind: "loading" });
    const result = await evaluateAndreApi({ beskrivelse: data.beskrivelse });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Analyserer tiltaket…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Andre tiltak" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Beskriv tiltaket</h2></div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hva skal du gjøre?</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Beskriv tiltaket så detaljert som mulig â€” f.eks. støpe platting, sette opp carport, rive garasje…"
                value={data.beskrivelse}
                onChange={(e) => setData({ ...data, beskrivelse: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">{data.beskrivelse.length}/500 tegn</p>
            </div>
            <Alert>Vi gir deg en første vurdering. Komplekse tiltak kan kreve dialog med kommunen.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.beskrivelse.trim()} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="Beskrivelse" v={data.beskrivelse.length > 60 ? data.beskrivelse.slice(0, 60) + "…" : data.beskrivelse} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>⚡ Beregn nå</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
