"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateBruksendringApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/lib/i18n/context";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 | 2 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type FraType = "naring" | "kontor" | "garasje" | "bod" | "fritidsbolig" | "annet";
type TilType = "bolig" | "hybel" | "kontor" | "naring";
type PlanStatus = "tillatt" | "ikke_tillatt" | "usikker";

const FRA_LABEL: Record<FraType, string> = { naring: "Næringslokale / butikk", kontor: "Kontor", garasje: "Garasje", bod: "Bod / lager", fritidsbolig: "Fritidsbolig / hytte", annet: "Annet" };
const FRA_LABEL_EN: Record<FraType, string> = { naring: "Commercial space / shop", kontor: "Office", garasje: "Garage", bod: "Storage / warehouse", fritidsbolig: "Holiday home / cabin", annet: "Other" };
const TIL_LABEL: Record<TilType, string> = { bolig: "Bolig", hybel: "Hybel / utleiedel", kontor: "Kontor", naring: "Næring" };
const TIL_LABEL_EN: Record<TilType, string> = { bolig: "Dwelling", hybel: "Bedsit / rental unit", kontor: "Office", naring: "Commercial" };

export function BruksendringWizard({ p }: { p: Address }) {
  const router = useRouter();
  const tr = useT();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", {
    fra: null as FraType | null,
    til: null as TilType | null,
    areal: 0,
    verneverdig: false,
    godkjent_bruk_bekreftet: false,
    plan_status: "usikker" as PlanStatus,
    inngrep_baerende: false,
  });

  const evaluate = async () => {
    if (!data.fra || !data.til) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBruksendringApi(data);
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="bruksendring" loadingText={tr("Sjekker PBL og reguleringsplan…", "Checking PBL and zoning plan…")} />;

  const step = phase.step;
  const back = () => {
    if (step === 0) router.push(`/property/${p.id}/tiltak`);
    else setPhase({ kind: "wizard", step: (step - 1) as 0 | 1 | 2 });
  };

  return (
    <>
      <Topbar onBack={back} title={tr("Bruksendring", "Change of use")} right={<span className="text-sm text-gray-500">{step + 1}/3</span>} />
      <ProgressBar step={step} total={3} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Hva er dagens bruk?", "What is the current use?")}</h2></div>
            <div className="space-y-2">
              {(Object.keys(FRA_LABEL) as FraType[]).map((ty) => (
                <RadioCard key={ty} selected={data.fra === ty} onClick={() => setData({ ...data, fra: ty })} title={tr(FRA_LABEL[ty], FRA_LABEL_EN[ty])} desc="" />
              ))}
            </div>
            <ToggleRow on={data.godkjent_bruk_bekreftet} onChange={() => setData({ ...data, godkjent_bruk_bekreftet: !data.godkjent_bruk_bekreftet })} title={tr("Bekreftet i godkjent tegning", "Confirmed in approved drawing")} desc={tr("Jeg har kontrollert siste godkjente tegning", "I checked the latest approved drawing")} />
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.fra} onClick={() => setPhase({ kind: "wizard", step: 1 })}>{tr("Neste", "Next")} →</Button>
              <Button variant="ghost" full onClick={back}>{tr("Tilbake", "Back")}</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Hva skal ny bruk være?", "What will the new use be?")}</h2></div>
            <div className="space-y-2">
              {(Object.keys(TIL_LABEL) as TilType[]).map((ty) => (
                <RadioCard key={ty} selected={data.til === ty} onClick={() => setData({ ...data, til: ty })} title={tr(TIL_LABEL[ty], TIL_LABEL_EN[ty])} desc="" />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">{tr("Areal (m²)", "Area (m²)")}</label>
              <NumberField label="Areal" value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
            </div>
            <Alert>{tr("Ny bruk må også være tillatt i gjeldende plan og oppfylle relevante tekniske krav.", "The new use must also comply with the applicable plan and relevant technical requirements.")}</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.til || data.areal <= 0} onClick={() => setPhase({ kind: "wizard", step: 2 })}>{tr("Neste", "Next")} →</Button>
              <Button variant="ghost" full onClick={back}>{tr("Tilbake", "Back")}</Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Plan og fysiske endringer", "Plan and physical changes")}</h2></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{tr("Tillater gjeldende plan den nye bruken?", "Does the current plan allow the new use?")}</h3>
              <div className="space-y-2">
                <RadioCard selected={data.plan_status === "tillatt"} onClick={() => setData({ ...data, plan_status: "tillatt" })} title={tr("Ja, planen er kontrollert", "Yes, the plan is checked")} desc="" />
                <RadioCard selected={data.plan_status === "ikke_tillatt"} onClick={() => setData({ ...data, plan_status: "ikke_tillatt" })} title={tr("Nei, dispensasjon kan være nødvendig", "No, a dispensation may be needed")} desc="" />
                <RadioCard selected={data.plan_status === "usikker"} onClick={() => setData({ ...data, plan_status: "usikker" })} title={tr("Jeg er usikker", "I am unsure")} desc="" />
              </div>
            </div>
            <ToggleRow on={data.inngrep_baerende} onChange={() => setData({ ...data, inngrep_baerende: !data.inngrep_baerende })} title={tr("Inngrep i bærevegg, dekke eller søyle", "Changes to bearing walls, floors or columns")} desc={tr("Krever faglig vurdering før arbeid starter", "Requires professional review before work begins")} />
            <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title={tr("Verneverdig / antikvarisk bygning", "Heritage / protected building")} desc={tr("Registrert i SEFRAK eller kommunalt vernekart", "Listed in SEFRAK or the municipal heritage map")} />
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k={tr("Eiendom", "Property")} v={p.street} />
              <KV k={tr("Fra", "From")} v={tr(FRA_LABEL[data.fra!], FRA_LABEL_EN[data.fra!])} />
              <KV k={tr("Til", "To")} v={tr(TIL_LABEL[data.til!], TIL_LABEL_EN[data.til!])} />
              <KV k={tr("Areal", "Area")} v={`${data.areal} m²`} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>⚡ {tr("Beregn nå", "Calculate now")}</Button>
              <Button variant="ghost" full onClick={back}>{tr("Tilbake", "Back")}</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
