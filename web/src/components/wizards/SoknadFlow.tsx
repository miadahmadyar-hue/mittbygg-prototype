"use client";

import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Pill } from "@/components/ui/Pill";
import { PlanSvg, SnittSvg, FasadeSvg, SitSvg } from "./Thumbnails";
import { ReactNode } from "react";

interface PreviewProps {
  ansvarsrett: boolean;
  onBack: () => void;
  onSend: () => void;
}

export function SoknadPreview({ ansvarsrett, onBack, onSend }: PreviewProps) {
  return (
    <>
      <Topbar title="Søknadspakke" />
      <div className="view">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Klar til innsending</h2>
          <p className="text-sm text-gray-500 mt-2">
            Alle dokumentene er generert. Sjekk gjennom før du sender.
          </p>
        </div>

        <SectionHead>Tegninger (PDF)</SectionHead>
        <div className="grid grid-cols-2 gap-2">
          <Thumb label="Situasjonsplan 1:200"><SitSvg /></Thumb>
          <Thumb label="Plan FØR 1:50"><PlanSvg /></Thumb>
          <Thumb label="Plan ETTER 1:50"><PlanSvg /></Thumb>
          <Thumb label="Snitt A-A 1:50"><SnittSvg /></Thumb>
          <Thumb label="Fasade nord 1:100"><FasadeSvg /></Thumb>
          <Thumb label="Fasade sør 1:100"><FasadeSvg /></Thumb>
        </div>

        <SectionHead>Dokumenter</SectionHead>
        <ul className="space-y-2">
          <DocItem
            t={`Søknadsskjema (DiBK ${ansvarsrett ? "5174" : "5153"})`}
            d="Forhåndsutfylt med din info"
          />
          <DocItem t="Redegjørelse for tiltaket" d="Beskriver bruksendringen og lempninger" />
          <DocItem t="Brannkonsept (NS 3901)" d=".docx · genereres ved innsending" />
          <DocItem t="Energiberegning" d="For nye bygningsdeler" />
          <DocItem t="Nabovarsel (DiBK 5154)" d="Klar til distribusjon — 3 naboer identifisert" />
          {ansvarsrett && (
            <DocItem t="Erklæring om ansvarsrett" d="Trenger ANS-foretak før innsending" warn />
          )}
        </ul>

        <Alert>
          <strong>Pris:</strong> 4 900 kr for komplett pakke. Premium m/arkitekt-KS:
          12 900 kr (anbefalt for {ansvarsrett ? "denne saken" : "sikkerhets skyld"}).
        </Alert>

        <div className="mt-2 flex flex-col gap-2">
          <Button size="lg" full onClick={onSend}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2l-7 20-4-9-9-4z" />
            </svg>
            Send via Altinn
          </Button>
          <Button variant="ghost" full onClick={onBack}>Tilbake</Button>
        </div>
      </div>
    </>
  );
}

interface SentProps {
  ansvarsrett: boolean;
  onDone: () => void;
}

export function SoknadSent({ ansvarsrett, onDone }: SentProps) {
  const ref = "DBK-" + Math.floor(100_000 + Math.random() * 900_000);
  const now = new Date().toLocaleString("nb-NO");
  return (
    <>
      <Topbar title="Sendt" back={false} />
      <div className="view text-center pt-8">
        <div
          className="rounded-[28px] grid place-items-center mx-auto mb-6"
          style={{
            width: 88, height: 88,
            background: "linear-gradient(135deg, #16a34a, #0a4f3c)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.8 11.3 2 22l10.7-3.79" />
            <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" />
            <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38a2.65 2.65 0 0 0-2.61 3l.03.18a2.65 2.65 0 0 1-3 2.61L10 13" />
            <path d="M19 5 8 16" />
          </svg>
        </div>

        <h1 className="text-[32px] font-bold tracking-[-0.025em] leading-[1.1]">Søknad sendt!</h1>
        <p className="text-[17px] text-gray-700 mt-3 leading-snug">
          Søknaden er mottatt av kommunen via DiBK Fellestjenester Bygg.
        </p>

        <div className="bg-white border border-gray-100 rounded-xl mt-6 text-left">
          <KV k="Saksnummer" v={ref} mono />
          <KV k="Mottatt" v={now} />
          <KV k="Forventet svar" v={ansvarsrett ? "12 uker" : "3 uker"} />
          <KV
            k="Status"
            vEl={<Pill variant="amber">Til behandling</Pill>}
            last
          />
        </div>

        <div className="mt-4 text-left">
          <Alert variant="green">
            Vi varsler deg på SMS når kommunen svarer eller naboer kommer med
            merknader.
          </Alert>
        </div>

        <div className="mt-6">
          <Button full onClick={onDone}>Tilbake til min eiendom</Button>
        </div>
      </div>
    </>
  );
}

function Thumb({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="aspect-[4/3] border border-gray-200 rounded-lg bg-white relative overflow-hidden">
      {children}
      <span className="absolute bottom-1.5 left-1.5 bg-white/95 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
}

function DocItem({ t, d, warn }: { t: string; d: string; warn?: boolean }) {
  return (
    <li className="flex gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl items-start">
      <div
        className={`w-[22px] h-[22px] rounded-full grid place-items-center shrink-0 mt-0.5 ${
          warn ? "bg-amber-50 text-amber-500" : "bg-green-50 text-green-500"
        }`}
      >
        {warn ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="m10.3 3.86-8.58 14.86A2 2 0 0 0 3.44 22h17.12a2 2 0 0 0 1.72-3.28L13.7 3.86a2 2 0 0 0-3.4 0z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <div className="font-semibold text-sm">{t}</div>
        <div className="text-[13px] text-gray-500 mt-0.5">{d}</div>
      </div>
    </li>
  );
}

function SectionHead({ children }: { children: ReactNode }) {
  return <h3 className="text-[17px] font-semibold mt-2">{children}</h3>;
}

function KV({
  k, v, vEl, last, mono,
}: { k: string; v?: string; vEl?: ReactNode; last?: boolean; mono?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 px-5 py-3 text-sm ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-500 shrink-0">{k}</span>
      {vEl ?? <span className={`font-semibold ${mono ? "font-mono text-xs" : ""}`}>{v}</span>}
    </div>
  );
}
