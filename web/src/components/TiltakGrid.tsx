"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/ui/Topbar";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TiltakIcon } from "@/components/ui/TiltakIcon";
import { TILTAK, TAG_EN, type Tiltak } from "@/lib/data/tiltak";
import { useT } from "@/lib/i18n/context";

const ICON_BG: Record<string, string> = {
  "":     "bg-green-50 text-green-500",
  warm:   "bg-[#fef0e6] text-orange-500",
  blue:   "bg-[#e3edf7] text-[#2156a8]",
};

export function TiltakGrid({ propertyId }: { propertyId: string }) {
  const tr = useT();
  const [unavailable, setUnavailable] = useState<Tiltak | null>(null);

  return (
    <>
      <Topbar title={tr("Velg tiltak", "Choose a project")} />
      <div className="view">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">{tr("Hva vil du gjøre?", "What would you like to do?")}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {tr("Velg det som ligner mest. AI-en hjelper deg med detaljene.", "Pick whatever fits best. The AI helps with the details.")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TILTAK.map((t) => (
            <TiltakCard
              key={t.id}
              t={t}
              propertyId={propertyId}
              onUnavailable={() => setUnavailable(t)}
            />
          ))}
        </div>
      </div>

      <Sheet open={!!unavailable} onClose={() => setUnavailable(null)}>
        <h2 className="text-[22px] font-bold">{unavailable ? tr(unavailable.name, unavailable.name_en) : ""}</h2>
        <p className="text-sm text-gray-500 mt-2">{unavailable ? tr(unavailable.desc, unavailable.desc_en) : ""}</p>
        <div className="mt-4">
          <Alert>
            {tr(
              "Denne tiltakstypen er under utvikling og blir tilgjengelig i Stage 2 (Q3 2026). Bli varslet når den åpner.",
              "This project type is under development and will be available in Stage 2 (Q3 2026). Get notified when it opens.",
            )}
          </Alert>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button full onClick={() => setUnavailable(null)}>{tr("Varsle meg", "Notify me")}</Button>
          <Button variant="ghost" full onClick={() => setUnavailable(null)}>{tr("Lukk", "Close")}</Button>
        </div>
      </Sheet>
    </>
  );
}

function TiltakCard({
  t,
  propertyId,
  onUnavailable,
}: {
  t: Tiltak;
  propertyId: string;
  onUnavailable: () => void;
}) {
  const tr = useT();
  const cardClasses =
    "bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 text-left min-h-[140px] transition-all";
  const enabledClasses = "hover:border-green-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer";

  const inner = (
    <>
      <div
        className={`w-11 h-11 rounded-xl grid place-items-center mb-1 ${ICON_BG[t.iconClass]}`}
      >
        <TiltakIcon k={t.icon} />
      </div>
      <div className="text-sm font-bold leading-tight">{tr(t.name, t.name_en)}</div>
      <div className="text-xs text-gray-500 leading-snug">{tr(t.desc, t.desc_en)}</div>
      <div className="mt-auto flex flex-wrap gap-1">
        {t.tags.map((tag, i) => (
          <Pill key={i} variant={tag.variant === "" ? "default" : tag.variant}>
            {tr(tag.text, TAG_EN[tag.text] ?? tag.text)}
          </Pill>
        ))}
        {!t.available && <Pill>{tr("Kommer", "Coming")}</Pill>}
      </div>
    </>
  );

  if (t.available && t.slug) {
    return (
      <Link
        href={`/property/${propertyId}/tiltak/${t.slug}`}
        className={`${cardClasses} ${enabledClasses}`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onUnavailable} className={`${cardClasses} opacity-80`}>
      {inner}
    </button>
  );
}
