"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";

import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateBruksendringApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/lib/i18n/context";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 | 2 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type FraType = "naring" | "kontor" | "garasje" | "bod" | "fritidsbolig" | "annet" | "usikker";
type TilType = "bolig" | "hybel" | "rom" | "kontor" | "naring";
type PlanStatus = "tillatt" | "ikke_tillatt" | "usikker";

const FRA_LABEL: Record<FraType, string> = { naring: "Næringslokale / butikk", kontor: "Kontor", garasje: "Garasje", bod: "Bod / lager", fritidsbolig: "Fritidsbolig / hytte", annet: "Annet", usikker: "Vet ikke" };
const FRA_LABEL_EN: Record<FraType, string> = { naring: "Commercial space / shop", kontor: "Office", garasje: "Garage", bod: "Storage / warehouse", fritidsbolig: "Holiday home / cabin", annet: "Other", usikker: "Don’t know" };
const TIL_LABEL: Record<TilType, string> = { rom: "Ekstra rom i eksisterende bolig", bolig: "Ny separat bolig", hybel: "Utleie – avklar oppdeling", kontor: "Kontor", naring: "Næring" };
const TIL_LABEL_EN: Record<TilType, string> = { rom: "Extra room in existing home", bolig: "New separate dwelling", hybel: "Rental – clarify layout", kontor: "Office", naring: "Commercial" };

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
    unknownArea: false,
    vern_status: "usikker" as "ja" | "nei" | "usikker",
    baerende_status: "usikker" as "ja" | "nei" | "usikker",
    bolig_scope: "unknown" as "same" | "separate" | "unknown",
  });

  const evaluate = async () => {
    if (!data.fra || !data.til) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBruksendringApi({ ...data,
      areal: data.unknownArea ? null : data.areal,
      vern_status: data.vern_status ?? "usikker", baerende_status: data.baerende_status ?? "usikker",
      verneverdig: data.vern_status === "ja", inngrep_baerende: data.baerende_status === "ja",
      godkjent_bruk_bekreftet: data.fra !== "usikker" && data.godkjent_bruk_bekreftet,
      bolig_scope: data.til === "rom" ? "same" : data.til === "bolig" ? "separate" : (data.bolig_scope ?? "unknown"),
    });
    setPhase({ kind: "result", result });
  };

  if ("result" in phase && !("vern_status" in (phase.result.input as Record<string, unknown>))) return <><Topbar title="Oppdatert veiviser" /><main className="view"><h1>Kontroller de lagrede svarene</h1><p>Svarene er beholdt. Vurderingen må kjøres på nytt med de nye spørsmålene.</p><Button full onClick={() => setPhase({ kind: "wizard", step: 0 })}>Se svar og oppdater vurderingen</Button></main></>;
  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="bruksendring" loadingText={tr("Vurderer opplysningene dine…", "Reviewing your answers…")} />;

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
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Hva er arealet godkjent som?", "What is the approved use?")}</h2></div>
            <div className="space-y-2">
              {(Object.keys(FRA_LABEL) as FraType[]).map((ty) => (
                <RadioCard key={ty} selected={data.fra === ty} onClick={() => setData({ ...data, fra: ty, godkjent_bruk_bekreftet: false })} title={tr(FRA_LABEL[ty], FRA_LABEL_EN[ty])} desc="" />
              ))}
            </div>
            <label className="flex gap-3 text-sm"><input type="checkbox" disabled={!data.fra || data.fra === "usikker"} checked={data.godkjent_bruk_bekreftet && data.fra !== "usikker"} onChange={e => setData({ ...data, godkjent_bruk_bekreftet: e.target.checked })} />{tr("Jeg har kontrollert siste godkjente tegning og vedtak", "I checked the latest approved drawing and decision")}</label>
            <Alert>{tr("Bruk godkjent bruk, ikke bare dagens faktiske bruk. Kommunens byggesaksarkiv kan hjelpe deg å finne tegninger. Du kan laste dem opp etter vurderingen.", "Use the approved use, not just actual use today. Ask the municipal archive for drawings. You can upload them after the assessment.")}</Alert>
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
            {data.til === "hybel" && <div className="panel p-4 space-y-2"><h3>{tr("Hvordan fungerer utleiedelen?", "How is the rental space arranged?")}</h3>
              <RadioCard selected={data.bolig_scope === "same"} onClick={() => setData({ ...data, bolig_scope: "same" })} title={tr("Rom i samme bolig", "Room in the same dwelling")} desc={tr("Delte funksjoner eller intern forbindelse", "Shared functions or an internal connection")} />
              <RadioCard selected={data.bolig_scope === "separate"} onClick={() => setData({ ...data, bolig_scope: "separate" })} title={tr("Separat boenhet", "Separate dwelling")} desc={tr("Egen inngang, alle boligfunksjoner og fysisk atskilt", "Own entrance, all dwelling functions and physically separate")} />
              <RadioCard selected={(data.bolig_scope ?? "unknown") === "unknown"} onClick={() => setData({ ...data, bolig_scope: "unknown" })} title={tr("Usikker", "Unsure")} />
            </div>}
            <label className="flex gap-3 text-sm"><input type="checkbox" checked={data.unknownArea ?? false} onChange={e => setData({ ...data, unknownArea: e.target.checked })} />{tr("Arealet er ikke målt ennå", "Area not measured yet")}</label>
            {!data.unknownArea && <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">{tr("Areal (m²)", "Area (m²)")}</label>
              <NumberField label="Areal" value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
            </div>}
            <Alert>{tr("Ny bruk må også være tillatt i gjeldende plan og oppfylle relevante tekniske krav.", "The new use must also comply with the applicable plan and relevant technical requirements.")}</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.til || (!data.unknownArea && data.areal <= 0)} onClick={() => setPhase({ kind: "wizard", step: 2 })}>{tr("Neste", "Next")} →</Button>
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
            <Condition label={tr("Berøres bærevegger, dekker eller søyler?", "Are bearing walls, floors or columns affected?")} value={data.baerende_status ?? "usikker"} onChange={v => setData({ ...data, baerende_status: v })} />
            <Condition label={tr("Har bygningen kjent vern eller kulturminneregistrering?", "Does the building have known heritage protection or registration?")} value={data.vern_status ?? "usikker"} onChange={v => setData({ ...data, vern_status: v })} />
            <Alert>{tr("Velg usikker når forholdet ikke er kontrollert. Appen har ikke hentet eller godkjent plan- og vernestatus for deg.", "Choose unsure when not verified. The app has not retrieved or approved planning or heritage status for you.")}</Alert>
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k={tr("Eiendom", "Property")} v={p.street} />
              <KV k={tr("Fra", "From")} v={tr(FRA_LABEL[data.fra!], FRA_LABEL_EN[data.fra!])} />
              <KV k={tr("Til", "To")} v={tr(TIL_LABEL[data.til!], TIL_LABEL_EN[data.til!])} />
              <KV k={tr("Areal", "Area")} v={data.unknownArea ? tr("Ikke målt", "Not measured") : `${data.areal} m²`} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>{tr("Se vurdering", "View assessment")}</Button>
              <Button variant="ghost" full onClick={back}>{tr("Tilbake", "Back")}</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Condition({ label, value, onChange }: { label: string; value: "ja" | "nei" | "usikker"; onChange: (v: "ja" | "nei" | "usikker") => void }) {
  const tr = useT();
  return <fieldset><legend className="text-sm font-semibold mb-2">{label}</legend><div className="grid grid-cols-3 gap-2">{(["ja", "nei", "usikker"] as const).map(v => <RadioCard key={v} selected={value === v} onClick={() => onChange(v)} title={v === "ja" ? tr("Ja", "Yes") : v === "nei" ? tr("Nei", "No") : tr("Usikker", "Unsure")} />)}</div></fieldset>;
}
