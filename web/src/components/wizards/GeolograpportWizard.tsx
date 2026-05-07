"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, KV } from "./SimpleWizard";
import { evaluateGeolograpportApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type GType = "nybygg" | "tilbygg" | "kjeller" | "brygge" | "annet";
type Timing = "asap" | "planlegging" | "usikker";

export function GeolograpportWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as GType | null, timing: null as Timing | null });

  const evaluate = async () => {
    if (!data.type || !data.timing) return;
    setPhase({ kind: "loading" });
    const result = await evaluateGeolograpportApi({ type: data.type, timing: data.timing });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Kobler til geotekniker…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Geolograpport" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hvilket prosjekt gjelder det?</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "nybygg"}   onClick={() => setData({ ...data, type: "nybygg" })}   title="Nybygg / bolig"    desc="Nytt hus, garasje eller frittliggende bygg" />
              <RadioCard selected={data.type === "tilbygg"}  onClick={() => setData({ ...data, type: "tilbygg" })}  title="Tilbygg"           desc="Utvidelse av eksisterende bygg" />
              <RadioCard selected={data.type === "kjeller"}  onClick={() => setData({ ...data, type: "kjeller" })}  title="Kjellerarbeid"     desc="Senke gulv, drenering, bruksendring" />
              <RadioCard selected={data.type === "brygge"}   onClick={() => setData({ ...data, type: "brygge" })}   title="Brygge"            desc="Fast brygge med pÃ¦ler i grunn" />
              <RadioCard selected={data.type === "annet"}    onClick={() => setData({ ...data, type: "annet" })}    title="Annet / usikker"   desc="Vil ha oversikt over grunnforholdene" />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">NÃ¥r trenger du rapporten?</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.timing === "asap"}        onClick={() => setData({ ...data, timing: "asap" })}        title="SÃ¥ snart som mulig"    desc="Innen 1â€“2 uker" />
              <RadioCard selected={data.timing === "planlegging"} onClick={() => setData({ ...data, timing: "planlegging" })} title="I planleggingsfasen"   desc="2â€“4 uker" />
              <RadioCard selected={data.timing === "usikker"}     onClick={() => setData({ ...data, timing: "usikker" })}     title="Vet ikke ennÃ¥"         desc="Ã˜nsker prisoversikt" />
            </div>
            <Alert>Geotekniker kontakter deg innen 2 virkedager. Rapporten inngÃ¥r i sÃ¸knadspakken din.</Alert>
            <div className="bg-white border border-gray-100 rounded-xl mt-2">
              <KV k="Eiendom" v={p.street} />
              <KV k="Prosjekttype" v={data.type === "nybygg" ? "Nybygg / bolig" : data.type === "tilbygg" ? "Tilbygg" : data.type === "kjeller" ? "Kjellerarbeid" : data.type === "brygge" ? "Brygge" : "Annet / usikker"} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={!data.timing} onClick={evaluate}>âš¡ Se pris og bestill</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
