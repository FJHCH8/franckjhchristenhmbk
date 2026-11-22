"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { AnneauPS2 } from "@/components/AnneauPS2";

const DUREE = 2200;

/**
 * Ouverture du site, à chaque chargement : le logo de Franck se dessine en blanc
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

    // Le chargement reste à l'écran tant que la page n'est pas entièrement chargée.
    let pret = document.readyState === "complete";
    const charge = () => {
      pret = true;
    };
    if (!pret) window.addEventListener("load", charge, { once: true });

    const step = (now: number) => {
      // Le logo se dessine pendant DUREE, puis l'anneau tourne jusqu'au chargement complet (8 s max).
      const t = Math.min(1, (now - start) / DUREE);
      if (t >= 1 && !pret && now - start < 8000) {
        node.style.setProperty("--intro-p", "0.9999");
        frame = window.requestAnimationFrame(step);
        return;
      }
      node.style.setProperty("--intro-p", ease(Math.min(1, t / 0.75)).toFixed(4));
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      node.classList.add("is-fin");
      fin = window.setTimeout(() => {
        root.classList.remove("intro-joue");
        fin = window.setTimeout(() => node.remove(), 1300);
      }, 380);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fin);
      window.removeEventListener("load", charge);
      root.classList.remove("intro-joue");
    };
  }, []);

  return (
    <div className="intro" ref={ref} aria-hidden="true">
      <div className="intro-scene">
        <Logo className="intro-logo" anime />
        <AnneauPS2 taille={150} className="intro-starload" />
      </div>
    </div>
  );
}
