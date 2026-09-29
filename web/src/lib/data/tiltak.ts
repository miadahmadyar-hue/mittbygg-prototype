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
  category: "inside" | "expand" | "exterior" | "site" | "help";
  hidden?: boolean;
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
    slug: "kjeller", available: true, category: "inside",
  },
  {
    id: "fjern-vegg",
    name: "Endring i bærekonstruksjon",
    name_en: "Load-bearing change",
    desc: "Fjerne eller flytte bærevegg, bjelke eller søyle",
    desc_en: "Remove or move a load-bearing wall, beam or column",
    icon: "wall", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "vegg", available: true, category: "inside",
  },
  {
    id: "tilbygg",
    name: "Tilbygg",
    name_en: "Extension",
    desc: "Utvide huset med ekstra rom eller etasje",
    desc_en: "Expand the house with an extra room or floor",
    icon: "tilbygg", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilbygg", available: true, category: "expand",
  },
  {
    id: "garasje",
    name: "Bygge garasje / carport",
    name_en: "Build garage / carport",
    desc: "Frittliggende garasje, carport eller bod",
    desc_en: "Detached garage, carport or shed",
    icon: "garasje", iconClass: "blue",
    tags: [{ text: "Regelsjekk", variant: "blue" }],
    slug: "garasje", available: true, category: "expand",
  },
  {
    id: "fasade",
    name: "Fasadeendring",
    name_en: "Facade change",
    desc: "Vindu, dør, kledning, hull i vegg eller terrasse",
    desc_en: "Window, door, cladding, wall opening or deck",
    icon: "fasade", iconClass: "",
    tags: [{ text: "Avhenger", variant: "" }],
    slug: "fasade", available: true, category: "exterior",
  },
  {
    id: "tak",
    name: "Tak og loft",
    name_en: "Roof and attic",
    desc: "Taktekking, endret takform eller innredning av loft",
    desc_en: "Roofing, roof shape changes or attic conversion",
    icon: "tak", iconClass: "blue",
    tags: [{ text: "Regelsjekk", variant: "blue" }],
    slug: "tak", available: true, category: "exterior",
  },
  {
    id: "anneks",
    name: "Anneks / uthus",
    name_en: "Annex / outbuilding",
    desc: "Frittliggende uthus, hagestue eller bygg for overnatting",
    desc_en: "Detached outbuilding, garden room or overnight annex",
    icon: "anneks", iconClass: "",
    tags: [{ text: "Regelsjekk", variant: "blue" }],
    slug: "anneks", available: true, category: "expand",
  },
  {
    id: "levegg",
    name: "Levegg / gjerde",
    name_en: "Privacy wall / fence",
    desc: "Skjerm mot innsyn eller vind",
    desc_en: "Screen against view or wind",
    icon: "levegg", iconClass: "blue",
    tags: [{ text: "Regelsjekk", variant: "blue" }],
    slug: "levegg", available: true, category: "exterior",
  },
  {
    id: "brygge",
    name: "Brygge / sjøbod",
    name_en: "Dock / boathouse",
    desc: "Privat brygge på sjøtomt",
    desc_en: "Private dock on a waterfront plot",
    icon: "brygge", iconClass: "blue",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "brygge", available: true, category: "site",
  },
  {
    id: "bruksendring",
    name: "Bruksendring",
    name_en: "Change of use",
    desc: "Gjøre bod, garasje, næring eller andre arealer om til ny bruk",
    desc_en: "Convert storage, garage, commercial or other areas to a new use",
    icon: "bruksendring", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "bruksendring", available: true, category: "inside",
  },
  {
    id: "tilleggsdel",
    name: "Tilleggsdel til hoveddel",
    name_en: "Convert to living space",
    desc: "Gjøre bod, vaskerom eller garasje til oppholdsrom",
    desc_en: "Turn a storage room, laundry or garage into living space",
    icon: "tilleggsdel", iconClass: "",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilleggsdel", available: true, category: "inside", hidden: true,
  },
  {
    id: "boenhet",
    name: "Etablere ny boenhet",
    name_en: "Create a new dwelling unit",
    desc: "Opprette hybel, sokkelleilighet eller tomannsbolig",
    desc_en: "Create a bedsit, basement flat or duplex",
    icon: "boenhet", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "boenhet", available: true, category: "inside",
  },
  {
    id: "geolograpport",
    name: "Geolograpport",
    name_en: "Geotechnical report",
    desc: "Grunnundersøkelse og geoteknisk rapport",
    desc_en: "Ground survey and geotechnical report",
    icon: "geolog", iconClass: "blue",
    tags: [{ text: "Fagtjeneste", variant: "blue" }],
    slug: "geolograpport", available: true, category: "help", hidden: true,
  },
  {
    id: "andre",
    name: "Noe annet",
    name_en: "Something else",
    desc: "Beskriv tiltaket og få hjelp til riktig neste steg",
    desc_en: "Describe the project and get help choosing the next step",
    icon: "ai", iconClass: "warm",
    tags: [{ text: "Manuell avklaring", variant: "" }],
    slug: "andre", available: true, category: "help",
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
  "Regelsjekk": "Rule check",
  "Manuell avklaring": "Manual review",
};
