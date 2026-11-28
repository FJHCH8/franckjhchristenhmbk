"use client";

/**
 * Protège le contenu du site : pas de clic droit, pas de copie, pas de glisser-déposer
 * d'images ou de textes, pas de sélection (les champs à remplir restent utilisables),
 * et pas de zoom : ni avec deux doigts, ni par double tape, ni avec Ctrl + molette / Ctrl + +.
 */
import { useEffect } from "react";
import "@/app/protection.css";

const champ = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']");

export function Protection() {
  useEffect(() => {
    const bloque = (e: Event) => {
      if (!champ(e.target)) e.preventDefault();
    };
    const touches = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S (enregistrer), U (code source), P (imprimer), A et C hors des champs
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "+" || k === "=" || k === "-" || k === "0")) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "u" || k === "p" || ((k === "a" || k === "c") && !champ(e.target)))) e.preventDefault();
    };
    const evts = ["contextmenu", "copy", "cut", "dragstart", "selectstart"] as const;
    evts.forEach((n) => document.addEventListener(n, bloque));
    document.addEventListener("keydown", touches);
    // le zoom : Safari ignore « user-scalable=no », on l'arrête à la main
    const geste = (e: Event) => e.preventDefault();
    const deuxDoigts = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    let derniereTouche = 0;
    const doubleTape = (e: TouchEvent) => {
      const n = Date.now();
      if (n - derniereTouche < 320 && !champ(e.target)) e.preventDefault();
      derniereTouche = n;
    };
    const molette = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    document.addEventListener("gesturestart", geste, { passive: false });
    document.addEventListener("gesturechange", geste, { passive: false });
    document.addEventListener("touchmove", deuxDoigts, { passive: false });
    document.addEventListener("touchend", doubleTape, { passive: false });
    window.addEventListener("wheel", molette, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", geste);
      document.removeEventListener("gesturechange", geste);
      document.removeEventListener("touchmove", deuxDoigts);
      document.removeEventListener("touchend", doubleTape);
      window.removeEventListener("wheel", molette);
      evts.forEach((n) => document.removeEventListener(n, bloque));
      document.removeEventListener("keydown", touches);
    };
  }, []);
  return null;
}
