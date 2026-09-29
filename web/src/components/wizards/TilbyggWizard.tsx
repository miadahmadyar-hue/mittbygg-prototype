"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField } from "./SimpleWizard";
import { evaluateTilbyggApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type TType = "tilbygg_1etasje" | "ny_etasje" | "innglasset_terrasse";
type Use = "bod" | "terrasse" | "veranda" | "oppholdsrom" | "bad" | "annet";
type TriState = "ja" | "nei" | "usikker";

export function TilbyggWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState({
    type: null as TType | null, bruk: null as Use | null,
    areal: 0, avstand: 0, plan: "usikker" as TriState,
    bya: "usikker" as TriState, pipe: false,
  });

  const evaluate = async () => {
    if (!data.type || !data.bruk) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTilbyggApi({
      type: data.type, bruk: data.bruk, areal: data.areal, avstand: data.avstand,
      plan_ok: data.plan === "usikker" ? null : data.plan === "ja",
      bya_ok: data.bya === "usikker" ? null : data.bya === "ja",
      pipe: data.pipe,
    });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases phase={phase} setPhase={setPhase} p={p} slug="tilbygg" loadingText="Kontrollerer type, bruk, areal og planvilkår…" />;
  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar title="Tilbygg eller ny etasje" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hvordan utvider du bygget?</h2>
              <p className="text-sm text-gray-500 mt-2">Påbygg og tilbygg følger ulike regler.</p>
            </div>
            <div className="space-y-2">
              <RadioCard selected={data.type === "tilbygg_1etasje"} onClick={() => setData({ ...data, type: "tilbygg_1etasje" })} title="Tilbygg på bakken" desc="Utvider bygningens grunnflate" />
              <RadioCard selected={data.type === "ny_etasje"} onClick={() => setData({ ...data, type: "ny_etasje" })} title="Ny etasje eller påbygg" desc="Bygges oppå eksisterende bygning" />
              <RadioCard selected={data.type === "innglasset_terrasse"} onClick={() => setData({ ...data, type: "innglasset_terrasse" })} title="Innglasset terrasse eller vinterhage" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Hva skal arealet brukes til?</h3>
              <div className="space-y-2">
                <RadioCard selected={data.bruk === "bod"} onClick={() => setData({ ...data, bruk: "bod" })} title="Bod eller oppbevaring" />
                <RadioCard selected={data.bruk === "terrasse"} onClick={() => setData({ ...data, bruk: "terrasse" })} title="Terrasse eller takoverbygg" />
                <RadioCard selected={data.bruk === "veranda"} onClick={() => setData({ ...data, bruk: "veranda" })} title="Veranda eller inngangsparti" />
                <RadioCard selected={data.bruk === "oppholdsrom"} onClick={() => setData({ ...data, bruk: "oppholdsrom" })} title="Stue, soverom eller annet oppholdsrom" />
                <RadioCard selected={data.bruk === "bad"} onClick={() => setData({ ...data, bruk: "bad" })} title="Bad eller våtrom" />
                <RadioCard selected={data.bruk === "annet"} onClick={() => setData({ ...data, bruk: "annet" })} title="Annet" />
              </div>
            </div>
            {data.type === "ny_etasje" && <Alert variant="amber">En ny etasje er et påbygg og omfattes ikke av 15 m²-unntaket for små tilbygg.</Alert>}
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.type || !data.bruk} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        ) : (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Størrelse og eiendomsplan</h2></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Areal" value={data.areal} unit="m²" onChange={(areal) => setData({ ...data, areal })} />
              <Field label="Til nabogrense" value={data.avstand} unit="m" step={0.1} onChange={(avstand) => setData({ ...data, avstand })} />
            </div>
            <ToggleRow on={data.pipe} onChange={() => setData({ ...data, pipe: !data.pipe })} title="Tilbygget skal ha pipe eller skorstein" desc="Dette krever ansvarlige foretak" />
            <TriStateQuestion title="Er tiltaket innenfor byggegrense og reguleringsplan?" value={data.plan} onChange={(plan) => setData({ ...data, plan })} />
            <TriStateQuestion title="Er det ledig utnyttelsesgrad (BYA/BRA)?" value={data.bya} onChange={(bya) => setData({ ...data, bya })} />
            <Alert>Et lite areal er bare ett vilkår. Bruk, plan, utnyttelsesgrad, avstand og eventuell pipe påvirker resultatet.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={data.areal <= 0 || data.avstand <= 0} onClick={evaluate}>Sjekk prosjektet</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, value, unit, step = 1, onChange }: { label: string; value: number; unit: string; step?: number; onChange: (value: number) => void }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label><NumberField value={value} unit={unit} step={step} onChange={onChange} /></div>;
}

function TriStateQuestion({ title, value, onChange }: { title: string; value: TriState; onChange: (value: TriState) => void }) {
  return <div><h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3><div className="grid grid-cols-3 gap-2"><RadioCard selected={value === "ja"} onClick={() => onChange("ja")} title="Ja" /><RadioCard selected={value === "nei"} onClick={() => onChange("nei")} title="Nei" /><RadioCard selected={value === "usikker"} onClick={() => onChange("usikker")} title="Usikker" /></div></div>;
}
