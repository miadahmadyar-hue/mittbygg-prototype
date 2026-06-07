"use client";

/**
 * Lightweight in-house i18n for the prototype.
 *
 * Usage:
 *   const t = useT();
 *   <h1>{t("Velg adresse", "Choose address")}</h1>
 *
 * We pass both strings inline rather than using a key/dictionary file. For a
 * prototype this keeps the Norwegian readable in place and avoids a giant
 * lookup table getting out of sync. Default language is Norwegian; the choice
 * is persisted to localStorage so a demo doesn't reset between screens.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "no" | "en";

const STORAGE_KEY = "mittbygg_lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<LangCtx>({
  lang: "no",
  setLang: () => {},
  toggle: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  // Always render "no" on the server and first client paint to avoid a
  // hydration mismatch; flip to the stored choice once mounted.
  const [lang, setLangState] = useState<Lang>("no");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of the persisted choice after mount
    if (stored === "en" || stored === "no") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore private-mode write failures */
    }
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "no" ? "en" : "no"),
    [lang, setLang],
  );

  return <Ctx.Provider value={{ lang, setLang, toggle }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

/** Returns a translator: t(norsk, english) → string for the active language. */
export function useT() {
  const { lang } = useContext(Ctx);
  return useCallback((no: string, en: string) => (lang === "en" ? en : no), [lang]);
}
