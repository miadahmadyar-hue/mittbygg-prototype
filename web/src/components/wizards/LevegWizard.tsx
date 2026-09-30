"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { RadioCard } from "@/components/ui/RadioCard";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateLevegApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };

export function LevegWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", { hoyde: 0, lengde: 0, avstand: 0, plan: "usikker" as "ja" | "nei" | "usikker" });

  const evaluate = async () => {
    setPhase({ kind: "loading" });
    const result = await evaluateLevegApi({ ...data, plan_ok: data.plan === "usikker" ? null : data.plan === "ja" });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="levegg" loadingText="Kontrollerer høyde, lengde og avstand…" />;
  const maxLength = data.avstand < 1 ? 5 : 10;

  const back = () => router.push(`/property/${p.id}/tiltak`);

  return (
    <>
      <Topbar onBack={back} title="Levegg" />
      <div className="view">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Mål og plassering</h2>
          <p className="text-sm text-gray-500 mt-2">Tre mål er nok for den første vurderingen.</p>
        </div>
        <Field label="Høyde" value={data.hoyde} unit="m" step={0.1} onChange={(hoyde) => setData({ ...data, hoyde })} />
        <Field label="Sammenhengende lengde" value={data.lengde} unit="m" step={0.1} onChange={(lengde) => setData({ ...data, lengde })} />
        <Field label="Avstand til nabogrense" value={data.avstand} unit="m" step={0.1} onChange={(avstand) => setData({ ...data, avstand })} />
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Er planbestemmelser og frisikt kontrollert?</h3>
          <div className="grid grid-cols-3 gap-2">
            <RadioCard selected={data.plan === "ja"} onClick={() => setData({ ...data, plan: "ja" })} title="Ja" />
            <RadioCard selected={data.plan === "nei"} onClick={() => setData({ ...data, plan: "nei" })} title="Nei" />
            <RadioCard selected={data.plan === "usikker"} onClick={() => setData({ ...data, plan: "usikker" })} title="Usikker" />
          </div>
        </div>
        <Alert>
          Ved minst 1,0 m avstand er maksimal unntatt lengde 10 m. Nærmere enn 1,0 m er grensen 5 m. Høyden kan være inntil 1,8 m.
          {data.avstand > 0 && <strong> For din plassering er lengdegrensen {maxLength} m.</strong>}
        </Alert>
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button size="lg" full disabled={data.hoyde <= 0 || data.lengde <= 0 || data.avstand < 0} onClick={evaluate}>Sjekk leveggen</Button>
          <Button variant="ghost" full onClick={() => router.push(`/property/${p.id}/tiltak`)}>Tilbake</Button>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, unit, step, onChange }: { label: string; value: number; unit: string; step: number; onChange: (value: number) => void }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label><NumberField label={label} value={value} unit={unit} step={step} onChange={onChange} /></div>;
}
