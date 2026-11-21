"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const SAUT = ".count, .count-barre, .nav, .title-dock, .edition-menu, .vent-toggle, .lang, .toggle";
const BLOCS = ".scroll-head h1, .endurreisen, .welcome, .epithet, .kicker, .rubrique-nom, .qui-line, .prose, .reserve dd, .reserve dt, .motto blockquote, .motto figcaption, .etoile-texte, time";
const TITRES = ".scroll-head h1, .endurreisen, .welcome, .epithet, .kicker, .rubrique-nom, time";
const BRUIT = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;!?-[]^/";

type Signe = { el: HTMLElement; c: string };
type Bloc = { el: HTMLElement; signes: Signe[]; debut: number; duree: number };

function reduit() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function aleatoire() {
  return BRUIT[(Math.random() * BRUIT.length) | 0] ?? "a";
}

function cesar(signe: string, decalage: number) {
  const base = signe.normalize("NFD").replace(/\p{M}/gu, "");
  const code = base.codePointAt(0) ?? 0;
  const pas = ((decalage % 26) + 26) % 26;
  if (code >= 97 && code <= 122) return String.fromCharCode(97 + ((code - 97 + pas) % 26));
  if (code >= 65 && code <= 90) return String.fromCharCode(65 + ((code - 65 + pas) % 26));
  if (code >= 48 && code <= 57) return String.fromCharCode(48 + ((code - 48 + (decalage % 10)) % 10));
  return aleatoire();
}

function dureeDe(el: HTMLElement, nombre: number) {
  if (el.matches(TITRES)) return Math.min(1200, 620 + nombre * 18);
  return Math.min(2500, 1500 + nombre * 3);
}

function decouper(el: HTMLElement) {
  if (el.closest(SAUT) || el.dataset.hack === "1") return;
  if (el.closest("a, button") && !el.matches("time, .rubrique-nom")) return;
  if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.innerText);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const noeuds: Text[] = [];
  let courant = walker.nextNode();
  while (courant) {
    if ((courant.nodeValue ?? "").length && !courant.parentElement?.closest(".hack-signe")) noeuds.push(courant as Text);
    courant = walker.nextNode();
  }
  const signes: Signe[] = [];
  for (const noeud of noeuds) {
    const fragment = document.createDocumentFragment();
    for (const morceau of (noeud.nodeValue ?? "").split(/(\s+)/)) {
      if (!morceau) continue;
      if (!morceau.trim()) {
        fragment.append(morceau);
        continue;
      }
      const mot = document.createElement("span");
      mot.className = "hack-mot";
      for (const signe of morceau) {
        const span = document.createElement("span");
        span.className = "hack-signe";
        span.dataset.c = signe;
        span.textContent = aleatoire();
        span.style.opacity = "0.34";
        mot.append(span);
        signes.push({ el: span, c: signe });
      }
      fragment.append(mot);
    }
    noeud.parentNode?.replaceChild(fragment, noeud);
  }
  if (!signes.length) return;
  el.dataset.hack = "1";
  const largeur = signes.find((signe) => signe.c.trim())?.el.getBoundingClientRect().width ?? 0;
  if (largeur > 0) {
    for (const signe of signes) {
      if (signe.c.trim()) signe.el.style.width = `${largeur}px`;
    }
  }
  return { el, signes, debut: 0, duree: dureeDe(el, signes.filter((signe) => signe.c.trim()).length) };
}

export function Recit() {
  const chemin = usePathname();

  useLayoutEffect(() => {
    if (reduit()) return;
    const blocs: Bloc[] = [];
    let cadre = 0;
    let attente = 0;

    const peindre = (now: number) => {
      cadre = 0;
      let vivant = false;
      for (const bloc of blocs) {
        if (!bloc.debut) continue;
        const t = Math.min(1, (now - bloc.debut) / bloc.duree);
        const front = t * bloc.signes.length;
        for (let i = 0; i < bloc.signes.length; i += 1) {
          const signe = bloc.signes[i];
          if (!signe || !signe.c.trim()) continue;
          const distance = i - front;
          let texte = signe.c;
          let opacite = "1";
          if (distance >= 5) {
            texte = aleatoire();
            opacite = "0.34";
          } else if (distance >= 0.65) {
            texte = cesar(signe.c, Math.max(2, Math.round(distance)));
            opacite = "0.5";
          } else if (distance >= -0.15) {
            texte = cesar(signe.c, 1);
            opacite = "0.8";
          }
          if (signe.el.textContent !== texte) signe.el.textContent = texte;
          if (signe.el.style.opacity !== opacite) signe.el.style.opacity = opacite;
        }
        if (t < 1) vivant = true;
        else {
          for (const signe of bloc.signes) {
            signe.el.textContent = signe.c;
            signe.el.style.opacity = "1";
          }
          bloc.debut = 0;
        }
      }
      if (vivant) cadre = window.requestAnimationFrame(peindre);
    };

    const lancer = (bloc: Bloc) => {
      if (bloc.debut) return;
      bloc.debut = performance.now();
      if (!cadre) cadre = window.requestAnimationFrame(peindre);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const bloc = blocs.find((item) => item.el === entry.target);
          if (!bloc) continue;
          observer.unobserve(entry.target);
          lancer(bloc);
        }
      },
      { threshold: 0.28 },
    );

    const brancher = () => {
      document.querySelectorAll<HTMLElement>(BLOCS).forEach((el) => {
        const bloc = decouper(el);
        if (!bloc) return;
        blocs.push(bloc);
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) lancer(bloc);
        else observer.observe(el);
      });
    };

    const plusTard = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(brancher, 50);
    };

    const copier = (event: ClipboardEvent) => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      const plage = selection.getRangeAt(0);
      const hote = plage.commonAncestorContainer instanceof Element ? plage.commonAncestorContainer : plage.commonAncestorContainer.parentElement;
      if (!hote?.closest("[data-hack='1']") && !hote?.querySelector(".hack-signe")) return;
      const clone = plage.cloneContents();
      clone.querySelectorAll<HTMLElement>(".hack-signe").forEach((el) => {
        el.textContent = el.dataset.c ?? "";
      });
      event.clipboardData?.setData("text/plain", clone.textContent ?? "");
      event.preventDefault();
    };

    brancher();
    document.fonts?.ready.then(() => {
      for (const bloc of blocs) {
        for (const signe of bloc.signes) {
          if (!signe.c.trim()) continue;
          const courant = signe.el.textContent;
          signe.el.textContent = signe.c;
          signe.el.style.width = "";
          const largeur = signe.el.getBoundingClientRect().width;
          if (largeur > 0) signe.el.style.width = `${largeur}px`;
          if (courant != null) signe.el.textContent = courant;
        }
      }
    }).catch(() => undefined);
    const mutations = new MutationObserver((records) => {
      const interne = records.every((record) => {
        const cible = record.target instanceof Element ? record.target : record.target.parentElement;
        return Boolean(cible?.closest(".hack-signe"));
      });
      if (!interne) plusTard();
    });
    const racine = document.getElementById("contenu");
    if (racine) mutations.observe(racine, { childList: true, subtree: true });
    document.addEventListener("copy", copier);
    return () => {
      window.clearTimeout(attente);
      if (cadre) window.cancelAnimationFrame(cadre);
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("copy", copier);
    };
  }, [chemin]);

  return null;
}
