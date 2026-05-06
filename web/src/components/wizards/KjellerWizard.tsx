"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioCard } from "@/components/ui/RadioCard";
import { ToggleRow } from "@/components/ui/Toggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultView } from "./ResultView";
import { BetalingModal } from "./BetalingModal";
import { SoknadPreview, SoknadSent } from "./SoknadFlow";
import {
  KJELLER_BRUK, getKjellerRooms, type KjellerBrukId,
} from "@/lib/data/kjellerBruk";
import type { KjellerResult } from "@/lib/regulations/kjeller";
import { evaluateKjellerApi } from "@/lib/api/evaluate";
import { downloadKjellerSoknad } from "@/lib/api/soknad";
import type { Address } from "@/lib/data/addresses";

type Phase =
  | { kind: "wizard"; step: 0 | 1 | 2 | 3 }
  | { kind: "loading" }
  | { kind: "result"; result: KjellerResult }
  | { kind: "betaling"; result: KjellerResult }
  | { kind: "preview"; result: KjellerResult }
  | { kind: "sending"; result: KjellerResult }
  | { kind: "sent"; result: KjellerResult };

interface WizardData {
  room: string | null;
  ny_bruk: KjellerBrukId | null;
  radon: number | null;
  drenering: boolean;
  balansert_vent: boolean;
}

const INITIAL: WizardData = {
  room: null,
  ny_bruk: null,
  radon: null,
  drenering: true,
  balansert_vent: false,
};

export function KjellerWizard({ p }: { p: Address }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "wizard", step: 0 });
  const [data, setData] = useState<WizardData>(INITIAL);
  const [pdfLoading, setPdfLoading] = useState(false);

  const evaluate = async () => {
    if (!data.room || !data.ny_bruk) return;
    setPhase({ kind: "loading" });
    const result = await evaluateKjellerApi({
      propId: p.id,
      byggeAar: p.bygg.byggeAar,
      room: data.room!,
      ny_bruk: data.ny_bruk!,
      radon: data.radon,
      drenering: data.drenering,
      balansert_vent: data.balansert_vent,
      bra: p.bygg.BRA ?? null,
      etasjer: p.bygg.etasjer ?? null,
    });
    setPhase({ kind: "result", result });
  };

  const handleGoToBetaling = async () => {
    if (phase.kind !== "result") return;
    setPhase({ kind: "betaling", result: phase.result });
  };

  const doDownloadAfterPayment = async (result: KjellerResult) => {
    setPdfLoading(true);
    try {
      await downloadKjellerSoknad(
        result,
        p.street,
        Number(p.matrikkel.gnr),
        Number(p.matrikkel.bnr),
        p.city,
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const sendSoknad = () => {
    if (phase.kind !== "preview") return;
    const result = phase.result;
    setPhase({ kind: "sending", result });
    setTimeout(() => setPhase({ kind: "sent", result }), 1800);
  };

  if (phase.kind === "loading") {
    return <LoadingScreen text="Sjekker TEK17, SAK10 og PBL…" />;
  }
  if (phase.kind === "sending") {
    return <LoadingScreen text="Sender til Altinn / DiBK Fellestjenester Bygg…" />;
  }
  if (phase.kind === "result") {
    return (
      <ResultView
        r={phase.result}
        onGenerateSoknad={() => setPhase({ kind: "preview", result: phase.result })}
        onDownloadPdf={handleGoToBetaling}
        pdfLoading={pdfLoading}
        onRestart={() => router.push(`/property/${p.id}/tiltak`)}
      />
    );
  }
  if (phase.kind === "betaling") {
    return (
      <BetalingModal
        totalKostnad={phase.result.totalKostnad}
        onBetal={() => doDownloadAfterPayment(phase.result)}
        onBack={() => setPhase({ kind: "result", result: phase.result })}
      />
    );
  }
  if (phase.kind === "preview") {
    return (
      <SoknadPreview
        ansvarsrett={phase.result.ansvarsrett}
        onBack={() => setPhase({ kind: "result", result: phase.result })}
        onSend={sendSoknad}
      />
    );
  }
  if (phase.kind === "sent") {
    return (
      <SoknadSent
        ansvarsrett={phase.result.ansvarsrett}
        onDone={() => router.push(`/property/${p.id}`)}
      />
    );
  }

  // Wizard phase
  const step = phase.step;
  const rooms = getKjellerRooms(p.id, p.bygg);

  const back = () => {
    if (step === 0) router.push(`/property/${p.id}/tiltak`);
    else setPhase({ kind: "wizard", step: (step - 1) as 0 | 1 | 2 });
  };

  return (
    <>
      <Topbar
        title="Bruksendring kjeller"
        right={<span className="text-sm text-gray-500">{step + 1}/4</span>}
      />
      <ProgressBar step={step} total={4} />
      <div className="view">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hvilket rom?</h2>
              <p className="text-sm text-gray-500 mt-2">
                Vi har funnet disse rommene i kjelleren din.
              </p>
            </div>
            <div className="space-y-2">
              {rooms.map((r) => (
                <RadioCard
                  key={r.id}
                  selected={data.room === r.id}
                  onClick={() => setData({ ...data, room: r.id })}
                  title={r.name}
                  desc={`${r.area} m² · takhøyde ${r.height} mm · ${r.vinduer.toLowerCase()}`}
                  leadIcon={
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21V8l9-6 9 6v13" />
                      <path d="M3 13h18M9 21v-5h6v5" />
                    </svg>
                  }
                />
              ))}
            </div>
            <Alert>
              Romdataene er hentet fra eksisterende tegninger på fil hos kommunen. Du kan korrigere senere.
            </Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button
                full
                disabled={!data.room}
                onClick={() => setPhase({ kind: "wizard", step: 1 })}
              >
                Neste
                <ArrowRight />
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Hva skal det bli?</h2>
              <p className="text-sm text-gray-500 mt-2">Velg ny bruk av rommet.</p>
            </div>
            <div className="space-y-2">
              {(Object.entries(KJELLER_BRUK) as [KjellerBrukId, typeof KJELLER_BRUK[KjellerBrukId]][]).map(
                ([key, b]) => (
                  <RadioCard
                    key={key}
                    selected={data.ny_bruk === key}
                    onClick={() => setData({ ...data, ny_bruk: key })}
                    title={b.label}
                    desc={b.desc}
                  />
                ),
              )}
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button
                full
                disabled={!data.ny_bruk}
                onClick={() => setPhase({ kind: "wizard", step: 2 })}
              >
                Neste
                <ArrowRight />
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Tilstand i dag</h2>
              <p className="text-sm text-gray-500 mt-2">
                Hjelper oss vurdere PBL § 31-2 lempninger og tiltakskostnad.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Radonmåling (Bq/m³)
              </label>
              <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
                <input
                  type="number"
                  placeholder="La stå tom hvis ikke målt"
                  value={data.radon ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      radon: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="flex-1 bg-transparent outline-none text-base"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tiltaksgrense 100 · Grenseverdi 200 · Anbefalt 60-dagers måling
              </p>
            </div>

            <div className="space-y-2">
              <ToggleRow
                on={data.drenering}
                onChange={() => setData({ ...data, drenering: !data.drenering })}
                title="Drenering er på plass"
                desc="Utvendig drensrør, knastefolie, fuktbeskyttelse"
              />
              <ToggleRow
                on={data.balansert_vent}
                onChange={() =>
                  setData({ ...data, balansert_vent: !data.balansert_vent })
                }
                title="Balansert ventilasjon"
                desc="Med varmegjenvinning (anbefalt for kjeller)"
              />
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button full onClick={() => setPhase({ kind: "wizard", step: 3 })}>
                Neste <ArrowRight />
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">Bekreft og beregn</h2>
              <p className="text-sm text-gray-500 mt-2">
                Vi sjekker mot TEK17, SAK10 og PBL — inkludert lempninger for eldre bygg.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl">
              <KV k="Eiendom" v={p.street} />
              <KV
                k="Byggeår"
                v={`${p.bygg.byggeAar}${p.bygg.byggeAar < 2010 ? " · lempninger" : ""}`}
              />
              <KV
                k="Rom"
                v={rooms.find((r) => r.id === data.room)?.name ?? "—"}
              />
              <KV
                k="Ny bruk"
                v={data.ny_bruk ? KJELLER_BRUK[data.ny_bruk].label : "—"}
              />
              <KV k="Radon" v={data.radon != null ? `${data.radon} Bq/m³` : "Ikke målt"} />
              <KV k="Drenering" v={data.drenering ? "Ja" : "Nei"} />
              <KV
                k="Balansert vent."
                v={data.balansert_vent ? "Ja" : "Nei"}
                last
              />
            </div>
            <Alert>
              <strong>Slik beregnes resultatet:</strong> Vi går gjennom TEK17 § 11 (brann),
              § 12-7 (takhøyde), § 13-5 (radon), § 13-7 (dagslys) og § 14 (energi),
              kombinert med PBL §§ 20-1, 20-3, 20-4, 31-2.
            </Alert>
            <div className="mt-auto pt-4 flex flex-col gap-2">
              <Button size="lg" full onClick={evaluate}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Beregn nå
              </Button>
              <Button variant="ghost" full onClick={back}>Tilbake</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <>
      <Topbar back={false} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
        <div className="spinner spinner-lg" />
        <h3 className="text-base font-semibold">{text}</h3>
        <p className="text-sm text-gray-500">Henter fra Kartverket og DiBK…</p>
      </div>
    </>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function KV({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
