const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AssessmentItemType = "ok" | "warn" | "missing";

export interface AssessmentItem {
  type: AssessmentItemType;
  text: string;
}

export interface ArchitectAssessment {
  feasible: boolean;
  summary: string;
  items: AssessmentItem[];
  anbefalinger: string[];
  meta?: {
    source?: "claude" | "fallback";
    reason?: string;
    model?: string;
  };
}

interface ArchitectRequest {
  session_id: string | null;
  slug: string;
  address: string;
  gnr: number;
  bnr: number;
  kommune: string;
  bygg: Record<string, unknown>;
}

export async function callArchitectAgent(req: ArchitectRequest): Promise<ArchitectAssessment> {
  const res = await fetch(`${API_URL}/api/ai/architect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error("architect api failed");
  return res.json();
}
