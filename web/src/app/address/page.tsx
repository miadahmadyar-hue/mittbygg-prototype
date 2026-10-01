"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { searchAddresses } from "@/lib/api/address";
import { ADDRESSES, type Address } from "@/lib/data/addresses";
import { getUser, setUser, type User } from "@/lib/auth";
import { useT } from "@/lib/i18n/context";

export default function AddressPage() {
  const router = useRouter();
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Address[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [mode, setMode] = useState("exact");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [user, setUserState] = useState<User | null>(() => getUser());

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

    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const next = await searchAddresses(trimmed, page, controller.signal);
        if (active) {
          setResults(next.results);
          setTotal(next.total);
          setHasMore(next.hasMore);
          setMode(next.mode);
        }
      } catch {
        if (active) { setError(true); setResults([]); }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [query, page, retry]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(0);
    setTotal(0);
    setHasMore(false);
    setLoading(value.trim().length >= 2);
    setResults([]);
    setError(false);
  };

  const select = (id: string, address?: Address) => {
    if (address) {
      try {
        localStorage.setItem(`property_v2_${id}`, JSON.stringify(address));
      } catch {
        try { sessionStorage.setItem(`property_v2_${id}`, JSON.stringify(address)); } catch { /* Backend can reload the property. */ }
      }
    }
    router.push(`/property/${id}`);
  };

  const showResults = query.trim().length >= 2;
  const showQuickList = query.trim().length === 0;

  return (
    <>
      <Topbar
        title=""
        back={false}
        right={
          <div className="grid h-9 w-9 place-items-center rounded-[5px] bg-green-500 text-sm font-bold text-white" title={user?.name ?? "Bruker"}>
            {user?.initial ?? "?"}
          </div>
        }
      />

      <div className="view view-wide">
        <header className="max-w-[760px] border-b border-gray-200 pb-8">
          <p className="page-kicker">{t("Ny eiendomsvurdering", "New property assessment")}</p>
          <h1 className="page-title mt-3">{t("Hvilken eiendom?", "Which property?")}</h1>
          <p className="mt-4 max-w-[620px] text-base leading-7 text-gray-600">
            {t(
              "Søk i hele Norge. Skriv gate og husnummer, gjerne med poststed eller postnummer. Du kan også søke med kommune/gnr/bnr, for eksempel 0301/208/619.",
              "Search all of Norway. Enter street and house number, preferably with town or postcode. You can also use municipality/farm/property number, for example 0301/208/619.",
            )}
          </p>
        </header>

        <div className="panel flex max-w-[900px] items-center gap-4 px-5 py-4 shadow-md transition focus-within:border-green-500 focus-within:shadow-[0_0_0_3px_var(--color-green-100)]">
          <span className="shrink-0 text-gray-400">{loading ? <SpinnerIcon /> : <SearchIcon />}</span>
          <input
            aria-label={t("Søk etter eiendom", "Search for property")}
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder={t("Søk etter adresse, for eksempel Solbakken 12", "Search for an address, for example Solbakken 12")}
            autoComplete="off"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base outline-none md:text-lg"
          />
          {query.length > 0 && (
            <button type="button" aria-label={t("Tøm søk", "Clear search")} onClick={() => updateQuery("")} className="p-1 text-gray-400 hover:text-gray-700">
              <CloseIcon />
            </button>
          )}
        </div>

        <p className="max-w-[900px] text-sm leading-6 text-gray-500">{t("Kilde: Kartverkets adresseregister. Byggeår, areal og godkjente tegninger følger ikke med adressesøket. Disse opplysningene kontrollerer du på eiendomssiden.", "Source: Kartverket’s address register. Year built, floor area and approved drawings are not included in address search. Check these details on the property page.")}</p>
        {showResults && loading && <p role="status" className="text-sm text-gray-600">{t("Søker etter adresser…", "Searching addresses…")}</p>}
        {showResults && !loading && !error && results.length > 0 && <p role="status" className="text-sm text-gray-600">{t("Viser", "Showing")} {page * 20 + 1}–{page * 20 + results.length} {t("av", "of")} {total} {t("treff", "matches")}{mode === "fuzzy" ? t(" · Omtrentlige treff — kontroller adressen.", " · Approximate matches — check the address.") : ""}</p>}
        {showResults && !loading && results.length > 0 && (
          <div className="panel max-w-[900px] overflow-hidden">
            {results.map((address, index) => (
              <PropertyRow
                key={address.id}
                address={address}
                onClick={() => select(address.id, address)}
                last={index === results.length - 1}
              />
            ))}
          </div>
        )}

        {showResults && !loading && results.length === 0 && !error && (
          <p className="max-w-[900px] border-y border-gray-200 py-8 text-center text-sm text-gray-500">
            {t("Ingen treff. Prøv gatenavn og husnummer uten leilighetsnummer, og legg til poststed eller postnummer.", "No matches. Try the street and house number without the apartment number, adding town or postcode.")}
          </p>
        )}

        {showResults && error && (
          <div role="alert" className="max-w-[900px] border-y border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <p>{t("Kunne ikke koble til søketjenesten. Prøv igjen.", "Couldn't reach the search service. Try again.")}</p>
            <button className="text-link mt-3" onClick={() => { setLoading(true); setError(false); setRetry((n) => n + 1); }}>{t("Prøv igjen", "Try again")}</button>
          </div>
        )}

        {showResults && !loading && !error && (page > 0 || hasMore) && <nav aria-label={t("Søkeresultatsider", "Search result pages")} className="flex max-w-[900px] items-center justify-between gap-4">
          <button className="text-link disabled:opacity-40" disabled={page === 0} onClick={() => { setLoading(true); setPage((n) => n - 1); }}>{t("Forrige treff", "Previous matches")}</button>
          <span className="text-sm">{t("Side", "Page")} {page + 1}</span>
          <button className="text-link disabled:opacity-40" disabled={!hasMore} onClick={() => { setLoading(true); setPage((n) => n + 1); }}>{t("Flere treff", "More matches")}</button>
        </nav>}

        {showQuickList && (
          <section className="max-w-[900px]">
            <div className="mb-3 flex items-end justify-between border-b border-gray-200 pb-3">
              <div>
                <p className="page-kicker">{t("Eksempler", "Examples")}</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">{t("Prøv en eksempeladresse", "Try an example address")}</h2>
              </div>
              <span className="text-xs text-gray-500">{t("Demodata", "Demo data")}</span>
            </div>
            <div className="panel overflow-hidden">
              {ADDRESSES.slice(0, 4).map((address, index) => (
                <PropertyRow
                  key={address.id}
                  address={address}
                  onClick={() => select(address.id, address)}
                  last={index === 3}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function PropertyRow({ address, onClick, last }: { address: Address; onClick: () => void; last: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${last ? "" : "border-b border-gray-100"}`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[5px] bg-green-50 text-green-500"><PinIcon /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900 md:text-[15px]">{address.street}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{address.postal} {address.city} · gnr {address.matrikkel.gnr}/{address.matrikkel.bnr}</div>
      </div>
      <ArrowIcon />
    </button>
  );
}

function SearchIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
}

function SpinnerIcon() {
  return <svg className="animate-spin" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>;
}

function PinIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
}

function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
