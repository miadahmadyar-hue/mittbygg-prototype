"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { BooleanQuestion } from "@/components/ui/BooleanQuestion";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateAnneksApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type AType = "anneks" | "uthus" | "hagebod";
type TriState = "ja" | "nei" | "usikker";

export function AnneksWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", {
    type: null as AType | null, areal: 0, avstand: 0, avstand_bygg: 0,
    overnatting: false, kjeller: false, etasjer: 1,
    monehoyde: 0, gesimshoyde: 0, over_ledninger: null as boolean | null,
    plan: "usikker" as TriState,
  });

  const chooseType = (type: AType) => setData({ ...data, type, overnatting: type === "anneks" });
  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateAnneksApi({ ...data, type: data.type, plan_ok: data.plan === "usikker" ? null : data.plan === "ja" });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="anneks" loadingText="Kontrollerer bruk, plassering og størrelse…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar onBack={back} title="Anneks, uthus eller hagebod" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hvordan skal bygget brukes?</h2>
              <p className="text-sm text-gray-500 mt-2">Overnatting er det første spørsmålet fordi det endrer hele søknadsløpet.</p>
            </div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "anneks"} onClick={() => chooseType("anneks")} title="Anneks eller gjestehytte" desc="Skal kunne brukes til overnatting" />
              <RadioCard selected={data.type === "uthus"} onClick={() => chooseType("uthus")} title="Uthus eller verksted" desc="Ingen beboelse eller overnatting" />
              <RadioCard selected={data.type === "hagebod"} onClick={() => chooseType("hagebod")} title="Hagebod" desc="Enkel oppbevaring" />
            </div>
            {data.type !== "anneks" && <ToggleRow on={data.overnatting} onChange={() => setData({ ...data, overnatting: !data.overnatting })} title="Skal likevel brukes til overnatting" />}
            <div className="grid grid-cols-2 gap-3">
              <Field label="BRA/BYA" value={data.areal} unit="m²" onChange={(areal) => setData({ ...data, areal })} />
              <Field label="Etasjer" value={data.etasjer} unit="stk" onChange={(value) => setData({ ...data, etasjer: Math.max(1, Math.round(value)) })} />
            </div>
            <Alert variant={data.overnatting ? "amber" : undefined}>Bygg for overnatting omfattes ikke av 50 m²-unntaket for frittliggende bod og uthus.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type || data.areal <= 0} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Plassering og høyder</h2></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Til nabogrense" value={data.avstand} unit="m" step={0.1} onChange={(avstand) => setData({ ...data, avstand })} />
              <Field label="Til annet bygg" value={data.avstand_bygg} unit="m" step={0.1} onChange={(avstand_bygg) => setData({ ...data, avstand_bygg })} />
              <Field label="Mønehøyde" value={data.monehoyde} unit="m" step={0.1} onChange={(monehoyde) => setData({ ...data, monehoyde })} />
              <Field label="Gesimshøyde" value={data.gesimshoyde} unit="m" step={0.1} onChange={(gesimshoyde) => setData({ ...data, gesimshoyde })} />
            </div>
            <div className="space-y-2">
              <ToggleRow on={data.kjeller} onChange={() => setData({ ...data, kjeller: !data.kjeller })} title="Bygget skal ha kjeller" />
              <BooleanQuestion value={data.over_ledninger} onChange={(over_ledninger) => setData({ ...data, over_ledninger })} title="Plasseres over vann- eller avløpsledninger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Er plan, byggegrense og BYA kontrollert?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.plan === "ja"} onClick={() => setData({ ...data, plan: "ja" })} title="Ja" />
                <RadioCard selected={data.plan === "usikker"} onClick={() => setData({ ...data, plan: "usikker" })} title="Jeg er usikker" />
                <RadioCard selected={data.plan === "nei"} onClick={() => setData({ ...data, plan: "nei" })} title="Nei" />
              </div>
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={data.avstand < 0 || data.avstand_bygg < 0 || data.monehoyde <= 0 || data.gesimshoyde <= 0} onClick={evaluate}>Sjekk prosjektet</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, value, unit, step = 1, onChange }: { label: string; value: number; unit: string; step?: number; onChange: (value: number) => void }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label><NumberField label={label} value={value} unit={unit} step={step} onChange={onChange} /></div>;
}
