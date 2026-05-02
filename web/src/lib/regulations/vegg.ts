/**
 * Fjern-vegg rule engine + bjelkedimensjonering.
 * TS port of evaluateVegg() from prototype.
 * Mirrors norsk_arkitekt_ai/core/structural.py.foreslaa_bjelkedimensjon().
 */

import type { Finding, Tiltak, Lempning } from "./kjeller";

export interface VeggInput {
  spennvidde: number; // mm
  last: number;       // kN/m
}

export interface Bjelke {
  b: number;            // bredde mm
  h: number;            // høyde mm
  type: string;
  spennvidde: number;
  last: number;
}

export interface VeggResult {
  status: "green" | "amber" | "red";
  statusText: string;
  statusDesc: string;
  findings: Finding[];
  tiltak: Tiltak[];
  lempninger: Lempning[];
  soknadstype: string;
  ansvarsrett: boolean;
  tiltaksklasse: 1 | 2;
  totalKostnad: number;
  bjelke: Bjelke;
  input: VeggInput;
}

export function evaluateVegg(input: VeggInput): VeggResult {
  const findings: Finding[] = [];
  const tiltak: Tiltak[] = [];
  const lempninger: Lempning[] = [];

  // Forenklet bjelkedimensjon (Limtre GL30c)
  const L = input.spennvidde / 1000;            // m
  const qd = input.last * 1.5;                  // design last kN/m
  const M = (qd * L * L) / 8;                   // kNm
  const fm = 30;                                // MPa (GL30c)
  const b = L < 4 ? 90 : L < 6 ? 115 : 140;
  const h_min = Math.sqrt((6 * M * 1e6) / (b * fm));
  const std = [180, 225, 270, 315, 360, 405, 450, 495, 540, 630, 720];
  const h = std.find((v) => v >= h_min) ?? 720;

  findings.push({
    type: "fail",
    t: "Krever ansvarsrett (PBL § 20-3)",
    d: "Endring av bærekonstruksjon utløser alltid søknad med ansvarsrett. Ansvarlig prosjekterende konstruksjon (PRO-RIB) må signere endelig dimensjon.",
    ref: "PBL § 20-3",
  });
  findings.push({
    type: "warn",
    t: "Brannmotstand på bjelken må sjekkes",
    d: "Bjelken må ha R 30 (BKL1) eller R 60 (BKL2). Limtre kan kreve ekstra tiltak.",
    ref: "TEK17 § 11-12",
  });
  findings.push({
    type: "ok",
    t: `Foreslått bjelke: ${b}×${h} mm Limtre GL30c`,
    d: `Spennvidde ${input.spennvidde} mm, last ${input.last} kN/m. Kapasitetsmoment ${((b * h * h * fm) / 6 / 1e6).toFixed(1)} kNm > krav ${M.toFixed(1)} kNm.`,
    ref: "NS-EN 1995",
  });

  tiltak.push(
    { name: `Limtre-bjelke ${b}×${h} mm`,
      desc: "Limtre GL30c, ferdig overflatebehandlet. Leveres med dragar-sko (varmgalv. stål).",
      kostnad: Math.round(L * 4500) },
    { name: "Riving + bortkjøring av eksisterende vegg",
      desc: "Container, støvavskjerming, midlertidig avstiving under riveperioden.",
      kostnad: 25_000 },
    { name: "Konstruksjonsberegning (RIB)",
      desc: "Eurokode-beregning iht. NS-EN 1995, gjennomboyning < L/300, brannmotstand R 30 minimum.",
      kostnad: 15_000 },
    { name: "Innkledning av bjelke (estetikk + brann)",
      desc: "Gips-innkledning eller eksponert. Brannmaling om eksponert.",
      kostnad: 12_000 },
  );

  const totalKostnad = tiltak.reduce((s, t) => s + t.kostnad, 0);

  return {
    status: "amber",
    statusText: "Klar — krever arkitekt-KS",
    statusDesc: "Tiltaket er gjennomførbart, men må gå gjennom konstruksjonsfag (PRO-RIB) før søknad sendes.",
    findings, tiltak, lempninger,
    soknadstype: "PBL § 20-3 (med ansvarsrett)",
    ansvarsrett: true,
    tiltaksklasse: 1,
    totalKostnad,
    bjelke: { b, h, type: "Limtre GL30c", spennvidde: input.spennvidde, last: input.last },
    input,
  };
}
