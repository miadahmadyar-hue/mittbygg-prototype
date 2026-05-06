"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { ResultPhases, KV } from "./SimpleWizard";
import { evaluateFasadeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type FType = "kledning" | "farge" | "vindu_storre" | "terrasse" | "dor";
const LABEL: Record<FType, string> = { kledning: "Ny ytterkledning", farge: "Farge / overflate", vindu_storre: "Større vindusåpning", terrasse: "Terrasse", dor: "Ny dør" };
const DESC: Record<FType, string>  = { kledning: "Skifte kledning, panel eller puss", farge: "Male om fasaden eller endre overflate", vindu_storre: "Lage større vindu i eksisterende fasade", terrasse: "Ny terrasse eller uteplass", dor: "Skifte eller flytte ytterdør" };

export function FasadeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as FType | null, verneverdig: false });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateFasadeApi({ type: data.type, verneverdig: data.verneverdig });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker SAK10 og kulturminneregisteret…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Fasadeendring" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva skal endres?</h2></div>
            <div className="space-y-2">
              {(Object.keys(LABEL) as FType[]).map((t) => (
                <RadioCard key={t} selected={data.type === t} onClick={() => setData({ ...data, type: t })} title={LABEL[t]} desc={DESC[t]} />
              ))}
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bygningsstatus</h2></div>
            <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title="Verneverdig / antikvarisk bygning" desc="Registrert i SEFRAK eller kommunalt vernekart" />
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k="Eiendom" v={p.street} />
              <KV k="Tiltak" v={LABEL[data.type!]} />
              <KV k="Verneverdig" v={data.verneverdig ? "Ja" : "Nei"} last />
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
