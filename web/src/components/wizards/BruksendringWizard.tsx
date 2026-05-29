"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateBruksendringApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 | 2 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type FraType = "naring" | "kontor" | "garasje" | "bod" | "fritidsbolig" | "annet";
type TilType = "bolig" | "hybel" | "kontor" | "naring";

const FRA_LABEL: Record<FraType, string> = { naring: "Næringslokale / butikk", kontor: "Kontor", garasje: "Garasje", bod: "Bod / lager", fritidsbolig: "Fritidsbolig / hytte", annet: "Annet" };
const TIL_LABEL: Record<TilType, string> = { bolig: "Bolig", hybel: "Hybel / utleiedel", kontor: "Kontor", naring: "Næring" };

export function BruksendringWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ fra: null as FraType | null, til: null as TilType | null, areal: 30, verneverdig: false });

  const evaluate = async () => {
    if (!data.fra || !data.til) return;
    setPhase({ kind: "loading" });
    const result = await evaluateBruksendringApi({ fra: data.fra, til: data.til, areal: data.areal, verneverdig: data.verneverdig });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="bruksendring" loadingText="Sjekker PBL og reguleringsplan…" />;

  const step = phase.step;
  const back = () => {
    if (step === 0) router.push(`/property/${p.id}/tiltak`);
    else setPhase({ kind: "wizard", step: (step - 1) as 0 | 1 | 2 });
  };

  return (
    <>
      <Topbar title="Bruksendring" right={<span className="text-sm text-gray-500">{step + 1}/3</span>} />
      <ProgressBar step={step} total={3} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva er dagens bruk?</h2></div>
            <div className="space-y-2">
              {(Object.keys(FRA_LABEL) as FraType[]).map((t) => (
                <RadioCard key={t} selected={data.fra === t} onClick={() => setData({ ...data, fra: t })} title={FRA_LABEL[t]} desc="" />
              ))}
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.fra} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva skal ny bruk være?</h2></div>
            <div className="space-y-2">
              {(Object.keys(TIL_LABEL) as TilType[]).map((t) => (
                <RadioCard key={t} selected={data.til === t} onClick={() => setData({ ...data, til: t })} title={TIL_LABEL[t]} desc="" />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">Areal (m²)</label>
              <NumberField value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
            </div>
            <Alert>Bruksendring er alltid søknadspliktig etter PBL § 20-1 d.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.til} onClick={() => setPhase({ kind: "wizard", step: 2 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2></div>
            <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title="Verneverdig / antikvarisk bygning" desc="Registrert i SEFRAK eller kommunalt vernekart" />
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k="Eiendom" v={p.street} />
              <KV k="Fra" v={FRA_LABEL[data.fra!]} />
              <KV k="Til" v={TIL_LABEL[data.til!]} />
              <KV k="Areal" v={`${data.areal} m²`} last />
            </div>
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
