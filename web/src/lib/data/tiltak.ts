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
  desc: string;
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
    desc: "Kjeller til soverom, hybel, kontor eller stue",
    icon: "kjeller", iconClass: "",
    tags: [{ text: "Søknadspliktig", variant: "amber" }, { text: "Vanlig", variant: "" }],
    slug: "kjeller", available: true,
  },
  {
    id: "fjern-vegg",
    name: "Endring i bærekonstruksjon",
    desc: "Fjerne eller flytte bærevegg, bjelke eller søyle",
    icon: "wall", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "vegg", available: true,
  },
  {
    id: "tilbygg",
    name: "Tilbygg",
    desc: "Utvide huset med ekstra rom eller etasje",
    icon: "tilbygg", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilbygg", available: true,
  },
  {
    id: "garasje",
    name: "Bygge garasje / carport",
    desc: "Frittliggende garasje, carport eller bod",
    icon: "garasje", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "garasje", available: true,
  },
  {
    id: "fasade",
    name: "Fasadeendring",
    desc: "Vindu, dør, kledning, hull i vegg eller terrasse",
    icon: "fasade", iconClass: "",
    tags: [{ text: "Avhenger", variant: "" }],
    slug: "fasade", available: true,
  },
  {
    id: "tak",
    name: "Skifte tak",
    desc: "Nytt tekkemateriale eller takform",
    icon: "tak", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "tak", available: true,
  },
  {
    id: "anneks",
    name: "Anneks / uthus",
    desc: "Frittliggende anneks ≤ 50 m²",
    icon: "anneks", iconClass: "",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "anneks", available: true,
  },
  {
    id: "levegg",
    name: "Levegg / gjerde",
    desc: "Skjerm mot innsyn eller vind",
    icon: "levegg", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "levegg", available: true,
  },
  {
    id: "brygge",
    name: "Brygge / sjøbod",
    desc: "Privat brygge på sjøtomt",
    icon: "brygge", iconClass: "blue",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "brygge", available: true,
  },
  {
    id: "bruksendring",
    name: "Bruksendring",
    desc: "Endre bruk av rom eller bygning til ny kategori",
    icon: "bruksendring", iconClass: "warm",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "bruksendring", available: true,
  },
  {
    id: "tilleggsdel",
    name: "Tilleggsdel til hoveddel",
    desc: "Gjøre bod, vaskerom eller garasje til oppholdsrom",
    icon: "tilleggsdel", iconClass: "",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "tilleggsdel", available: true,
  },
  {
    id: "boenhet",
    name: "Etablere ny boenhet",
    desc: "Opprette hybel, sokkelleilighet eller tomannsbolig",
    icon: "boenhet", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "boenhet", available: true,
  },
  {
    id: "geolograpport",
    name: "Geolograpport",
    desc: "Grunnundersøkelse og geoteknisk rapport",
    icon: "geolog", iconClass: "blue",
    tags: [{ text: "Fagtjeneste", variant: "blue" }],
    slug: "geolograpport", available: true,
  },
  {
    id: "andre",
    name: "Noe annet",
    desc: "Beskriv tiltaket – AI hjelper deg videre",
    icon: "ai", iconClass: "warm",
    tags: [{ text: "AI-assistent", variant: "" }],
    slug: "andre", available: true,
  },
];
