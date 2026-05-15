"use client";

import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import type { ArchitectAssessment, AssessmentItemType } from "@/lib/api/aiArchitect";
import type { EngineerAssessment, Beregning } from "@/lib/api/aiEngineer";

interface Props {
  architect: ArchitectAssessment;
  engineer: EngineerAssessment;
  onContinue: () => void;
}

export function AiAnalyse({ architect, engineer, onContinue }: Props) {
  return (
    <>
      <Topbar title="AI-analyse" back={false} />
      <div className="view">

        {/* Architect section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-green-500 text-white">
            <ArchitectIcon />
          </div>
          <div>
            <p className="font-bold text-[15px]">Arkitekt-vurdering</p>
            <p className="text-xs text-gray-400">Gjennomførbarhet og regulering</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{architect.summary}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {architect.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 ${i < architect.items.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <ItemBadge type={item.type} />
              <p className="text-sm flex-1 leading-snug pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        {architect.anbefalinger.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <ul className="space-y-1">
              {architect.anbefalinger.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-800">
                  <span className="shrink-0">→</span><span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Engineer section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-blue-500 text-white">
            <EngineerIcon />
          </div>
          <div>
            <p className="font-bold text-[15px]">Teknisk analyse</p>
            <p className="text-xs text-gray-400">Beregninger etter TEK17 / NS-EN</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {engineer.beregninger.map((b, i) => (
            <BeregningRow key={i} b={b} last={i === engineer.beregninger.length - 1} />
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{engineer.konklusjon}</p>
        </div>

        {engineer.notater.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <ul className="space-y-1">
              {engineer.notater.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm text-blue-800">
                  <span className="shrink-0 font-bold">·</span><span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Generert av AI — ikke juridisk bindende
        </p>

        <div className="mt-auto pt-2">
          <Button size="lg" full onClick={onContinue}>
            Last ned søknadspakke
            <DownloadIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

function BeregningRow({ b, last }: { b: Beregning; last: boolean }) {
  const color: Record<string, string> = {
    last:   "bg-orange-50 text-orange-600",
    energi: "bg-green-50 text-green-600",
    brann:  "bg-red-50 text-red-600",
    grunn:  "bg-stone-100 text-stone-600",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-gray-100"}`}>
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${color[b.type] ?? "bg-gray-100 text-gray-500"}`}>
        {b.type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{b.navn}</p>
        <p className="text-xs text-gray-400 truncate">{b.referanse}</p>
      </div>
      <span className="text-sm font-mono font-semibold text-gray-700 shrink-0">{b.verdi}</span>
    </div>
  );
}

function ItemBadge({ type }: { type: AssessmentItemType }) {
  if (type === "ok") return (
    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 grid place-items-center shrink-0 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
    </div>
  );
  if (type === "warn") return (
    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 grid place-items-center shrink-0 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 9v4M12 16h.01" /></svg>
    </div>
  );
  return (
    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 grid place-items-center shrink-0 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </div>
  );
}

function ArchitectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function EngineerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
