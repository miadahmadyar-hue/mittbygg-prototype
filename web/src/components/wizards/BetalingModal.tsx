"use client";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { getPricing, formatKr, formatServicePrice } from "@/lib/data/pricing";
import { useT } from "@/lib/i18n/context";

export function BetalingModal({ totalKostnad, slug, onBetal, onBack }: { totalKostnad: number; slug?: string; onBetal: () => void; onBack: () => void }) {
  const t = useT();
  const price = getPricing(slug ?? "");
  return <><Topbar title={t("Kontroller dokumentgrunnlaget", "Review the document draft")} onBack={onBack} /><main className="view">
    <section className="panel p-6"><p className="page-kicker">Demo</p><h1 className="mt-3 text-2xl font-semibold">{t("Dette inneholder PDF-en", "What the PDF contains")}</h1>
      <ul className="mt-4 list-disc pl-5 space-y-2"><li>{t("Eiendomsopplysninger og foreløpig regelsjekk", "Property facts and preliminary assessment")}</li><li>{t("Tiltaksliste, kostnadsindikasjoner og regelhenvisninger", "Project actions, cost indications and rule references")}</li><li>{t("Neste steg og tilgjengelig AI-gjennomgang", "Next steps and available AI review")}</li></ul>
      <p className="mt-4 text-sm text-gray-600">{t("Tegninger er ikke vedlagt PDF-en. Dokumentet erstatter ikke godkjente tegninger, signerte skjemaer, nabovarsel eller faglig prosjektering. Kontroller kommunens dokumentkrav før innsending.", "Drawings are not attached to this PDF. It does not replace approved drawings, signed forms, neighbor notices or professional design. Check the municipality’s document requirements before submission.")}</p>
      <p className="mt-6 text-lg font-semibold">{t("Prisindikasjon", "Indicative price")}: {formatServicePrice(price)} {t("eks. mva", "excl. VAT")}</p>
      <p className="mt-2 text-sm">{t("Ingen betaling i demoen. Kommunale gebyrer og eventuell fagbistand er ikke inkludert.", "No payment in this demo. Municipal fees and professional services are not included.")}</p>
      {totalKostnad > 0 && <p className="mt-3 text-sm text-gray-500">{t("Separat kostnadsindikasjon for byggearbeidet", "Separate indicative construction cost")}: {formatKr(totalKostnad)}</p>}
    </section>
    <Button full onClick={onBetal}>{t("Generer gratis demo-PDF", "Generate free demo PDF")}</Button>
    <Button full variant="ghost" onClick={onBack}>{t("Tilbake", "Back")}</Button>
  </main></>;
}
