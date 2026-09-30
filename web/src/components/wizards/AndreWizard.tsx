"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases } from "./SimpleWizard";
import { evaluateAndreApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };

export function AndreWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", { beskrivelse: "" });

  const evaluate = async () => {
    if (!data.beskrivelse.trim()) return;
    setPhase({ kind: "loading" });
    const result = await evaluateAndreApi({ beskrivelse: data.beskrivelse });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="andre" loadingText="Analyserer tiltaket…" />;

  const back = () => router.push(`/property/${p.id}/tiltak`);

  return (
    <>
      <Topbar onBack={back} title="Andre tiltak" />
      <div className="view">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Beskriv det du vil gjøre</h2>
          <p className="text-sm text-gray-500 mt-2">Ta med størrelse, plassering, dagens bruk og hva du ønsker å endre.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Prosjektbeskrivelse</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={7}
            maxLength={500}
            placeholder="Eksempel: Jeg vil bygge en 25 m² carport 2 meter fra nabogrensen. Eiendommen ligger i et boligområde."
            value={data.beskrivelse}
            onChange={(e) => setData({ ...data, beskrivelse: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">{data.beskrivelse.length}/500 tegn</p>
        </div>
        <Alert>Du får en foreløpig avklaring og forslag til hva som må undersøkes videre.</Alert>
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button size="lg" full disabled={data.beskrivelse.trim().length < 20} onClick={evaluate}>Få en første vurdering</Button>
          <Button variant="ghost" full onClick={back}>Tilbake</Button>
        </div>
      </div>
    </>
  );
}
