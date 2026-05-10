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
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type TType = "tilbygg_1etasje" | "ny_etasje" | "innglasset_terrasse";
const LABEL: Record<TType, string> = { tilbygg_1etasje: "Tilbygg i 1. etasje", ny_etasje: "Ny etasje", innglasset_terrasse: "Innglasset terrasse" };

export function TilbyggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as TType | null, areal: 20, avstand: 5 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTilbyggApi({ type: data.type, areal: data.areal, avstand: data.avstand });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="tilbygg" loadingText="Sjekker SAK10, PBL og reguleringsplan…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Tilbygg" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Type og dimensjoner</h2></div>
            <div className="space-y-2">
              {(["tilbygg_1etasje", "ny_etasje", "innglasset_terrasse"] as TType[]).map((t) => (
                <RadioCard key={t} selected={data.type === t} onClick={() => setData({ ...data, type: t })} title={LABEL[t]} desc={t === "tilbygg_1etasje" ? "Utvide boligen i grunnflaten" : t === "ny_etasje" ? "Ekstra etasje på toppen" : "Innglasset terrasse eller vinterhage"} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Areal tilbygg (m²)</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
              <p className="text-xs text-gray-500 mt-1">≤ 15 m² unntatt · 15–50 m² søknad uten ansvarsrett · over 50 m² krever ANS-rett</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Avstand til nabogrense (m)</label>
              <NumberField value={data.avstand} onChange={(v) => setData({ ...data, avstand: v })} step={0.5} unit="m" />
              <p className="text-xs text-gray-500 mt-1">Krav: minst 4 m fra nabogrense (PBL § 29-4)</p>
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="Type" v={LABEL[data.type!]} />
              <KV k="Areal" v={`${data.areal} m²`} />
              <KV k="Avstand til nabo" v={`${data.avstand} m`} last />
            </div>
            <Alert>Vi sjekker mot SAK10, PBL §§ 20-1, 20-3, 20-4 og §29-4 naboavstand.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>⚡ Beregn nå</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
