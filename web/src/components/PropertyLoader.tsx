"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { findAddress, type Address } from "@/lib/data/addresses";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchFromBackend(id: string): Promise<Address | null> {
  try {
    const res = await fetch(`${API_URL}/api/property/${id}`, {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      id: d.id, street: d.street, postal: d.postal ?? "", city: d.city ?? "",
      coords: [d.coords?.lat ?? 0, d.coords?.lon ?? 0],
      matrikkel: { gnr: String(d.matrikkel?.gnr ?? ""), bnr: String(d.matrikkel?.bnr ?? ""), kommune: String(d.matrikkel?.kommune ?? "") },
      bygg: {
        byggeAar: d.bygg?.byggeAar ?? 1975, BRA: d.bygg?.BRA ?? null, etasjer: d.bygg?.etasjer ?? null,
        kjeller: d.bygg?.kjeller ?? true, garasje: d.bygg?.garasje ?? false, tomt: d.bygg?.tomt ?? null,
        regplan: d.bygg?.regplan ?? "Kommuneplan", byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
        tidligereSaker: (d.tidligereSaker ?? []).map((s: Record<string, unknown>) => ({
          aar: s.aar, type: s.type, status: s.status === "Godkjent" ? "Tillatelse" : s.status,
        })),
        bygg_source: d.bygg?.bygg_source ?? "default",
      },
    };
  } catch { return null; }
}

export async function loadProperty(id: string): Promise<Address | null> {
  const local = findAddress(id);
  if (local) return local;
  try {
    const cached =
      localStorage.getItem(`property_${id}`) ??
      sessionStorage.getItem(`property_${id}`);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  return fetchFromBackend(id);
}

export function PropertyLoader({ children }: { children: (p: Address) => React.ReactNode }) {
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<Address | null | "loading">("loading");

  useEffect(() => {
    loadProperty(id).then(setProperty);
  }, [id]);

  if (property === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-gray-500">Henter eiendomsdata…</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold">Eiendom ikke funnet</p>
        <p className="text-sm text-gray-500">Gå tilbake og søk på nytt.</p>
      </div>
    );
  }

  return <>{children(property)}</>;
}
