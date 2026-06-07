"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { ADDRESSES, type Address } from "@/lib/data/addresses";
import { getUser, setUser, type User } from "@/lib/auth";
import { useT } from "@/lib/i18n/context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const KARTVERKET_URL = "https://ws.geonorge.no/adresser/v1/sok";

async function searchBackend(q: string): Promise<Address[]> {
  const res = await fetch(`${API_URL}/api/address/search?q=${encodeURIComponent(q)}`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error("search failed");
  const data = await res.json();
  return (data.results ?? []).map((a: Record<string, unknown>) => ({
    id:      a.id,
    street:  a.street,
    postal:  a.postal ?? "",
    city:    a.city ?? "",
    coords:  [(a as Record<string, {lat:number;lon:number}>).coords?.lat ?? 0, (a as Record<string, {lat:number;lon:number}>).coords?.lon ?? 0],
    matrikkel: {
      gnr:     String((a as Record<string, Record<string,unknown>>).matrikkel?.gnr ?? ""),
      bnr:     String((a as Record<string, Record<string,unknown>>).matrikkel?.bnr ?? ""),
      kommune: String((a as Record<string, Record<string,unknown>>).matrikkel?.kommune ?? ""),
    },
    bygg: {
      byggeAar:  (a as Record<string, Record<string,unknown>>).bygg?.byggeAar ?? 1975,
      BRA:       (a as Record<string, Record<string,unknown>>).bygg?.BRA ?? null,
      etasjer:   (a as Record<string, Record<string,unknown>>).bygg?.etasjer ?? null,
      kjeller:   (a as Record<string, Record<string,unknown>>).bygg?.kjeller ?? true,
      garasje:   (a as Record<string, Record<string,unknown>>).bygg?.garasje ?? false,
      tomt:      null,
      regplan:   "Kommuneplan",
      byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
      tidligereSaker: [],
      bygg_source: String((a as Record<string, Record<string,unknown>>).bygg?.bygg_source ?? "default"),
    },
  }));
}

async function searchKartverket(q: string): Promise<Address[]> {
  const url = new URL(KARTVERKET_URL);
  url.searchParams.set("sok", q);
  url.searchParams.set("fuzzy", "true");
  url.searchParams.set("utkoordsys", "4258");
  url.searchParams.set("treffPerSide", "8");
  url.searchParams.set("sokemodus", "AND");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error("kartverket failed");
  const data = await res.json();

  return (data.adresser ?? []).map((a: Record<string, unknown>) => {
    const gnr     = parseInt(String(a.gardsnummer ?? "0")) || 0;
    const bnr     = parseInt(String(a.bruksnummer ?? "0")) || 0;
    const kommune = String(a.kommunenummer ?? "0000");
    const nummer  = String(a.nummer ?? "");
    const bokstav = String(a.bokstav ?? "");
    const punkt   = (a.representasjonspunkt as Record<string,number>) ?? {};
    return {
      id:     `k_${kommune}_${gnr}_${bnr}`,
      street: `${a.adressenavn ?? ""} ${nummer}${bokstav}`.trim(),
      postal: String(a.postnummer ?? ""),
      city:   String(a.kommunenavn ?? "").replace(/\b\w/g, c => c.toUpperCase()),
      coords: [punkt.lat ?? 0, punkt.lon ?? 0] as [number, number],
      matrikkel: { gnr: String(gnr), bnr: String(bnr), kommune },
      bygg: {
        byggeAar: 1975, BRA: null, etasjer: null,
        kjeller: true, garasje: false, tomt: null,
        regplan: "Kommuneplan",
        byggegrenser: { nord: 4, sor: 4, ost: 4, vest: 4 },
        tidligereSaker: [], bygg_source: "default",
      },
    };
  });
}

async function search(q: string): Promise<Address[]> {
  try {
    return await searchBackend(q);
  } catch {
    return searchKartverket(q);
  }
}

export default function AddressPage() {
  const router = useRouter();
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(false);
  const [user, setUserState] = useState<User | null>(() => getUser());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "ok") return;

    const name = params.get("name") ?? "Bruker";
    const timer = setTimeout(() => {
      setUserState(setUser(name));
      window.history.replaceState({}, "", "/address");
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await search(trimmed);
        setResults(res);
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(false);
    setResults([]);
    setError(false);
  };

  const select = (id: string, address?: Address) => {
    if (address) {
      try {
        localStorage.setItem(`property_${id}`, JSON.stringify(address));
      } catch {
        sessionStorage.setItem(`property_${id}`, JSON.stringify(address));
      }
    }
    router.push(`/property/${id}`);
  };
  const showResults    = query.trim().length >= 2;
  const showQuickList  = query.trim().length === 0;

  return (
    <>
      <Topbar
        title=""
        right={
          <div className="w-9 h-9 rounded-full bg-green-500 text-white grid place-items-center font-bold text-sm">
            {user?.initial ?? "?"}
          </div>
        }
      />
      <div className="view">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.025em] leading-[1.1]">
            {t("Hvilken eiendom?", "Which property?")}
          </h1>
          <p className="mt-2 text-[17px] text-gray-700 leading-snug">
            {t(
              "Søk etter adresse, postnummer eller gnr/bnr.",
              "Search by address, postal code or gnr/bnr.",
            )}
          </p>
        </div>

        <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 mt-2 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
          <span className="text-gray-400 shrink-0">
            {loading ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
            )}
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder={t("f.eks. Solbakken 12, Oslo", "e.g. Solbakken 12, Oslo")}
            autoComplete="off"
            autoFocus
            className="flex-1 bg-transparent outline-none text-base"
          />
          {query.length > 0 && (
            <button onClick={() => updateQuery("")} className="text-gray-400 hover:text-gray-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          )}
        </div>

        {showResults && !loading && results.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {results.map((a, i) => (
              <SuggestionRow key={a.id} address={a} onClick={() => select(a.id, a)} last={i === results.length - 1} />
            ))}
          </div>
        )}

        {showResults && !loading && results.length === 0 && !error && (
          <p className="text-sm text-gray-500 text-center py-6">{t("Ingen treff. Prøv en annen adresse.", "No matches. Try another address.")}</p>
        )}

        {showResults && error && (
          <p className="text-sm text-red-500 text-center py-6">{t("Kunne ikke koble til søketjenesten. Sjekk internett og prøv igjen.", "Couldn't reach the search service. Check your connection and try again.")}</p>
        )}

        {showQuickList && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mt-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("Forslag", "Suggestions")}</h4>
            {ADDRESSES.slice(0, 4).map((a) => (
              <button key={a.id} type="button" onClick={() => select(a.id, a)}
                className="flex items-center gap-3 w-full py-2 border-b border-gray-100 last:border-b-0 text-left cursor-pointer">
                <span className="text-gray-400"><PinIcon /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{a.street}</div>
                  <div className="text-xs text-gray-500 truncate">{a.postal} {a.city}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SuggestionRow({ address, onClick, last }: { address: Address; onClick: () => void; last: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left ${last ? "" : "border-b border-gray-100"}`}>
      <div className="w-9 h-9 rounded-full bg-green-50 text-green-500 grid place-items-center shrink-0"><PinIcon /></div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{address.street}</div>
        <div className="text-[13px] text-gray-500 truncate">{address.postal} {address.city} · gnr {address.matrikkel.gnr}/{address.matrikkel.bnr}</div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    </button>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}
