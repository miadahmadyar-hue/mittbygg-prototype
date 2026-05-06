/**
 * Kjellerbruksendring — bruk-typer og rom-data
 * Ported from prototype/index.html (KJELLER_BRUK + KJELLER_ROOMS).
 */

export type KjellerBrukId = "soverom" | "hybel" | "stue" | "kontor" | "bad";

export interface KjellerBruk {
  label: string;
  desc: string;
  takhoyde_min: number;
  takhoyde_lempet: number;
  krav_romning: boolean;
  krav_dagslys: number;   // 0..1 (0.10 = 10%)
  krav_radon: boolean;
  ansvarsrett: boolean;
  soknad: string;
}

export const KJELLER_BRUK: Record<KjellerBrukId, KjellerBruk> = {
  soverom: {
    label: "Soverom",
    desc: "Eget soverom for familiemedlem",
    takhoyde_min: 2400, takhoyde_lempet: 2200,
    krav_romning: true, krav_dagslys: 0.10, krav_radon: true,
    ansvarsrett: false,
    soknad: "PBL § 20-1 d (bruksendring)",
  },
  hybel: {
    label: "Hybel / utleie",
    desc: "Utleieleilighet med eget kjøkken og bad",
    takhoyde_min: 2400, takhoyde_lempet: 2400,
    krav_romning: true, krav_dagslys: 0.10, krav_radon: true,
    ansvarsrett: true,
    soknad: "PBL § 20-3 (med ansvarsrett)",
  },
  stue: {
    label: "Stue / TV-rom",
    desc: "Familierom som del av samme bolig",
    takhoyde_min: 2400, takhoyde_lempet: 2200,
    krav_romning: false, krav_dagslys: 0.10, krav_radon: true,
    ansvarsrett: false,
    soknad: "PBL § 20-4 c (uten ansvarsrett)",
  },
  kontor: {
    label: "Hjemmekontor",
    desc: "Arbeidsrom innen samme bolig",
    takhoyde_min: 2400, takhoyde_lempet: 2200,
    krav_romning: false, krav_dagslys: 0.10, krav_radon: true,
    ansvarsrett: false,
    soknad: "PBL § 20-4 c (uten ansvarsrett)",
  },
  bad: {
    label: "Bad / WC",
    desc: "Ekstra bad i kjeller",
    takhoyde_min: 2200, takhoyde_lempet: 2200,
    krav_romning: false, krav_dagslys: 0, krav_radon: false,
    ansvarsrett: false,
    soknad: "PBL § 20-4 c (uten ansvarsrett)",
  },
};

export interface KjellerRoom {
  id: string;
  name: string;
  area: number;     // m²
  height: number;   // mm
  vinduer: string;
}

const ROOMS_BY_PROP_ID: Record<string, KjellerRoom[]> = {
  "1":  [{ id: "fellesrom", name: "Fellesrom", area: 24, height: 2280, vinduer: "Lite vindu (0,8×0,6 m)" },
         { id: "bod",       name: "Bod",       area: 18, height: 2280, vinduer: "Ingen" },
         { id: "vaskerom",  name: "Vaskerom",  area: 12, height: 2280, vinduer: "Lite vindu (0,6×0,4 m)" }],
  "2":  [{ id: "fellesrom", name: "Fellesrom", area: 28, height: 2280, vinduer: "Lite vindu (0,8×0,6 m)" },
         { id: "teknisk",   name: "Teknisk",   area: 9,  height: 2280, vinduer: "Ingen" },
         { id: "bod",       name: "Bod",       area: 14, height: 2280, vinduer: "Ingen" }],
  "4":  [{ id: "stue",      name: "Stue (delvis innredet)", area: 22, height: 2150, vinduer: "Lite vindu (0,6×0,5 m)" },
         { id: "bod",       name: "Bod",       area: 16, height: 2150, vinduer: "Ingen" }],
  "5":  [{ id: "fellesrom", name: "Fellesrom", area: 32, height: 2310, vinduer: "Lite vindu (0,9×0,6 m)" },
         { id: "vaskerom",  name: "Vaskerom",  area: 11, height: 2310, vinduer: "Ingen" },
         { id: "bod",       name: "Bod",       area: 19, height: 2310, vinduer: "Ingen" }],
};

const DEFAULT_ROOMS: KjellerRoom[] = [
  { id: "fellesrom", name: "Fellesrom", area: 26, height: 2280, vinduer: "Lite vindu (0,8×0,6 m)" },
  { id: "bod",       name: "Bod",       area: 16, height: 2280, vinduer: "Ingen" },
];

export function getKjellerRooms(
  propId: string,
  bygg?: { BRA?: number | null; etasjer?: number | null; byggeAar?: number } | null,
): KjellerRoom[] {
  if (ROOMS_BY_PROP_ID[propId]) return ROOMS_BY_PROP_ID[propId];
  if (bygg?.BRA || bygg?.etasjer) return deriveKjellerRooms(bygg.byggeAar ?? 1975, bygg.BRA, bygg.etasjer);
  return DEFAULT_ROOMS;
}

function deriveKjellerRooms(
  byggeAar: number,
  bra: number | null | undefined,
  etasjer: number | null | undefined,
): KjellerRoom[] {
  const floors = Math.max(etasjer ?? 2, 1);
  const totalBra = bra ?? 140;
  const basementArea = Math.max(22, Math.floor(totalBra / floors));

  let height: number;
  if (byggeAar < 1945) height = 2100;
  else if (byggeAar < 1960) height = 2150;
  else if (byggeAar < 1980) height = 2200;
  else if (byggeAar < 1995) height = 2280;
  else height = 2400;

  let mainVinduer: string;
  if (byggeAar < 1955) mainVinduer = "Ingen";
  else if (byggeAar < 1975) mainVinduer = "Lite vindu (0,6×0,5 m)";
  else mainVinduer = "Lite vindu (0,8×0,6 m)";

  const fellesrom = Math.max(14, Math.floor(basementArea * 0.45));
  const vaskerom  = Math.max(6,  Math.floor(basementArea * 0.20));
  const bod       = Math.max(6,  basementArea - fellesrom - vaskerom);

  return [
    { id: "fellesrom", name: "Fellesrom", area: fellesrom, height, vinduer: mainVinduer },
    { id: "vaskerom",  name: "Vaskerom",  area: vaskerom,  height, vinduer: "Ingen" },
    { id: "bod",       name: "Bod",       area: bod,       height, vinduer: "Ingen" },
  ];
}
