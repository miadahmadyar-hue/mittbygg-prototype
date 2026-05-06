import { apiPost } from "./client";
import {
  evaluateKjeller as evaluateKjellerLocal,
  type KjellerInput,
  type KjellerResult,
} from "@/lib/regulations/kjeller";
import {
  evaluateVegg as evaluateVeggLocal,
  type VeggInput,
  type VeggResult,
} from "@/lib/regulations/vegg";

export async function evaluateKjellerApi(input: KjellerInput): Promise<KjellerResult> {
  try {
    return await apiPost<KjellerResult>("/api/evaluate/kjeller", input);
  } catch {
    // Backend unavailable — fall back to client-side rule engine
    return evaluateKjellerLocal(input);
  }
}

export async function evaluateVeggApi(input: VeggInput): Promise<VeggResult> {
  try {
    return await apiPost<VeggResult>("/api/evaluate/vegg", input);
  } catch {
    return evaluateVeggLocal(input);
  }
}
