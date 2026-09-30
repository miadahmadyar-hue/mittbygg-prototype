"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioCard } from "@/components/ui/RadioCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ToggleRow } from "@/components/ui/Toggle";
import { NumberField, ResultPhases } from "./SimpleWizard";
import { KJELLER_BRUK, type KjellerBrukId } from "@/lib/data/kjellerBruk";
import { evaluateKjellerApi, type TiltakResult } from "@/lib/api/evaluate";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: 0 | 1 | 2 | 3 }
  | { kind: "loading" }
  | { kind: "result"; result: TiltakResult }
  | { kind: "betaling"; result: TiltakResult }
  | { kind: "sending"; result: TiltakResult }
  | { kind: "sent"; result: TiltakResult };

type CurrentUse = "bod" | "vaskerom" | "teknisk" | "annet";
type Condition = "ja" | "nei" | "usikker";

interface WizardData {
  room: CurrentUse | null;
  ny_bruk: KjellerBrukId | null;
  godkjent_bruk_bekreftet: boolean;
  rom_areal: number;
  takhoyde: number;
  vindu_bredde: number;
  vindu_hoyde: number;
  vindu_brystning: number;
  radon: number | null;
  drenering_status: Condition;
  ventilasjon_status: Condition;
}

const INITIAL: WizardData = {
  room: null,
  ny_bruk: null,
  godkjent_bruk_bekreftet: false,
  rom_areal: 0,
  takhoyde: 0,
  vindu_bredde: 0,
  vindu_hoyde: 0,
  vindu_brystning: 0,
  radon: null,
  drenering_status: "usikker",
  ventilasjon_status: "usikker",
};

const CURRENT_USE: Record<CurrentUse, [string, string]> = {
  bod: ["Bod eller lager", "Ikke godkjent for varig opphold"],
  vaskerom: ["Vaskerom", "Våtrom eller vaskesone"],
  teknisk: ["Teknisk rom", "Rom for tekniske installasjoner"],
  annet: ["Annet eller usikker", "Vi markerer dette for nærmere avklaring"],
};

export function KjellerWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState<WizardData>("data", INITIAL);

  const evaluate = async () => {
    if (!data.room || !data.ny_bruk || !data.rom_areal || !data.takhoyde) return;
    setPhase({ kind: "loading" });
    const result = await evaluateKjellerApi({
      propId: p.id,
      byggeAar: p.bygg.byggeAar,
      room: data.room,
      ny_bruk: data.ny_bruk,
      radon: data.radon,
      drenering: data.drenering_status === "ja",
      balansert_vent: data.ventilasjon_status === "ja",
      bra: p.bygg.BRA ?? null,
      etasjer: p.bygg.etasjer ?? null,
      rom_areal: data.rom_areal,
      takhoyde: data.takhoyde,
      vindu_bredde: data.vindu_bredde || null,
      vindu_hoyde: data.vindu_hoyde || null,
      vindu_brystning: data.vindu_brystning || null,
      godkjent_bruk_bekreftet: data.godkjent_bruk_bekreftet,
      drenering_status: data.drenering_status,
      ventilasjon_status: data.ventilasjon_status,
    });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") {
    return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="kjeller" loadingText="Vurderer rommet mot kravene…" />;
  }

  const step = phase.step;
  const back = () => {
    if (step === 0) router.push(`/property/${p.id}/tiltak`);
    else setPhase({ kind: "wizard", step: (step - 1) as 0 | 1 | 2 });
  };

  return (
    <>
      <Topbar onBack={back} title="Bruksendring kjeller" right={<span className="text-sm text-gray-500">{step + 1}/4</span>} />
      <ProgressBar step={step} total={4} />
      <div className="view">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva er rommet godkjent som i dag?</h2>
              <p className="text-sm text-gray-500 mt-2">Bruk siste godkjente plantegning, ikke hvordan rommet brukes akkurat nå.</p>
            </div>
            <div className="space-y-2">
              {(Object.entries(CURRENT_USE) as [CurrentUse, [string, string]][]).map(([value, label]) => (
                <RadioCard key={value} selected={data.room === value} onClick={() => setData({ ...data, room: value })} title={label[0]} desc={label[1]} />
              ))}
            </div>
            <ToggleRow
              on={data.godkjent_bruk_bekreftet}
              onChange={() => setData({ ...data, godkjent_bruk_bekreftet: !data.godkjent_bruk_bekreftet })}
              title="Bekreftet i godkjent tegning"
              desc="Jeg har kontrollert siste godkjente plantegning"
            />
            <Alert variant="amber">Har du ikke tegningene, kan kommunen vanligvis gi innsyn i byggesaksarkivet.</Alert>
            <Navigation canProceed={Boolean(data.room)} onNext={() => setPhase({ kind: "wizard", step: 1 })} onBack={back} />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva skal rommet brukes til?</h2>
              <p className="text-sm text-gray-500 mt-2">Dette avgjør hvilke krav som må dokumenteres.</p>
            </div>
            <div className="space-y-2">
              {(Object.entries(KJELLER_BRUK) as [KjellerBrukId, typeof KJELLER_BRUK[KjellerBrukId]][]).map(([key, value]) => (
                <RadioCard key={key} selected={data.ny_bruk === key} onClick={() => setData({ ...data, ny_bruk: key })} title={value.label} desc={value.desc} />
              ))}
            </div>
            <Navigation canProceed={Boolean(data.ny_bruk)} onNext={() => setPhase({ kind: "wizard", step: 2 })} onBack={back} />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Mål rommet</h2>
              <p className="text-sm text-gray-500 mt-2">Oppgi faktiske mål. Vindu måles som fri åpning når det er helt åpent.</p>
            </div>
            <Measurement label="Gulvareal" value={data.rom_areal} onChange={(value) => setData({ ...data, rom_areal: value })} unit="m²" step={0.5} />
            <Measurement label="Takhøyde" value={data.takhoyde} onChange={(value) => setData({ ...data, takhoyde: value })} unit="mm" />
            <div className="grid grid-cols-2 gap-3">
              <Measurement label="Vindu, fri bredde" value={data.vindu_bredde} onChange={(value) => setData({ ...data, vindu_bredde: value })} unit="m" step={0.05} />
              <Measurement label="Vindu, fri høyde" value={data.vindu_hoyde} onChange={(value) => setData({ ...data, vindu_hoyde: value })} unit="m" step={0.05} />
            </div>
            <Measurement label="Høyde fra gulv til vindusåpning" value={data.vindu_brystning} onChange={(value) => setData({ ...data, vindu_brystning: value })} unit="m" step={0.05} />
            <Navigation canProceed={data.rom_areal > 0 && data.takhoyde > 0} onNext={() => setPhase({ kind: "wizard", step: 3 })} onBack={back} />
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Tilstand og dokumentasjon</h2>
              <p className="text-sm text-gray-500 mt-2">Velg usikker når du ikke har dokumentasjon. Det gir et tryggere resultat.</p>
            </div>
            <ConditionGroup label="Er drenering og fuktsikring kontrollert?" value={data.drenering_status} onChange={(value) => setData({ ...data, drenering_status: value })} />
            <ConditionGroup label="Finnes dokumentert ventilasjon for ny bruk?" value={data.ventilasjon_status} onChange={(value) => setData({ ...data, ventilasjon_status: value })} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Radonmåling, hvis tilgjengelig</label>
              <NumberField label="Radon" value={data.radon ?? 0} onChange={(value) => setData({ ...data, radon: value || null })} unit="Bq/m³" />
              <p className="text-xs text-gray-500 mt-2">La feltet stå på 0 hvis radon ikke er målt.</p>
            </div>
            <Alert>Resultatet er en tidlig regelsjekk. Tegninger og teknisk dokumentasjon må fortsatt kontrolleres før innsending.</Alert>
            <Navigation canProceed onNext={evaluate} onBack={back} final />
          </>
        )}
      </div>
    </>
  );
}

function Measurement({ label, value, onChange, unit, step = 1 }: { label: string; value: number; onChange: (value: number) => void; unit: string; step?: number }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <NumberField label={label} value={value} onChange={onChange} unit={unit} step={step} />
    </div>
  );
}

function ConditionGroup({ label, value, onChange }: { label: string; value: Condition; onChange: (value: Condition) => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="grid grid-cols-3 gap-2">
        <RadioCard selected={value === "ja"} onClick={() => onChange("ja")} title="Ja" />
        <RadioCard selected={value === "nei"} onClick={() => onChange("nei")} title="Nei" />
        <RadioCard selected={value === "usikker"} onClick={() => onChange("usikker")} title="Usikker" />
      </div>
    </div>
  );
}

function Navigation({ canProceed, onNext, onBack, final = false }: { canProceed: boolean; onNext: () => void; onBack: () => void; final?: boolean }) {
  return (
    <div className="mt-auto pt-4 flex flex-col gap-2">
      <Button size={final ? "lg" : undefined} full disabled={!canProceed} onClick={onNext}>{final ? "Se vurdering" : "Neste"}</Button>
      <Button variant="ghost" full onClick={onBack}>Tilbake</Button>
    </div>
  );
}
