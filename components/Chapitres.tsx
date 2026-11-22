"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";

// La scène 3D (Three.js) n'est chargée que sur l'accueil, et seulement quand on approche des chapitres.
const ParticulesScene = dynamic(() => import("@/components/ParticulesScene"), { ssr: false });

type Chapitre = {
  id: string;
  titre: string;
  href: string;
  texte: string;
  /** Image échantillonnée en particules. */
  particules: string;
  /** Repli : la photo telle quelle, si la 3D ne peut pas tourner. */
  photo: string;
  focus: string;
};

export const CHAPITRES: Chapitre[] = [
  {
    id: "qui",
    titre: "Qui suis-je",
    href: "/qui-suis-je",
    texte: "Né en 2007, né différent. Il a toujours regardé ce que personne ne voulait voir. Derrière ce nom à rallonge, une manière unique de penser le monde.",
    particules: "/media/franck.jpg",
    photo: "/media/franck.jpg",
    focus: "50% 38%",
  },
  {
    id: "apropos",
    titre: "À propos",
    href: "/a-propos",
    texte: "Pourquoi ce site existe, ce qu’il va raconter, et à quel rythme il grandit. Les coulisses, en quelques lignes.",
    particules: "/fond/judo-640-a.webp",
    photo: "/fond/judo-1280-a.webp",
    focus: "50% 26%",
  },
  {
    id: "contact",
    titre: "Contact",
    href: "/contact",
    texte: "Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à Franck. Choisissez le vôtre.",
    particules: "/fond/avion-640-a.webp",
    photo: "/fond/avion-1280-a.webp",
    focus: "68% 42%",
  },
  {
    id: "projets",
    titre: "Projets",
    href: "/projets",
    texte: "Des citations qui restent, des projets qui avancent, et un compte à rebours vers Endurreisen. Qu’est-ce qui se prépare ?",
    particules: "/fond/rose-640-a.webp",
    photo: "/fond/rose-1280-a.webp",
    focus: "46% 34%",
  },
];

const IMAGES = CHAPITRES.map((chapitre) => chapitre.particules);

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Récit au défilement de l'accueil. Derrière les quatre chapitres, une seule scène :
 * des milliers de particules forment la photo du chapitre, puis se dispersent dans
 * un vortex et se réassemblent en la suivante.
 */
export function Chapitres() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progression = useRef({ g: -1, actif: false });
  const [charger, setCharger] = useState(false);
  const [pret, setPret] = useState(false);
  const [lite, setLite] = useState(false);
  const [actif, setActif] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracks = [...root.querySelectorAll<HTMLElement>("[data-chap]")];

    // On prépare la 3D un peu avant d'arriver aux chapitres.
    const veille = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || motion.matches) return;
        veille.disconnect();
        setLite(document.documentElement.dataset.power === "lite");
        setCharger(true);
      },
      { rootMargin: "120% 0px 120% 0px" },
    );
    veille.observe(root);

    let frame = 0;
    let enVue = false;
    const paint = () => {
      frame = 0;
      const view = window.innerHeight;
      // La scène 3D ne calcule que lorsque les chapitres sont à l'écran.
      const zone = root.getBoundingClientRect();
      const visible = zone.bottom > -view * 0.3 && zone.top < view * 1.3;
      if (visible !== enVue) {
        enVue = visible;
        setActif(visible);
      }
      if (motion.matches) {
        for (const track of tracks) track.style.setProperty("--p", "0.62");
        return;
      }
      let g = -1;
      tracks.forEach((track, index) => {
        const box = track.getBoundingClientRect();
        const travel = Math.max(1, box.height - view);
        const p = clamp(-box.top / travel);
        if (box.bottom > -view * 0.2 && box.top < view * 1.2) track.style.setProperty("--p", p.toFixed(4));
        if (index === 0 && box.top > 0) g = -Math.min(1, box.top / view);
        else if (box.top <= 0) g = index + p;
      });
      const fin = tracks[tracks.length - 1]?.getBoundingClientRect();
      if (fin && fin.bottom < view) g = tracks.length + Math.min(1, (view - fin.bottom) / view);
      progression.current.g = g;
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    motion.addEventListener("change", wake);
    return () => {
      veille.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      motion.removeEventListener("change", wake);
    };
  }, []);

  return (
    <div className={pret ? "chapitres is-particules" : "chapitres"} ref={rootRef} aria-label="Chapitres du site">
      <div className="chap-particules" aria-hidden="true">
        {charger ? <ParticulesScene images={IMAGES} progression={progression} lite={lite} actif={actif} onPret={() => setPret(true)} /> : null}
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
              {/* Repli sans 3D : la photo, au noir transparent. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chapitre.photo} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: chapitre.focus }} />
            </figure>
            <p className="chap-numero" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className="chap-numero-trait" />
              <span>{String(CHAPITRES.length).padStart(2, "0")}</span>
            </p>
            <h2 className="chap-mot" id={`chap-${chapitre.id}`}>
              <Split text={chapitre.titre} mode="chars" lang className="kt-x" />
            </h2>
            <div className="chap-pied">
              <p className="chap-texte">
                <Split text={chapitre.texte} lit="css" />
              </p>
              <Link className="chap-lien" href={chapitre.href} aria-label={`Entrer : ${chapitre.titre}`} data-glow="">
                <span>Entrer</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
