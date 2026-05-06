export type IconKey =
  | "kjeller" | "wall" | "garasje" | "tilbygg" | "fasade" | "tak"
  | "sol" | "anneks" | "levegg" | "vindu" | "brygge" | "ai";

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
    name: "Fjern bærevegg",
    desc: "Åpen planløsning – med bjelke og dimensjonering",
    icon: "wall", iconClass: "warm",
    tags: [{ text: "Krever ANS-rett", variant: "red" }],
    slug: "vegg", available: true,
  },
  {
    id: "garasje",
    name: "Bygge garasje",
    desc: "Frittliggende garasje, carport eller bod",
    icon: "garasje", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "garasje", available: true,
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
    id: "fasade",
    name: "Fasadeendring",
    desc: "Nye vinduer, kledning eller terrasse",
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
    id: "solceller",
    name: "Solceller",
    desc: "Solcelleanlegg på tak eller vegg",
    icon: "sol", iconClass: "warm",
    tags: [{ text: "Unntatt søknad", variant: "green" }],
    slug: "solceller", available: true,
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
    name: "Levegg",
    desc: "Skjerm mot innsyn eller vind",
    icon: "levegg", iconClass: "blue",
    tags: [{ text: "Ofte unntatt", variant: "green" }],
    slug: "levegg", available: true,
  },
  {
    id: "vindu",
    name: "Innsette nytt vindu",
    desc: "Nytt vindu på fasade",
    icon: "vindu", iconClass: "",
    tags: [{ text: "Avhenger", variant: "" }],
    slug: "vindu", available: true,
  },
  {
    id: "brygge",
    name: "Brygge / stupebrett",
    desc: "Privat brygge på sjøtomt",
    icon: "brygge", iconClass: "blue",
    tags: [{ text: "Søknadspliktig", variant: "amber" }],
    slug: "brygge", available: true,
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
