"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { ResultPhases, KV } from "./SimpleWizard";
import { evaluateTakApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "preview"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type TakType = "bytte_materiale" | "endre_form" | "bygge_loft";

export function TakWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({ type: null as TakType | null, verneverdig: false, etterisolere: false });

  const evaluate = async () => {
    if (!data.type) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTakApi({ type: data.type, verneverdig: data.verneverdig, etterisolere: data.etterisolere });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} loadingText="Sjekker TEK17 og reguleringsplanâ€¦" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Skifte tak" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva skal gjÃ¸res?</h2></div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "bytte_materiale"} onClick={() => setData({ ...data, type: "bytte_materiale" })} title="Bytte tekkemateriale" desc="Skifte til ny takstein, shingel eller annet materiale" />
              <RadioCard selected={data.type === "endre_form"} onClick={() => setData({ ...data, type: "endre_form" })} title="Endre takform" desc="Endre vinkel, gesims eller mÃ¸nehÃ¸yde" />
              <RadioCard selected={data.type === "bygge_loft"} onClick={() => setData({ ...data, type: "bygge_loft" })} title="Bygge ut loft" desc="Innrede loft til oppholdsrom eller soverom" />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste â†’</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Bygningsdetaljer</h2></div>
            <div className="space-y-2">
              <ToggleRow on={data.verneverdig} onChange={() => setData({ ...data, verneverdig: !data.verneverdig })} title="Verneverdig / antikvarisk bygning" desc="SEFRAK-registrert eller kommunalt vernet" />
              <ToggleRow on={data.etterisolere} onChange={() => setData({ ...data, etterisolere: !data.etterisolere })} title="Etterisolere taket samtidig" desc="Legge til ekstra isolasjon â€” anbefales ved skifte" />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl mt-2">
              <KV k="Eiendom" v={p.street} />
              <KV k="ByggeÃ¥r" v={String(p.bygg.byggeAar)} />
              <KV k="Etterisolere" v={data.etterisolere ? "Ja" : "Nei"} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>âš¡ Beregn nÃ¥</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
