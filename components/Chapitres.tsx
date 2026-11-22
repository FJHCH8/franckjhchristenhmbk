"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";
import type { EtatParticules } from "@/components/Ficelle";
import { clic, eclat } from "@/lib/sons";

// La ficelle n'est chargée que sur l'accueil, et seulement quand on approche du bocal.
const Ficelle = dynamic(() => import("@/components/Ficelle"), { ssr: false });

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
const CLE = "fjch-bocal";
const MAINTIEN = 1300;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

const lisse = (t: number) => t * t * (3 - 2 * t);

function dessinPossible() {
  try {
    return Boolean(document.createElement("canvas").getContext("2d"));
  } catch {
    return false;
  }
}

/**
 * La partie fluide de l'accueil. Un bocal plein de particules ; on appuie longtemps
 * pour le briser ; les particules jaillissent et deviennent les images des quatre
 * chapitres, qui glissent à l'horizontale, collés les uns aux autres.
 */
export function Chapitres() {
  const fluideRef = useRef<HTMLDivElement>(null);
  const calqueRef = useRef<HTMLDivElement>(null);
  const bocalRef = useRef<HTMLDivElement>(null);
  const chapRef = useRef<HTMLDivElement>(null);
  const rangeeRef = useRef<HTMLDivElement>(null);
  const progression = useRef<EtatParticules>({ g: 0, phase: "bocal", fissure: 0, eclat: 0, densite: 0, decalage: 0 });
  const [mode, setMode] = useState<"attente" | "particules" | "photos">("attente");
  const [brise, setBrise] = useState(false);
  const [charger, setCharger] = useState(false);
  const [pret, setPret] = useState(false);
  const surPret = useCallback(() => setPret(true), []);
  const [lite, setLite] = useState(false);
  const [actif, setActif] = useState(false);
  const [fissure, setFissure] = useState(0);
  const maintien = useRef({ depart: 0, frame: 0 });

  // Particules si possible ; sinon, les photos. Le bocal reste brisé pendant toute la visite.
  useEffect(() => {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const possible = !calme && dessinPossible();
    let deja = false;
    try {
      deja = sessionStorage.getItem(CLE) === "1";
    } catch {
      /* navigation privée */
    }
    if (deja || !possible) progression.current.phase = "libre";
    const id = window.requestAnimationFrame(() => {
      if (deja || !possible) setBrise(true);
      setLite(document.documentElement.dataset.power === "lite");
      setMode(possible ? "particules" : "photos");
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (mode !== "particules") return;
    const fluide = fluideRef.current;
    if (!fluide) return;
    const veille = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        veille.disconnect();
        setCharger(true);
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    veille.observe(fluide);
    return () => veille.disconnect();
  }, [mode]);

  // Défilement : glissement horizontal des chapitres, densité et ancrage des particules.
  useEffect(() => {
    const chap = chapRef.current;
    const rangee = rangeeRef.current;
    if (!chap || !rangee) return;
    const panneaux = [...rangee.querySelectorAll<HTMLElement>("[data-chap]")];
    const dernier = panneaux.length - 1;
    let frame = 0;
    let enVue = false;

    const paint = () => {
      frame = 0;
      const view = window.innerHeight;
      const e = progression.current;
      const boite = chap.getBoundingClientRect();
      const ouvert = boite.height > 1;

      if (ouvert) {
        const course = Math.max(1, boite.height - view);
        const g = clamp(-boite.top / course) * dernier;
        e.g = g;
        const i = Math.min(dernier, Math.floor(g));
        const f = g - i;
        const decalage = i >= dernier ? dernier : i + lisse(clamp((f - 0.12) / 0.8));
        rangee.style.setProperty("--decalage", decalage.toFixed(4));
        panneaux.forEach((panneau, j) => panneau.style.setProperty("--p", clamp(0.62 + (decalage - j) * 0.38).toFixed(4)));
      }

      // La partie fluide va du bocal à la fin des chapitres.
      const bocal = bocalRef.current?.getBoundingClientRect();
      const haut = bocal ? bocal.top : boite.top;
      const bas = ouvert ? boite.bottom : (bocal?.bottom ?? boite.bottom);
      const entree = clamp((view - haut) / (view * 0.7));
      const sortie = clamp((bas - view * 0.15) / (view * 0.85));
      e.densite = Math.min(entree, sortie);

      // Ancrage : le bocal suit la page ; les chapitres restent au centre tant qu'ils sont épinglés.
      if (e.phase === "bocal" && bocal) {
        const place = bocalRef.current?.querySelector(".flacon-place")?.getBoundingClientRect();
        e.decalage = place ? place.top + place.height / 2 - view / 2 : 0;
      } else if (ouvert && boite.top > 0) e.decalage = boite.top;
      else if (ouvert && boite.bottom < view) e.decalage = boite.bottom - view;
      else e.decalage = 0;

      if (calqueRef.current) calqueRef.current.style.opacity = e.densite.toFixed(3);
      const visible = e.densite > 0.002;
      if (visible !== enVue) {
        enVue = visible;
        setActif(visible);
      }
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    const intervalle = window.setInterval(wake, 250);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      window.clearInterval(intervalle);
    };
  }, [brise, mode]);

  const briser = () => {
    const e = progression.current;
    e.phase = "libre";
    e.eclat = performance.now();
    e.fissure = 0;
    setFissure(0);
    setBrise(true);
    eclat();
    try {
      sessionStorage.setItem(CLE, "1");
    } catch {
      /* navigation privée */
    }
    // Les chapitres viennent de s'ouvrir : on y glisse doucement.
    window.setTimeout(() => {
      const chap = chapRef.current;
      if (!chap) return;
      const cible = chap.getBoundingClientRect().top + window.scrollY;
      const lenis = (window as Window & { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
      if (lenis) lenis.scrollTo(cible, { duration: 2.2 });
      else window.scrollTo({ top: cible, behavior: "smooth" });
    }, 700);
  };

  const appuyer = () => {
    if (brise || maintien.current.frame) return;
    clic();
    maintien.current.depart = performance.now();
    const pas = (now: number) => {
      const f = clamp((now - maintien.current.depart) / MAINTIEN);
      progression.current.fissure = f;
      setFissure(f);
      if (f >= 1) {
        maintien.current.frame = 0;
        briser();
        return;
      }
      maintien.current.frame = window.requestAnimationFrame(pas);
    };
    maintien.current.frame = window.requestAnimationFrame(pas);
  };

  const relacher = () => {
    if (!maintien.current.frame) return;
    window.cancelAnimationFrame(maintien.current.frame);
    maintien.current.frame = 0;
    // La fissure se referme doucement.
    const debut = progression.current.fissure;
    const t0 = performance.now();
    const referme = (now: number) => {
      const f = debut * (1 - clamp((now - t0) / 500));
      progression.current.fissure = f;
      setFissure(f);
      if (f > 0 && !maintien.current.frame) window.requestAnimationFrame(referme);
    };
    window.requestAnimationFrame(referme);
  };

  const ouvert = brise || mode === "photos";
  const classes = ["chapitres", ouvert ? "is-ouvert" : "", pret ? "is-particules" : "", mode === "photos" ? "is-photos" : ""].filter(Boolean).join(" ");

  return (
    <div className="fluide" ref={fluideRef}>
      {mode === "particules" ? (
        <div className="particules-calque" ref={calqueRef} aria-hidden="true">
          {charger ? <Ficelle images={IMAGES} progression={progression} lite={lite} actif={actif} onPret={surPret} /> : null}
        </div>
      ) : null}

      {mode === "particules" && !brise ? (
        <section className="flacon" ref={bocalRef} aria-label="Le bocal">
          <div className="flacon-place" aria-hidden="true" />
          <button
            type="button"
            className="flacon-bouton"
            style={{ ["--f" as string]: fissure } as CSSProperties}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              appuyer();
            }}
            onPointerUp={relacher}
            onPointerCancel={relacher}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                event.preventDefault();
                appuyer();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") relacher();
            }}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span className="flacon-anneau" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" />
                <circle className="flacon-anneau-plein" cx="24" cy="24" r="21" pathLength={1} />
              </svg>
            </span>
            <span className="flacon-texte">
              <Split text="Appuie longtemps pour briser le bocal" mode="chars" />
            </span>
          </button>
        </section>
      ) : null}

      <div className={classes} ref={chapRef} aria-label="Chapitres du site" style={{ ["--n" as string]: CHAPITRES.length } as CSSProperties}>
        <div className="chap-piste">
          <div className="chap-rangee" ref={rangeeRef}>
            {CHAPITRES.map((chapitre, index) => (
              <section
                key={chapitre.id}
                className={`chap chap-${chapitre.id}`}
                data-chap=""
                aria-labelledby={`chap-${chapitre.id}`}
                style={{ ["--sens" as string]: index % 2 ? -1 : 1 } as CSSProperties}
              >
                <div className="chap-scene">
                  {mode === "photos" ? (
                    <figure className="chap-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={chapitre.photo} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: chapitre.focus }} />
                    </figure>
                  ) : null}
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
        </div>
      </div>
    </div>
  );
}
