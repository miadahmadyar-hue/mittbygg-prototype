"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateBoenhetApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type BType = "hybel" | "sokkelleilighet" | "tomannsbolig";

export function BoenhetWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as BType | null, antall: 1, areal: 40 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBoenhetApi({ type: data.type, antall: data.antall, areal: data.areal });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker PBL, TEK17 og reguleringsplan…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Etablere ny boenhet" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Type boenhet</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "hybel"}           onClick={() => setData({ ...data, type: "hybel" })}           title="Hybel"              desc="Rom med bad og kjÃ¸kken innenfor eksisterende leilighet" />
              <RadioCard selected={data.type === "sokkelleilighet"} onClick={() => setData({ ...data, type: "sokkelleilighet" })} title="Sokkelleilighet"    desc="Selvstendig leilighet i kjeller eller underetasje" />
              <RadioCard selected={data.type === "tomannsbolig"}    onClick={() => setData({ ...data, type: "tomannsbolig" })}    title="Tomannsbolig"      desc="To fullverdige boliger i samme bygg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">Antall nye boenheter</label>
              <NumberField value={data.antall} onChange={(v) => setData({ ...data, antall: Math.max(1, Math.round(v)) })} step={1} unit="stk" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Areal per boenhet (mÂ²)</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="mÂ²" />
              <p className="text-xs text-gray-500 mt-1">Minimum 25 mÂ² for godkjent boenhet (TEK17 Â§ 12-2)</p>
            </div>
            <Alert>Ny boenhet krever alltid sÃ¸knad med ansvarlig foretak.</Alert>
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
              <KV k="Type" v={data.type === "hybel" ? "Hybel" : data.type === "sokkelleilighet" ? "Sokkelleilighet" : "Tomannsbolig"} />
              <KV k="Antall boenheter" v={String(data.antall)} />
              <KV k="Areal per enhet" v={`${data.areal} mÂ²`} last />
            </div>
            <Alert>Dette tiltaket krever ansvarlig sÃ¸ker. Vi kobler deg med godkjent foretak.</Alert>
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
