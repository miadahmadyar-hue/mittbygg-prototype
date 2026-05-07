"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateSolcellerApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type SType = "integrert" | "paamontering" | "vegg";

export function SolcellerWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as SType | null, areal: 20, verneverdig: false });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateSolcellerApi({ type: data.type, areal: data.areal, verneverdig: data.verneverdig });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker SAK10 og el-forskrifterâ€¦" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });
  const kwp = Math.round(data.areal * 0.2 * 10) / 10;

  return (
    <>
      <Topbar title="Solceller" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Monteringstype og areal</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "integrert"}    onClick={() => setData({ ...data, type: "integrert" })}    title="Integrert i takflaten"  desc="Panel erstatter taktekkematerialet" />
              <RadioCard selected={data.type === "paamontering"} onClick={() => setData({ ...data, type: "paamontering" })} title="PÃ¥montering pÃ¥ tak"       desc="Paneler montert pÃ¥ eksisterende tak" />
              <RadioCard selected={data.type === "vegg"}         onClick={() => setData({ ...data, type: "vegg" })}         title="Veggmontert"            desc="Panel pÃ¥ fasade eller garasjevegg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Areal paneler (mÂ²)</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="mÂ²" />
              <p className="text-xs text-gray-500 mt-1">Typisk bolig: 15â€“30 mÂ² â‰ˆ {kwp} kWp â‰ˆ {Math.round(kwp * 900)} kWh/Ã¥r</p>
            </div>
            <Alert>Solceller er unntatt sÃ¸knad siden 2021 (SAK10 Â§ 4-1 k). Kun melding til nettselskapet.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bygningstype</h2></div>
            <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title="Verneverdig / antikvarisk bygning" desc="Kan kreve sÃ¦rskilt kulturminnevurdering" />
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k="Eiendom" v={p.street} />
              <KV k="Areal" v={`${data.areal} mÂ²`} />
              <KV k="Effekt" v={`ca. ${kwp} kWp`} last />
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
