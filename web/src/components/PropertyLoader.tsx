"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { type Address } from "@/lib/data/addresses";
import { useT } from "@/lib/i18n/context";

export { loadProperty } from "@/lib/data/property";
import { loadProperty } from "@/lib/data/property";

export function PropertyLoader({ children }: { children: (p: Address) => React.ReactNode }) {
  const params = useParams();
  const t = useT();
  const id = params.id as string;
  const [property, setProperty] = useState<Address | null | "loading">("loading");

  useEffect(() => {
    let active = true;
    loadProperty(id).then((next) => { if (active) setProperty(next); });
    return () => { active = false; };
  }, [id]);

  if (property === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-gray-500">{t("Henter eiendomsdata…", "Fetching property data…")}</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold">{t("Eiendom ikke funnet", "Property not found")}</p>
        <p className="text-sm text-gray-500">{t("Opplysningene kan være midlertidig utilgjengelige.", "Property information may be temporarily unavailable.")}</p><Link className="primary-link" href="/address">{t("Søk etter eiendom", "Search for property")}</Link>
      </div>
    );
  }

  return <>{property.bygg.demo && <p className="bg-amber-50 px-5 py-2 text-sm" role="status">{t("Demo-eiendom — opplysninger og arkiv er eksempler.", "Demo property — facts and archive entries are examples.")}</p>}{children(property)}</>;
}
