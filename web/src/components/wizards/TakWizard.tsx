"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases } from "./SimpleWizard";
import { evaluateTakApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type TakType = "bytte_materiale" | "endre_form" | "bygge_loft";

export function TakWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", { type: null as TakType | null, samme_utseende: false, verneverdig: false, etterisolere: false });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTakApi({ ...data, type: data.type });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="tak" loadingText="Klassifiserer takarbeidet etter faktisk omfang…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar onBack={back} title="Tak og loft" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva skal gjøres?</h2>
              <p className="text-sm text-gray-500 mt-2">Vedlikehold, fasadeendring, konstruksjonsarbeid og bruksendring er separate løp.</p>
            </div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "bytte_materiale"} onClick={() => setData({ ...data, type: "bytte_materiale" })} title="Skifte taktekking" desc="Takstein, papp, shingel eller plater" />
              <RadioCard selected={data.type === "endre_form"} onClick={() => setData({ ...data, type: "endre_form" })} title="Endre takform eller høyde" desc="Takvinkel, møne, ark eller heving" />
              <RadioCard selected={data.type === "bygge_loft"} onClick={() => setData({ ...data, type: "bygge_loft" })} title="Innrede loft til oppholdsrom" desc="Bruksendring, høyde, lys, rømning og trapp" />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Om endringen</h2></div>
            {data.type === "bytte_materiale" && (
              <ToggleRow on={data.samme_utseende} onChange={() => setData({ ...data, samme_utseende: !data.samme_utseende })} title="Samme materiale og visuelt uttrykk" desc="Lik utskifting regnes normalt som vedlikehold" />
            )}
            <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title="Bygningen er vernet eller bevaringsverdig" desc="Velg bare ja hvis dette er bekreftet" />
            {data.type !== "bygge_loft" && <ToggleRow on={data.etterisolere} onChange={() => setData({ ...data, etterisolere: !data.etterisolere })} title="Etterisolere taket samtidig" />}
            {data.type === "endre_form" && <Alert variant="amber">Endret takform berører normalt bærekonstruksjon og kan endre tillatt høyde.</Alert>}
            {data.type === "bygge_loft" && <Alert>Loftsutbygging skal videre til bruksendringsløpet med målt takhøyde, dagslys, rømning, trapp og godkjent eksisterende bruk.</Alert>}
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>Få riktig neste steg</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
