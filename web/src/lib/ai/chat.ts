export type ChatSlug = "vegg" | "kjeller";
export type ChatFact = { key: string; value: string | number | null; evidence: string };
export type ChatMessage = { role: "user" | "assistant"; content: string; specialist?: "architect" | "engineer" };
type Spec = { label: string; choices?: Record<string, string>; min?: number; max?: number; unit?: string; empty: string | number | null };
const condition = { ja: "Ja", nei: "Nei", usikker: "Usikker" };
export const CHAT_FIELDS: Record<ChatSlug, Record<string, Spec>> = {
  vegg: {
    type: { label: "Ønsket endring", choices: { fjerne_vegg: "Fjerne vegg", ny_apning: "Ny åpning", utvide_apning: "Utvide åpning", flytte_vegg: "Flytte vegg", endre_soyle: "Endre søyle" }, empty: "fjerne_vegg" },
    baerende: { label: "Bærende konstruksjon", choices: condition, empty: "usikker" },
    apning_bredde: { label: "Åpningsbredde", min: 0.1, max: 30, unit: "m", empty: null },
    etasje: { label: "Etasje", choices: { kjeller: "Kjeller", forste: "Første etasje", ovre: "Øvre etasje", usikker: "Usikker" }, empty: "usikker" },
    etasjer_over: { label: "Etasjer over", min: 0, max: 100, unit: "stk", empty: null },
    konstruksjon: { label: "Materiale", choices: { tre: "Tre", mur_betong: "Mur / betong", stal: "Stål", usikker: "Usikker" }, empty: "usikker" },
  },
  kjeller: {
    room: { label: "Oppgitt godkjent bruk", choices: { bod: "Bod / lager", vaskerom: "Vaskerom", teknisk: "Teknisk rom", annet: "Annen bruk", usikker: "Vet ikke" }, empty: "usikker" },
    ny_bruk: { label: "Ønsket bruk", choices: { soverom: "Soverom", hybel: "Hybel", stue: "Stue", kontor: "Kontor", bad: "Bad" }, empty: null },
    rental: { label: "Boenhet", choices: { same: "Del av eksisterende bolig", separate: "Ny selvstendig boenhet", unknown: "Usikker" }, empty: "unknown" },
    rom_areal: { label: "Romareal", min: 0.1, max: 10000, unit: "m²", empty: 0 },
    takhoyde: { label: "Takhøyde", min: 100, max: 10000, unit: "mm", empty: 0 },
    vindu_bredde: { label: "Fri vindusbredde", min: 0.01, max: 10, unit: "m", empty: 0 },
    vindu_hoyde: { label: "Fri vindushøyde", min: 0.01, max: 10, unit: "m", empty: 0 },
    vindu_brystning: { label: "Høyde til vindu", min: 0, max: 10, unit: "m", empty: 0 },
    radon: { label: "Målt radon", min: 0, max: 100000, unit: "Bq/m³", empty: null },
    drenering_status: { label: "Drenering", choices: condition, empty: "usikker" },
    ventilasjon_status: { label: "Balansert ventilasjon", choices: condition, empty: "usikker" },
  },
};

export function validFact(slug: ChatSlug, fact: ChatFact): boolean {
  if (!fact || !Object.hasOwn(CHAT_FIELDS[slug], fact.key)) return false;
  const spec = CHAT_FIELDS[slug][fact.key];
  if (!spec || typeof fact.evidence !== "string" || !fact.evidence.trim()) return false;
  if (fact.value === null) return true;
  if (spec.choices) return typeof fact.value === "string" && Object.hasOwn(spec.choices, fact.value);
  return typeof fact.value === "number" && Number.isFinite(fact.value) && fact.value >= spec.min! && fact.value <= spec.max!
    && (fact.key !== "etasjer_over" || Number.isInteger(fact.value));
}

export function displayFact(slug: ChatSlug, fact: ChatFact): string {
  const spec = CHAT_FIELDS[slug][fact.key];
  if (fact.value === null) return "Ukjent – tidligere svar tømmes";
  return spec.choices?.[String(fact.value)] ?? `${fact.value} ${spec.unit ?? ""}`;
}

export function chatPatch(slug: ChatSlug, facts: ChatFact[]): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const fact of facts) {
    if (!validFact(slug, fact)) continue;
    patch[fact.key] = fact.value ?? CHAT_FIELDS[slug][fact.key].empty;
  }
  if (slug === "kjeller") {
    // AI must never assert that the customer has checked an approved drawing.
    if (Object.hasOwn(patch, "room")) patch.godkjent_bruk_bekreftet = false;
    if (Object.hasOwn(patch, "rom_areal") || Object.hasOwn(patch, "takhoyde")) patch.unknownMeasurements = false;
    if (["vindu_bredde", "vindu_hoyde", "vindu_brystning"].some(k => Object.hasOwn(patch, k))) patch.unknownWindow = false;
  }
  return patch;
}
