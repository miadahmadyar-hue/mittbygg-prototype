import { findAddress, type Address } from "./addresses";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function number(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function boolean(value: unknown): boolean | null { return typeof value === "boolean" ? value : null; }
export function mapProperty(value: unknown): Address {
  const d = record(value), b = record(d.bygg), m = record(d.matrikkel), c = record(d.coords);
  const limits = record(b.byggegrenser);
  return {
    id: String(d.id), street: String(d.street ?? ""), postal: String(d.postal ?? ""), city: String(d.city ?? ""),
    coords: [number(c.lat) ?? 0, number(c.lon) ?? 0],
    matrikkel: { gnr: String(m.gnr ?? ""), bnr: String(m.bnr ?? ""), kommune: String(m.kommune ?? "") },
    bygg: {
      byggeAar: number(b.byggeAar), BRA: number(b.BRA), etasjer: number(b.etasjer), kjeller: boolean(b.kjeller), garasje: boolean(b.garasje), tomt: number(b.tomt),
      regplan: typeof b.regplan === "string" ? b.regplan : null,
      byggegrenser: { nord: number(limits.nord), sor: number(limits.sor), ost: number(limits.ost), vest: number(limits.vest) },
      tidligereSaker: [],
      bygg_source: b.bygg_source === "matrikkel" || b.bygg_source === "eiendomsinfo" ? b.bygg_source : "default",
    },
  };
}
export async function fetchProperty(id: string): Promise<Address | null> {
  try {
    const response = await fetch(`${API_URL}/api/property/${encodeURIComponent(id)}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    return response.ok ? mapProperty(await response.json()) : null;
  } catch { return null; }
}
export function propertyOverride(property: Address): Address {
  if (typeof window === "undefined") return property;
  try {
    const saved = localStorage.getItem(`property_confirmed_${property.id}`);
    if (saved) return { ...property, bygg: { ...property.bygg, ...JSON.parse(saved) } };
  } catch { /* Keep fetched facts when storage is unavailable. */ }
  return property;
}
export async function loadProperty(id: string): Promise<Address | null> {
  const demo = findAddress(id);
  if (demo) return propertyOverride({ ...demo, bygg: { ...demo.bygg, demo: true } });
  try {
    // Versioned cache avoids restoring the fabricated defaults used by older releases.
    const saved = localStorage.getItem(`property_v2_${id}`) ?? sessionStorage.getItem(`property_v2_${id}`);
    if (saved) return propertyOverride(JSON.parse(saved));
  } catch { /* Fetch on cache failure. */ }
  const property = await fetchProperty(id);
  return property ? propertyOverride(property) : null;
}
