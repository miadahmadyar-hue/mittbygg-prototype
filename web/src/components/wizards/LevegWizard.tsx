"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateLevegApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };

export function LevegWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ hoyde: 1.8, lengde: 6, avstand: 1 });

  const evaluate = async () => {
    setPhase({ kind: "loading" });
    const result = await evaluateLevegApi({ hoyde: data.hoyde, lengde: data.lengde, avstand: data.avstand });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker SAK10 og PBLâ€¦" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Levegg / gjerde" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">MÃ¥l og plassering</h2></div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">HÃ¸yde (m)</label>
              <NumberField value={data.hoyde} onChange={(v) => setData({ ...data, hoyde: v })} step={0.1} unit="m" />
              <p className="text-xs text-gray-500 mt-1">Under 1,8 m er normalt unntatt sÃ¸knad</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lengde (m)</label>
              <NumberField value={data.lengde} onChange={(v) => setData({ ...data, lengde: v })} step={0.5} unit="m" />
              <p className="text-xs text-gray-500 mt-1">Maks 10 m sammenhengende for unntak</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Avstand til nabogrense (m)</label>
              <NumberField value={data.avstand} onChange={(v) => setData({ ...data, avstand: v })} step={0.5} unit="m" />
            </div>
            <Alert>Levegg â‰¤ 1,8 m hÃ¸y og â‰¤ 10 m lang er unntatt sÃ¸knad (SAK10 Â§ 4-1 e).</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="HÃ¸yde" v={`${data.hoyde} m`} />
              <KV k="Lengde" v={`${data.lengde} m`} />
              <KV k="Avstand til nabo" v={`${data.avstand} m`} last />
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
