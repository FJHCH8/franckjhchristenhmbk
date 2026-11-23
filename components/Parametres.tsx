"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CodeEdition } from "@/components/CodeEdition";
import { useLocale } from "@/components/Locale";
import { Logo } from "@/components/Logo";
import { clic } from "@/lib/sons";

type Choix = "langue" | "contact" | "apropos" | "edition" | "oeuf";

const trait = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Le pictogramme seul, dessiné dans un carré de 24 : style Windows Phone (traits fins, formes simples). */
function Glyphe({ nom }: { nom: Choix | "reglages" | "retour" }) {
  switch (nom) {
    case "reglages":
      return (
        <g {...trait}>
          <path d="M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z" />
          <path d="M10.6 3.5h2.8l.5 2.2 1.6.7 1.9-1.2 2 2-1.2 1.9.7 1.6 2.2.5v2.8l-2.2.5-.7 1.6 1.2 1.9-2 2-1.9-1.2-1.6.7-.5 2.2h-2.8l-.5-2.2-1.6-.7-1.9 1.2-2-2 1.2-1.9-.7-1.6-2.2-.5v-2.8l2.2-.5.7-1.6-1.2-1.9 2-2 1.9 1.2 1.6-.7z" />
        </g>
      );
    case "langue":
      return (
        <g {...trait}>
          <path d="M5 7h8M9 5v2M7 7c.4 3 2.4 5.2 5 6.4M11 7c-.5 2.8-2.6 5-5.6 6.4" />
          <path d="M12.5 19l3.2-7.6 3.3 7.6M13.6 16.6h4.3" />
        </g>
      );
    case "contact":
      return (
        <g {...trait}>
          <rect x="4" y="6.5" width="16" height="11" />
          <path d="M4.5 7l7.5 5.6L19.5 7" />
        </g>
      );
    case "apropos":
      return (
        <g {...trait}>
          <path d="M12 10.6v6" />
          <circle cx="12" cy="7.6" r=".5" fill="currentColor" />
          <circle cx="12" cy="12" r="8.2" />
        </g>
      );
    case "edition":
      return (
        <g {...trait}>
          <path d="M5 19l.9-3.7L15.7 5.5a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3L8.7 18.1 5 19z" />
          <path d="M14.2 7l2.8 2.8" />
        </g>
      );
    case "oeuf":
      return (
        <g {...trait}>
          <path d="M12 4c3.3 0 5.8 4.7 5.8 8.6A5.8 5.8 0 0 1 12 18.6a5.8 5.8 0 0 1-5.8-6C6.2 8.7 8.7 4 12 4z" />
          <path d="M7 11.6l1.9 1.3 1.6-1.3 1.5 1.3 1.5-1.3 1.6 1.3 1.9-1.3" />
        </g>
      );
    case "retour":
      return (
        <g {...trait}>
          <path d="M16.5 12h-9M11 8l-4 4 4 4" />
        </g>
      );
  }
}

/** L'icône Windows Phone : le pictogramme blanc dans un cercle fin. */
function Icone({ nom, rond = true }: { nom: Choix | "reglages" | "retour"; rond?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="param-icone">
      {rond ? <circle cx="16" cy="16" r="14.6" fill="none" stroke="currentColor" strokeWidth="1.8" /> : null}
      <g transform={rond ? "translate(5.6 5.6) scale(0.867)" : "translate(4 4)"}>
        <Glyphe nom={nom} />
      </g>
    </svg>
  );
}

const LIGNES: { id: Choix; nom: string; sous: string }[] = [
  { id: "langue", nom: "langue", sous: "français (Bretagne) ou tavissiv (Aaka)" },
  { id: "contact", nom: "contact", sous: "e-mail et Instagram" },
  { id: "apropos", nom: "à propos", sous: "le site, sa raison d'être, son rythme" },
  { id: "edition", nom: "édition", sous: "accès réservé, par code" },
  { id: "oeuf", nom: "easter egg", sous: "écrire dans l'écriture Aaka" },
];

function Langue() {
  const { locale, setLocale } = useLocale();
  const options: { id: "fr" | "tavissiv"; libelle: ReactNode; sous: string; aria: string }[] = [
    { id: "fr", libelle: "français", sous: "Bretagne", aria: "Français (Bretagne)" },
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
            <span>{o.libelle}</span>
            <small>{o.sous}</small>
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
        <Icone nom="contact" />
        <span>
          <small>e-mail</small>
          franckjhchristen@gmail.com
        </span>
      </a>
      <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank" translate="no" className="param-lien">
        <svg viewBox="0 0 32 32" aria-hidden="true" className="param-icone">
          <circle cx="16" cy="16" r="14.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="9.5" y="9.5" width="13" height="13" rx="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="16" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="19.8" cy="12.2" r=".7" fill="currentColor" />
        </svg>
        <span>
          <small>instagram</small>
          @fjhchristenhmbk
        </span>
      </a>
      <p className="param-texte">Une idée, une question, un projet à partager ? Deux chemins mènent jusqu&apos;à Franck.</p>
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
  const [texte, setTexte] = useState("frank j.h christen h.m.b.k");
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
 * le titre en grand, puis chaque réglage avec son sous-titre gris et son icône ronde.
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
        <Icone nom="reglages" rond={false} />
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
                            <Icone nom={l.id} />
                            <span className="param-ligne-texte">
                              <span>{l.nom}</span>
                              <small>{l.sous}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className={monte ? "param-detail is-monte" : "param-detail"}>
                    <h2 className="param-ligne param-ligne-titre">
                      <Icone nom={choix} />
                      <span className="param-ligne-texte">
                        <span>{ligne?.nom}</span>
                        <small>{ligne?.sous}</small>
                      </span>
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
                  <span>{choix ? "retour" : "fermer"}</span>
                </button>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
