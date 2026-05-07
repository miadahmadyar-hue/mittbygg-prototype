"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { findAddress, type Address } from "@/lib/data/addresses";
import { PropertyDashboard } from "@/components/PropertyDashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchFromBackend(id: string): Promise<Address | null> {
  try {
    const res = await fetch(`${API_URL}/api/property/${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
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

export default function PropertyPage() {
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<Address | null | "loading">("loading");

  useEffect(() => {
    async function load() {
      // 1. hardcoded test fixtures
      const local = findAddress(id);
      if (local) { setProperty(local); return; }

      // 2. sessionStorage — set by address search on selection
      try {
        const cached = sessionStorage.getItem(`property_${id}`);
        if (cached) { setProperty(JSON.parse(cached)); return; }
      } catch { /* ignore */ }

      // 3. backend
      const remote = await fetchFromBackend(id);
      setProperty(remote);
    }
    load();
  }, [id]);

  if (property === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-gray-500">Henter eiendomsdata…</p>
      </div>
    );
  }

  if (!property) return notFound();
  return <PropertyDashboard p={property} />;
}
