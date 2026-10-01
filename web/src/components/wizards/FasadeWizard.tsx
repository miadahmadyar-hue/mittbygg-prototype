"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { BooleanQuestion } from "@/components/ui/BooleanQuestion";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateFasadeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type FType = "skifte_vindu" | "nytt_hull" | "vindu_storre" | "dor" | "kledning" | "farge" | "terrasse";
type Character = "nei" | "ja" | "usikker";

const OPTIONS: Record<FType, [string, string]> = {
  skifte_vindu: ["Skifte vindu eller dør", "Samme åpning, med eller uten nytt utseende"],
  nytt_hull: ["Nytt vindu eller ny dør", "Ny åpning i ytterveggen"],
  vindu_storre: ["Større vindusåpning", "Utvide en eksisterende åpning"],
  dor: ["Flytte ytterdør", "Ny plassering i fasaden"],
  kledning: ["Skifte ytterkledning", "Panel, puss eller annet materiale"],
  farge: ["Endre farge eller overflate", "Maling, beis eller puss"],
  terrasse: ["Terrasse", "Uteplass forbundet med bygningen"],
};

export function FasadeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", {
    type: null as FType | null, verneverdig: null as boolean | null, samme_utseende: false,
    karakterendring: "usikker" as Character,
    terrasse_hoyde: 0, terrasse_dybde: 0, terrasse_avstand: 0, terrasse_overbygd: false, terrasse_rekkverk: 0, plan_ok: null as boolean | null,
  });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateFasadeApi({
      ...data,
      type: data.type,
      terrasse_hoyde: data.type === "terrasse" ? data.terrasse_hoyde : null,
      terrasse_dybde: data.type === "terrasse" ? data.terrasse_dybde : null,
      terrasse_avstand: data.type === "terrasse" ? data.terrasse_avstand : null,
    });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="fasade" loadingText="Vurderer tiltakets faktiske omfang…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar onBack={back} title="Fasade, vindu, dør eller terrasse" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva skal endres?</h2></div>
            <div className="space-y-2">
              {(Object.entries(OPTIONS) as [FType, [string, string]][]).map(([type, option]) => (
                <RadioCard key={type} selected={data.type === type} onClick={() => setData({ ...data, type })} title={option[0]} desc={option[1]} />
              ))}
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : data.type === "terrasse" ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Terrassens plassering</h2>
              <p className="text-sm text-gray-500 mt-2">Areal alene avgjør ikke om terrassen er unntatt.</p>
            </div>
            <Field label="Maks høyde over terreng" value={data.terrasse_hoyde} unit="m" onChange={(terrasse_hoyde) => setData({ ...data, terrasse_hoyde })} />
            <Field label="Hvor langt ut fra fasaden" value={data.terrasse_dybde} unit="m" onChange={(terrasse_dybde) => setData({ ...data, terrasse_dybde })} />
            <Field label="Avstand til nabogrense" value={data.terrasse_avstand} unit="m" onChange={(terrasse_avstand) => setData({ ...data, terrasse_avstand })} />
            <Field label="Rekkverkshøyde fra terrassegulvet (0 uten rekkverk)" value={data.terrasse_rekkverk} unit="m" onChange={(terrasse_rekkverk) => setData({ ...data, terrasse_rekkverk })} />
            <BooleanQuestion title="Er plan, byggegrenser og utnyttelsesgrad kontrollert?" value={data.plan_ok} onChange={(plan_ok) => setData({ ...data, plan_ok })} />
            <ToggleRow on={data.terrasse_overbygd} onChange={() => setData({ ...data, terrasse_overbygd: !data.terrasse_overbygd })} title="Terrassen skal være overbygd" />
            <Alert>For unntak må terrassen blant annet være høyst 1,0 m over terreng, gå høyst 4,0 m ut, være minst 1,0 m fra grensen og ikke være overbygd.</Alert>
            <Actions disabled={data.terrasse_hoyde < 0 || data.terrasse_dybde <= 0 || data.terrasse_avstand < 0} onEvaluate={evaluate} onBack={back} />
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Utseende og vernestatus</h2>
              <p className="text-sm text-gray-500 mt-2">Kommunen vurderer om bygningens karakter endres.</p>
            </div>
            <ToggleRow on={data.samme_utseende} onChange={() => setData({ ...data, samme_utseende: !data.samme_utseende })} title="Samme størrelse, materiale og utseende" desc="Vanlig vedlikehold eller tilbakeføring" />
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vil bygningens uttrykk endres?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.karakterendring === "nei"} onClick={() => setData({ ...data, karakterendring: "nei" })} title="Nei" />
                <RadioCard selected={data.karakterendring === "ja"} onClick={() => setData({ ...data, karakterendring: "ja" })} title="Ja" />
                <RadioCard selected={data.karakterendring === "usikker"} onClick={() => setData({ ...data, karakterendring: "usikker" })} title="Jeg er usikker" />
              </div>
            </div>
            <BooleanQuestion value={data.verneverdig} onChange={(verneverdig) => setData({ ...data, verneverdig })} title="Bygningen er vernet eller registrert som bevaringsverdig" description="Velg «Vet ikke» hvis vernestatus ikke er kontrollert." />
            <Alert>En ny eller større åpning kan også berøre bæring og brannskille. Det vurderes ikke ut fra fasaden alene.</Alert>
            <Actions disabled={false} onEvaluate={evaluate} onBack={back} />
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (value: number) => void }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label><NumberField label={label} value={value} unit={unit} step={0.1} onChange={onChange} /></div>;
}

function Actions({ disabled, onEvaluate, onBack }: { disabled: boolean; onEvaluate: () => void; onBack: () => void }) {
  return <div className="mt-auto pt-4 flex flex-col gap-2"><Button size="lg" full disabled={disabled} onClick={onEvaluate}>Sjekk tiltaket</Button><Button variant="ghost" full onClick={onBack}>Tilbake</Button></div>;
}
