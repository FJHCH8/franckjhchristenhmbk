/**
 * La mémoire du téléphone : tout ce que fait le visiteur reste dans sessionStorage
 * jusqu'à « Réinitialiser le téléphone » ou la fermeture de la page.
 */
import { useSyncExternalStore } from "react";

const PREFIXE = "aakanos-m:";

export function lireSession<T>(cle: string): T | null {
  try {
    const b = sessionStorage.getItem(PREFIXE + cle);
    return b ? (JSON.parse(b) as T) : null;
  } catch {
    return null;
  }
}
export function ecrireSession(cle: string, v: unknown) {
  try {
    sessionStorage.setItem(PREFIXE + cle, JSON.stringify(v));
  } catch {}
}

/** Un petit magasin partagé entre les applis, gardé dans la session. */
export function creerStore<T>(cle: string, init: T) {
  let val = init;
  let charge = false;
  const abonnes = new Set<() => void>();
  const charger = () => {
    if (charge || typeof window === "undefined") return;
    charge = true;
    const lu = lireSession<T>(cle);
    if (lu !== null) val = lu;
  };
  const lire = () => {
    charger();
    return val;
  };
  const ecrire = (f: T | ((x: T) => T)) => {
    charger();
    val = typeof f === "function" ? (f as (x: T) => T)(val) : f;
    ecrireSession(cle, val);
    abonnes.forEach((a) => a());
  };
  const abonner = (cb: () => void) => {
    abonnes.add(cb);
    return () => {
      abonnes.delete(cb);
    };
  };
  const useValeur = () => useSyncExternalStore(abonner, lire, () => init);
  return { lire, ecrire, useValeur, abonner };
}

