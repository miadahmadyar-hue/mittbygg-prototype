import { findAddress, type Address } from "@/lib/data/addresses";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchPropertyFromBackend(id: string): Promise<Address | null> {
  try {
    const res = await fetch(`${API_URL}/api/property/${id}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      id: d.id,
      street: d.street,
      postal: d.postal ?? "",
      city: d.city ?? "",
      coords: [d.coords?.lat ?? 0, d.coords?.lon ?? 0],
      matrikkel: {
        gnr: String(d.matrikkel?.gnr ?? ""),
        bnr: String(d.matrikkel?.bnr ?? ""),
        kommune: String(d.matrikkel?.kommune ?? ""),
      },
      bygg: {
        byggeAar:    d.bygg?.byggeAar ?? 1975,
        BRA:         d.bygg?.BRA     ?? null,
        etasjer:     d.bygg?.etasjer ?? null,
        kjeller:     d.bygg?.kjeller ?? true,
        garasje:     d.bygg?.garasje ?? false,
        tomt:        d.bygg?.tomt    ?? null,
        regplan:     d.bygg?.regplan ?? "Kommuneplan",
        byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
        tidligereSaker: (d.tidligereSaker ?? []).map((s: Record<string, unknown>) => ({
          aar:    s.aar,
          type:   s.type,
          status: s.status === "Godkjent" ? "Tillatelse" : s.status,
        })),
        bygg_source: d.bygg?.bygg_source ?? "default",
      },
    };
  } catch {
    return null;
  }
}

export async function getProperty(id: string): Promise<Address | null> {
  return (await fetchPropertyFromBackend(id)) ?? findAddress(id);
}
