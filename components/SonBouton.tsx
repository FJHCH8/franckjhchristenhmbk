"use client";

import { useSyncExternalStore } from "react";
import { clic, reglerSons, sonsActifs } from "@/lib/sons";

function abonner(onChange: () => void) {
  window.addEventListener("fjch-sons", onChange);
  return () => window.removeEventListener("fjch-sons", onChange);
}

/** Petit interrupteur des sons d'interface, avec un égaliseur qui danse quand ils sont actifs. */
export function SonBouton() {
  const on = useSyncExternalStore(abonner, sonsActifs, () => false);
  return (
    <button
      type="button"
      className={on ? "son-bouton is-on" : "son-bouton"}
      aria-pressed={on}
      aria-label={on ? "Couper les sons" : "Activer les sons"}
      data-magnet=""
      onClick={() => {
        reglerSons(!on);
        if (!on) window.setTimeout(clic, 30);
      }}
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
