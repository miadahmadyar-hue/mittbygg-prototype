"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateBryggeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type BType = "fast" | "flytende" | "stupebrett";
type Work = "ny" | "utvide" | "erstatte" | "vedlikehold";
type PlanStatus = "tillatt" | "ikke_tillatt" | "usikker";

export function BryggeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({
    type: null as BType | null,
    arbeid: null as Work | null,
    lengde: 0,
    bredde: 0,
    eier_strandgrunn: null as boolean | null,
    plan_status: "usikker" as PlanStatus,
  });

  const evaluate = async () => {
    if (!data.type || !data.arbeid || !data.lengde || !data.bredde) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBryggeApi(data);
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="brygge" loadingText="Vurderer tiltaket mot plan- og kystreglene…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Brygge og tiltak i strandsonen" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva skal du gjøre?</h2>
              <p className="text-sm text-gray-500 mt-2">Vedlikehold og nye tiltak vurderes forskjellig.</p>
            </div>
            <div className="space-y-2">
              <RadioCard selected={data.arbeid === "ny"} onClick={() => setData({ ...data, arbeid: "ny" })} title="Bygge nytt" />
              <RadioCard selected={data.arbeid === "utvide"} onClick={() => setData({ ...data, arbeid: "utvide" })} title="Utvide eksisterende" />
              <RadioCard selected={data.arbeid === "erstatte"} onClick={() => setData({ ...data, arbeid: "erstatte" })} title="Erstatte eller flytte" />
              <RadioCard selected={data.arbeid === "vedlikehold"} onClick={() => setData({ ...data, arbeid: "vedlikehold" })} title="Vedlikeholde uten å endre" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Type konstruksjon</h3>
              <div className="space-y-2">
                <RadioCard selected={data.type === "fast"} onClick={() => setData({ ...data, type: "fast" })} title="Fast brygge" desc="Peler, bolter eller annen fast forbindelse" />
                <RadioCard selected={data.type === "flytende"} onClick={() => setData({ ...data, type: "flytende" })} title="Flytebrygge" desc="Flytende konstruksjon med landgang" />
                <RadioCard selected={data.type === "stupebrett"} onClick={() => setData({ ...data, type: "stupebrett" })} title="Badeplattform eller stupebrett" />
              </div>
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type || !data.arbeid} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Plassering og planstatus</h2>
              <p className="text-sm text-gray-500 mt-2">Lokale planer og rett til grunnen er avgjørende i strandsonen.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Lengde</label><NumberField value={data.lengde} onChange={(lengde) => setData({ ...data, lengde })} step={0.5} unit="m" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Bredde</label><NumberField value={data.bredde} onChange={(bredde) => setData({ ...data, bredde })} step={0.5} unit="m" /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tillater gjeldende plan tiltaket?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.plan_status === "tillatt"} onClick={() => setData({ ...data, plan_status: "tillatt" })} title="Ja, jeg har kontrollert planen" />
                <RadioCard selected={data.plan_status === "ikke_tillatt"} onClick={() => setData({ ...data, plan_status: "ikke_tillatt" })} title="Nei, dispensasjon kan være nødvendig" />
                <RadioCard selected={data.plan_status === "usikker"} onClick={() => setData({ ...data, plan_status: "usikker" })} title="Jeg er usikker" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Har du rett til strandgrunnen?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.eier_strandgrunn === true} onClick={() => setData({ ...data, eier_strandgrunn: true })} title="Ja" desc="Eierskap eller skriftlig rett er dokumentert" />
                <RadioCard selected={data.eier_strandgrunn === false} onClick={() => setData({ ...data, eier_strandgrunn: false })} title="Nei eller usikker" />
              </div>
            </div>
            <Alert variant="amber">Ikke bestill konstruksjonen før kommunen har avklart planstatus og eventuelle tillatelser.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={!data.lengde || !data.bredde || data.eier_strandgrunn === null} onClick={evaluate}>Se hva du må avklare</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
