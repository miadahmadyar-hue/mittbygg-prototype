"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateGarasjeApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/lib/i18n/context";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type GType = "garasje" | "carport" | "bod";
const LABEL: Record<GType, string> = { garasje: "Garasje", carport: "Carport", bod: "Bod / uthus" };
const LABEL_EN: Record<GType, string> = { garasje: "Garage", carport: "Carport", bod: "Shed / outbuilding" };

export function GarasjeWizard({ p }: { p: Address }) {
  const router = useRouter();
  const tr = useT();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as GType | null, areal: 30, avstand: 2.5 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateGarasjeApi({ type: data.type, areal: data.areal, avstand: data.avstand });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="garasje" loadingText={tr("Sjekker SAK10 og PBL…", "Checking SAK10 and PBL…")} />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title={tr("Bygge garasje", "Build garage")} right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Type og dimensjoner", "Type and dimensions")}</h2></div>
            <div className="space-y-2">
              {(["garasje", "carport", "bod"] as GType[]).map((ty) => (
                <RadioCard key={ty} selected={data.type === ty} onClick={() => setData({ ...data, type: ty })} title={tr(LABEL[ty], LABEL_EN[ty])} desc={ty === "garasje" ? tr("Lukket garasje med port", "Enclosed garage with door") : ty === "carport" ? tr("Åpen carport med tak", "Open carport with roof") : tr("Bod, uthus eller verksted", "Shed, outbuilding or workshop")} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Areal (m²)", "Area (m²)")}</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
              <p className="text-xs text-gray-500 mt-1">{tr("Under 50 m² er som regel unntatt søknad", "Under 50 m² is usually exempt from application")}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Avstand til nabogrense (m)", "Distance to property line (m)")}</label>
              <NumberField value={data.avstand} onChange={(v) => setData({ ...data, avstand: v })} step={0.5} unit="m" />
            </div>
            <Alert>{tr("Garasje ≤ 50 m² og ≥ 1 m fra nabogrense er normalt unntatt søknad (SAK10 § 4-1 b).", "A garage ≤ 50 m² and ≥ 1 m from the property line is normally exempt (SAK10 § 4-1 b).")}</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>{tr("Neste", "Next")} →</Button>
              <Button variant="ghost" full onClick={back}>{tr("Tilbake", "Back")}</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Bekreft og beregn", "Confirm and calculate")}</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k={tr("Eiendom", "Property")} v={p.street} />
              <KV k={tr("Type", "Type")} v={tr(LABEL[data.type!], LABEL_EN[data.type!])} />
              <KV k={tr("Areal", "Area")} v={`${data.areal} m²`} />
              <KV k={tr("Avstand til nabo", "Distance to neighbor")} v={`${data.avstand} m`} last />
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
