"use client";

import { createContext, useContext, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import { texteTavissiv } from "@/lib/tavissiv";
import { traduire, type LangueEtrangere } from "@/lib/traductions";

export type LocaleName = "fr" | "tavissiv" | LangueEtrangere;

export const estEtrangere = (l: LocaleName): l is LangueEtrangere => l === "de" || l === "sv" || l === "br";

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
  document.documentElement.lang = estEtrangere(locale) ? locale : "fr";
}

/*
 * Traducteur : en allemand, suédois ou breton, chaque texte affiché (et les étiquettes
 * aria-label, placeholder, title) passe par le dictionnaire. Le français d'origine est gardé
 * à côté, pour revenir au français ou changer de langue sans recharger.
 */
const ORIGINE = new WeakMap<Text, string>();
const POSE = new WeakMap<Text, string>();
const ATTRS = ["aria-label", "placeholder", "title"] as const;
const ORIGINE_ATTR = new WeakMap<Element, Record<string, [string, string]>>();
const EXCLU = "script,style,textarea,input,.tavissiv,.os,[translate=no]";

function versLangue(src: string, l: LocaleName) {
  return estEtrangere(l) ? traduire(src, l) : src;
}

function texte(n: Text, l: LocaleName) {
  if (n.parentElement?.closest(EXCLU)) return;
  const actuel = n.nodeValue ?? "";
  let src = ORIGINE.get(n);
  if (src === undefined || actuel !== POSE.get(n)) src = actuel;
  ORIGINE.set(n, src);
  const sortie = versLangue(src, l);
  POSE.set(n, sortie);
  if (sortie !== actuel) n.nodeValue = sortie;
}

function attributs(e: Element, l: LocaleName) {
  if (e.closest(EXCLU.replace("input,", "").replace("textarea,", ""))) return;
  let memo = ORIGINE_ATTR.get(e);
  for (const a of ATTRS) {
    const actuel = e.getAttribute(a);
    if (actuel === null) continue;
    memo ??= {};
    const m = memo[a];
    const src = m && m[1] === actuel ? m[0] : actuel;
    const sortie = versLangue(src, l);
    memo[a] = [src, sortie];
    if (sortie !== actuel) e.setAttribute(a, sortie);
  }
  if (memo) ORIGINE_ATTR.set(e, memo);
}

function parcourir(racine: Node, l: LocaleName) {
  if (racine.nodeType === Node.TEXT_NODE) return texte(racine as Text, l);
  if (racine.nodeType !== Node.ELEMENT_NODE) return;
  attributs(racine as Element, l);
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) texte(n as Text, l);
    else attributs(n as Element, l);
  }
}

function useTraducteur(locale: LocaleName) {
  useLayoutEffect(() => {
    parcourir(document.body, locale);
    if (!estEtrangere(locale)) return;
    const obs = new MutationObserver((liste) => {
      for (const m of liste) {
        if (m.type === "characterData") texte(m.target as Text, locale);
        else if (m.type === "attributes") attributs(m.target as Element, locale);
        else m.addedNodes.forEach((n) => parcourir(n, locale));
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => obs.disconnect();
  }, [locale]);
}

/** Pour les composants qui animent leur texte (décodage) : la langue est appliquée dès le départ. */
export function useTraduire() {
  const { locale } = useContext(LocaleContext);
  return (s: string) => versLangue(s, locale);
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
    if (stored === "de" || stored === "sv" || stored === "br") return stored;
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
  useTraducteur(locale);

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
