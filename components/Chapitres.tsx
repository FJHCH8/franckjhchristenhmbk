"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";


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
    href: "/?parametres=apropos",
    texte: "Pourquoi ce site existe, ce qu’il va raconter, et à quel rythme il grandit. Les coulisses, en quelques lignes.",
    particules: "/fond/judo-640-a.webp",
    photo: "/fond/judo-1280-a.webp",
    focus: "50% 26%",
  },
  {
    id: "contact",
    titre: "Contact",
    href: "/?parametres=contact",
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

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

const lisse = (t: number) => t * t * (3 - 2 * t);

/**
 * Les quatre chapitres de l'accueil, toujours présents : ils glissent à l'horizontale,
 * collés les uns aux autres ; la photo de chaque chapitre fait son entrée quand il arrive.
 */
export function Chapitres() {
  const chapRef = useRef<HTMLDivElement>(null);
  const rangeeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chap = chapRef.current;
    const rangee = rangeeRef.current;
    if (!chap || !rangee) return;
    const panneaux = [...rangee.querySelectorAll<HTMLElement>("[data-chap]")];
    const dernier = panneaux.length - 1;
    const roue = chap.querySelector<HTMLElement>(".roue-disque");
    const cssPilote = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    const photos = roue ? [...roue.querySelectorAll<HTMLElement>(".roue-photo")] : [];
    let frame = 0;
    let courant = -1;

    const paint = () => {
      frame = 0;
      const view = window.innerHeight;
      const boite = chap.getBoundingClientRect();
      const course = Math.max(1, boite.height - view);
      const g = clamp(-boite.top / course) * dernier;
      const i = Math.min(dernier, Math.floor(g));
      const f = g - i;
      // Mêmes paliers que l'animation CSS (5 % de pause de chaque côté d'un glissement).
      const decalage = i >= dernier ? dernier : i + lisse(clamp((f - 0.15) / 0.7));
      // Le disque tourne par le défilement lui-même (CSS) ; le script ne prend le relais
      // que sur les navigateurs qui ne savent pas le faire.
      if (!cssPilote) roue?.style.setProperty("--decalage", decalage.toFixed(4));
      // Le chapitre affiché change à mi-glissement : sa photo fait son entrée.
      const proche = Math.round(decalage);
      if (proche !== courant) {
        courant = proche;
        panneaux.forEach((panneau, j) => panneau.classList.toggle("is-actif", j === proche));
        photos.forEach((photo, j) => photo.classList.toggle("is-actif", j === proche));
      }
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, []);

  return (
    <div className="fluide">
      <div className="chapitres is-ouvert" ref={chapRef} aria-label="Chapitres du site" style={{ ["--n" as string]: CHAPITRES.length } as CSSProperties}>
        <div className="chap-piste">
          {/* Le disque : les photos sur son bord ; en défilant, il tourne et amène le thème suivant. */}
          <div className="roue" aria-hidden="true">
            <div className="roue-disque">
              <span className="roue-anneau" />
              {CHAPITRES.map((chapitre, i) => (
                <figure key={chapitre.id} className="roue-photo" style={{ ["--i" as string]: i } as CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chapitre.photo} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: chapitre.focus }} />
                </figure>
              ))}
            </div>
          </div>
          <div className="chap-rangee" ref={rangeeRef}>
            {CHAPITRES.map((chapitre, i) => (
              <section
                key={chapitre.id}
                className={`chap chap-${chapitre.id}`}
                data-chap=""
                aria-labelledby={`chap-${chapitre.id}`}
                style={{ ["--sens" as string]: i % 2 ? -1 : 1 } as CSSProperties}
              >
                <div className="chap-scene">
                  <p className="chap-numero" aria-hidden="true">
                    <span>{String(i + 1).padStart(2, "0")}</span>
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
        </div>
      </div>
    </div>
  );
}
