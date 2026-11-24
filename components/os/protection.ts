/**
 * Rien du téléphone ne se télécharge : pas de menu « Enregistrer l'image / la vidéo / le lien » (clic droit
 * ou appui long), pas de glisser-déposer d'une image vers le bureau, pas de Ctrl/Cmd+S sur la page AakanOS.
 * Les champs de saisie gardent leur menu (copier-coller).
 */
import { useEffect } from "react";

const saisie = (t: EventTarget | null) => t instanceof Element && !!t.closest("input, textarea, [contenteditable=true]");

export function useProtectionTelechargement() {
  useEffect(() => {
    const menu = (e: Event) => {
      if (!saisie(e.target)) e.preventDefault();
    };
    const glisser = (e: DragEvent) => {
      if (!saisie(e.target)) e.preventDefault();
    };
    const clavier = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) e.preventDefault();
    };
    document.addEventListener("contextmenu", menu, true);
    document.addEventListener("dragstart", glisser, true);
    window.addEventListener("keydown", clavier, true);
    return () => {
      document.removeEventListener("contextmenu", menu, true);
      document.removeEventListener("dragstart", glisser, true);
      window.removeEventListener("keydown", clavier, true);
    };
  }, []);
}
