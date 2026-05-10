"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateAnneksApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type AType = "anneks" | "uthus" | "hagebod";

export function AnneksWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as AType | null, areal: 25, avstand: 2 });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateAnneksApi({ type: data.type, areal: data.areal, avstand: data.avstand });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker SAK10 og PBL…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Anneks / uthus" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Type og dimensjoner</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "anneks"}   onClick={() => setData({ ...data, type: "anneks" })}   title="Anneks / gjestehytte"  desc="Separat bygning med overnatting" />
              <RadioCard selected={data.type === "uthus"}    onClick={() => setData({ ...data, type: "uthus" })}    title="Uthus / verksted"      desc="Verksted, lager eller hobbyrom" />
              <RadioCard selected={data.type === "hagebod"}  onClick={() => setData({ ...data, type: "hagebod" })}  title="Hagebod"               desc="Enkel bod for hageredskap" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Areal (m²)</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
              <p className="text-xs text-gray-500 mt-1">Under 50 m² er normalt unntatt søknad</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Avstand til nabogrense (m)</label>
              <NumberField value={data.avstand} onChange={(v) => setData({ ...data, avstand: v })} step={0.5} unit="m" />
            </div>
            <Alert>Frittstående byggverk ≤ 50 m² og ≥ 1 m fra nabo er unntatt søknad (SAK10 § 4-1 b).</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV k="Type" v={data.type === "anneks" ? "Anneks / gjestehytte" : data.type === "uthus" ? "Uthus / verksted" : "Hagebod"} />
              <KV k="Areal" v={`${data.areal} m²`} />
              <KV k="Avstand til nabo" v={`${data.avstand} m`} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>âš¡ Beregn nå</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
