"use client";

import { useState } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { formatKr } from "@/lib/format";
import { getPricing, discountPct } from "@/lib/data/pricing";

type BetalingState = "idle" | "processing" | "success";

const INKLUDERT = [
  "Komplett PDF-søknadspakke",
  "Ferdig utfylt DiBK-skjema (5153)",
  "Tiltaksliste og paragrafhenvisninger",
  "Neste-steg-guide med tidsplan",
  "Nabovarselmal og følgebrev",
];

interface Props {
  totalKostnad: number;
  slug?: string;
  onBetal: () => void;
  onBack: () => void;
}

export function BetalingModal({ totalKostnad, slug, onBetal, onBack }: Props) {
  const [state, setState] = useState<BetalingState>("idle");
  const pricing = getPricing(slug ?? "");
  const pct = discountPct(pricing);

  const handleVipps = async () => {
    setState("processing");
    await new Promise<void>((r) => setTimeout(r, 2000));
    setState("success");
    setTimeout(onBetal, 1200);
  };

  if (state === "success") {
    return (
      <>
        <Topbar back={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 grid place-items-center">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">Betaling godkjent</h2>
            <p className="text-sm text-gray-500 mt-1">PDF-pakken genereres nå…</p>
          </div>
          <div className="spinner spinner-lg" />
        </div>
      </>
    );
  }

  if (state === "processing") {
    return (
      <>
        <Topbar back={false} />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-10">
          <div className="spinner spinner-lg" />
          <div>
            <h3 className="text-base font-semibold">Venter på Vipps-bekreftelse…</h3>
            <p className="text-sm text-gray-500 mt-1">Betalingen behandles i Vipps-appen din.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Kjøp søknadspakke" />
      <div className="view">
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4 flex items-start justify-between">
            <div>
              <div className="text-white font-bold text-lg">Søknadspakke</div>
              <div className="text-green-100 text-sm mt-0.5">Alt du trenger for å sende søknaden selv</div>
            </div>
            <div className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-3">
              -{pct}%
            </div>
          </div>

          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-end gap-2">
              <span className="text-[34px] font-extrabold tracking-tight leading-none text-green-700">
                {formatKr(pricing.mittbygg)}
              </span>
              <span className="text-sm text-gray-500 mb-1">eks. mva</span>
            </div>
            <div className="text-sm text-gray-400 mt-1 line-through">{formatKr(pricing.market)} hos arkitekt/konsulent</div>
          </div>

          <ul className="px-5 py-4 space-y-2.5">
            {INKLUDERT.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="m5 13 4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {totalKostnad > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm flex justify-between">
            <span className="text-gray-500">Estimert tiltakskostnad</span>
            <span className="font-bold text-orange-600">{formatKr(totalKostnad)}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            onClick={handleVipps}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-white text-[17px] active:opacity-90 transition-opacity"
            style={{ background: "#FF5B24" }}
          >
            <VippsLogo />
            Betal med Vipps
          </button>

          <Button variant="ghost" full onClick={onBack}>
            Tilbake til resultat
          </Button>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Sikker betaling via Vipps. Du kan laste ned pakken umiddelbart etter betaling.
            Kjøpet refunderes ikke etter nedlasting.
          </p>
        </div>
      </div>
    </>
  );
}

function VippsLogo() {
  return (
    <svg width="62" height="20" viewBox="0 0 62 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0" y="16"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="18"
        fill="white"
        letterSpacing="1"
      >
        vipps
      </text>
    </svg>
  );
}
