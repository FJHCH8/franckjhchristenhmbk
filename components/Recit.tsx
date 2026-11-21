"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SAUT = ".count, .count-barre, .nav, .title-dock, .edition-menu, .info-bubble, .vent-toggle, .lang, .toggle, .flip";
const LETTRES = ".scroll-head h1, .endurreisen, .welcome, .epithet";
const MOTS = ".kicker, .rubrique-nom, .motto blockquote, .motto figcaption, .etoile-texte, .prose, .reserve dt";
const LIGNES = ".reserve dd, .contact-links a span";
const CHAPITRES = ".hero .motto-glass, .page-solo .glass, .qui-note, .rubrique";

function reduit() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function timelineNative() {
  return typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()");
}

function visible(el: Element) {
  const box = el.getBoundingClientRect();
  return box.top < window.innerHeight * 0.92 && box.bottom > 40;
}

function poser(el: HTMLElement, mode: "lettre" | "mot") {
  if (el.closest(SAUT)) return;
  if (el.dataset.kin === mode && el.querySelector(mode === "lettre" ? ".kin-lettre" : ".kin-mot")) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const noeuds: Text[] = [];
  let courant = walker.nextNode();
  while (courant) {
    const texte = courant.nodeValue ?? "";
    if (texte.trim() && !(courant.parentElement?.closest("[data-kin]"))) noeuds.push(courant as Text);
    courant = walker.nextNode();
  }
  if (!noeuds.length) return;
  let index = 0;
  for (const noeud of noeuds) {
    const fragment = document.createDocumentFragment();
    const morceaux = (noeud.nodeValue ?? "").split(/(\s+)/);
    for (const morceau of morceaux) {
      if (!morceau) continue;
      if (!morceau.trim()) {
        fragment.append(morceau);
        continue;
      }
      if (mode === "mot") {
        const span = document.createElement("span");
        span.className = "kin-mot";
        span.style.setProperty("--i", String(index));
        span.textContent = morceau;
        fragment.append(span);
        index += 1;
        continue;
      }
      const groupe = document.createElement("span");
      groupe.className = "kin-groupe";
      for (const signe of morceau) {
        const span = document.createElement("span");
        span.className = "kin-lettre";
        span.style.setProperty("--i", String(index));
        span.textContent = signe;
        groupe.append(span);
        index += 1;
      }
      fragment.append(groupe);
    }
    noeud.parentNode?.replaceChild(fragment, noeud);
  }
  el.dataset.kin = mode;
  el.classList.add("kin-suivi");
  if (visible(el)) el.classList.add("is-revele");
}

function lignes() {
  document.querySelectorAll<HTMLElement>(LIGNES).forEach((el) => {
    if (el.closest(SAUT) || el.dataset.kin) return;
    el.dataset.kin = "ligne";
    el.classList.add("kin-ligne");
    if (visible(el)) el.classList.add("is-revele");
  });
}

function chapitres() {
  document.querySelectorAll<HTMLElement>(CHAPITRES).forEach((el) => {
    el.classList.add("recit-chapitre");
    if (!timelineNative() && visible(el)) el.classList.add("is-chapitre");
  });
}

function preparer() {
  document.querySelectorAll<HTMLElement>(LETTRES).forEach((el) => poser(el, "lettre"));
  document.querySelectorAll<HTMLElement>(MOTS).forEach((el) => poser(el, "mot"));
  lignes();
  chapitres();
  document.querySelectorAll<HTMLElement>(".kin-suivi.is-revele, .kin-ligne.is-revele").forEach((el) => {
    el.closest(".scroll-head")?.classList.add("is-revele");
  });
}

export function Recit() {
  const chemin = usePathname();

  useEffect(() => {
    if (reduit()) return;
    let cadre = 0;
    let attente = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          if (el.classList.contains("recit-chapitre")) {
            if (!timelineNative()) el.classList.add("is-chapitre");
          } else el.classList.add("is-revele");
          el.closest(".scroll-head")?.classList.add("is-revele");
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
    );

    const brancher = () => {
      preparer();
      const cibles = ".kin-suivi:not(.is-revele), .kin-ligne:not(.is-revele)" + (timelineNative() ? "" : ", .recit-chapitre:not(.is-chapitre)");
      document.querySelectorAll<HTMLElement>(cibles).forEach((el) => {
        observer.observe(el);
      });
    };

    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(brancher, 40);
    };

    const suivre = () => {
      if (cadre) return;
      cadre = window.requestAnimationFrame(() => {
        cadre = 0;
        const vue = window.innerHeight || 1;
        document.querySelectorAll<HTMLElement>(".kin-suivi").forEach((el) => {
          const box = el.getBoundingClientRect();
          const valeur = 1 - (box.top + box.height * 0.45) / (vue + box.height);
          el.style.setProperty("--kin", String(Math.max(0, Math.min(1, valeur)).toFixed(3)));
        });
      });
    };

    brancher();
    suivre();
    const mutations = new MutationObserver(plusTard);
    const racine = document.getElementById("contenu");
    if (racine) mutations.observe(racine, { childList: true, subtree: true });
    window.addEventListener("scroll", suivre, { passive: true });
    return () => {
      window.clearTimeout(attente);
      if (cadre) window.cancelAnimationFrame(cadre);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", suivre);
    };
  }, [chemin]);

  return null;
}
