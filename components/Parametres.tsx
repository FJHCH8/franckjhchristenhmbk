"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CodeEdition } from "@/components/CodeEdition";
import { useLocale } from "@/components/Locale";
import { Logo } from "@/components/Logo";
import { clic } from "@/lib/sons";

type Choix = "langue" | "contact" | "apropos" | "edition" | "oeuf";

const trait = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Icone({ nom }: { nom: Choix | "reglages" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="param-icone">
      {nom === "reglages" ? (
        <g {...trait}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9" />
          <circle cx="12" cy="12" r="6.4" />
        </g>
      ) : nom === "langue" ? (
        <g {...trait}>
          <rect x="3" y="3.5" width="11" height="11" />
          <rect x="10" y="9.5" width="11" height="11" fill="#000" />
          <path d="M6 11.5l2.5-5.5 2.5 5.5M6.9 9.6h3.2M13 17.5h5M15.5 13v4.5" />
        </g>
      ) : nom === "contact" ? (
        <g {...trait}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
        </g>
      ) : nom === "apropos" ? (
        <g {...trait}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.4 9.3a2.7 2.7 0 1 1 3.8 2.5c-.8.4-1.2 1-1.2 1.9v.6" />
          <circle cx="12" cy="17.2" r=".6" fill="currentColor" />
        </g>
      ) : nom === "edition" ? (
        <g {...trait}>
          <path d="M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
          <path d="M14 6.8l3.2 3.2" />
        </g>
      ) : (
        <g {...trait}>
          <path d="M12 3c3.6 0 6.5 5 6.5 9.4A6.5 6.5 0 0 1 12 19a6.5 6.5 0 0 1-6.5-6.6C5.5 8 8.4 3 12 3z" />
          <path d="M7.2 11.5l2.2 1.4 2.6-1.8 2.6 1.8 2.2-1.4" />
        </g>
      )}
    </svg>
  );
}

const LIGNES: { id: Choix; nom: string }[] = [
  { id: "langue", nom: "langue" },
  { id: "contact", nom: "contact" },
  { id: "apropos", nom: "à propos" },
  { id: "edition", nom: "édition" },
  { id: "oeuf", nom: "easter egg" },
];

function Langue() {
  const { locale, setLocale } = useLocale();
  const options: { id: "fr" | "tavissiv"; libelle: ReactNode; aria: string }[] = [
    { id: "fr", libelle: <>Français <small>(Bretagne)</small></>, aria: "Français (Bretagne)" },
    {
      id: "tavissiv",
      libelle: (
        <span className="tavissiv" lang="x-tavissiv">
          tavissiv (aaka)
        </span>
      ),
      aria: "Tavissiv (Aaka)",
    },
  ];
  return (
    <div className="param-radios" role="radiogroup" aria-label="Langue">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={locale === o.id} aria-label={o.aria} className="param-radio" onClick={() => setLocale(o.id)}>
          <span className="param-radio-rond" aria-hidden="true" />
          <span className="param-radio-texte">{o.libelle}</span>
        </button>
      ))}
    </div>
  );
}

function Contact() {
  return (
    <div className="param-liens">
      <a href="mailto:franckjhchristen@gmail.com" translate="no">
        <small>e-mail</small>franckjhchristen@gmail.com
      </a>
      <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank" translate="no">
        <small>instagram</small>@fjhchristenhmbk
      </a>
      <Link href="/contact" className="param-bouton">
        page contact
      </Link>
    </div>
  );
}

function APropos() {
  return (
    <div className="param-liens">
      <p className="param-texte">
        Ce site publie la vie, les projets et les annonces de Franck J.H. Christen H.M.B.K. Il évolue chaque semaine.
      </p>
      <Link href="/a-propos" className="param-bouton">
        page à propos
      </Link>
    </div>
  );
}

/** L'easter egg : on écrit en lettres latines, le texte apparaît dans l'écriture Aaka. */
function Transcripteur() {
  const [texte, setTexte] = useState("frank j.h christen h.m.b.k");
  return (
    <div className="aaka">
      <p className="param-texte">Écris en Tavissiv avec les lettres latines : il s&apos;affiche dans l&apos;écriture Aaka.</p>
      <textarea className="aaka-saisie" value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} spellCheck={false} aria-label="Texte à transcrire" />
      <p className="aaka-rendu tavissiv" lang="x-tavissiv" aria-live="polite">
        {texte || " "}
      </p>
    </div>
  );
}

/**
 * Les paramètres : l'icône en haut à droite ouvre un écran Metro plein écran,
 * avec le logo de Franck qui se dessine en boucle au milieu. Quand on choisit une ligne,
 * les autres s'effacent et elle monte sous le logo, son contenu apparaît dessous.
 */
export function Parametres() {
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [monte, setMonte] = useState(false);
  const [partant, setPartant] = useState<Choix | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ouvert) return;
    const lenis = (window as Window & { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("param-ouvert");
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") retour();
    };
    window.addEventListener("keydown", echap);
    return () => {
      window.removeEventListener("keydown", echap);
      document.documentElement.classList.remove("param-ouvert");
      document.documentElement.style.overflow = avant;
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert]);

  // On ferme les paramètres quand on change de page.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setOuvert(false);
      setChoix(null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  // Les autres lignes s'effacent d'abord, puis celle choisie monte sous le logo.
  const choisir = (id: Choix) => {
    clic();
    setPartant(id);
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      setPartant(null);
      setChoix(id);
      setMonte(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setMonte(true)));
    }, calme ? 0 : 280);
  };

  function retour() {
    clic();
    if (choix) {
      setChoix(null);
      setMonte(false);
    } else setOuvert(false);
  }

  const editionOk = () => {
    setOuvert(false);
    setChoix(null);
    if (pathname !== "/projets") {
      try {
        sessionStorage.setItem("fjch-edition-ouvrir", "1");
      } catch {
        /* navigation privée */
      }
      router.push("/projets");
    }
  };

  const ligneChoisie = LIGNES.find((l) => l.id === choix);

  return (
    <>
      <button
        type="button"
        className="param-ouvrir"
        aria-label="Paramètres"
        aria-expanded={ouvert}
        onClick={() => {
          clic();
          setOuvert(true);
          setChoix(null);
        }}
      >
        <Icone nom="reglages" />
      </button>
      {ouvert
        ? createPortal(
            <div className="param" role="dialog" aria-modal="true" aria-label="Paramètres">
              <div className="param-logo">
                <Logo className="param-logo-svg" anime />
              </div>
              {!choix ? (
                <>
                  <h2 className="param-titre">
                    <Icone nom="reglages" />
                    paramètres
                  </h2>
                  <ul className={partant ? "param-liste is-partant" : "param-liste"}>
                    {LIGNES.map((l, i) => (
                      <li key={l.id} className={partant === l.id ? "is-choisi" : undefined} style={{ ["--i" as string]: i } as CSSProperties}>
                        <button type="button" className="param-ligne" onClick={() => choisir(l.id)}>
                          <Icone nom={l.id} />
                          <span>{l.nom}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className={monte ? "param-detail is-monte" : "param-detail"}>
                  <h2 className="param-ligne param-ligne-titre">
                    <Icone nom={choix} />
                    <span>{ligneChoisie?.nom}</span>
                  </h2>
                  <div className="param-contenu">
                    {choix === "langue" ? <Langue /> : null}
                    {choix === "contact" ? <Contact /> : null}
                    {choix === "apropos" ? <APropos /> : null}
                    {choix === "edition" ? <CodeEdition onOk={editionOk} /> : null}
                    {choix === "oeuf" ? <Transcripteur /> : null}
                  </div>
                </div>
              )}
              <button type="button" className="param-bouton param-retour" onClick={retour}>
                retour
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
