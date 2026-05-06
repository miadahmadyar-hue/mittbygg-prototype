import { apiGet } from "./client";
import type { Address } from "@/lib/data/addresses";

export async function searchAddressesApi(q: string): Promise<Address[]> {
  if (q.trim().length < 2) return [];
  try {
    const data = await apiGet<{ results: Address[] }>(
      `/api/address/search?q=${encodeURIComponent(q)}`,
    );
    return data.results;
  } catch {
    return [];
  }
}
