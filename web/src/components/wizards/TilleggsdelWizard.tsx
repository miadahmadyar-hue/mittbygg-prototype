"use client";

import { useDraftState } from "@/lib/projects";
import { useRouter } from "next/navigation";
import { RadioCard } from "@/components/ui/RadioCard";
import { Alert } from "@/components/ui/Alert";
import { ResultPhases, NumberField, KV } from "./SimpleWizard";
import { evaluateTilleggsdelApi, type TiltakResult } from "@/lib/api/evaluate";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Address } from "@/lib/data/addresses";

type Phase = { kind: "wizard"; step: 0 | 1 } | { kind: "loading" } | { kind: "result"; result: TiltakResult } | { kind: "betaling"; result: TiltakResult } | { kind: "sending"; result: TiltakResult } | { kind: "sent"; result: TiltakResult };
type RomType = "bod" | "gang" | "vaskerom" | "garasje" | "teknisk" | "usikker";
type Formaal = "soverom" | "stue" | "kontor" | "bad";

const ROM_LABEL: Record<RomType, string> = { bod: "Bod / lager", gang: "Gang / entre", vaskerom: "Vaskerom", garasje: "Innebygd garasje", teknisk: "Teknisk rom", usikker: "Vet ikke godkjent bruk" };
const ROM_DESC: Record<RomType, string>  = { bod: "Oppbevaring uten krav til dagslys", gang: "Kommunikasjonsareal", vaskerom: "Kan allerede være godkjent som hoveddel", garasje: "Garasje integrert i boligen", teknisk: "El-rom, varmesentral o.l.", usikker: "Vi hjelper deg å avklare tegningsgrunnlaget" };
const FORMAAL_LABEL: Record<Formaal, string> = { soverom: "Soverom", stue: "Stue / oppholdsrom", kontor: "Hjemmekontor", bad: "Bad / WC" };

export function TilleggsdelWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useDraftState<Phase>("phase", { kind: "wizard", step: 0 });
  const [data, setData] = useDraftState("data", { romtype: null as RomType | null, areal: 0, godkjent_bruk_bekreftet: false, formaal: null as Formaal | null });

  const evaluate = async () => {
    if (!data.romtype || !data.formaal) return;
    setPhase({ kind: "loading" });
    const result = await evaluateTilleggsdelApi({ ...data, areal: data.areal > 0 ? data.areal : null });
    setPhase({ kind: "result", result });
  };

  if (phase.kind !== "wizard") return <ResultPhases onEdit={() => setPhase({ kind: "wizard", step: 0 })} phase={phase} setPhase={setPhase} p={p} slug="tilleggsdel" loadingText="Sjekker TEK17 og PBL…" />;

  const step = phase.step;
  const back = () => step === 0 ? router.push(`/property/${p.id}/tiltak`) : setPhase({ kind: "wizard", step: 0 });

  return (
    <>
      <Topbar onBack={back} title="Tilleggsdel til hoveddel" right={<span className="text-sm text-gray-500">{step + 1}/2</span>} />
      <ProgressBar step={step} total={2} />
      <div className="view">
        {step === 0 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Hva er rommet godkjent som?</h2></div>
            <div className="space-y-2">
              {(Object.keys(ROM_LABEL) as RomType[]).map((t) => (
                <RadioCard key={t} selected={data.romtype === t} onClick={() => setData({ ...data, romtype: t })} title={ROM_LABEL[t]} desc={ROM_DESC[t]} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">Areal hvis kjent (m²)</label>
              <NumberField label="Areal" value={data.areal} onChange={(v) => setData({ ...data, areal: v })} unit="m²" />
            </div>
            <label className="flex gap-3 text-sm"><input type="checkbox" checked={data.godkjent_bruk_bekreftet} onChange={(e) => setData({ ...data, godkjent_bruk_bekreftet: e.target.checked })} />Jeg har kontrollert bruken mot godkjente tegninger eller vedtak.</label>
            <Alert>Oppgi godkjent bruk, selv om rommet brukes annerledes i dag. Gang og vaskerom kan allerede være hoveddel. La arealet stå tomt eller 0 hvis det er ukjent.</Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full disabled={!data.romtype || data.areal < 0} onClick={() => setPhase({ kind: "wizard", step: 1 })}>Neste →</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-[22px] font-bold tracking-tight">Ny bruk av rommet</h2></div>
            <div className="space-y-2">
              {(Object.keys(FORMAAL_LABEL) as Formaal[]).map((t) => (
                <RadioCard key={t} selected={data.formaal === t} onClick={() => setData({ ...data, formaal: t })} title={FORMAAL_LABEL[t]} desc="" />
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl mt-4">
              <KV k="Eiendom" v={p.street} />
              <KV k="Rom" v={ROM_LABEL[data.romtype!]} />
              <KV k="Areal" v={data.areal > 0 ? `${data.areal} m²` : "Ikke oppgitt"} last />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full disabled={!data.formaal} onClick={evaluate}>Vurder endret rombruk</Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
