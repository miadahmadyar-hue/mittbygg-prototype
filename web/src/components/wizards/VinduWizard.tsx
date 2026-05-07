"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, KV } from "./SimpleWizard";
import { evaluateVinduApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type VType = "skifte" | "nytt_hull" | "storre_apning";
const LABEL: Record<VType, string> = { skifte: "Skifte eksisterende vindu", nytt_hull: "Nytt vindu i eksisterende vegg", storre_apning: "ForstÃ¸rre vindusÃ¥pning" };
const DESC: Record<VType, string> = { skifte: "Same stÃ¸rrelse, ny glass/karm", nytt_hull: "Hull i eksisterende vegg uten endring av stÃ¸rrelse", storre_apning: "Utvide eller slÃ¥ ut eksisterende Ã¥pning" };

export function VinduWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as VType | null, brannvegg: false });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateVinduApi({ type: data.type, brannvegg: data.brannvegg });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker TEK17 brann- og energikrav…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Vindu / dÃ¸r" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Type arbeid</h2></div>
            <div className="space-y-2">
              {(Object.keys(LABEL) as VType[]).map((t) => (
                <RadioCard key={t} selected={data.type === t} onClick={() => setData({ ...data, type: t })} title={LABEL[t]} desc={DESC[t]} />
              ))}
            </div>
            <Alert>Skifte av vindu til samme stÃ¸rrelse er unntatt sÃ¸knad (SAK10 Â§ 4-1).</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Veggtype</h2></div>
            <ToggleRow on={data.brannvegg} onChange={() => setData({ ...data, brannvegg: !data.brannvegg })} title="Brannvegg mot nabo" desc="Vindu i brannvegg krever sÃ¸knad og godkjenning" />
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k="Eiendom" v={p.street} />
              <KV k="Tiltak" v={LABEL[data.type!]} />
              <KV k="Brannvegg" v={data.brannvegg ? "Ja" : "Nei"} last />
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
