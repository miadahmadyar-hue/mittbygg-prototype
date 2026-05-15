import type { ArchitectAssessment } from "@/lib/api/aiArchitect";
import type { EngineerAssessment } from "@/lib/api/aiEngineer";

export const FALLBACK_ARCHITECT: ArchitectAssessment = {
  feasible: true,
  summary:
    "Tiltaket ser gjennomførbart ut basert på tilgjengelig eiendomsdata. " +
    "Last opp tegninger for en mer presis faglig vurdering.",
  items: [
    { type: "ok",      text: "Ingen åpenbare konflikter med reguleringsplan" },
    { type: "warn",    text: "Nabovarsel må sendes minst 2 uker før byggestart" },
    { type: "missing", text: "Situasjonsplan i målestokk 1:500 anbefales" },
  ],
  anbefalinger: [
    "Last opp situasjonsplan og plantegning for en komplett søknad",
    "Kontroller avstand til nabogrense etter PBL § 29-4",
  ],
};

export const FALLBACK_ENGINEER: EngineerAssessment = {
  tittel: "Teknisk redegjørelse",
  beregninger: [
    { type: "last",   navn: "Dimensjonerende nyttelast", verdi: "2,0 kN/m²",  referanse: "NS-EN 1991-1-1" },
    { type: "energi", navn: "U-verdi yttervegg",         verdi: "0,18 W/m²K", referanse: "TEK17 §14-3" },
    { type: "brann",  navn: "Brannklasse",                verdi: "BKL 1",      referanse: "TEK17 §11-2" },
  ],
  konklusjon:
    "Tiltaket kan gjennomføres innenfor gjeldende tekniske krav etter TEK17.",
  notater: [
    "Utførelse dokumenteres av ansvarlig foretak",
    "Kontroll utføres etter NS 3420",
  ],
};
