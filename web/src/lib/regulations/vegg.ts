import type { Finding, Tiltak, Lempning } from "./kjeller";

export interface VeggInput {
  type: "fjerne_vegg" | "ny_apning" | "utvide_apning" | "flytte_vegg" | "endre_soyle";
  baerende: "ja" | "nei" | "usikker";
  apning_bredde: number | null;
  etasje: "kjeller" | "forste" | "ovre";
  etasjer_over: number;
  konstruksjon: "tre" | "mur_betong" | "stal" | "usikker";
}

export interface VeggResult {
  outcome: "exempt" | "professional" | "clarify" | "application";
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
  bjelke?: undefined;
  input: VeggInput;
}

const LABELS: Record<VeggInput["type"], string> = {
  fjerne_vegg: "Fjerne hele veggen",
  ny_apning: "Lage en ny åpning",
  utvide_apning: "Utvide en eksisterende åpning",
  flytte_vegg: "Flytte veggen",
  endre_soyle: "Endre eller fjerne søyle",
};

export function evaluateVegg(input: VeggInput): VeggResult {
  const isNonBearing = input.baerende === "nei";
  const findings: Finding[] = isNonBearing
    ? [
        {
          type: "ok",
          t: "Ingen bærende funksjon oppgitt",
          d: "Arbeid på en ikke-bærende vegg kan normalt utføres uten søknad dersom brann- eller lydskille ikke berøres.",
          ref: "SAK10 § 4-1",
        },
        {
          type: "warn",
          t: "Brann- og lydskille må bekreftes",
          d: "Vegger mellom boenheter og brannceller krever særskilt vurdering.",
          ref: "TEK17 kap. 11 og 13",
        },
      ]
    : [
        {
          type: input.baerende === "ja" ? "fail" : "warn",
          t: input.baerende === "ja" ? "Inngrep i bærende konstruksjon krever søknad" : "Bærende funksjon er ikke avklart",
          d: "En konstruksjonsingeniør må kontrollere godkjente tegninger, lastvei og konstruksjonen på stedet før arbeid starter.",
          ref: "PBL § 20-3",
        },
        {
          type: "warn",
          t: "Ingen bjelkedimensjon beregnes her",
          d: "Dimensjoner krever tegninger, materialkontroll og stedlige laster.",
          ref: "TEK17 § 10-2",
        },
      ];

  findings.push({
    type: "ok",
    t: `Omfang registrert: ${LABELS[input.type]}`,
    d: `Åpningsbredde ${input.apning_bredde ? `ca. ${input.apning_bredde} m` : "ikke oppgitt"}, ${input.etasjer_over} etasje(r) over.`,
    ref: "Kundeopplysninger",
  });

  const tiltak: Tiltak[] = isNonBearing ? [] : [{
    name: "Konstruksjonsfaglig forundersøkelse",
    desc: "Gjennomgang av tegninger, befaring og avklaring av lastvei før prosjektering.",
    kostnad: 15_000,
  }];

  return {
    outcome: isNonBearing ? "clarify" : "professional",
    status: isNonBearing ? "green" : "amber",
    statusText: isNonBearing ? "Trolig unntatt søknad" : "Krever konstruksjonsfaglig vurdering",
    statusDesc: isNonBearing
      ? "Bekreft at veggen ikke er del av bæring, brann- eller lydskille."
      : "Ikke start riving før løsningen er dokumentert av konstruksjonsingeniør.",
    findings,
    tiltak,
    lempninger: [],
    soknadstype: isNonBearing ? "Trolig unntatt - må bekreftes" : "PBL § 20-3 (med ansvarsrett)",
    ansvarsrett: !isNonBearing,
    tiltaksklasse: 1,
    totalKostnad: tiltak.reduce((sum, item) => sum + item.kostnad, 0),
    input,
  };
}
