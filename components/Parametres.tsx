"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CodeEdition } from "@/components/CodeEdition";
import { T, useLocale } from "@/components/Locale";
import { Icone, type NomIcone } from "@/components/Icone";
import { Logo } from "@/components/Logo";
import { LogoOdyssee } from "@/components/LogoOdyssee";
import { MatriceNom } from "@/components/MatriceNom";
import { clic } from "@/lib/sons";

type Choix = "apparence" | "langue" | "contact" | "apropos" | "systeme" | "edition" | "oeuf";

/** Correspondance entre les rubriques et les icônes du système. */
const ICONE_DE = {
  apparence: "palette",
  langue: "language",
  contact: "mail",
  apropos: "info",
  edition: "edit",
  oeuf: "egg_alt",
  systeme: "phone_iphone",
  reglages: "settings",
  retour: "arrow_back",
  instagram: "photo_camera",
} as const satisfies Record<string, NomIcone>;

/** Une petite tuile argentée en relief, façon vieil iPhone, avec l'icône pleine au centre. */
function Tuile({ nom }: { nom: keyof typeof ICONE_DE; couleur?: string }) {
  return (
    <span className="param-tuile">
      <Icone nom={ICONE_DE[nom]} />
    </span>
  );
}

const LIGNES: { id: Choix; nom: string; couleur: string }[] = [
  { id: "apparence", nom: "apparence", couleur: "#262626" },
  { id: "langue", nom: "langue", couleur: "#262626" },
  { id: "contact", nom: "contact", couleur: "#262626" },
  { id: "apropos", nom: "à propos", couleur: "#262626" },
  { id: "systeme", nom: "système", couleur: "#262626" },
  { id: "edition", nom: "édition", couleur: "#262626" },
  { id: "oeuf", nom: "easter egg", couleur: "#262626" },
];

/** Apparence : le site classique, ou AakanOS (le site comme un système de téléphone). */
const CLE_APPARENCE = "fjch-apparence";
function Apparence() {
  const [mode, setMode] = useState<"classique" | "aakanos">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(CLE_APPARENCE) === "aakanos" ? "aakanos" : "classique";
    } catch {
      return "classique";
    }
  });
  const dansAakanOS = typeof window !== "undefined" && window.top !== window.self;
  const choisir = (m: "classique" | "aakanos") => {
    setMode(m);
    try {
      localStorage.setItem(CLE_APPARENCE, m);
    } catch {
      /* navigation privée */
    }
    // Depuis une appli d'AakanOS, revenir au site classique quitte le système entier.
    if (m === "classique" && dansAakanOS && window.top) window.top.location.assign("/");
  };
  const options = [
    { id: "classique" as const, nom: "site classique", sous: "Odyssée" },
    { id: "aakanos" as const, nom: "AakanOS", sous: "le site comme un téléphone" },
  ];
  return (
    <>
      <div className="param-radios" role="radiogroup" aria-label="Apparence">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={mode === o.id} className="param-radio" onClick={() => choisir(o.id)}>
            <span className="param-radio-rond" aria-hidden="true" />
            <span className="param-radio-texte">
              <T>{o.nom}</T>
              <small>
                (<T>{o.sous}</T>)
              </small>
            </span>
          </button>
        ))}
      </div>
      {!dansAakanOS ? (
        <button
          type="button"
          className="param-lancer"
          onClick={() => {
            choisir("aakanos");
            window.location.assign("/aakanos");
          }}
        >
          <Icone nom="phone_iphone" />
          <span>
            <T>lancer AakanOS</T>
          </span>
        </button>
      ) : null}
    </>
  );
}

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
        <Tuile nom="contact" />
        <span>
          <small>
            <T>e-mail</T>
          </small>
          franckjhchristen@gmail.com
        </span>
      </a>
      <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank" translate="no" className="param-lien">
        <Tuile nom="instagram" />
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

/** « Système » : le nom de l'interface, sa version et la date de mise à jour ; un appui sur la date montre l'historique. */
function Systeme() {
  const [historique, setHistorique] = useState(false);
  const actuelle = SYSTEME.versions[0]!;
  return (
    <div className="systeme">
      <div className="systeme-image">
        <LogoOdyssee className="systeme-logo" />
      </div>
      <p className="systeme-nom">{SYSTEME.nom}</p>
      <dl className="systeme-infos">
        <div>
          <dt>version</dt>
          <dd>{actuelle.numero}</dd>
        </div>
        <div>
          <dt>nom</dt>
          <dd>{SYSTEME.nom}</dd>
        </div>
        <div>
          <dt>mise à jour</dt>
          <dd>
            <button type="button" className="systeme-date" aria-expanded={historique} onClick={() => setHistorique((h) => !h)}>
              {actuelle.date}
              <Icone nom="chevron_right" />
            </button>
          </dd>
        </div>
      </dl>
      {historique ? (
        <ol className="systeme-historique">
          {SYSTEME.versions.map((v) => (
            <li key={v.numero}>
              <span>{v.numero}</span>
              <span>{v.date}</span>
            </li>
          ))}
        </ol>
      ) : null}
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

/** La fiche du système. Pour une nouvelle version, on l'ajoute en tête de liste. */
const SYSTEME = {
  nom: "Odyssée",
  versions: [
    { numero: "0.1", date: "23 novembre 2026" },
    { numero: "0.0", date: "9 novembre 2026" },
  ],
};

const CHOIX: Choix[] = ["apparence", "langue", "contact", "apropos", "systeme", "edition", "oeuf"];

/**
 * Les paramètres, comme ceux de Windows Phone : le nom du site en petites capitales,
 * le titre en grand, puis chaque réglage avec sa petite tuile de couleur.
 * Le logo de Franck se dessine en boucle au milieu. Quand on choisit une ligne, les autres
 * s'effacent et elle monte sous le logo ; la barre d'application en bas permet de revenir.
 */
export function Parametres() {
  const { locale } = useLocale();
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [monte, setMonte] = useState(false);
  const [partant, setPartant] = useState<Choix | null>(null);
  const [fermant, setFermant] = useState(false);

  /** Fermeture : la fenêtre se referme en zoomant vers la roue dentée, puis disparaît. */
  const fermer = () => {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calme) {
      setOuvert(false);
      return;
    }
    setFermant(true);
    window.setTimeout(() => {
      setFermant(false);
      setOuvert(false);
    }, 260);
  };
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

  // Apparence AakanOS choisie : le site s'ouvre directement dans le système (sauf depuis ses propres applis).
  useEffect(() => {
    try {
      if (!demande && window.top === window.self && localStorage.getItem(CLE_APPARENCE) === "aakanos") window.location.replace("/aakanos");
    } catch {
      /* navigation privée */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } else fermer();
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
        <Icone nom="settings" />
      </button>
      {ouvert
        ? createPortal(
            <div className={fermant ? "param is-fermant" : "param"} role="dialog" aria-modal="true" aria-label="Paramètres">
              <div className="param-defile" data-lenis-prevent="">
                <div className="param-logo">
                  <Logo className="param-logo-svg" anime />
                </div>
                {!choix ? (
                  <>
                    <h2 className="param-titre">
                      <T>paramètres</T>
                    </h2>
                    <ul className={partant ? "param-liste is-partant" : "param-liste"}>
                      {LIGNES.map((l, i) => (
                        <li key={l.id} className={partant === l.id ? "is-choisi" : undefined} style={{ ["--i" as string]: i } as CSSProperties}>
                          <button type="button" className="param-ligne" onClick={() => choisir(l.id)}>
                            <Tuile nom={l.id} />
                            <span className="param-ligne-texte">
                              <T>{l.nom}</T>
                            </span>
                            {l.id === "langue" ? (
                              <span className="param-valeur">{locale === "tavissiv" ? <span className="tavissiv" lang="x-tavissiv">tavissiv</span> : "français"}</span>
                            ) : null}
                            <svg className="param-chevron" viewBox="0 0 16 16" aria-hidden="true">
                              <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className={monte ? "param-detail is-monte" : "param-detail"}>
                    <h2 className="param-ligne param-ligne-titre">
                      {ligne ? <Tuile nom={choix} /> : null}
                      <span className="param-ligne-texte">{ligne ? <T>{ligne.nom}</T> : null}</span>
                    </h2>
                    <div className="param-contenu">
                      {choix === "apparence" ? <Apparence /> : null}
                      {choix === "langue" ? <Langue /> : null}
                      {choix === "contact" ? <Contact /> : null}
                      {choix === "apropos" ? <APropos /> : null}
                      {choix === "edition" ? <CodeEdition onOk={editionOk} /> : null}
                      {choix === "oeuf" ? <Transcripteur /> : null}
                      {choix === "systeme" ? <Systeme /> : null}
                    </div>
                  </div>
                )}
                <div className="param-pied">
                  <MatriceNom />
                </div>
              </div>
              <nav className="param-barre" aria-label="Barre d'application">
                <button type="button" className="param-barre-bouton" onClick={retour}>
                  <Icone nom="arrow_back" />
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
