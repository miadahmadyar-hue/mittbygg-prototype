"use client";

import { useLang, type Lang } from "@/lib/i18n/context";

/** Compact NO | EN segmented switch. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div
      className={`inline-flex items-center rounded-[5px] border border-gray-200 bg-gray-50 p-0.5 text-[11px] font-bold ${className}`}
      role="group"
      aria-label="Språk / Language"
    >
      {(["no", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-[3px] px-2 py-1 transition-colors ${
            lang === l
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {l === "no" ? "NO" : "EN"}
        </button>
      ))}
    </div>
  );
}
