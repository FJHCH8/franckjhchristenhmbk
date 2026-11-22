"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import { texteTavissiv } from "@/lib/tavissiv";

export type LocaleName = "fr" | "tavissiv";

export const LOCALE_KEY = "fjch-lang";

const LocaleContext = createContext<{
  locale: LocaleName;
  setLocale: (locale: LocaleName) => void;
}>({
  locale: "fr",
  setLocale: () => undefined,
});

function applyLocale(locale: LocaleName) {
  if (locale === "tavissiv") document.documentElement.dataset.locale = "tavissiv";
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
    // Anciens noms de la langue (lassavi, davissiv) : on garde le choix du visiteur.
    if (stored === "tavissiv" || stored === "lassavi" || stored === "davissiv") {
      if (stored !== "tavissiv") localStorage.setItem(LOCALE_KEY, "tavissiv");
      return "tavissiv";
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
  if (keep || locale !== "tavissiv") return text;
  return texteTavissiv(text);
}

/** Vrai si ce texte a une traduction en Tavissiv : elle s'écrit alors dans l'écriture Tavissiv. */
export function estTraduit(locale: LocaleName, francais: string) {
  return locale === "tavissiv" && texteTavissiv(francais) !== francais;
}

export function T({ children }: { children: string; width?: string }) {
  const { locale } = useLocale();
  if (!estTraduit(locale, children)) return <>{children}</>;
  return (
    <span className="tavissiv" lang="x-tavissiv">
      {texteTavissiv(children)}
    </span>
  );
}

export function Block({ children }: { lines?: string[]; children: ReactNode }) {
  return <>{children}</>;
}
