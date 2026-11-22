"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import { texteDavissiv } from "@/lib/davissiv";

export type LocaleName = "fr" | "davissiv";

export const LOCALE_KEY = "fjch-lang";

const LocaleContext = createContext<{
  locale: LocaleName;
  setLocale: (locale: LocaleName) => void;
}>({
  locale: "fr",
  setLocale: () => undefined,
});

function applyLocale(locale: LocaleName) {
  if (locale === "davissiv") document.documentElement.dataset.locale = "davissiv";
  else delete document.documentElement.dataset.locale;
}

function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("fjch-lang", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("fjch-lang", onStoreChange);
  };
}

function readLocale(): LocaleName {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "davissiv" || stored === "lassavi") {
      if (stored === "lassavi") localStorage.setItem(LOCALE_KEY, "davissiv");
      return "davissiv";
    }
    return "fr";
  } catch {
    return "fr";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "fr" as LocaleName);

  useLayoutEffect(() => {
    applyLocale(locale);
  }, [locale]);

  const setLocale = (next: LocaleName) => {
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* private mode */
    }
    applyLocale(next);
    window.dispatchEvent(new Event("fjch-lang"));
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function titleLabel(locale: LocaleName, text: string, keep = false) {
  if (keep || locale !== "davissiv") return text;
  return texteDavissiv(text);
}

/** Vrai si ce texte a une traduction en Davissis : elle s'écrit alors dans l'écriture Davissis. */
export function estTraduit(locale: LocaleName, francais: string) {
  return locale === "davissiv" && texteDavissiv(francais) !== francais;
}

export function T({ children }: { children: string; width?: string }) {
  const { locale } = useLocale();
  if (!estTraduit(locale, children)) return <>{children}</>;
  return (
    <span className="davissis" lang="x-davissis">
      {texteDavissiv(children)}
    </span>
  );
}

export function Block({ children }: { lines?: string[]; children: ReactNode }) {
  return <>{children}</>;
}
