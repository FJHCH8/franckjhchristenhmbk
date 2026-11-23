"use client";

import { useEffect } from "react";

/**
 * L'onde Material : à chaque appui sur un bouton ou un lien, un cercle de lumière part du doigt
 * et s'étale en s'effaçant. Un seul écouteur pour tout le site, rien n'est calculé au repos.
 */
export function Onde() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const appui = (e: PointerEvent) => {
      const cible = (e.target as Element | null)?.closest<HTMLElement>(
        "button, a, [role='button'], .gt-bande",
      );
      if (!cible || cible.closest("[data-sans-onde], .stories, .jeu-plateau")) return;
      const r = cible.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) return;
      const taille = Math.max(r.width, r.height) * 2.2;
      const onde = document.createElement("span");
      onde.className = "onde";
      onde.style.cssText = `width:${taille}px;height:${taille}px;left:${e.clientX - r.left - taille / 2}px;top:${e.clientY - r.top - taille / 2}px`;
      if (getComputedStyle(cible).position === "static") cible.style.position = "relative";
      cible.classList.add("a-onde");
      cible.appendChild(onde);
      onde.addEventListener("animationend", () => onde.remove(), { once: true });
    };
    window.addEventListener("pointerdown", appui, { passive: true });
    return () => window.removeEventListener("pointerdown", appui);
  }, []);
  return null;
}
