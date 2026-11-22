"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const CARDS = [
  { id: 0, kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg" },
  { id: 1, kind: "photo" as const, src: "/media/franck.jpg" },
];

/** Écart entre deux photos sur le bord du disque. */
const PAS = 46;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * L'album est un disque : les photos sont posées sur son bord.
 * On le fait tourner au doigt ou à la souris, et il s'arrête sur la photo la plus proche.
 */
export function Album() {
  const disqueRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0); // en « photos » : 0 = la première en haut
  const geste = useRef<{ id: number; x: number; depart: number; bouge: boolean } | null>(null);
  const anim = useRef(0);

  const peindre = useCallback(() => {
    const disque = disqueRef.current;
    if (!disque) return;
    disque.style.setProperty("--rot", `${-angle.current * PAS}deg`);
    const proche = Math.round(angle.current);
    disque.querySelectorAll<HTMLElement>("[data-card]").forEach((carte) => {
      carte.classList.toggle("is-devant", Number(carte.dataset.card) === proche);
    });
  }, []);

  const aller = useCallback(
    (cible: number) => {
      const fin = clamp(cible, 0, CARDS.length - 1);
      window.cancelAnimationFrame(anim.current);
      const debut = angle.current;
      const t0 = performance.now();
      const duree = 520;
      const pas = (now: number) => {
        const t = clamp((now - t0) / duree, 0, 1);
        const e = 1 - (1 - t) ** 3;
        angle.current = debut + (fin - debut) * e;
        peindre();
        if (t < 1) anim.current = window.requestAnimationFrame(pas);
      };
      anim.current = window.requestAnimationFrame(pas);
    },
    [peindre],
  );

  useEffect(() => {
    peindre();
    return () => window.cancelAnimationFrame(anim.current);
  }, [peindre]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    window.cancelAnimationFrame(anim.current);
    geste.current = { id: event.pointerId, x: event.clientX, depart: angle.current, bouge: false };
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    if (!g.bouge) {
      if (Math.abs(dx) < 8) return;
      g.bouge = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const largeur = event.currentTarget.clientWidth || 320;
    const brut = g.depart - dx / (largeur * 0.55);
    // Un peu de résistance au-delà des bords.
    const min = 0;
    const max = CARDS.length - 1;
    angle.current = brut < min ? min - (min - brut) * 0.3 : brut > max ? max + (brut - max) * 0.3 : brut;
    peindre();
  };

  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    geste.current = null;
    if (!g || !g.bouge) return;
    const dx = event.clientX - g.x;
    const elan = Math.abs(dx) > 40 ? Math.sign(-dx) * 0.35 : 0;
    aller(Math.round(angle.current + elan));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") aller(Math.round(angle.current) + 1);
    else if (event.key === "ArrowLeft") aller(Math.round(angle.current) - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className="album album-roue" tabIndex={0} role="group" aria-label="Franck J.H. CHRISTEN H.M.B.K." onKeyDown={onKey}>
      <div className="album-zone" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="album-disque" ref={disqueRef}>
          <span className="album-anneau" aria-hidden="true" />
          {CARDS.map((card, i) => (
            <article key={card.id} className="album-card" data-card={card.id} style={{ ["--a" as string]: `${i * PAS}deg` } as CSSProperties}>
              <div className="album-glass">
                {card.kind === "video" ? (
                  <video src={card.src} poster={card.poster} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <Image src={card.src} alt="Franck J.H. CHRISTEN H.M.B.K." fill sizes="340px" draggable={false} />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="album-nav">
        <button type="button" aria-label="Photo précédente" onClick={() => aller(Math.round(angle.current) - 1)}>
          <Chevron dir="left" />
        </button>
        <button type="button" aria-label="Photo suivante" onClick={() => aller(Math.round(angle.current) + 1)}>
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
