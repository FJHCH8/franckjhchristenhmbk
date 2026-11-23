"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CodeEdition } from "@/components/CodeEdition";
import { T, useLocale } from "@/components/Locale";
import { Logo } from "@/components/Logo";
import { clic } from "@/lib/sons";

type Choix = "langue" | "contact" | "apropos" | "edition" | "oeuf";

const trait = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Les pictogrammes, dessinés dans un carré de 24 : traits fins et réguliers, formes simples. */
function Glyphe({ nom }: { nom: NomIcone }) {
  switch (nom) {
    case "reglages":
      return (
        <g {...trait}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.6-1.5L14.2 2.6h-4.4l-.3 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.6 1.5l.3 2.5h4.4l.3-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3 1 2-3.4z" />
        </g>
      );
    case "langue":
      return (
        <g {...trait}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
        </g>
      );
    case "contact":
      return (
        <g {...trait}>
          <path d="M3.5 6.5h17v11h-17z" />
          <path d="M3.8 6.8 12 13l8.2-6.2" />
        </g>
      );
    case "apropos":
      return (
        <g {...trait}>
          <path d="M12 10v9.5" strokeWidth="2.4" />
          <circle cx="12" cy="5.6" r="1.5" fill="currentColor" stroke="none" />
        </g>
      );
    case "edition":
      return (
        <g {...trait}>
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </g>
      );
    case "oeuf":
      return (
        <g {...trait}>
          <path d="M12 3.2c3.5 0 6.2 5.1 6.2 9.2a6.2 6.2 0 0 1-12.4 0c0-4.1 2.7-9.2 6.2-9.2z" />
          <path d="M6.3 11.8 8.6 13l2.2-1.5 2.4 1.5 2.2-1.5 2.3 1.2" />
        </g>
      );
    case "retour":
      return (
        <g {...trait}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </g>
      );
    case "instagram":
      return (
        <g {...trait}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.6" />
          <path d="M16.8 7.2v.1" strokeWidth="2.2" />
        </g>
      );
  }
}

type NomIcone = Choix | "reglages" | "retour" | "instagram";

/** Le pictogramme seul. */
function Icone({ nom }: { nom: NomIcone }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="param-icone">
      <Glyphe nom={nom} />
    </svg>
  );
}

/** Une petite tuile Metro carrée, de couleur, avec le pictogramme blanc au centre. */
function Tuile({ nom, couleur }: { nom: NomIcone; couleur: string }) {
  return (
    <span className="param-tuile" style={{ background: couleur }}>
      <Icone nom={nom} />
    </span>
  );
}

const LIGNES: { id: Choix; nom: string; couleur: string }[] = [
  { id: "langue", nom: "langue", couleur: "#1ba1e2" },
  { id: "contact", nom: "contact", couleur: "#00aba9" },
  { id: "apropos", nom: "à propos", couleur: "#6a00ff" },
  { id: "edition", nom: "édition", couleur: "#d80073" },
  { id: "oeuf", nom: "easter egg", couleur: "#f0a30a" },
];

function Langue() {
  const { locale, setLocale } = useLocale();
  const options: { id: "fr" | "tavissiv"; libelle: ReactNode; sous: string; aria: string }[] = [
    { id: "fr", libelle: <T>français</T>, sous: "Bretagne", aria: "Français (Bretagne)" },
    {
      id: "tavissiv",
      libelle: (
        <span className="tavissiv" lang="x-tavissiv">
          tavissiv
        </span>
      ),
      sous: "écriture Aaka",
      aria: "Tavissiv (Aaka)",
    },
  ];
  return (
    <div className="param-radios" role="radiogroup" aria-label="Langue">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={locale === o.id} aria-label={o.aria} className="param-radio" onClick={() => setLocale(o.id)}>
          <span className="param-radio-rond" aria-hidden="true" />
          <span className="param-radio-texte">
            {o.libelle}
            <small>
              (<T>{o.sous}</T>)
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}

function Contact() {
  return (
    <div className="param-liens">
      <a href="mailto:franckjhchristen@gmail.com" translate="no" className="param-lien">
        <Tuile nom="contact" couleur="#00aba9" />
        <span>
          <small>
            <T>e-mail</T>
          </small>
          franckjhchristen@gmail.com
        </span>
      </a>
      <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank" translate="no" className="param-lien">
        <Tuile nom="instagram" couleur="#c1355b" />
        <span>
          <small>
            <T>instagram</T>
          </small>
          @fjhchristenhmbk
        </span>
      </a>
      <p className="param-texte">
        <T>Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à Franck.</T>
      </p>
    </div>
  );
}

function APropos() {
  return (
    <div className="param-apropos">
      <p className="param-texte param-texte-grand">Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.</p>
      <dl>
        <div>
          <dt>présentation</dt>
          <dd>La vie, les projets et les annonces de Franck y prennent place.</dd>
        </div>
        <div>
          <dt>horizon</dt>
          <dd>Le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les 7 jours.</dd>
        </div>
      </dl>
    </div>
  );
}

/** L'easter egg : on écrit en lettres latines, le texte apparaît dans l'écriture Aaka. */
function Transcripteur() {
  const [texte, setTexte] = useState("franck j.h christen h.m.b.k");
  return (
    <div className="aaka">
      <p className="param-texte">Écris en Tavissiv avec les lettres latines : il s&apos;affiche aussitôt dans l&apos;écriture Aaka.</p>
      <textarea className="aaka-saisie" value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} spellCheck={false} aria-label="Texte à transcrire" />
      <div className="aaka-cadre">
        <small>aaka</small>
        <p className="aaka-rendu tavissiv" lang="x-tavissiv" aria-live="polite">
          {texte || " "}
        </p>
      </div>
    </div>
  );
}

const CHOIX: Choix[] = ["langue", "contact", "apropos", "edition", "oeuf"];

/**
 * Les paramètres, comme ceux de Windows Phone : le nom du site en petites capitales,
 * le titre en grand, puis chaque réglage avec sa petite tuile de couleur.
 * Le logo de Franck se dessine en boucle au milieu. Quand on choisit une ligne, les autres
 * s'effacent et elle monte sous le logo ; la barre d'application en bas permet de revenir.
 */
export function Parametres() {
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [monte, setMonte] = useState(false);
  const [partant, setPartant] = useState<Choix | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const demande = params.get("parametres");

  const ouvrirSur = (id: Choix | null) => {
    setOuvert(true);
    setChoix(id);
    setMonte(false);
    if (id) window.requestAnimationFrame(() => window.requestAnimationFrame(() => setMonte(true)));
  };

  // Un lien « /?parametres=contact » (ou les anciennes pages) ouvre directement la bonne rubrique.
  useEffect(() => {
    if (!demande) return;
    const id = CHOIX.includes(demande as Choix) ? (demande as Choix) : null;
    const t = window.setTimeout(() => {
      ouvrirSur(id);
      router.replace(pathname, { scroll: false });
    }, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demande]);

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

  const ligne = LIGNES.find((l) => l.id === choix);

  return (
    <>
      <button
        type="button"
        className="param-ouvrir"
        aria-label="Paramètres"
        aria-expanded={ouvert}
        onClick={() => {
          clic();
          ouvrirSur(null);
        }}
      >
        <Icone nom="reglages" />
      </button>
      {ouvert
        ? createPortal(
            <div className="param" role="dialog" aria-modal="true" aria-label="Paramètres">
              <div className="param-defile" data-lenis-prevent="">
                <p className="param-app">franck j.h christen</p>
                <div className="param-logo">
                  <Logo className="param-logo-svg" anime />
                </div>
                {!choix ? (
                  <>
                    <h2 className="param-titre">paramètres</h2>
                    <ul className={partant ? "param-liste is-partant" : "param-liste"}>
                      {LIGNES.map((l, i) => (
                        <li key={l.id} className={partant === l.id ? "is-choisi" : undefined} style={{ ["--i" as string]: i } as CSSProperties}>
                          <button type="button" className="param-ligne" onClick={() => choisir(l.id)}>
                            <Tuile nom={l.id} couleur={l.couleur} />
                            <span className="param-ligne-texte">
                              <T>{l.nom}</T>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className={monte ? "param-detail is-monte" : "param-detail"}>
                    <h2 className="param-ligne param-ligne-titre">
                      {ligne ? <Tuile nom={choix} couleur={ligne.couleur} /> : null}
                      <span className="param-ligne-texte">{ligne ? <T>{ligne.nom}</T> : null}</span>
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
              </div>
              <nav className="param-barre" aria-label="Barre d'application">
                <button type="button" className="param-barre-bouton" onClick={retour}>
                  <Icone nom="retour" />
                  <span>{choix ? <T>retour</T> : "fermer"}</span>
                </button>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
