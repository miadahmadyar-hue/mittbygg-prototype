"use client";
import { getPricing, formatServicePrice } from "@/lib/data/pricing";
import { useT } from "@/lib/i18n/context";

export function ChangeUsePrice() {
  const t = useT();
  return <section className="panel p-5"><h2 className="font-semibold">{t("Prisindikasjon for bruksendringssaken", "Indicative change-of-use service price")}</h2>
    <p className="text-xl font-bold mt-2">{formatServicePrice(getPricing("bruksendring"))} {t("eks. mva", "excl. VAT")}</p>
    <p className="text-sm mt-2">{t("Endelig omfang og pris avtales særskilt. Kommunale gebyrer og eventuelle fagrapporter avklares i tilbudet. Dette er ikke en fastpris eller bestilling.", "Final scope and price are agreed separately. Municipal fees and specialist reports are clarified in the quote. This is not a fixed price or an order.")}</p>
    <p className="text-sm mt-2">{t("Foreløpig vurdering og saksunderlag er gratis i denne demoen. Ingen betaling trekkes.", "Preliminary review and the case brief are free in this demo. No payment is collected.")}</p>
  </section>;
}
