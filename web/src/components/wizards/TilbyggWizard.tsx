"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateTilbyggApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/lib/i18n/context";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type TType = "tilbygg_1etasje" | "ny_etasje" | "innglasset_terrasse";
const LABEL: Record<TType, string> = { tilbygg_1etasje: "Tilbygg i 1. etasje", ny_etasje: "Ny etasje", innglasset_terrasse: "Innglasset terrasse" };
const LABEL_EN: Record<TType, string> = { tilbygg_1etasje: "Ground-floor extension", ny_etasje: "New floor", innglasset_terrasse: "Glazed terrace" };

export function TilbyggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const tr = useT();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as TType | null, areal: 20, avstand: 5 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTilbyggApi({ type: data.type, areal: data.areal, avstand: data.avstand });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="tilbygg" loadingText={tr("Sjekker SAK10, PBL og reguleringsplan…", "Checking SAK10, PBL and zoning plan…")} />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title={tr("Tilbygg", "Extension")} right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">{tr("Type og dimensjoner", "Type and dimensions")}</h2></div>
            <div className="space-y-2">
              {(["tilbygg_1etasje", "ny_etasje", "innglasset_terrasse"] as TType[]).map((ty) => (
                <RadioCard key={ty} selected={data.type === ty} onClick={() => setData({ ...data, type: ty })} title={tr(LABEL[ty], LABEL_EN[ty])} desc={ty === "tilbygg_1etasje" ? tr("Utvide boligen i grunnflaten", "Expand the home's footprint") : ty === "ny_etasje" ? tr("Ekstra etasje på toppen", "Extra floor on top") : tr("Innglasset terrasse eller vinterhage", "Glazed terrace or conservatory")} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Areal tilbygg (m²)", "Extension area (m²)")}</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
              <p className="text-xs text-gray-500 mt-1">{tr("≤ 15 m² unntatt · 15–50 m² søknad uten ansvarsrett · over 50 m² krever ANS-rett", "≤ 15 m² exempt · 15–50 m² application without pro liability · over 50 m² needs pro liability")}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Avstand til nabogrense (m)", "Distance to property line (m)")}</label>
              <NumberField value={data.avstand} onChange={(v) => setData({ ...data, avstand: v })} step={0.5} unit="m" />
              <p className="text-xs text-gray-500 mt-1">{tr("Krav: minst 4 m fra nabogrense (PBL § 29-4)", "Requirement: at least 4 m from the property line (PBL § 29-4)")}</p>
            </div>
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
            <Alert>{tr("Vi sjekker mot SAK10, PBL §§ 20-1, 20-3, 20-4 og §29-4 naboavstand.", "We check against SAK10, PBL §§ 20-1, 20-3, 20-4 and § 29-4 neighbor distance.")}</Alert>
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
