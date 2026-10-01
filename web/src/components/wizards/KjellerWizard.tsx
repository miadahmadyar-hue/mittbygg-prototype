"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioCard } from "@/components/ui/RadioCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

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

type CurrentUse = "bod" | "vaskerom" | "teknisk" | "annet" | "usikker";
type Condition = "ja" | "nei" | "usikker";

interface WizardData {
  room: CurrentUse | null;
  rental?: "same" | "separate" | "unknown";
  unknownMeasurements?: boolean;
  unknownWindow?: boolean;
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
  annet: ["Annen godkjent bruk", "Beskriv bruken i saksunderlaget etter vurderingen"],
  usikker: ["Vet ikke", "Jeg har ikke funnet godkjent bruk ennå"],
};

export function KjellerWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState<WizardData>("data", INITIAL);

  const evaluate = async () => {
    if (!data.room || !data.ny_bruk) return;
    setPhase({ kind: "loading" });
    const result = await evaluateKjellerApi({
      propId: p.id,
      byggeAar: p.bygg.byggeAar,
      room: data.room,
      ny_bruk: data.ny_bruk,
      rental_use: data.ny_bruk === "hybel" ? (data.rental ?? "unknown") : "same",
      radon: data.radon,
      drenering: data.drenering_status === "ja",
      balansert_vent: data.ventilasjon_status === "ja",
      bra: p.bygg.BRA ?? null,
      etasjer: p.bygg.etasjer ?? null,
      rom_areal: data.unknownMeasurements ? null : data.rom_areal,
      takhoyde: data.unknownMeasurements ? null : data.takhoyde,
      vindu_bredde: data.unknownWindow ? null : (data.vindu_bredde || null),
      vindu_hoyde: data.unknownWindow ? null : (data.vindu_hoyde || null),
      vindu_brystning: data.unknownWindow ? null : (data.vindu_brystning || null),
      godkjent_bruk_bekreftet: data.room !== "usikker" && data.godkjent_bruk_bekreftet,
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
                <RadioCard key={value} selected={data.room === value} onClick={() => setData({ ...data, room: value, godkjent_bruk_bekreftet: false })} title={label[0]} desc={label[1]} />
              ))}
            </div>
            <label className="flex gap-3 items-start text-sm"><input type="checkbox" disabled={data.room === "usikker" || !data.room} checked={data.godkjent_bruk_bekreftet && data.room !== "usikker"} onChange={(e) => setData({ ...data, godkjent_bruk_bekreftet: e.target.checked })} />Jeg har kontrollert bruken i siste godkjente plantegning</label>
            <Alert variant="amber">Mangler du tegninger? Be kommunens byggesaksarkiv om siste godkjente plantegning og vedtak. Oppgi adresse og gårds-/bruksnummer. Du kan fortsette med «Vet ikke» og laste opp dokumentene etter vurderingen.</Alert>
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
                <RadioCard key={key} selected={data.ny_bruk === key} onClick={() => setData({ ...data, ny_bruk: key })} title={key === "hybel" ? "Utleie / mulig egen boenhet" : value.label} desc={key === "hybel" ? "Avklar om dette er del av boligen eller en separat enhet" : value.desc} />
              ))}
            </div>
            {data.ny_bruk === "hybel" && <div className="panel p-4 space-y-2"><h3 className="font-semibold">Hvordan skal utleiedelen fungere?</h3>
              <RadioCard selected={data.rental === "same"} onClick={() => setData({ ...data, rental: "same" })} title="Rom i eksisterende bolig" desc="Delte funksjoner eller intern forbindelse til resten av boligen" />
              <RadioCard selected={data.rental === "separate"} onClick={() => setData({ ...data, rental: "separate" })} title="Planlegger en separat boenhet" desc="Egen inngang, alle boligfunksjoner og fysisk atskilt fra resten" />
              <RadioCard selected={data.rental === "unknown"} onClick={() => setData({ ...data, rental: "unknown" })} title="Usikker på oppdelingen" />
              <p className="text-sm">Utleie alene avgjør ikke om det er en ny boenhet. Den faktiske løsningen må kontrolleres.</p>
            </div>}
            <Navigation canProceed={Boolean(data.ny_bruk) && (data.ny_bruk !== "hybel" || Boolean(data.rental))} onNext={() => setPhase({ kind: "wizard", step: 2 })} onBack={back} />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Mål rommet</h2>
              <p className="text-sm text-gray-500 mt-2">Oppgi faktiske mål. Vindu måles som fri åpning når det er helt åpent.</p>
            </div>
            <label className="flex gap-3"><input type="checkbox" checked={data.unknownMeasurements ?? false} onChange={(e) => setData({ ...data, unknownMeasurements: e.target.checked })} />Areal og takhøyde er ikke målt ennå</label>
            {!data.unknownMeasurements && <>
            <Measurement label="Gulvareal" value={data.rom_areal} onChange={(value) => setData({ ...data, rom_areal: value })} unit="m²" step={0.5} />
            <Measurement label="Takhøyde" value={data.takhoyde / 1000} onChange={(value) => setData({ ...data, takhoyde: Math.round(value * 1000) })} unit="m" step={0.01} />
            </>}
            {data.ny_bruk !== "bad" && <>
            <label className="flex gap-3"><input type="checkbox" checked={data.unknownWindow ?? false} onChange={(e) => setData({ ...data, unknownWindow: e.target.checked })} />Vindu mangler eller er ikke målt ennå</label>
            {!data.unknownWindow && <>
            <div className="grid grid-cols-2 gap-3">
              <Measurement label="Vindu, fri bredde" value={data.vindu_bredde} onChange={(value) => setData({ ...data, vindu_bredde: value })} unit="m" step={0.05} />
              <Measurement label="Vindu, fri høyde" value={data.vindu_hoyde} onChange={(value) => setData({ ...data, vindu_hoyde: value })} unit="m" step={0.05} />
            </div>
            <Measurement label="Høyde fra gulv til vindusåpning" value={data.vindu_brystning} onChange={(value) => setData({ ...data, vindu_brystning: value })} unit="m" step={0.05} />
            </>}</>}
            <Navigation canProceed={Boolean(data.unknownMeasurements) || (data.rom_areal > 0 && data.takhoyde > 0)} onNext={() => setPhase({ kind: "wizard", step: 3 })} onBack={back} />
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
              <label className="flex gap-3 mb-3"><input type="checkbox" checked={data.radon === null} onChange={(e) => setData({ ...data, radon: e.target.checked ? null : 0 })} />Ikke målt / målerapport mangler</label>
              {data.radon !== null && <NumberField label="Radon" value={data.radon} onChange={(value) => setData({ ...data, radon: value })} unit="Bq/m³" />}
              <p className="text-xs text-gray-500 mt-2">Oppgi resultatet fra målerapporten. Rapporten kan lastes opp etter vurderingen.</p>
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
