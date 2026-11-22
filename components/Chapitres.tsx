"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";

type Chapitre = {
  id: string;
  titre: string;
  href: string;
  texte: string;
  image: { src: string; srcSet?: string; focus: string };
};

const fond = (name: string) => ({
  src: `/fond/${name}-1280.webp`,
  srcSet: `/fond/${name}-640.webp 640w, /fond/${name}-960.webp 960w, /fond/${name}-1280.webp 1280w, /fond/${name}-1500.webp 1500w`,
});

const CHAPITRES: Chapitre[] = [
  {
    id: "qui",
    titre: "Qui suis-je",
    href: "/qui-suis-je",
    texte: "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France.",
    image: { src: "/media/franck.jpg", focus: "50% 38%" },
  },
  {
    id: "apropos",
    titre: "À propos",
    href: "/a-propos",
    texte: "Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.",
    image: { ...fond("judo"), focus: "50% 26%" },
  },
  {
    id: "contact",
    titre: "Contact",
    href: "/contact",
    texte: "franckjhchristen@gmail.com — Instagram : @fjhchristenhmbk",
    image: { ...fond("avion"), focus: "68% 42%" },
  },
  {
    id: "projets",
    titre: "Projets",
    href: "/projets",
    texte: "Citations et projets. Endurreisen.",
    image: { ...fond("rose"), focus: "46% 34%" },
  },
];

const ROUTE = ["Qui suis-je", "À propos", "Contact", "Projets"];

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Récit au défilement de l'accueil : chaque chapitre se fige à l'écran,
 * la photo s'ouvre, le mot traverse la page et la phrase s'allume.
 */
export function Chapitres() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracks = [...root.querySelectorAll<HTMLElement>("[data-chap]")];
    const bande = root.querySelector<HTMLElement>(".chap-bande");
    let frame = 0;

    const paint = () => {
      frame = 0;
      const view = window.innerHeight;
      if (motion.matches) {
        for (const track of tracks) track.style.setProperty("--p", "0.62");
        bande?.style.setProperty("--p", "0.5");
        return;
      }
      for (const track of tracks) {
        const box = track.getBoundingClientRect();
        if (box.bottom < -view * 0.5 || box.top > view * 1.5) continue;
        const travel = Math.max(1, box.height - view);
        track.style.setProperty("--p", clamp(-box.top / travel).toFixed(4));
      }
      if (bande) {
        const box = bande.getBoundingClientRect();
        bande.style.setProperty("--p", clamp((view - box.top) / (view + box.height)).toFixed(4));
      }
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    motion.addEventListener("change", wake);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      motion.removeEventListener("change", wake);
    };
  }, []);

  const ligne = [...ROUTE, ...ROUTE, ...ROUTE].join("  ·  ");

  return (
    <div className="chapitres" ref={rootRef} aria-label="Chapitres du site">
      <div className="chap-bande" aria-hidden="true">
        <p className="chap-bande-ligne">{ligne}</p>
        <p className="chap-bande-ligne is-retour">{ligne}</p>
      </div>
      {CHAPITRES.map((chapitre, index) => (
        <section
          key={chapitre.id}
          className={`chap chap-${chapitre.id}`}
          data-chap=""
          aria-labelledby={`chap-${chapitre.id}`}
          style={{ ["--sens" as string]: index % 2 ? -1 : 1 } as CSSProperties}
        >
          <div className="chap-scene">
            <figure className="chap-photo">
              {/* Images déjà servies telles quelles depuis /public. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chapitre.image.src}
                srcSet={chapitre.image.srcSet}
                sizes="100vw"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ objectPosition: chapitre.image.focus }}
              />
            </figure>
            <p className="chap-numero" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className="chap-numero-trait" />
              <span>{String(CHAPITRES.length).padStart(2, "0")}</span>
            </p>
            <h2 className="chap-mot" id={`chap-${chapitre.id}`}>
              <Split text={chapitre.titre} mode="chars" lang />
            </h2>
            <div className="chap-pied">
              <p className="chap-texte">
                <Split text={chapitre.texte} lit="css" />
              </p>
              <Link className="chap-lien" href={chapitre.href} aria-label={`Entrer : ${chapitre.titre}`}>
                <span>Entrer</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
            <span className="chap-progres" aria-hidden="true" />
          </div>
        </section>
      ))}
    </div>
  );
}
