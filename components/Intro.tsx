"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const RECIT = ["Bienvenue", "Polymathe", "Franck J.H. Christen"];
const DUREE = 2600;

/**
 * Ouverture du site, une fois par session : trois mots se succèdent pendant que le
 * compteur monte, puis le rideau se lève sur la page. Le script de démarrage décide
 * avant l'affichage s'il faut la jouer (classe intro-joue) ou non (intro-vue).
 */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const node = ref.current;
    if (!node) return;
    if (!root.classList.contains("intro-joue")) {
      node.remove();
      return;
    }
    const compte = node.querySelector<HTMLElement>(".intro-compte");
    const lignes = [...node.querySelectorAll<HTMLElement>(".intro-mot")];
    const start = performance.now();
    let frame = 0;
    let fin = 0;
    let phase = -1;
    const ease = (t: number) => 1 - (1 - t) ** 3;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DUREE);
      const value = Math.round(ease(t) * 100);
      if (compte) compte.textContent = String(value).padStart(3, "0");
      node.style.setProperty("--intro-p", ease(t).toFixed(4));
      const next = Math.min(RECIT.length - 1, Math.floor(t * RECIT.length));
      if (next !== phase) {
        lignes.forEach((ligne, index) => {
          ligne.classList.toggle("is-on", index === next);
          ligne.classList.toggle("is-out", index < next);
        });
        phase = next;
      }
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      root.classList.remove("intro-joue");
      node.classList.add("is-fin");
      try {
        sessionStorage.setItem("fjch-intro", "1");
      } catch {
        /* navigation privée */
      }
      fin = window.setTimeout(() => node.remove(), 1300);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fin);
      root.classList.remove("intro-joue");
    };
  }, []);

  return (
    <div className="intro" ref={ref} aria-hidden="true">
      <span className="intro-mesh" />
      <div className="intro-scene">
        {RECIT.map((mot, ligne) => (
          <p key={mot} className={ligne === 0 ? "intro-mot is-on" : "intro-mot"} translate="no">
            {[...mot].map((char, index) => (
              <span key={index} style={{ ["--i" as string]: index } as CSSProperties}>
                {char === " " ? " " : char}
              </span>
            ))}
          </p>
        ))}
      </div>
      <p className="intro-pied">
        <span className="intro-compte">000</span>
        <span className="intro-ligne">
          <span />
        </span>
        <span>H.M.B.K.</span>
      </p>
    </div>
  );
}
