"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioCard } from "@/components/ui/RadioCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateVeggApi, type TiltakResult } from "@/lib/api/evaluate";
import type { VeggInput } from "@/lib/regulations/vegg";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: 0 | 1 }
  | { kind: "loading" }
  | { kind: "result"; result: TiltakResult }
  | { kind: "betaling"; result: TiltakResult }
  | { kind: "sending"; result: TiltakResult }
  | { kind: "sent"; result: TiltakResult };

const TYPE_LABELS: Record<VeggInput["type"], [string, string]> = {
  fjerne_vegg: ["Fjerne hele veggen", "Åpne rommet helt"],
  ny_apning: ["Lage en ny åpning", "Ny dør eller åpning i veggen"],
  utvide_apning: ["Utvide en åpning", "Gjøre en eksisterende åpning bredere"],
  flytte_vegg: ["Flytte veggen", "Endre planløsningen"],
  endre_soyle: ["Endre eller fjerne søyle", "Arbeid på eksisterende søyle"],
};

const INITIAL: VeggInput = {
  type: "fjerne_vegg",
  baerende: "usikker",
  apning_bredde: null,
  etasje: "forste",
  etasjer_over: 1,
  konstruksjon: "usikker",
};

export function VeggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState<VeggInput>(INITIAL);

  const evaluate = async () => {
    setPhase({ kind: "loading" });
    const result = await evaluateVeggApi(data);
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") {
    return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="vegg" loadingText="Klargjør faglig avklaring…" />;
  }

  const step = phase.step;
  const back = () => step === 0
    ? router.push(`/property/${p.id}/tiltak`)
    : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Endring i bærekonstruksjon" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva ønsker du å endre?</h2>
              <p className="text-sm text-gray-500 mt-2">Du trenger ikke kjenne laster eller bjelkedimensjoner.</p>
            </div>
            <div className="space-y-2">
              {(Object.entries(TYPE_LABELS) as [VeggInput["type"], [string, string]][]).map(([value, label]) => (
                <RadioCard key={value} selected={data.type === value} onClick={() => setData({ ...data, type: value })} title={label[0]} desc={label[1]} />
              ))}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vet du om konstruksjonen er bærende?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.baerende === "ja"} onClick={() => setData({ ...data, baerende: "ja" })} title="Ja" desc="Fremgår av tegning eller er bekreftet av fagperson" />
                <RadioCard selected={data.baerende === "usikker"} onClick={() => setData({ ...data, baerende: "usikker" })} title="Jeg er usikker" desc="Dette er det vanligste og tryggeste valget" />
                <RadioCard selected={data.baerende === "nei"} onClick={() => setData({ ...data, baerende: "nei" })} title="Nei" desc="Bekreftet ikke-bærende lettvegg" />
              </div>
            </div>
            <Alert variant="amber">Ikke start riving før bæring, brannskille og midlertidig avstiving er avklart.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Om konstruksjonen</h2>
              <p className="text-sm text-gray-500 mt-2">Omtrentlige opplysninger er nok for å sende saken til riktig fagperson.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Omtrentlig bredde på åpningen</label>
              <NumberField value={data.apning_bredde ?? 0} onChange={(value) => setData({ ...data, apning_bredde: value || null })} step={0.1} unit="m" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Hvor er veggen?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.etasje === "kjeller"} onClick={() => setData({ ...data, etasje: "kjeller" })} title="Kjeller" />
                <RadioCard selected={data.etasje === "forste"} onClick={() => setData({ ...data, etasje: "forste" })} title="Første etasje" />
                <RadioCard selected={data.etasje === "ovre"} onClick={() => setData({ ...data, etasje: "ovre" })} title="Øvre etasje" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Antall etasjer over</label>
              <NumberField value={data.etasjer_over} onChange={(value) => setData({ ...data, etasjer_over: Math.max(0, Math.round(value)) })} unit="stk" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Hovedmateriale</h3>
              <div className="space-y-2">
                <RadioCard selected={data.konstruksjon === "tre"} onClick={() => setData({ ...data, konstruksjon: "tre" })} title="Tre" />
                <RadioCard selected={data.konstruksjon === "mur_betong"} onClick={() => setData({ ...data, konstruksjon: "mur_betong" })} title="Mur eller betong" />
                <RadioCard selected={data.konstruksjon === "stal"} onClick={() => setData({ ...data, konstruksjon: "stal" })} title="Stål" />
                <RadioCard selected={data.konstruksjon === "usikker"} onClick={() => setData({ ...data, konstruksjon: "usikker" })} title="Usikker" />
              </div>
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>Få neste steg</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
