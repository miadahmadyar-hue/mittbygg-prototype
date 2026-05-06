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

// ── Shared result type for all simple tiltak wizards ─────────────────────────

export interface TiltakFinding {
  type: "ok" | "warn" | "fail";
  t: string;
  d: string;
  ref: string;
}

export interface TiltakTiltak {
  name: string;
  desc: string;
  kostnad: number;
}

export interface TiltakResult {
  status: "green" | "amber" | "red";
  statusText: string;
  statusDesc: string;
  findings: TiltakFinding[];
  tiltak: TiltakTiltak[];
  lempninger: { regel: string; tekst: string }[];
  soknadstype: string;
  ansvarsrett: boolean;
  tiltaksklasse: 1 | 2;
  totalKostnad: number;
  input: Record<string, unknown>;
}

// ── Existing wizards ──────────────────────────────────────────────────────────

export async function evaluateKjellerApi(input: KjellerInput): Promise<KjellerResult> {
  try {
    return await apiPost<KjellerResult>("/api/evaluate/kjeller", input);
  } catch {
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

// ── New tiltak evaluate functions (backend-only, no client fallback needed) ───

async function evalTiltak(slug: string, input: unknown): Promise<TiltakResult> {
  return apiPost<TiltakResult>(`/api/evaluate/${slug}`, input);
}

export const evaluateGarasjeApi   = (i: unknown) => evalTiltak("garasje",   i);
export const evaluateTilbyggApi   = (i: unknown) => evalTiltak("tilbygg",   i);
export const evaluateFasadeApi    = (i: unknown) => evalTiltak("fasade",    i);
export const evaluateTakApi       = (i: unknown) => evalTiltak("tak",       i);
export const evaluateSolcellerApi = (i: unknown) => evalTiltak("solceller", i);
export const evaluateAnneksApi    = (i: unknown) => evalTiltak("anneks",    i);
export const evaluateLevegApi     = (i: unknown) => evalTiltak("levegg",    i);
export const evaluateVinduApi     = (i: unknown) => evalTiltak("vindu",     i);
export const evaluateBryggeApi    = (i: unknown) => evalTiltak("brygge",    i);
export const evaluateAndreApi     = (i: unknown) => evalTiltak("andre",     i);
