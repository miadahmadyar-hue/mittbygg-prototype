"use client";
import { invalidateProjectCache } from "@/lib/projects";
import { useState } from "react";
import type { Address } from "@/lib/data/addresses";
import { useT } from "@/lib/i18n/context";

export function PropertyFacts({ property, onSave }: { property: Address; onSave: (p: Address) => void }) {
  const t = useT();
  const [year, setYear] = useState(String(property.bygg.byggeAar ?? ""));
  const [area, setArea] = useState(String(property.bygg.BRA ?? ""));
  const [plan, setPlan] = useState(property.bygg.regplan ?? "");
  const [message, setMessage] = useState("");
  return <details className="panel p-5"><summary className="cursor-pointer font-semibold">{t("Kontroller eller korriger eiendomsdata", "Check or correct property facts")}</summary>
    <p className="mt-3 text-sm text-gray-600">{t("Tomme felt betyr ukjent. Kontroller byggeår og areal mot dokumentasjon. Planens navn bekrefter ikke at tiltaket er tillatt; byggegrenser og utnyttelse må vurderes for prosjektet.", "Blank fields mean unknown. Verify the year and floor area against records. A plan name does not confirm that the project is allowed; boundaries and utilization must be checked for the project.")}</p>
    <p className="mt-2 text-xs">{property.bygg.confirmedAt ? t("Kilde: dine sist lagrede opplysninger", "Source: your last saved information") : property.bygg.demo ? t("Kilde: eksempeldata", "Source: example data") : `${t("Kilde", "Source")}: ${property.bygg.bygg_source === "default" ? t("ikke tilgjengelig", "unavailable") : property.bygg.bygg_source}`}</p>
    <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(event) => {
      event.preventDefault();
      const facts = { byggeAar: year ? Number(year) : null, BRA: area ? Number(area) : null, regplan: plan.trim() || null, confirmedAt: new Date().toISOString() };
      try {
        localStorage.setItem(`property_confirmed_${property.id}`, JSON.stringify(facts));
        invalidateProjectCache();
        onSave({ ...property, bygg: { ...property.bygg, ...facts } });
        setMessage(t("Opplysningene er lagret på denne enheten. Kjør regelsjekken på nytt hvis du har endret grunnlaget.", "Facts saved on this device. Run the assessment again if you changed the inputs."));
      } catch { setMessage(t("Kunne ikke lagre. Kontroller nettleserens lagringsinnstillinger.", "Could not save. Check your browser storage settings.")); }
    }}>
      <label className="text-sm">{t("Byggeår", "Year built")}<input className="mt-1 w-full rounded border p-3" type="number" min="1000" max={new Date().getFullYear()} value={year} onChange={(e) => setYear(e.target.value)} placeholder={t("Ukjent", "Unknown")} /></label>
      <label className="text-sm">{t("Bruksareal (BRA), m²", "Floor area (BRA), m²")}<input className="mt-1 w-full rounded border p-3" type="number" min="1" step="1" value={area} onChange={(e) => setArea(e.target.value)} placeholder={t("Ukjent", "Unknown")} /></label>
      <label className="text-sm">{t("Planreferanse", "Plan reference")}<input className="mt-1 w-full rounded border p-3" value={plan} onChange={(e) => setPlan(e.target.value)} placeholder={t("Ukjent", "Unknown")} /></label>
      <button className="primary-link" type="submit">{t("Lagre mine opplysninger", "Save my information")}</button>
    </form>{message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </details>;
}
