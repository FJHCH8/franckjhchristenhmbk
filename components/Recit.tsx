"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const SAUT = ".count, .count-barre, .nav, .title-dock, .edition-menu, .vent-toggle, .lang, .toggle, .flip";
const TITRES = ".scroll-head h1, .endurreisen, .welcome, .epithet, .kicker, .rubrique-nom";
const PARAGRAPHES = ".qui-line, .prose, .reserve dd, .motto blockquote, .motto figcaption, .etoile-texte";

function reduit() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mots(el: HTMLElement) {
  if (el.closest(`${SAUT}, a, button`) || el.closest(TITRES)) return;
  if (el.dataset.veille === "mots" && el.querySelector(".veille-mot")) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const noeuds: Text[] = [];
  let courant = walker.nextNode();
  while (courant) {
    if ((courant.nodeValue ?? "").trim() && !courant.parentElement?.closest(".veille-mot")) noeuds.push(courant as Text);
    courant = walker.nextNode();
  }
  if (!noeuds.length) return;
  for (const noeud of noeuds) {
    const fragment = document.createDocumentFragment();
    for (const morceau of (noeud.nodeValue ?? "").split(/(\s+)/)) {
      if (!morceau) continue;
      if (!morceau.trim()) {
        fragment.append(morceau);
        continue;
      }
      const span = document.createElement("span");
      span.className = "veille-mot";
      span.textContent = morceau;
      fragment.append(span);
    }
    noeud.parentNode?.replaceChild(fragment, noeud);
  }
  el.dataset.veille = "mots";
}

function preparer() {
  document.querySelectorAll<HTMLElement>(TITRES).forEach((el) => {
    if (el.closest(SAUT) || el.dataset.veille === "titre") return;
    el.dataset.veille = "titre";
    el.classList.add("veille-titre");
  });
  document.querySelectorAll<HTMLElement>(PARAGRAPHES).forEach(mots);
}

export function Recit() {
  const chemin = usePathname();

  useLayoutEffect(() => {
    if (reduit()) return;
    let cadre = 0;
    let attente = 0;
    let noeuds: HTMLElement[] = [];

    const allumer = () => {
      const ligne = (window.innerHeight || 1) * 0.46;
      const largeur = window.innerWidth || 1;
      for (const el of noeuds) {
        if (!el.isConnected) continue;
        const box = el.getBoundingClientRect();
        const decalage = el.classList.contains("veille-mot") ? (box.left / largeur) * 36 : 0;
        const passe = box.top + box.height * 0.5 < ligne - decalage;
        if (passe !== el.classList.contains("is-allume")) el.classList.toggle("is-allume", passe);
      }
    };

    const suivre = () => {
      if (cadre) return;
      cadre = window.requestAnimationFrame(() => {
        cadre = 0;
        allumer();
      });
    };

    const brancher = () => {
      preparer();
      noeuds = [...document.querySelectorAll<HTMLElement>(".veille-mot, .veille-titre")];
      allumer();
    };

    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(brancher, 40);
    };

    brancher();
    const mutations = new MutationObserver(plusTard);
    const racine = document.getElementById("contenu");
    if (racine) mutations.observe(racine, { childList: true, subtree: true });
    window.addEventListener("scroll", suivre, { passive: true });
    window.addEventListener("resize", suivre);
    return () => {
      window.clearTimeout(attente);
      if (cadre) window.cancelAnimationFrame(cadre);
      mutations.disconnect();
      window.removeEventListener("scroll", suivre);
      window.removeEventListener("resize", suivre);
    };
  }, [chemin]);

  return null;
}
