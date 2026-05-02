/**
 * Mock address data — ported from prototype/index.html.
 * Will be replaced by Kartverket Adresse-API + Geonorge/Matrikkel
 * + per-kommune saksinnsyn integrations in Sprint 1.
 */

export interface Tegning {
  saksnr: string;
  title: string;
  type: "PDF" | "DOCX" | "IFC";
  year: number;
  kilde: string;
}

export interface Sak {
  aar: number;
  type: string;
  status: "Ferdigattest" | "Avslag" | "Tillatelse";
}

export interface Address {
  id: string;
  street: string;
  postal: string;
  city: string;
  coords: [number, number];
  matrikkel: { gnr: string; bnr: string; kommune: string };
  bygg: {
    byggeAar: number;
    BRA: number;
    etasjer: number;
    kjeller: boolean;
    garasje: boolean;
    tomt: number;
    regplan: string;
    byggegrenser: { nord: number; sor: number; ost: number; vest: number };
    tidligereSaker: Sak[];
    tegninger?: Tegning[];
  };
}

export const ADDRESSES: Address[] = [
  {
    id: "1",
    street: "Solbakken 12",
    postal: "0123",
    city: "Oslo",
    coords: [59.9226, 10.7567],
    matrikkel: { gnr: "35", bnr: "127", kommune: "Oslo" },
    bygg: {
      byggeAar: 1985, BRA: 178, etasjer: 2, kjeller: true, garasje: false,
      tomt: 612, regplan: "Reguleringsplan S-3022 (1976)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 2018, type: "Tilbygg veranda", status: "Ferdigattest" },
        { aar: 2002, type: "Garasje (frittliggende)", status: "Ferdigattest" },
      ],
      tegninger: [
        { saksnr: "198501247", title: "Plantegning 1. etg",  type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "198501247", title: "Plantegning kjeller",  type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "198501247", title: "Snitt A-A",            type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "198501247", title: "Fasade nord/sør",      type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "198501247", title: "Fasade øst/vest",      type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "198501247", title: "Situasjonsplan",       type: "PDF", year: 1985, kilde: "Oslo PBE" },
        { saksnr: "200218903", title: "Garasje — plan + fasader", type: "PDF", year: 2002, kilde: "Oslo PBE" },
        { saksnr: "201804521", title: "Tilbygg veranda — tegninger", type: "PDF", year: 2018, kilde: "Oslo PBE" },
        { saksnr: "201804521", title: "Ferdigattest",         type: "PDF", year: 2019, kilde: "Oslo PBE" },
      ],
    },
  },
  {
    id: "2",
    street: "Solhellinga 24",
    postal: "0378",
    city: "Oslo",
    coords: [59.9389, 10.7008],
    matrikkel: { gnr: "42", bnr: "87", kommune: "Oslo" },
    bygg: {
      byggeAar: 1972, BRA: 142, etasjer: 1, kjeller: true, garasje: true,
      tomt: 580, regplan: "Småhusplan Oslo (vedtatt 2013)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 1995, type: "Innvendig endring", status: "Ferdigattest" },
      ],
      tegninger: [
        { saksnr: "197200834", title: "Plantegning 1. etg",  type: "PDF", year: 1972, kilde: "Oslo PBE" },
        { saksnr: "197200834", title: "Plantegning kjeller", type: "PDF", year: 1972, kilde: "Oslo PBE" },
        { saksnr: "197200834", title: "Snitt + fasader",     type: "PDF", year: 1972, kilde: "Oslo PBE" },
        { saksnr: "197200834", title: "Situasjonsplan",      type: "PDF", year: 1972, kilde: "Oslo PBE" },
        { saksnr: "199512456", title: "Innvendig endring — plan", type: "PDF", year: 1995, kilde: "Oslo PBE" },
      ],
    },
  },
  {
    id: "3",
    street: "Bjørkehaugen 7B",
    postal: "0357",
    city: "Oslo",
    coords: [59.9420, 10.7110],
    matrikkel: { gnr: "44", bnr: "201", kommune: "Oslo" },
    bygg: {
      byggeAar: 2015, BRA: 215, etasjer: 2, kjeller: false, garasje: true,
      tomt: 740, regplan: "Detaljreguleringsplan Bjørkehaugen (2012)",
      byggegrenser: { nord: 6, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "4",
    street: "Kirkeveien 99",
    postal: "0364",
    city: "Oslo",
    coords: [59.9343, 10.7128],
    matrikkel: { gnr: "47", bnr: "12", kommune: "Oslo" },
    bygg: {
      byggeAar: 1932, BRA: 96, etasjer: 2, kjeller: true, garasje: false,
      tomt: 320, regplan: "Småhusplan Oslo (vedtatt 2013)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 2009, type: "Bruksendring loft", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "5",
    street: "Fjordveien 18",
    postal: "5063",
    city: "Bergen",
    coords: [60.3697, 5.3489],
    matrikkel: { gnr: "165", bnr: "4", kommune: "Bergen" },
    bygg: {
      byggeAar: 1968, BRA: 156, etasjer: 2, kjeller: true, garasje: true,
      tomt: 660, regplan: "Kommuneplan Bergen 2018-2030",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "6",
    street: "Storgata 4",
    postal: "7011",
    city: "Trondheim",
    coords: [63.4305, 10.3951],
    matrikkel: { gnr: "404", bnr: "11", kommune: "Trondheim" },
    bygg: {
      byggeAar: 1898, BRA: 128, etasjer: 2, kjeller: true, garasje: false,
      tomt: 215, regplan: "Antikvarisk verneplan Midtbyen",
      byggegrenser: { nord: 0, sor: 0, ost: 0, vest: 0 },
      tidligereSaker: [
        { aar: 2020, type: "Fasadeendring vindu", status: "Avslag" },
        { aar: 2021, type: "Fasadeendring vindu (revidert)", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "7",
    street: "Lavollveien 31",
    postal: "9024",
    city: "Tromsø",
    coords: [69.6492, 18.9553],
    matrikkel: { gnr: "117", bnr: "302", kommune: "Tromsø" },
    bygg: {
      byggeAar: 1981, BRA: 134, etasjer: 1, kjeller: true, garasje: true,
      tomt: 720, regplan: "Reguleringsplan Tromsdalen Vest",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "8",
    street: "Marvik 27",
    postal: "4030",
    city: "Stavanger",
    coords: [58.9700, 5.7331],
    matrikkel: { gnr: "29", bnr: "612", kommune: "Stavanger" },
    bygg: {
      byggeAar: 1995, BRA: 198, etasjer: 2, kjeller: true, garasje: true,
      tomt: 510, regplan: "Detaljregulering Marvik (1992)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "9",
    street: "Nordvegen 88",
    postal: "1397",
    city: "Nesodden",
    coords: [59.8603, 10.6553],
    matrikkel: { gnr: "12", bnr: "405", kommune: "Nesodden" },
    bygg: {
      byggeAar: 1965, BRA: 110, etasjer: 1, kjeller: true, garasje: false,
      tomt: 980, regplan: "LNF / spredt boligbebyggelse",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "10",
    street: "Erlend Skjalgssons gate 2",
    postal: "0267",
    city: "Oslo",
    coords: [59.9181, 10.7028],
    matrikkel: { gnr: "37", bnr: "55", kommune: "Oslo" },
    bygg: {
      byggeAar: 1928, BRA: 88, etasjer: 1, kjeller: true, garasje: false,
      tomt: 245, regplan: "Småhusplan Oslo (vedtatt 2013)",
      byggegrenser: { nord: 3, sor: 3, ost: 3, vest: 3 },
      tidligereSaker: [
        { aar: 1998, type: "Bruksendring loft", status: "Ferdigattest" },
      ],
      tegninger: [
        { saksnr: "192800217", title: "Originaltegninger 1928 (skannet)", type: "PDF", year: 1928, kilde: "Oslo PBE — historisk arkiv" },
        { saksnr: "192800217", title: "Plantegning + fasader (kalkér)", type: "PDF", year: 1928, kilde: "Oslo PBE — historisk arkiv" },
        { saksnr: "199807112", title: "Loftutbygging — tegninger", type: "PDF", year: 1998, kilde: "Oslo PBE" },
        { saksnr: "199807112", title: "Brannkonsept (loft)", type: "DOCX", year: 1998, kilde: "Oslo PBE" },
      ],
    },
  },
  // ============== LILLESTRØM ==============
  {
    id: "11",
    street: "Storgata 14",
    postal: "2000",
    city: "Lillestrøm",
    coords: [59.9558, 11.0497],
    matrikkel: { gnr: "78", bnr: "421", kommune: "Lillestrøm" },
    bygg: {
      byggeAar: 1958, BRA: 124, etasjer: 2, kjeller: true, garasje: false,
      tomt: 432, regplan: "Kommuneplan Lillestrøm 2023–2034",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 2014, type: "Skifte tak (tekkemateriale)", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "12",
    street: "Sørumsgata 7",
    postal: "2003",
    city: "Lillestrøm",
    coords: [59.9522, 11.0469],
    matrikkel: { gnr: "81", bnr: "112", kommune: "Lillestrøm" },
    bygg: {
      byggeAar: 1991, BRA: 168, etasjer: 2, kjeller: true, garasje: true,
      tomt: 540, regplan: "Detaljreguleringsplan Sørum øst (1989)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "13",
    street: "Volla terrasse 18",
    postal: "2004",
    city: "Lillestrøm",
    coords: [59.9603, 11.0561],
    matrikkel: { gnr: "82", bnr: "303", kommune: "Lillestrøm" },
    bygg: {
      byggeAar: 2008, BRA: 198, etasjer: 2, kjeller: false, garasje: true,
      tomt: 620, regplan: "Detaljreguleringsplan Volla (2005)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  // ============== DRAMMEN ==============
  {
    id: "14",
    street: "Bragernes torg 5",
    postal: "3017",
    city: "Drammen",
    coords: [59.7440, 10.2045],
    matrikkel: { gnr: "110", bnr: "44", kommune: "Drammen" },
    bygg: {
      byggeAar: 1905, BRA: 152, etasjer: 3, kjeller: true, garasje: false,
      tomt: 198, regplan: "Antikvarisk verneplan Bragernes",
      byggegrenser: { nord: 0, sor: 0, ost: 0, vest: 0 },
      tidligereSaker: [
        { aar: 2017, type: "Fasadeendring (vinduer)", status: "Ferdigattest" },
        { aar: 1976, type: "Innvendig ombygging", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "15",
    street: "Strømsø allé 31",
    postal: "3045",
    city: "Drammen",
    coords: [59.7368, 10.2032],
    matrikkel: { gnr: "115", bnr: "208", kommune: "Drammen" },
    bygg: {
      byggeAar: 1979, BRA: 138, etasjer: 1, kjeller: true, garasje: true,
      tomt: 510, regplan: "Reguleringsplan Strømsø (1972)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "16",
    street: "Konnerudgata 92",
    postal: "3032",
    city: "Drammen",
    coords: [59.7218, 10.1731],
    matrikkel: { gnr: "118", bnr: "67", kommune: "Drammen" },
    bygg: {
      byggeAar: 2002, BRA: 187, etasjer: 2, kjeller: true, garasje: true,
      tomt: 690, regplan: "Detaljreguleringsplan Konnerud (1998)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  // ============== ASKER ==============
  {
    id: "17",
    street: "Askerveien 110",
    postal: "1384",
    city: "Asker",
    coords: [59.8331, 10.4395],
    matrikkel: { gnr: "63", bnr: "229", kommune: "Asker" },
    bygg: {
      byggeAar: 1962, BRA: 132, etasjer: 1, kjeller: true, garasje: true,
      tomt: 720, regplan: "Reguleringsplan Asker sentrum (1968)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 1988, type: "Tilbygg sør", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "18",
    street: "Bondiveien 41",
    postal: "1387",
    city: "Asker",
    coords: [59.8521, 10.4280],
    matrikkel: { gnr: "65", bnr: "514", kommune: "Asker" },
    bygg: {
      byggeAar: 1995, BRA: 174, etasjer: 2, kjeller: true, garasje: true,
      tomt: 580, regplan: "Detaljreguleringsplan Bondi (1992)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
  {
    id: "19",
    street: "Vollenveien 56",
    postal: "1390",
    city: "Vollen",
    coords: [59.8056, 10.4842],
    matrikkel: { gnr: "70", bnr: "812", kommune: "Asker" },
    bygg: {
      byggeAar: 1948, BRA: 96, etasjer: 1, kjeller: true, garasje: false,
      tomt: 1100, regplan: "LNF / spredt boligbebyggelse (Vollen)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 2009, type: "Bruksendring kjeller (avslag)", status: "Avslag" },
      ],
    },
  },
  // ============== BÆRUM (SANDVIKA) ==============
  {
    id: "20",
    street: "Rådmann Halmrasts vei 2",
    postal: "1337",
    city: "Sandvika",
    coords: [59.8917, 10.5267],
    matrikkel: { gnr: "53", bnr: "311", kommune: "Bærum" },
    bygg: {
      byggeAar: 1968, BRA: 156, etasjer: 2, kjeller: true, garasje: true,
      tomt: 640, regplan: "Småhusplan Bærum (vedtatt 2007)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 2003, type: "Garasje + carport", status: "Ferdigattest" },
      ],
    },
  },
  {
    id: "21",
    street: "Brambanigata 9",
    postal: "1338",
    city: "Sandvika",
    coords: [59.8932, 10.5288],
    matrikkel: { gnr: "53", bnr: "452", kommune: "Bærum" },
    bygg: {
      byggeAar: 1925, BRA: 118, etasjer: 2, kjeller: true, garasje: false,
      tomt: 380, regplan: "Småhusplan Bærum (vedtatt 2007) + bevaringsverdig",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [
        { aar: 1996, type: "Bruksendring loft", status: "Ferdigattest" },
        { aar: 2019, type: "Solcelleanlegg", status: "Tillatelse" },
      ],
    },
  },
  {
    id: "22",
    street: "Engervannsveien 12",
    postal: "1341",
    city: "Slependen",
    coords: [59.8843, 10.5602],
    matrikkel: { gnr: "57", bnr: "199", kommune: "Bærum" },
    bygg: {
      byggeAar: 2014, BRA: 224, etasjer: 2, kjeller: false, garasje: true,
      tomt: 780, regplan: "Detaljreguleringsplan Slependen (2010)",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
    },
  },
];

export function findAddress(id: string): Address | undefined {
  return ADDRESSES.find((a) => a.id === id);
}

export function searchAddresses(query: string): Address[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return ADDRESSES.filter(
    (a) =>
      a.street.toLowerCase().includes(q) ||
      a.postal.includes(q) ||
      a.city.toLowerCase().includes(q),
  );
}
