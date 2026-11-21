"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const SAUT = ".count, .count-barre, .nav, .title-dock, .edition-menu, .vent-toggle, .lang, .toggle, .flip";
const TITRES = ".scroll-head h1, .endurreisen, .welcome, .epithet, .kicker, .rubrique-nom";
const PARAGRAPHES = ".qui-line, .prose, .reserve dd, .motto blockquote, .motto figcaption, .etoile-texte";
const GLYPHES = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]^";

function reduit() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mots(el: HTMLElement) {
  if (el.closest(`${SAUT}, a, button`)) return;
  if (el.closest(TITRES)) return;
  if (el.dataset.veille === "mots" && el.querySelector(".veille-mot")) return;
  if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.innerText);
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
      const mot = document.createElement("span");
      mot.className = "veille-mot";
      for (const signe of morceau) {
        const span = document.createElement("span");
        span.className = "veille-signe";
        span.dataset.c = signe;
        span.textContent = signe;
        mot.append(span);
      }
      fragment.append(mot);
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

function liste() {
  return [...document.querySelectorAll<HTMLElement>(".veille-mot, .veille-titre")];
}

function figer() {
  document.querySelectorAll<HTMLElement>(".veille-signe:not([data-fige])").forEach((el) => {
    const largeur = el.getBoundingClientRect().width;
    if (largeur <= 0) return;
    el.style.width = `${largeur}px`;
    el.dataset.fige = "1";
  });
}

function glyphe() {
  return GLYPHES[(Math.random() * GLYPHES.length) | 0] ?? "a";
}

export function Recit() {
  const chemin = usePathname();

  useLayoutEffect(() => {
    if (reduit()) return;
    let cadre = 0;
    let attente = 0;
    let noeuds = liste();
    let doigt: { x: number; y: number } | null = null;
    let actifs = new Set<HTMLElement>();

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

    const restaurer = (el: HTMLElement) => {
      el.textContent = el.dataset.c ?? "";
    };

    const brouiller = () => {
      if (!doigt) {
        for (const el of actifs) restaurer(el);
        actifs = new Set();
        return;
      }
      const { x, y } = doigt;
      let rx = 150;
      let ry = 54;
      const sous = document.elementsFromPoint(x, y).find((noeud) => noeud instanceof HTMLElement && noeud.classList.contains("veille-signe"));
      if (sous instanceof HTMLElement) {
        const style = getComputedStyle(sous);
        const interligne = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.5;
        const chasse = sous.getBoundingClientRect().width || Number.parseFloat(style.fontSize) * 0.55;
        rx = Math.max(chasse * 9, 96);
        ry = interligne * 1.85;
      }
      const suivants = new Set<HTMLElement>();
      for (let ligne = 0; ligne < 7; ligne += 1) {
        for (let colonne = 0; colonne < 9; colonne += 1) {
          const px = x + (colonne / 8 - 0.5) * rx * 2;
          const py = y + (ligne / 6 - 0.5) * ry * 2;
          const nx = (px - x) / rx;
          const ny = (py - y) / ry;
          if (nx * nx + ny * ny > 1) continue;
          for (const noeud of document.elementsFromPoint(px, py)) {
            if (noeud instanceof HTMLElement && noeud.classList.contains("veille-signe") && (noeud.dataset.c ?? "").trim()) suivants.add(noeud);
          }
        }
      }
      for (const el of actifs) if (!suivants.has(el)) restaurer(el);
      for (const el of suivants) el.textContent = glyphe();
      actifs = suivants;
    };

    const suivre = () => {
      if (cadre) return;
      cadre = window.requestAnimationFrame(() => {
        cadre = 0;
        allumer();
        brouiller();
      });
    };

    const brancher = () => {
      preparer();
      figer();
      noeuds = liste();
      allumer();
    };

    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(brancher, 40);
    };

    const copier = (event: ClipboardEvent) => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      const plage = selection.getRangeAt(0);
      const hote = plage.commonAncestorContainer instanceof Element ? plage.commonAncestorContainer : plage.commonAncestorContainer.parentElement;
      if (!hote?.closest("[data-veille='mots']") && !hote?.querySelector(".veille-signe")) return;
      const clone = plage.cloneContents();
      clone.querySelectorAll<HTMLElement>(".veille-signe").forEach((el) => {
        el.textContent = el.dataset.c ?? "";
      });
      event.clipboardData?.setData("text/plain", clone.textContent ?? "");
      event.preventDefault();
    };

    const suivrePointeur = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      doigt = { x: event.clientX, y: event.clientY };
      suivre();
    };
    const suivreDoigt = (event: TouchEvent) => {
      const touche = event.touches[0];
      if (!touche) return;
      doigt = { x: touche.clientX, y: touche.clientY };
      suivre();
    };
    const lacher = () => {
      doigt = null;
      suivre();
    };

    brancher();
    document.fonts?.ready.then(() => {
      document.querySelectorAll<HTMLElement>(".veille-signe").forEach((el) => {
        el.textContent = el.dataset.c ?? "";
        el.style.width = "";
        delete el.dataset.fige;
      });
      figer();
    }).catch(() => undefined);
    const mutations = new MutationObserver((records) => {
      const interne = records.every((record) => {
        const cible = record.target instanceof Element ? record.target : record.target.parentElement;
        return Boolean(cible?.closest(".veille-signe"));
      });
      if (!interne) plusTard();
    });
    const racine = document.getElementById("contenu");
    if (racine) mutations.observe(racine, { childList: true, subtree: true });
    window.addEventListener("scroll", suivre, { passive: true });
    window.addEventListener("resize", suivre);
    window.addEventListener("pointermove", suivrePointeur, { passive: true });
    window.addEventListener("pointerleave", lacher);
    window.addEventListener("touchstart", suivreDoigt, { passive: true });
    window.addEventListener("touchmove", suivreDoigt, { passive: true });
    window.addEventListener("touchend", lacher, { passive: true });
    window.addEventListener("touchcancel", lacher, { passive: true });
    document.addEventListener("copy", copier);
    return () => {
      window.clearTimeout(attente);
      if (cadre) window.cancelAnimationFrame(cadre);
      for (const el of actifs) restaurer(el);
      mutations.disconnect();
      window.removeEventListener("scroll", suivre);
      window.removeEventListener("resize", suivre);
      window.removeEventListener("pointermove", suivrePointeur);
      window.removeEventListener("pointerleave", lacher);
      window.removeEventListener("touchstart", suivreDoigt);
      window.removeEventListener("touchmove", suivreDoigt);
      window.removeEventListener("touchend", lacher);
      window.removeEventListener("touchcancel", lacher);
      document.removeEventListener("copy", copier);
    };
  }, [chemin]);

  return null;
}
