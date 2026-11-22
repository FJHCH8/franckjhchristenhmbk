"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { AnneauPS2 } from "@/components/AnneauPS2";

const DUREE = 2800;

/**
 * Ouverture du site, une fois par session : le logo de Franck se dessine en blanc
 * sur le noir, sous un anneau de lumières bleues et blanches qui tourne comme un
 * chargement de console. Puis le logo s'envole, l'anneau s'éteint et le noir
 * s'ouvre en cercle sur le site.
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
    const start = performance.now();
    let frame = 0;
    let fin = 0;
    const ease = (t: number) => 1 - (1 - t) ** 3;

    // Le logo est dessiné dans la page : il est prêt tout de suite.
    const pret = true;

    let depart = start;
    const step = (now: number) => {
      if (!pret && now - start < 1200) {
        depart = now;
        frame = window.requestAnimationFrame(step);
        return;
      }
      const t = Math.min(1, (now - depart) / DUREE);
      node.style.setProperty("--intro-p", ease(Math.min(1, t / 0.75)).toFixed(4));
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      node.classList.add("is-fin");
      fin = window.setTimeout(() => {
        root.classList.remove("intro-joue");
        try {
          sessionStorage.setItem("fjch-intro", "1");
        } catch {
          /* navigation privée */
        }
        fin = window.setTimeout(() => node.remove(), 1300);
      }, 380);
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
      <div className="intro-scene">
        <Logo className="intro-logo" anime />
        <AnneauPS2 taille={96} />
      </div>
    </div>
  );
}
