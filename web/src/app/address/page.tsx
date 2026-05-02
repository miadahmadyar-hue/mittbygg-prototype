"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { ADDRESSES, searchAddresses, type Address } from "@/lib/data/addresses";

export default function AddressPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => searchAddresses(query), [query]);
  const showSuggestions = query.trim().length >= 2;
  const showQuickList = query.trim().length === 0;

  const select = (id: string) => router.push(`/property/${id}`);

  return (
    <>
      <Topbar
        title=""
        right={
          <div className="w-9 h-9 rounded-full bg-green-500 text-white grid place-items-center font-bold text-sm">
            D
          </div>
        }
      />
      <div className="view">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.025em] leading-[1.1]">
            Hvilken eiendom?
          </h1>
          <p className="mt-2 text-[17px] text-gray-700 leading-snug">
            Søk etter adresse, postnummer eller gnr/bnr.
          </p>
        </div>

        <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-xl px-4 py-3.5 gap-3 mt-2 focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_var(--color-green-50)] transition">
          <span className="text-gray-400 shrink-0">
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="f.eks. Solbakken 12"
            autoComplete="off"
            autoFocus
            className="flex-1 bg-transparent outline-none text-base"
          />
        </div>

        {showSuggestions && matches.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {matches.map((a, i) => (
              <SuggestionRow
                key={a.id}
                address={a}
                onClick={() => select(a.id)}
                last={i === matches.length - 1}
              />
            ))}
          </div>
        )}

        {showSuggestions && matches.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Ingen treff. Prøv en annen adresse.
          </p>
        )}

        {showQuickList && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mt-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Forslag
            </h4>
            {ADDRESSES.slice(0, 4).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => select(a.id)}
                className="flex items-center gap-3 w-full py-2 border-b border-gray-100 last:border-b-0 text-left cursor-pointer"
              >
                <span className="text-gray-400">
                  <PinIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{a.street}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {a.postal} {a.city}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SuggestionRow({
  address,
  onClick,
  last,
}: {
  address: Address;
  onClick: () => void;
  last: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-green-50 text-green-500 grid place-items-center shrink-0">
        <PinIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">
          {address.street}
        </div>
        <div className="text-[13px] text-gray-500 truncate">
          {address.postal} {address.city} · gnr {address.matrikkel.gnr}/
          {address.matrikkel.bnr}
        </div>
      </div>
      <span className="text-gray-400 shrink-0">
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

function PinIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
