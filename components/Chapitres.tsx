"use client";

import { Anton, Fraunces } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { T } from "@/components/Locale";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], weight: ["300"], display: "swap" });

type Chapitre = {
  id: string;
  /** Le premier mot du titre est en italique, le reste en droit. */
  titre: [string, string];
  mot: string;
  href: string;
  texte: string;
  photo: string;
  /** Cadrage de la photo dans le demi-disque (le visage doit se lever au-dessus de l'horizon). */
  cadre: string;
};

export const CHAPITRES: Chapitre[] = [
  {
    id: "qui",
    titre: ["Qui", "suis-je"],
    mot: "QUI",
    href: "/qui-suis-je",
    texte: "Né en 2007, né différent. Il a toujours regardé ce que personne ne voulait voir.",
    photo: "/media/franck.jpg",
    cadre: "50% 32%",
  },
  {
    id: "apropos",
    titre: ["À", "propos"],
    mot: "PROPOS",
    href: "/?parametres=apropos",
    texte: "Pourquoi ce site existe, ce qu’il va raconter, et à quel rythme il grandit.",
    photo: "/fond/judo-1280-a.webp",
    cadre: "50% 18%",
  },
  {
    id: "contact",
    titre: ["Contact", ""],
    mot: "CONTACT",
    href: "/?parametres=contact",
    texte: "Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à Franck.",
    photo: "/fond/avion-1280-a.webp",
    cadre: "68% 40%",
  },
  {
    id: "projets",
    titre: ["Projets", ""],
    mot: "PROJETS",
    href: "/projets",
    texte: "Des citations qui restent, des projets qui avancent, et Endurreisen qui approche.",
    photo: "/fond/rose-1280-a.webp",
    cadre: "46% 30%",
  },
];

const ROMAINS = ["I", "II", "III", "IV"];
const LAMELLES = 9;

/**
 * Les chapitres, en ouverture de film : chaque chapitre se lève comme un astre sur l'horizon,
 * vu à travers les lamelles d'un objectif qui s'ouvrent, cerclé de lumière dorée, avec son reflet
 * sur l'eau et son mot géant derrière. En défilant, il se couche et le suivant se lève ;
 * la pellicule en bas avance d'une image.
 *
 * Fluidité : le script n'écrit qu'une seule valeur (--p, la progression) par image ;
 * tout le reste est calculé par le navigateur, en transformations et transparences.
 */
export function Chapitres() {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let dernier = -1;
    const peindre = () => {
      frame = 0;
      const r = node.getBoundingClientRect();
      const course = Math.max(1, node.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / course));
      const v = calme ? Math.round(p * (CHAPITRES.length - 1)) / (CHAPITRES.length - 1) : p;
      if (Math.abs(v - dernier) < 0.0005) return;
      dernier = v;
      node.style.setProperty("--p", v.toFixed(4));
    };
    const surDefilement = () => {
      if (!frame) frame = window.requestAnimationFrame(peindre);
    };
    peindre();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    return () => {
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="cine" ref={scene} aria-label="Chapitres du site" style={{ ["--n" as string]: CHAPITRES.length } as CSSProperties}>
      <div className="cine-plateau">
        {CHAPITRES.map((c, i) => (
          <article key={c.id} className="cine-chap" style={{ ["--i" as string]: i } as CSSProperties} aria-labelledby={`cine-${c.id}`}>
            <p className={`cine-mot ${anton.className}`} aria-hidden="true" style={{ ["--len" as string]: c.mot.length } as CSSProperties}>
              {c.mot}
            </p>

            <div className="cine-ciel" aria-hidden="true">
              <div className="cine-astre">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt="" style={{ objectPosition: c.cadre }} draggable={false} />
                <div className="cine-iris">
                  {Array.from({ length: LAMELLES }, (_, k) => (
                    <span key={k} style={{ ["--k" as string]: k } as CSSProperties} />
                  ))}
                </div>
                <span className="cine-bague" />
              </div>
            </div>

            <div className="cine-eau" aria-hidden="true">
              <div className="cine-astre cine-reflet">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt="" style={{ objectPosition: c.cadre }} draggable={false} />
              </div>
            </div>

            <div className="cine-texte">
              <p className="cine-numero">
                <T>Chapitre</T> {ROMAINS[i]}
              </p>
              <h2 className={`cine-titre ${fraunces.className}`} id={`cine-${c.id}`}>
                <i>{c.titre[0]}</i> {c.titre[1]}
              </h2>
              <p className="cine-resume">{c.texte}</p>
              <Link className="cine-entrer" href={c.href}>
                <T>entrer</T>
              </Link>
            </div>
          </article>
        ))}

        <span className="cine-horizon" aria-hidden="true" />

        <div className="cine-pellicule" aria-hidden="true">
          <div className="cine-images">
            {CHAPITRES.map((c, i) => (
              <span key={c.id} className="cine-image" style={{ ["--i" as string]: i } as CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt="" style={{ objectPosition: c.cadre }} loading="lazy" draggable={false} />
                <small>{ROMAINS[i]}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
