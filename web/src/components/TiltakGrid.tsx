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

const ICON_STYLES: Record<string, string> = {
  "": "bg-green-50 text-green-600",
  warm: "bg-[#f8eee9] text-orange-600",
  blue: "bg-[#edf2f4] text-[#315b70]",
};

export function TiltakGrid({ propertyId }: { propertyId: string }) {
  const t = useT();
  const [unavailable, setUnavailable] = useState<Tiltak | null>(null);
  const visible = TILTAK.filter((item) => !item.hidden);
  const available = visible.filter((item) => item.available);
  const upcoming = visible.filter((item) => !item.available);
  const categories = [
    { id: "inside", no: "Endre inne", en: "Change the interior" },
    { id: "expand", no: "Bygge større", en: "Expand the property" },
    { id: "exterior", no: "Endre ute", en: "Change the exterior" },
    { id: "site", no: "Tiltak på tomten", en: "Work on the property" },
    { id: "help", no: "Finner du ikke riktig tiltak?", en: "Cannot find the right project?" },
  ] as const;

  return (
    <>
      <Topbar title={t("Velg tiltak", "Choose project")} />
      <main className="view view-wide">
        <header className="max-w-3xl border-b border-gray-200 pb-7">
          <p className="page-kicker">{t("Ny byggesak", "New building project")}</p>
          <h1 className="page-title mt-2">{t("Hva planlegger du?", "What are you planning?")}</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-gray-500">
            {t("Velg tiltaket som passer best. Du får en strukturert vurdering av søknadsplikt, dokumentkrav og neste steg.", "Choose the closest project type. You will get a structured assessment of permit requirements, documentation and next steps.")}
          </p>
        </header>

        <details className="panel p-5"><summary className="cursor-pointer font-semibold">{t("Usikker på forskjellen mellom tiltakene?", "Unsure which project to choose?")}</summary><p className="mt-3 text-sm leading-6">{t("Velg Bruksendring kjeller når et eksisterende kjellerrom skal få ny bruk. Velg Ny boenhet når du planlegger en separat bolig med egen inngang og alle boligfunksjoner. Bruksendring dekker andre arealer som bod, garasje eller næring. Er prosjektet sammensatt, velg Noe annet.", "Choose Basement conversion for a new use of an existing basement room. Choose New dwelling for a separate home with its own entrance and all residential functions. Change of use covers other areas such as storage, garages or commercial space. Choose Something else for a combined project.")}</p></details>
        {categories.map((category) => {
          const items = available.filter((item) => item.category === category.id);
          if (items.length === 0) return null;
          return (
            <section key={category.id}>
              <div className="section-line">
                <h2>{t(category.no, category.en)}</h2>
                <span>{items.length} {t(items.length === 1 ? "valg" : "valg", items.length === 1 ? "option" : "options")}</span>
              </div>
              <div className="project-grid mt-4">
                {items.map((item) => (
                  <ProjectCard key={item.id} item={item} propertyId={propertyId} onUnavailable={() => setUnavailable(item)} />
                ))}
              </div>
            </section>
          );
        })}

        {upcoming.length > 0 && (
          <section>
            <div className="section-line">
              <h2>{t("Kommer senere", "Coming later")}</h2>
              <span>{upcoming.length} {t("tiltak", "project types")}</span>
            </div>
            <div className="project-grid mt-4">
              {upcoming.map((item) => (
                <ProjectCard key={item.id} item={item} propertyId={propertyId} onUnavailable={() => setUnavailable(item)} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Sheet open={!!unavailable} onClose={() => setUnavailable(null)}>
        <p className="page-kicker">{t("Under utvikling", "In development")}</p>
        <h2 className="mt-2 text-2xl font-semibold">{unavailable ? t(unavailable.name, unavailable.name_en) : ""}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">{unavailable ? t(unavailable.desc, unavailable.desc_en) : ""}</p>
        <div className="mt-5">
          <Alert>{t("Denne tiltakstypen er ikke tilgjengelig ennå. Du kan registrere interesse og få beskjed når den åpner.", "This project type is not available yet. You can register interest and be notified when it opens.")}</Alert>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Button full onClick={() => setUnavailable(null)}>{t("Registrer interesse", "Register interest")}</Button>
          <Button variant="ghost" full onClick={() => setUnavailable(null)}>{t("Lukk", "Close")}</Button>
        </div>
      </Sheet>
    </>
  );
}

function ProjectCard({ item, propertyId, onUnavailable }: { item: Tiltak; propertyId: string; onUnavailable: () => void }) {
  const t = useT();
  const content = (
    <>
      <div className={`project-icon ${ICON_STYLES[item.iconClass] ?? ICON_STYLES[""]}`}>
        <TiltakIcon k={item.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-5 text-gray-900">{t(item.name, item.name_en)}</h3>
          {item.available ? <ArrowIcon /> : <Pill>{t("Kommer", "Coming")}</Pill>}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-gray-500">{t(item.desc, item.desc_en)}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((tag, index) => (
            <Pill key={`${tag.text}-${index}`} variant={tag.variant === "" ? "default" : tag.variant}>
              {t(tag.text, TAG_EN[tag.text] ?? tag.text)}
            </Pill>
          ))}
        </div>
      </div>
    </>
  );

  const className = `project-card ${item.available ? "project-card-active" : "project-card-muted"}`;
  if (item.available && item.slug) {
    return <Link href={`/property/${propertyId}/tiltak/${item.slug}`} className={className}>{content}</Link>;
  }
  return <button type="button" onClick={onUnavailable} className={className}>{content}</button>;
}

function ArrowIcon() {
  return <svg className="mt-0.5 shrink-0 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
