import { mapProperty } from "@/lib/data/property";
import type { Address } from "@/lib/data/addresses";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export type AddressSearch = { results: Address[]; total: number; page: number; hasMore: boolean; mode: string };

export async function searchAddresses(q: string, page = 0, signal?: AbortSignal): Promise<AddressSearch> {
  const response = await fetch(`${API_URL}/api/address/search?q=${encodeURIComponent(q)}&page=${page}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(28000)]) : AbortSignal.timeout(28000),
  });
  if (!response.ok) throw new Error("Address search unavailable");
  const data = await response.json();
  return { ...data, results: (data.results ?? []).map(mapProperty) };
}
