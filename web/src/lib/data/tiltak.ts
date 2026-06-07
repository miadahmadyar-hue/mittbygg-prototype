export type IconKey =
  | "kjeller" | "wall" | "garasje" | "tilbygg" | "fasade" | "tak"
  | "anneks" | "levegg" | "brygge" | "ai" | "geolog"
  | "bruksendring" | "tilleggsdel" | "boenhet";

export interface TiltakTag {
  text: string;
  variant: "" | "green" | "amber" | "red" | "blue";
}

export interface Tiltak {
  id: string;
  name: string;
  name_en: string;
  desc: string;
  desc_en: string;
  icon: IconKey;
  iconClass: "" | "warm" | "blue";
  tags: TiltakTag[];
  slug: string | null;
  available: boolean;
}

export const TILTAK: Tiltak[] = [
  {
    id: "kjeller-bruksendring",
    name: "Bruksendring kjeller",
    name_en: "Basement conversion",
    desc: "Kjeller til soverom, hybel, kontor eller stue",
    desc_en: "Basement to bedroom, flat, office or living room",
    icon: "kjeller", iconClass: "",
    tags: [{ text: "Søknadspliktig", variant: "amber" }, { text: "Vanlig", variant: "" }],
    slug: "kjeller", available: true,
  },
  {
    id: "fjern-vegg",
    name: "Endring i bærekonstruksjon",
    name_en: "Load-bearing change",
    desc: "Fjerne eller flytte bærevegg, bjelke eller søyle",
    desc_en: "Remove or move a load-bearing wall, beam or column",
    icon: "wall", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "vegg", available: true,
  },
  {
    id: "tilbygg",
    name: "Tilbygg",
    name_en: "Extension",
    desc: "Utvide huset med ekstra rom eller etasje",
    desc_en: "Expand the house with an extra room or floor",
    icon: "tilbygg", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilbygg", available: true,
  },
  {
    id: "garasje",
    name: "Bygge garasje / carport",
    name_en: "Build garage / carport",
    desc: "Frittliggende garasje, carport eller bod",
    desc_en: "Detached garage, carport or shed",
    icon: "garasje", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "garasje", available: true,
  },
  {
    id: "fasade",
    name: "Fasadeendring",
    name_en: "Facade change",
    desc: "Vindu, dør, kledning, hull i vegg eller terrasse",
    desc_en: "Window, door, cladding, wall opening or deck",
    icon: "fasade", iconClass: "",
    tags: [{ text: "Avhenger", variant: "" }],
    slug: "fasade", available: true,
  },
  {
    id: "tak",
    name: "Skifte tak",
    name_en: "Replace roof",
    desc: "Nytt tekkemateriale eller takform",
    desc_en: "New roofing material or roof shape",
    icon: "tak", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "tak", available: true,
  },
  {
    id: "anneks",
    name: "Anneks / uthus",
    name_en: "Annex / outbuilding",
    desc: "Frittliggende anneks ≤ 50 m²",
    desc_en: "Detached annex ≤ 50 m²",
    icon: "anneks", iconClass: "",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "anneks", available: true,
  },
  {
    id: "levegg",
    name: "Levegg / gjerde",
    name_en: "Privacy wall / fence",
    desc: "Skjerm mot innsyn eller vind",
    desc_en: "Screen against view or wind",
    icon: "levegg", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "levegg", available: true,
  },
  {
    id: "brygge",
    name: "Brygge / sjøbod",
    name_en: "Dock / boathouse",
    desc: "Privat brygge på sjøtomt",
    desc_en: "Private dock on a waterfront plot",
    icon: "brygge", iconClass: "blue",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "brygge", available: true,
  },
  {
    id: "bruksendring",
    name: "Bruksendring",
    name_en: "Change of use",
    desc: "Endre bruk av rom eller bygning til ny kategori",
    desc_en: "Change the use of a room or building to a new category",
    icon: "bruksendring", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "bruksendring", available: true,
  },
  {
    id: "tilleggsdel",
    name: "Tilleggsdel til hoveddel",
    name_en: "Convert to living space",
    desc: "Gjøre bod, vaskerom eller garasje til oppholdsrom",
    desc_en: "Turn a storage room, laundry or garage into living space",
    icon: "tilleggsdel", iconClass: "",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilleggsdel", available: true,
  },
  {
    id: "boenhet",
    name: "Etablere ny boenhet",
    name_en: "Create a new dwelling unit",
    desc: "Opprette hybel, sokkelleilighet eller tomannsbolig",
    desc_en: "Create a bedsit, basement flat or duplex",
    icon: "boenhet", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "boenhet", available: true,
  },
  {
    id: "geolograpport",
    name: "Geolograpport",
    name_en: "Geotechnical report",
    desc: "Grunnundersøkelse og geoteknisk rapport",
    desc_en: "Ground survey and geotechnical report",
    icon: "geolog", iconClass: "blue",
    tags: [{ text: "Fagtjeneste", variant: "blue" }],
    slug: "geolograpport", available: true,
  },
  {
    id: "andre",
    name: "Noe annet",
    name_en: "Something else",
    desc: "Beskriv tiltaket – AI hjelper deg videre",
    desc_en: "Describe the project – AI takes it from there",
    icon: "ai", iconClass: "warm",
    tags: [{ text: "AI-assistent", variant: "" }],
    slug: "andre", available: true,
  },
];

/** Norwegian → English for the short status tags shown on tiltak cards. */
export const TAG_EN: Record<string, string> = {
  "Søknadspliktig": "Permit required",
  "Vanlig": "Common",
  "Krever ANS-rett": "Needs pro liability",
  "Ofte unntatt": "Often exempt",
  "Avhenger": "Depends",
  "Fagtjeneste": "Pro service",
  "AI-assistent": "AI assistant",
};
