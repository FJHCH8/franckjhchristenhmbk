"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";

export type LocaleName = "fr" | "lassavi";

export const LOCALE_KEY = "fjch-lang";

const LASSAVI: Record<string, string> = {
  Accueil: "Hovaksa",
  "Qui suis-je": "Sihama",
  "À propos": "Asova",
  Contact: "Ispam",
};

const LocaleContext = createContext<{
  locale: LocaleName;
  setLocale: (locale: LocaleName) => void;
}>({
  locale: "fr",
  setLocale: () => undefined,
});

function applyLocale(locale: LocaleName) {
  if (locale === "lassavi") document.documentElement.dataset.locale = "lassavi";
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
    return localStorage.getItem(LOCALE_KEY) === "lassavi" ? "lassavi" : "fr";
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
  if (keep || locale !== "lassavi") return text;
  return LASSAVI[text] ?? null;
}

export function T({ children, width }: { children: string; width?: string }) {
  const { locale } = useLocale();
  if (locale !== "lassavi") return <>{children}</>;
  const word = LASSAVI[children];
  if (word) return <>{word}</>;
  const size = width ?? `${Math.max(2.2, Math.min(16, children.length * 0.5))}em`;
  return <span className="skel" style={{ width: size }} aria-hidden="true" />;
}

export function Block({ lines, children }: { lines: string[]; children: ReactNode }) {
  const { locale } = useLocale();
  if (locale !== "lassavi") return <>{children}</>;
  return (
    <span className="skel-stack" aria-hidden="true">
      {lines.map((width, index) => (
        <span key={`${width}-${index}`} className="skel" style={{ width }} />
      ))}
    </span>
  );
}
