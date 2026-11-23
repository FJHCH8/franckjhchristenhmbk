"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

const PHOTOS = [
  { kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg" },
  { kind: "photo" as const, src: "/media/franck.jpg" },
];

/** Places sur le manège : les photos se répètent pour le remplir tout autour. */
const PLACES = Math.max(6, PHOTOS.length);

/**
 * L'album est un manège vu de devant : les photos sont posées debout sur un cercle à plat.
 * Celle de devant est proche, donc grande ; celles des côtés sont loin, donc petites ;
 * toutes reposent sur le même sol. On fait tourner le manège au doigt, sans fin,
 * et il s'arrête sur la photo la plus proche.
 */
export function Album() {
  const scene = useRef<HTMLDivElement>(null);
  const position = useRef(0); // en places : 0 = la première photo devant
  const geste = useRef<{ id: number; x: number; depart: number; bouge: boolean } | null>(null);
  const anim = useRef(0);
  const devant = useRef(-1);
  const racine = useRef<HTMLDivElement>(null);

  /** Le manège prend toute la largeur de l'écran, quelle que soit la colonne qui le contient. */
  const caler = useCallback(() => {
    const node = racine.current;
    if (!node) return;
    node.style.marginLeft = "0px";
    node.style.marginLeft = `${-node.getBoundingClientRect().left}px`;
  }, []);

  const peindre = useCallback(() => {
    const node = scene.current;
    if (!node) return;
    const cartes = node.querySelectorAll<HTMLElement>("[data-place]");
    const largeur = node.clientWidth || 360;
    const rayon = Math.min(largeur * 0.42, 320);
    const proche = ((Math.round(position.current) % PLACES) + PLACES) % PLACES;
    cartes.forEach((carte) => {
      const i = Number(carte.dataset.place);
      const angle = ((i - position.current) / PLACES) * Math.PI * 2;
      const x = Math.sin(angle) * rayon;
      const z = (Math.cos(angle) - 1) * rayon; // 0 devant, -2R derrière
      // Plus c'est loin, plus c'est sombre.
      const lumiere = 0.35 + 0.65 * ((Math.cos(angle) + 1) / 2);
      // Chaque photo se tourne légèrement vers le centre, comme sur un vrai manège.
      carte.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), 0, ${z.toFixed(1)}px) rotateY(${(-angle * 0.45).toFixed(3)}rad)`;
      carte.style.zIndex = String(Math.round(1000 + z));
      carte.style.filter = `brightness(${lumiere.toFixed(3)})`;
      carte.classList.toggle("is-devant", i === proche);
    });
    // Les points sous l'album suivent la photo de devant.
    if (devant.current !== proche) {
      devant.current = proche;
      node.parentElement?.querySelectorAll<HTMLElement>("[data-point]").forEach((pt) => {
        pt.classList.toggle("is-actif", Number(pt.dataset.point) === proche % PHOTOS.length);
      });
    }
  }, []);

  const aller = useCallback(
    (cible: number) => {
      window.cancelAnimationFrame(anim.current);
      const debut = position.current;
      const t0 = performance.now();
      const duree = 820;
      const pas = (now: number) => {
        const t = Math.min(1, (now - t0) / duree);
        const e = 1 - (1 - t) ** 4;
        position.current = debut + (cible - debut) * e;
        peindre();
        if (t < 1) anim.current = window.requestAnimationFrame(pas);
      };
      anim.current = window.requestAnimationFrame(pas);
    },
    [peindre],
  );

  // Toutes les vidéos tournent en boucle, même quand elles ne sont pas de face.
  useEffect(() => {
    const videos = Array.from(scene.current?.querySelectorAll("video") ?? []);
    const lancer = () =>
      videos.forEach((v) => {
        v.muted = true;
        if (v.paused) void v.play().catch(() => undefined);
      });
    lancer();
    document.addEventListener("visibilitychange", lancer);
    window.addEventListener("pointerdown", lancer, { once: true });
    return () => document.removeEventListener("visibilitychange", lancer);
  }, []);

  useEffect(() => {
    caler();
    peindre();
    const surTaille = () => {
      caler();
      peindre();
    };
    window.addEventListener("resize", surTaille);
    return () => {
      window.cancelAnimationFrame(anim.current);
      window.removeEventListener("resize", surTaille);
    };
  }, [caler, peindre]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    window.cancelAnimationFrame(anim.current);
    geste.current = { id: event.pointerId, x: event.clientX, depart: position.current, bouge: false };
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
    const largeur = event.currentTarget.clientWidth || 360;
    position.current = g.depart - dx / (largeur * 0.45);
    peindre();
  };

  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    geste.current = null;
    if (!g || !g.bouge) return;
    const dx = event.clientX - g.x;
    const elan = Math.abs(dx) > 40 ? Math.sign(-dx) * 0.35 : 0;
    aller(Math.round(position.current + elan));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") aller(Math.round(position.current) + 1);
    else if (event.key === "ArrowLeft") aller(Math.round(position.current) - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div ref={racine} className="album album-manege" tabIndex={0} role="group" aria-label="Franck J.H. CHRISTEN H.M.B.K." onKeyDown={onKey}>
      <div className="album-zone" ref={scene} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="manege-sol" aria-hidden="true" />
        {Array.from({ length: PLACES }, (_, i) => {
          const photo = PHOTOS[i % PHOTOS.length];
          return (
            <article key={i} className="manege-carte" data-place={i}>
              {photo.kind === "video" ? (
                <video src={photo.src} poster={photo.poster} autoPlay muted loop playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.src} alt="Franck J.H. CHRISTEN H.M.B.K." draggable={false} loading="lazy" decoding="async" />
              )}
            </article>
          );
        })}
      </div>
      <div className="album-nav">
        <button type="button" className="album-fleche" aria-label="Photo précédente" onClick={() => aller(Math.round(position.current) - 1)}>
          <Chevron dir="left" />
        </button>
        <div className="album-points" aria-hidden="true">
          {PHOTOS.map((_, i) => (
            <span key={i} data-point={i} className={i === 0 ? "is-actif" : undefined} />
          ))}
        </div>
        <button type="button" className="album-fleche" aria-label="Photo suivante" onClick={() => aller(Math.round(position.current) + 1)}>
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
