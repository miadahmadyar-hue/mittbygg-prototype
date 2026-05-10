export interface TiltakPricing {
  market: number;
  mittbygg: number;
  note?: string;
}

export const PRICING: Record<string, TiltakPricing> = {
  kjeller:      { market: 25000,  mittbygg: 9900   },
  vegg:         { market: 55000,  mittbygg: 17900,  note: "Inkl. koordinering med konstruktør" },
  tilbygg:      { market: 45000,  mittbygg: 14900  },
  garasje:      { market: 16000,  mittbygg: 5900   },
  fasade:       { market: 16000,  mittbygg: 5900   },
  tak:          { market: 14000,  mittbygg: 4900   },
  solceller:    { market: 6000,   mittbygg: 1190,   note: "Kun melding til nettselskap kreves" },
  anneks:       { market: 16000,  mittbygg: 5900   },
  levegg:       { market: 10000,  mittbygg: 2990   },
  brygge:       { market: 38000,  mittbygg: 11900,  note: "Inkl. havne- og farvannslov" },
  bruksendring: { market: 25000,  mittbygg: 9900   },
  tilleggsdel:  { market: 25000,  mittbygg: 9900   },
  boenhet:      { market: 65000,  mittbygg: 21900,  note: "Inkl. koordinering med ansvarlig søker" },
  geolograpport:{ market: 35000,  mittbygg: 19900,  note: "Inkl. innhenting og kvalitetssikring av rapport" },
  andre:        { market: 24000,  mittbygg: 7900   },
};

export function getPricing(slug: string): TiltakPricing {
  return PRICING[slug] ?? { market: 24000, mittbygg: 7900 };
}

export function formatKr(n: number) {
  return n.toLocaleString("nb-NO") + " kr";
}

export function discountPct(p: TiltakPricing) {
  return Math.round((1 - p.mittbygg / p.market) * 100);
}
