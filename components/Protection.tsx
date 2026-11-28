"use client";

/**
 * Protège le contenu du site : pas de clic droit, pas de copie, pas de glisser-déposer
 * d'images ou de textes, pas de sélection (les champs à remplir restent utilisables).
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
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "u" || k === "p" || ((k === "a" || k === "c") && !champ(e.target)))) e.preventDefault();
    };
    const evts = ["contextmenu", "copy", "cut", "dragstart", "selectstart"] as const;
    evts.forEach((n) => document.addEventListener(n, bloque));
    document.addEventListener("keydown", touches);
    return () => {
      evts.forEach((n) => document.removeEventListener(n, bloque));
      document.removeEventListener("keydown", touches);
    };
  }, []);
  return null;
}
