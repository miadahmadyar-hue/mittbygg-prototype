"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateGarasjeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type GType = "garasje" | "carport" | "bod";
type TriState = "ja" | "nei" | "usikker";

export function GarasjeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", {
    type: null as GType | null,
    areal: 0,
    avstand: 0,
    avstand_bygg: 0,
    overnatting: false,
    kjeller: false,
    etasjer: 1,
    monehoyde: 0,
    gesimshoyde: 0,
    over_ledninger: false,
    plan: "usikker" as TriState,
  });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateGarasjeApi({
      ...data,
      type: data.type,
      plan_ok: data.plan === "usikker" ? null : data.plan === "ja",
    });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="garasje" loadingText="Kontrollerer vilkårene for garasje og uthus…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar onBack={back} title="Garasje, carport eller bod" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva skal du bygge?</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "garasje"} onClick={() => setData({ ...data, type: "garasje" })} title="Garasje" desc="Lukket garasje med port" />
              <RadioCard selected={data.type === "carport"} onClick={() => setData({ ...data, type: "carport" })} title="Carport" desc="Åpen biloppstillingsplass med tak" />
              <RadioCard selected={data.type === "bod"} onClick={() => setData({ ...data, type: "bod" })} title="Bod eller uthus" desc="Lager, verksted eller hageutstyr" />
            </div>
            <ToggleRow on={data.overnatting} onChange={() => setData({ ...data, overnatting: !data.overnatting })} title="Skal brukes til overnatting eller beboelse" desc="Dette faller utenfor unntaket for garasje og bod" />
            <details className="panel p-4 text-sm"><summary className="cursor-pointer font-semibold">Hvordan måler jeg?</summary><p className="mt-2">BRA er bruksareal inne i bygget. BYA er arealet bygget opptar på tomten. Oppgi det største av de to arealene for denne foreløpige sjekken. Mønehøyde er høyden til takets øverste punkt; gesimshøyde er høyden der tak og yttervegg møtes. Bruk dokumenterte mål fra tegningene.</p><svg viewBox="0 0 260 130" role="img" aria-label="Takprofil med møne på toppen og gesims ved takets kant" className="mt-3 w-full max-w-xs"><path d="M40 110V65L120 20L200 65V110Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M120 20H240M200 65H240" stroke="currentColor" strokeDasharray="4 3"/><text x="150" y="16" fontSize="12">Møne</text><text x="205" y="60" fontSize="12">Gesims</text></svg></details>
            <div className="grid grid-cols-2 gap-3">
              <Field label="BRA/BYA" value={data.areal} unit="m²" onChange={(areal) => setData({ ...data, areal })} />
              <Field label="Etasjer" value={data.etasjer} unit="stk" onChange={(value) => setData({ ...data, etasjer: Math.max(1, Math.round(value)) })} />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type || data.areal <= 0} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Plassering og utforming</h2>
              <p className="text-sm text-gray-500 mt-2">Alle vilkårene må være oppfylt for å slippe søknad.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Til nabogrense" value={data.avstand} unit="m" step={0.1} onChange={(avstand) => setData({ ...data, avstand })} />
              <Field label="Til annet bygg" value={data.avstand_bygg} unit="m" step={0.1} onChange={(avstand_bygg) => setData({ ...data, avstand_bygg })} />
              <Field label="Mønehøyde" value={data.monehoyde} unit="m" step={0.1} onChange={(monehoyde) => setData({ ...data, monehoyde })} />
              <Field label="Gesimshøyde" value={data.gesimshoyde} unit="m" step={0.1} onChange={(gesimshoyde) => setData({ ...data, gesimshoyde })} />
            </div>
            <div className="space-y-2">
              <ToggleRow on={data.kjeller} onChange={() => setData({ ...data, kjeller: !data.kjeller })} title="Bygget skal ha kjeller" />
              <ToggleRow on={data.over_ledninger} onChange={() => setData({ ...data, over_ledninger: !data.over_ledninger })} title="Plasseres over vann- eller avløpsledninger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Er plassering og BYA kontrollert mot planen?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.plan === "ja"} onClick={() => setData({ ...data, plan: "ja" })} title="Ja" desc="Byggegrense, planformål og utnyttelsesgrad er kontrollert" />
                <RadioCard selected={data.plan === "usikker"} onClick={() => setData({ ...data, plan: "usikker" })} title="Jeg er usikker" />
                <RadioCard selected={data.plan === "nei"} onClick={() => setData({ ...data, plan: "nei" })} title="Nei" desc="Tiltaket bryter planen eller tillatt BYA" />
              </div>
            </div>
            <Alert>Et areal under 50 m² er ikke alene nok. Bruk, høyde, etasjer, kjeller, avstander, ledninger og plan må også være innenfor.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={data.avstand <= 0 || data.avstand_bygg <= 0 || data.monehoyde <= 0 || data.gesimshoyde <= 0} onClick={evaluate}>Sjekk prosjektet</Button>
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
