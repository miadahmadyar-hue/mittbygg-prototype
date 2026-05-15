const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Beregning {
  type: "last" | "energi" | "brann" | "grunn";
  navn: string;
  verdi: string;
  referanse: string;
}

export interface EngineerAssessment {
  tittel: string;
  beregninger: Beregning[];
  konklusjon: string;
  notater: string[];
}

interface EngineerRequest {
  slug: string;
  address: string;
  gnr: number;
  bnr: number;
  bygg: Record<string, unknown>;
  architect_summary?: string;
}

export async function callEngineerAgent(req: EngineerRequest): Promise<EngineerAssessment> {
  const res = await fetch(`${API_URL}/api/ai/engineer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error("engineer api failed");
  return res.json();
}
