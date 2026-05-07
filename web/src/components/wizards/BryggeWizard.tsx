"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateBryggeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type BType = "fast" | "flytende" | "stupebrett";

export function BryggeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as BType | null, lengde: 6, bredde: 2 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBryggeApi({ type: data.type, lengde: data.lengde, bredde: data.bredde });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker plan- og bygningsloven og havne- og farvannsloven…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Brygge / sjÃ¸bod" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Type og dimensjoner</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "fast"}       onClick={() => setData({ ...data, type: "fast" })}       title="Fast brygge"      desc="Boltet til bunn eller peler i sjÃ¸en" />
              <RadioCard selected={data.type === "flytende"}   onClick={() => setData({ ...data, type: "flytende" })}   title="Flytebrygge"      desc="BÃ¸yefestet eller ankret flytebrygge" />
              <RadioCard selected={data.type === "stupebrett"} onClick={() => setData({ ...data, type: "stupebrett" })} title="Stupebrett / platting" desc="Liten platting i strandkanten" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lengde (m)</label>
              <NumberField value={data.lengde} onChange={(v) => setData({ ...data, lengde: v })} step={0.5} unit="m" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bredde (m)</label>
              <NumberField value={data.bredde} onChange={(v) => setData({ ...data, bredde: v })} step={0.5} unit="m" />
            </div>
            <Alert>Alle brygger krever sÃ¸knad etter plan- og bygningsloven og havne- og farvannsloven.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="Type" v={data.type === "fast" ? "Fast brygge" : data.type === "flytende" ? "Flytebrygge" : "Stupebrett / platting"} />
              <KV k="Lengde" v={`${data.lengde} m`} />
              <KV k="Bredde" v={`${data.bredde} m`} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>âš¡ Beregn nÃ¥</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
