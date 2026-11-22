"use client";

import { useEffect, useSyncExternalStore } from "react";
import { reglerSons, reprendreAuPremierGeste, sonsActifs } from "@/lib/sons";

function abonner(onChange: () => void) {
  window.addEventListener("fjch-sons", onChange);
  return () => window.removeEventListener("fjch-sons", onChange);
}

/** Petit interrupteur des sons d'interface, avec un égaliseur qui danse quand ils sont actifs. */
export function SonBouton() {
  const on = useSyncExternalStore(abonner, sonsActifs, () => false);
  useEffect(() => reprendreAuPremierGeste(), []);
  return (
    <button
      type="button"
      className={on ? "son-bouton is-on" : "son-bouton"}
      aria-pressed={on}
      aria-label={on ? "Couper les sons" : "Activer les sons"}
      data-magnet=""
      onClick={() => reglerSons(!on)}
    >
      <span className="son-barres" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="son-texte">Son</span>
    </button>
  );
}
