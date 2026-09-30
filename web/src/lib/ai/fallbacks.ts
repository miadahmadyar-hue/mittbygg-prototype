import type { ArchitectAssessment } from "@/lib/api/aiArchitect";
import type { EngineerAssessment } from "@/lib/api/aiEngineer";

export const FALLBACK_ARCHITECT: ArchitectAssessment = {
  meta: { source: "fallback", reason: "service_unavailable" },
  feasible: false,
  summary:
    "Faglig vurdering er ikke tilgjengelig. Ingen konklusjon om gjennomførbarhet er laget.",
  items: [
    { type: "missing", text: "Godkjente tegninger er ikke faglig kontrollert" },
    { type: "missing", text: "Reguleringsplan og eiendomsvilkår er ikke verifisert" },
  ],
  anbefalinger: [
    "Last opp relevante tegninger og få vurderingen utført på nytt",
    "Ikke bruk denne reservevisningen som prosjekteringsgrunnlag",
  ],
};

export const FALLBACK_ENGINEER: EngineerAssessment = {
  meta: { source: "fallback", reason: "service_unavailable" },
  tittel: "Teknisk vurdering ikke tilgjengelig",
  beregninger: [],
  konklusjon: "Det er ikke utført tekniske beregninger eller kontroll av konstruksjon, brann eller energi.",
  notater: [
    "Fagperson må kontrollere grunnlaget før prosjektering eller byggestart",
  ],
};
