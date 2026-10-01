"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { BooleanQuestion } from "@/components/ui/BooleanQuestion";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateBoenhetApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type BType = "hybel" | "sokkelleilighet" | "tomannsbolig";

export function BoenhetWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", {
    type: null as BType | null, antall: 1, areal: 0,
    hovedfunksjoner: null as boolean | null, egen_inngang: null as boolean | null, fysisk_adskilt: null as boolean | null,
  });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBoenhetApi(data);
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="boenhet" loadingText="Kontrollerer de tre kriteriene for ny boenhet…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });
  const allCriteria = data.hovedfunksjoner && data.egen_inngang && data.fysisk_adskilt;

  return (
    <>
      <Topbar onBack={back} title="Ny boenhet eller utleiedel" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva planlegger du?</h2>
              <p className="text-sm text-gray-500 mt-2">Navnet “hybel” avgjør ikke om det juridisk blir en ny boenhet.</p>
            </div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "hybel"} onClick={() => setData({ ...data, type: "hybel" })} title="Hybel eller utleiedel" desc="Del av eksisterende bolig" />
              <RadioCard selected={data.type === "sokkelleilighet"} onClick={() => setData({ ...data, type: "sokkelleilighet" })} title="Sokkelleilighet" desc="Planlagt leilighet i kjeller eller underetasje" />
              <RadioCard selected={data.type === "tomannsbolig"} onClick={() => setData({ ...data, type: "tomannsbolig" })} title="Dele til tomannsbolig" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Antall nye deler" value={data.antall} unit="stk" onChange={(value) => setData({ ...data, antall: Math.max(1, Math.round(value)) })} />
              <Field label="Ca. areal per del" value={data.areal} unit="m²" onChange={(areal) => setData({ ...data, areal })} />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type || data.areal <= 0} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">De tre avgjørende kriteriene</h2>
              <p className="text-sm text-gray-500 mt-2">Søknadspliktig oppdeling oppstår først når alle tre er oppfylt.</p>
            </div>
            <div className="space-y-2">
              <BooleanQuestion value={data.hovedfunksjoner} onChange={(hovedfunksjoner) => setData({ ...data, hovedfunksjoner })} title="Har alle hovedfunksjoner" description="Mulighet for stue, kjøkken, soveplass, bad og toalett" />
              <BooleanQuestion value={data.egen_inngang} onChange={(egen_inngang) => setData({ ...data, egen_inngang })} title="Har egen separat inngang" />
              <BooleanQuestion value={data.fysisk_adskilt} onChange={(fysisk_adskilt) => setData({ ...data, fysisk_adskilt })} title="Er fysisk adskilt" description="Ingen intern dør, trapp eller annen forbindelse til resten av boligen" />
            </div>
            <Alert variant={allCriteria ? "amber" : undefined}>
              {allCriteria
                ? "Alle tre kriteriene er valgt. Dette er søknadspliktig oppdeling og må videre til ansvarlig søker."
                : [data.hovedfunksjoner, data.egen_inngang, data.fysisk_adskilt].some(v => v == null) ? "Ett eller flere svar er ukjente. Vi må avklare disse før oppdelingen kan klassifiseres." : "Når ett eller flere kriterier mangler, er dette ikke en ny boenhet etter SAK10 § 2-2. Bruksendring eller andre arbeider kan fortsatt være søknadspliktige."}
            </Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>Klassifiser tiltaket</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (value: number) => void }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label><NumberField label={label} value={value} unit={unit} onChange={onChange} /></div>;
}
