"use client";

import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import type { ArchitectAssessment, AssessmentItemType } from "@/lib/api/aiArchitect";

interface Props {
  assessment: ArchitectAssessment;
  onContinue: () => void;
}

export function ArchitectVurdering({ assessment, onContinue }: Props) {
  return (
    <>
      <Topbar title="AI-arkitekt" back={false} />
      <div className="view">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a, #0a4f3c)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight">Arkitekt-vurdering</h2>
            <p className="text-xs text-gray-400">Generert av AI — ikke juridisk bindende</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{assessment.summary}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {assessment.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 ${i < assessment.items.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <ItemIcon type={item.type} />
              <p className="text-sm flex-1 leading-snug pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        {assessment.anbefalinger.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Anbefalinger</p>
            <ul className="space-y-1.5">
              {assessment.anbefalinger.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-800">
                  <span className="shrink-0 mt-0.5">→</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button size="lg" full onClick={onContinue}>
            Last ned søknadspakke
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Button>
        </div>
      </div>
    </>
  );
}

function ItemIcon({ type }: { type: AssessmentItemType }) {
  if (type === "ok") {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 grid place-items-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 13 4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (type === "warn") {
    return (
      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 grid place-items-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 16h.01" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 grid place-items-center shrink-0">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  );
}
