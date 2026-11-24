"use client";

/**
 * Les paramètres du site, style Odyssée × tactique, sur fond noir pur.
 * Liste numérotée (icônes pleines blanches, séparations fines) : au survol la ligne se remplit d'ambre ;
 * au choix, les autres lignes partent en pivotant et le panneau de la rubrique s'ouvre en se décodant.
 * Rubriques : apparence, langue, contact, à propos, système, édition, easter egg.
 * Ouverture directe possible avec « ?parametres=<rubrique> ».
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { T, useLocale, useTraduire, type LocaleName } from "@/components/Locale";
import { Icone, type NomIcone } from "@/components/Icone";
import { LogoOdyssee } from "@/components/LogoOdyssee";
import { clic } from "@/lib/sons";

type Choix = "apparence" | "langue" | "contact" | "apropos" | "systeme" | "edition" | "oeuf";

const RUBRIQUES: { id: Choix; nom: string; icone: NomIcone; aide: string }[] = [
  { id: "apparence", nom: "apparence", icone: "palette", aide: "LE SITE CLASSIQUE, OU AAKANOS : LE SITE COMME UN TÉLÉPHONE." },
  { id: "langue", nom: "langue", icone: "language", aide: "CHOISIS LA LANGUE DU SITE." },
  { id: "contact", nom: "contact", icone: "mail", aide: "DEUX CHEMINS MÈNENT JUSQU’À FRANCK." },
  { id: "apropos", nom: "à propos", icone: "info", aide: "CE QU’EST CE SITE, ET COMMENT IL ÉVOLUE." },
  { id: "systeme", nom: "système", icone: "phone_iphone", aide: "ODYSSÉE · LE SYSTÈME DU SITE ET SES MISES À JOUR." },
  { id: "edition", nom: "édition", icone: "edit", aide: "RÉSERVÉ À FRANCK · CODE À 6 CHIFFRES." },
  { id: "oeuf", nom: "easter egg", icone: "egg_alt", aide: "ÉCRIS EN TAVISSIV, LIS EN AAKA." },
];
const CHOIX = RUBRIQUES.map((r) => r.id);

/** La fiche du système. Pour une nouvelle version, on l'ajoute en tête de liste. */
const SYSTEME = {
  nom: "Odyssée",
  versions: [
    { numero: "0.2", date: "24 novembre 2026" },
    { numero: "0.1", date: "23 novembre 2026" },
    { numero: "0.0", date: "9 novembre 2026" },
  ],
};
const TRAITS_CHEVAL = 19;
const CLE_APPARENCE = "fjch-apparence";
const CARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/%&";
const deux = (n: number) => String(n).padStart(2, "0");

/* ---------------- petits outils ---------------- */

/** Texte qui se décode lettre par lettre (en Tavissiv : affiché tel quel, dans son écriture). */
function Decode({ texte: brut, delai = 0, duree = 700 }: { texte: string; delai?: number; duree?: number }) {
  const { locale } = useLocale();
  const texte = useTraduire()(brut);
  const [aff, setAff] = useState(() => texte.replace(/[^\s]/g, " "));
  useEffect(() => {
    if (locale === "tavissiv") return;
    let raf = 0;
    const debut = performance.now() + delai;
    const pas = (n: number) => {
      const p = Math.min(1, Math.max(0, (n - debut) / duree));
      setAff(
        [...texte]
          .map((c, i) => (c === " " || i / texte.length < p ? c : p > 0 && Math.random() < 0.9 ? CARS[Math.floor(Math.random() * CARS.length)] : " "))
          .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [texte, delai, duree, locale]);
  if (locale === "tavissiv") return <T>{texte}</T>;
  return <>{aff}</>;
}

function Coins() {
  return (
    <>
      <i className="cn tl" />
      <i className="cn tr" />
      <i className="cn bl" />
      <i className="cn br" />
    </>
  );
}

/** Élément qui entre en tourniquet (animation Metro), décalé selon son rang. */
function Tq({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <div className={`tq ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}

function Segments({ p }: { p: number; n?: number; delai?: number }) {
  // Barre de chargement : un mélange du jeu 8 bits et des cœurs de jeu d'aventure.
  // Des cœurs en pixels, en relief comme des blocs, qui se remplissent un par un (le dernier à moitié).
  const id = useId().replace(/:/g, "");
  const n = 10;
  const v = Math.max(0, Math.min(1, p)) * n;
  return (
    <div className="coeurs" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
      {Array.from({ length: n }, (_, k) => {
        const f = Math.max(0, Math.min(1, Math.round((v - k) * 2) / 2));
        return (
          <svg key={k} viewBox="0 0 7 6" preserveAspectRatio="none" shapeRendering="crispEdges" style={{ animationDelay: `${k * 70}ms` }} className={f === 1 ? "plein" : f > 0 ? "moitie" : ""}>
            <defs>
              <clipPath id={`${id}-${k}`}>
                <rect x="0" y="0" width={7 * f} height="6" />
              </clipPath>
            </defs>
            <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill="#2a2d31" />
            <g clipPath={`url(#${id}-${k})`}>
              <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill="#8fd0ff" />
              <path d="M1 1h1v1H1zM2 0h1v1H2z" fill="#eef8ff" />
              <path d="M5 2h1v1H5zM4 3h1v1H4zM3 4h1v1H3z" fill="#4f9fdc" />
            </g>
          </svg>
        );
      })}
    </div>
  );
}

const GLYPHES: Record<string, string[]> = {
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  " ": ["00", "00", "00", "00", "00", "00", "00"],
};

/** Le nom de Franck en points : il s'allume point par point. */
function Matrice() {
  let n = 0;
  return (
    <div className="matrice" aria-label="Franck J.H Christen">
      {["FRANCK J.H", "CHRISTEN"].map((l) => (
        <div key={l} className="matrice-ligne">
          {[...l].map((c, k) => {
            const g = GLYPHES[c] ?? GLYPHES[" "]!;
            return (
              <div key={k} className="matrice-lettre" style={{ gridTemplateColumns: `repeat(${g[0]!.length}, 1fr)` }}>
                {g.flatMap((r, y) =>
                  [...r].map((b, x) => <i key={`${x}-${y}`} className={b === "1" ? "on" : ""} style={b === "1" ? ({ "--d": n++ } as CSSProperties) : undefined} />),
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------------- panneaux ---------------- */

function PanneauApparence() {
  const [verrou, setVerrou] = useState(false);
  const [mode, setMode] = useState<"classique" | "aakanos">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(CLE_APPARENCE) === "aakanos" ? "aakanos" : "classique";
    } catch {
      return "classique";
    }
  });
  const dansAakanOS = typeof window !== "undefined" && window.top !== window.self;
  const choisir = (m: "classique" | "aakanos") => {
    clic();
    setMode(m);
    try {
      localStorage.setItem(CLE_APPARENCE, m);
    } catch {}
    if (m === "classique" && dansAakanOS && window.top) window.top.location.assign("/");
  };
  return (
    <>
      <h3>
        <Decode texte="Le site, ou AakanOS" duree={500} />
      </h3>
      {(
        [
          { id: "classique", nom: "site classique", sous: "Odyssée" },
          { id: "aakanos", nom: "AakanOS", sous: "le site comme un téléphone" },
        ] as const
      ).map((o, k) => (
        <Tq key={o.id} i={k + 1}>
          <button type="button" role="radio" aria-checked={mode === o.id} className={`p2-radio${mode === o.id ? " sel" : ""}`} onClick={() => choisir(o.id)}>
            <i />
            <span>
              <T>{o.nom}</T>
            </span>
            <em>
              <T>{o.sous}</T>
            </em>
          </button>
        </Tq>
      ))}
      {!dansAakanOS ? (
        <Tq i={3}>
          <button
            type="button"
            className={`p2-action${verrou ? " rouge" : ""}`}
            onClick={() => {
              // 1er appui : l'avertissement en rouge ; 2e appui : on part vers AakanOS (qui demande le code).
              if (!verrou) return setVerrou(true);
              choisir("aakanos");
              window.location.assign("/aakanos");
            }}
          >
            <Icone nom={verrou ? "info" : "phone_iphone"} />
            {verrou ? <span className="p2-action-txt">Pour rentrer sur AakanOS, il vous faut un mot de passe caché sur le site. Appuyez une nouvelle fois pour entrer.</span> : <T>lancer AakanOS</T>}
          </button>
        </Tq>
      ) : null}
    </>
  );
}

function PanneauLangue() {
  const { locale, setLocale } = useLocale();
  return (
    <>
      <h3>
        <Decode texte="Choisis la langue du site" duree={500} />
      </h3>
      <Tq i={1}>
        <button type="button" role="radio" aria-checked={locale === "fr"} aria-label="Français (Bretagne)" className={`p2-radio${locale === "fr" ? " sel" : ""}`} onClick={() => (clic(), setLocale("fr"))} translate="no">
          <i />
          <span>
            <T>français</T>
          </span>
          <em>
            <T>Bretagne</T>
          </em>
        </button>
      </Tq>
      {(
        [
          ["de", "Deutsch", "Deutschland"],
          ["sv", "svenska", "Sverige"],
          ["br", "brezhoneg", "Breizh"],
        ] as [LocaleName, string, string][]
      ).map(([id, nom, pays], k) => (
        <Tq i={2 + k} key={id}>
          <button type="button" role="radio" aria-checked={locale === id} className={`p2-radio${locale === id ? " sel" : ""}`} onClick={() => (clic(), setLocale(id))} translate="no">
            <i />
            <span>{nom}</span>
            <em>{pays}</em>
          </button>
        </Tq>
      ))}
      <Tq i={5}>
        <button
          type="button"
          role="radio"
          aria-checked={locale === "tavissiv"}
          aria-label="Tavissiv (Aaka)"
          className={`p2-radio${locale === "tavissiv" ? " sel" : ""}`}
          onClick={() => (clic(), setLocale("tavissiv"))}
        >
          <i />
          <span className="tavissiv" lang="x-tavissiv">
            tavissiv
          </span>
          <em>
            <T>écriture Aaka</T>
          </em>
        </button>
      </Tq>
      <p className="p2-decode">
        <Decode texte="LE TAVISSIV S’ÉCRIT EN AAKA, L’ALPHABET DE FRANCK." delai={300} duree={900} />
        <b>▌</b>
      </p>
    </>
  );
}

function PanneauContact() {
  const canaux = [
    { icone: "mail" as const, nom: "e-mail", valeur: "franckjhchristen@gmail.com", lien: "mailto:franckjhchristen@gmail.com" },
    { icone: "photo_camera" as const, nom: "instagram", valeur: "@fjhchristenhmbk", lien: "https://instagram.com/fjhchristenhmbk" },
  ];
  return (
    <>
      <h3>
        <Decode texte="Deux chemins mènent jusqu’à Franck" duree={600} />
      </h3>
      {canaux.map((c, k) => (
        <Tq key={c.nom} i={k + 1}>
          <a className="p2-canal" href={c.lien} translate="no" target={c.lien.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => clic()}>
            <span className="p2-tuile">
              <Icone nom={c.icone} />
            </span>
            <span>
              <small>
                <T>{c.nom}</T>
              </small>
              <b>{c.valeur}</b>
            </span>
            <Icone nom="chevron_right" />
          </a>
        </Tq>
      ))}
      <p className="p2-texte">
        <T>Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à Franck.</T>
      </p>
    </>
  );
}

function PanneauAPropos() {
  return (
    <>
      <h3>
        <Decode texte="Ce site" duree={400} />
      </h3>
      <Tq i={1}>
        <p className="p2-texte">
          <T>Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.</T>
        </p>
      </Tq>
      <Tq i={2} className="p2-def">
        <small>
          <T>présentation</T>
        </small>
        <p className="p2-texte">
          <T>La vie, les projets et les annonces de Franck y prennent place.</T>
        </p>
      </Tq>
      <Tq i={3} className="p2-def">
        <small>
          <T>horizon</T>
        </small>
        <p className="p2-texte">
          <T>Le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les 7 jours.</T>
        </p>
      </Tq>
    </>
  );
}

function PanneauSysteme() {
  const [trace, setTrace] = useState(0);
  useEffect(() => {
    const debut = performance.now();
    let raf = 0;
    const pas = (n: number) => {
      const v = Math.min(TRAITS_CHEVAL, Math.ceil(((n - debut) / 3300) * TRAITS_CHEVAL));
      setTrace(v);
      if (v < TRAITS_CHEVAL) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, []);
  const actuelle = SYSTEME.versions[0]!;
  return (
    <div className="p2-sys">
      <div className="p2-sys-logo">
        <LogoOdyssee />
        <span className="p2-trace">
          TRACÉ {deux(trace)}/{TRAITS_CHEVAL}
        </span>
      </div>
      <div className="p2-sys-nom">
        <Decode texte={SYSTEME.nom.toUpperCase()} delai={200} duree={700} />
      </div>
      <div className="p2-sys-v">
        <T>version</T> {actuelle.numero} · FJHC
      </div>
      <Segments p={trace / TRAITS_CHEVAL} />
      <small className="p2-h">
        {"// "}
        <T>mise à jour</T>
      </small>
      {SYSTEME.versions.map((v, k) => (
        <Tq key={v.numero} i={k + 2}>
          <div className={`p2-ver${k === 0 ? " act" : ""}`}>
            <b>{v.numero}</b>
            <span>{v.date}</span>
            <em>{k === 0 ? <T>actuelle</T> : null}</em>
          </div>
        </Tq>
      ))}
    </div>
  );
}

function PanneauEdition({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState("");
  const [etat, setEtat] = useState<"" | "verif" | "erreur" | "ok">("");
  const [msg, setMsg] = useState("AUTHENTIFICATION REQUISE");
  const verifier = async (c: string) => {
    setEtat("verif");
    setMsg("VÉRIFICATION…");
    try {
      const r = await fetch("/api/edition/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const d = (await r.json()) as { ok?: boolean; jeton?: string; erreur?: string };
      if (!r.ok || !d.ok || !d.jeton) throw new Error(d.erreur || "Ce code n’est pas accepté.");
      setEtat("ok");
      setMsg("ACCÈS AUTORISÉ");
      clic();
      window.setTimeout(() => {
        onOk();
        window.dispatchEvent(new CustomEvent("fjch-edition-ok", { detail: d.jeton }));
      }, 600);
    } catch (e) {
      setEtat("erreur");
      setMsg(((e as Error).message || "Ce code n’est pas accepté.").toUpperCase());
      window.setTimeout(() => {
        setCode("");
        setEtat("");
      }, 700);
    }
  };
  const appui = (k: string) => {
    if (etat === "verif" || etat === "ok") return;
    if (k === "⌫") return setCode((c) => c.slice(0, -1));
    if (code.length >= 6) return;
    const c = code + k;
    setCode(c);
    if (c.length === 6) void verifier(c);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) appui(e.key);
      else if (e.key === "Backspace") {
        e.preventDefault();
        appui("⌫");
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  return (
    <>
      <h3>
        <Decode texte="Code d’accès · 6 chiffres" duree={500} />
      </h3>
      <div className={`p2-code ${etat}`} aria-label={`${code.length} chiffres sur 6`}>
        {Array.from({ length: 6 }, (_, k) => (
          <i key={k} className={k < code.length ? "plein" : ""}>
            {k < code.length ? "•" : ""}
          </i>
        ))}
      </div>
      <div className="p2-pave">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k ? (
            <button type="button" key={i} onClick={() => appui(k)} aria-label={k === "⌫" ? "Effacer" : k}>
              {k === "⌫" ? <Icone nom="backspace" /> : k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <p className={`p2-decode centre ${etat}`} key={msg}>
        <Decode texte={msg} duree={400} />
        <b>▌</b>
      </p>
    </>
  );
}

function PanneauAaka() {
  const [texte, setTexte] = useState("franck j.h christen h.m.b.k");
  return (
    <>
      <h3>
        <Decode texte="Écris en Tavissiv, lis en Aaka" duree={600} />
      </h3>
      <p className="p2-texte petit">
        <T>Écris en Tavissiv avec les lettres latines : il s&apos;affiche aussitôt dans l&apos;écriture Aaka.</T>
      </p>
      <Tq i={1}>
        <textarea className="p2-saisie" value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} spellCheck={false} aria-label="Texte à transcrire" />
      </Tq>
      <Tq i={2} className="p2-aaka">
        <small>{"// AAKA"}</small>
        <p className="tavissiv" lang="x-tavissiv" aria-live="polite">
          {texte || " "}
        </p>
      </Tq>
    </>
  );
}

/* ---------------- la fenêtre ---------------- */

export function Parametres() {
  const [ouvertFenetre, setOuvertFenetre] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [partant, setPartant] = useState<Choix | null>(null);
  const [survol, setSurvol] = useState(0);
  const [fermant, setFermant] = useState(false);
  const [heure, setHeure] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const demande = params.get("parametres");

  const ouvrirSur = (id: Choix | null) => {
    setOuvertFenetre(true);
    setChoix(id);
    if (id) setSurvol(CHOIX.indexOf(id));
  };

  /** Fermeture : le rideau remonte, puis la fenêtre disparaît. */
  const fermer = () => {
    clic();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOuvertFenetre(false);
      return;
    }
    setFermant(true);
    window.setTimeout(() => {
      setFermant(false);
      setOuvertFenetre(false);
      setChoix(null);
    }, 320);
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

  // Pendant l'ouverture : le défilement de la page est bloqué, Échap revient en arrière, l'heure tourne.
  useEffect(() => {
    if (!ouvertFenetre) return;
    const lenis = (window as Window & { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("param-ouvert");
    const maj = () => {
      const d = new Date();
      setHeure(`${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}`);
    };
    maj();
    const horloge = window.setInterval(maj, 1000);
    return () => {
      window.clearInterval(horloge);
      document.documentElement.classList.remove("param-ouvert");
      document.documentElement.style.overflow = avant;
      lenis?.start();
    };
  }, [ouvertFenetre]);

  const choisir = (id: Choix) => {
    clic();
    setPartant(id);
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        setPartant(null);
        setChoix(id);
      },
      calme ? 0 : 300,
    );
  };
  const retour = () => {
    if (choix) {
      clic();
      setChoix(null);
    } else fermer();
  };

  useEffect(() => {
    if (!ouvertFenetre) return;
    const k = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (e.key === "Escape") return retour();
      if (choix || ["INPUT", "TEXTAREA"].includes(cible.tagName)) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSurvol((s) => (s + 1) % RUBRIQUES.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSurvol((s) => (s - 1 + RUBRIQUES.length) % RUBRIQUES.length);
      } else if (e.key === "Enter" && cible.tagName !== "BUTTON") choisir(RUBRIQUES[survol]!.id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const editionOk = () => {
    setOuvertFenetre(false);
    setChoix(null);
    // L'outil d'édition (citations, projets) est sur sa propre page.
    if (pathname !== "/edition") {
      try {
        sessionStorage.setItem("fjch-edition-ouvrir", "1");
      } catch {
        /* navigation privée */
      }
      window.location.assign("/edition");
    }
  };

  const lignes = choix ? RUBRIQUES.filter((r) => r.id === choix) : RUBRIQUES;
  const rang = (id: Choix) => CHOIX.indexOf(id);

  return (
    <>
      <button
        type="button"
        className="param-ouvrir"
        aria-label="Paramètres"
        aria-expanded={ouvertFenetre}
        onClick={() => {
          clic();
          ouvrirSur(null);
        }}
      >
        <Icone nom="settings" />
      </button>
      {ouvertFenetre
        ? createPortal(
            <div className={`ptac${fermant ? " ferme" : ""}${choix ? " ouvert" : ""}`} role="dialog" aria-modal="true" aria-label="Paramètres">
              <header className="ptac-haut">
                <span className="ptac-logo">
                  <LogoOdyssee /> ODYSSÉE
                </span>
                <span className="cache-mobile">{SYSTEME.nom.toUpperCase()} {SYSTEME.versions[0]!.numero}</span>
                <span className="cache-mobile">CONNEXION ÉTABLIE</span>
                <span className="ambre">{heure}</span>
                <span className="droite cache-mobile">FJHC // H.M.B.K.</span>
              </header>

              <div className="ptac-defile" data-lenis-prevent="">
                <div className="ptac-contenu">
                  <div className="ptac-titre">
                    <small>{"// OPTIONS"}</small>
                    <h2>
                      <T>paramètres</T>
                    </h2>
                  </div>

                  <div className="ptac-gauche">
                    <div className="p2-liste" key={choix ?? "liste"}>
                      {lignes.map((r) => {
                        const k = rang(r.id);
                        const sel = choix ? true : survol === k;
                        return (
                          <Tq key={r.id} i={choix ? 0 : k}>
                            <button
                              type="button"
                              className={`p2-ligne${sel ? " sel" : ""}${partant && partant !== r.id ? " part" : ""}${partant === r.id ? " choisie" : ""}`}
                              onMouseEnter={() => {
                                if (!choix) setSurvol(k);
                              }}
                              onFocus={() => {
                                if (!choix) setSurvol(k);
                              }}
                              onClick={() => (choix ? retour() : choisir(r.id))}
                            >
                              <b className="p2-num">{deux(k + 1)}</b>
                              <span className="p2-tuile">
                                <Icone nom={r.icone} />
                              </span>
                              <span className="p2-nom">
                                <T>{r.nom}</T>
                              </span>
                              <span className="p2-chev">
                                <Icone nom={choix ? "close" : "chevron_right"} />
                              </span>
                              <Coins />
                            </button>
                          </Tq>
                        );
                      })}
                    </div>
                    {!choix ? <Matrice /> : null}
                  </div>

                  <div className="ptac-droite">
                    {choix ? (
                      <div className="p2-panneau" key={choix}>
                        <Coins />
                        <small>
                          {`// ${deux(rang(choix) + 1)} · `}
                          <T>{RUBRIQUES[rang(choix)]!.nom}</T>
                        </small>
                        {choix === "apparence" ? <PanneauApparence /> : null}
                        {choix === "langue" ? <PanneauLangue /> : null}
                        {choix === "contact" ? <PanneauContact /> : null}
                        {choix === "apropos" ? <PanneauAPropos /> : null}
                        {choix === "systeme" ? <PanneauSysteme /> : null}
                        {choix === "edition" ? <PanneauEdition onOk={editionOk} /> : null}
                        {choix === "oeuf" ? <PanneauAaka /> : null}
                        <button type="button" className="p2-fermer" onClick={retour}>
                          <Icone nom="arrow_back" /> <T>retour</T>
                        </button>
                      </div>
                    ) : (
                      <div className="p2-panneau p2-apercu cache-mobile" key={survol}>
                        <Coins />
                        <small>
                          {`// ${deux(survol + 1)} · `}
                          <T>{RUBRIQUES[survol]!.nom}</T>
                        </small>
                        <p className="p2-decode">
                          <Decode texte={RUBRIQUES[survol]!.aide} duree={450} />
                          <b>▌</b>
                        </p>
                        <span className="p2-touche">[ENTRÉE] OU TOUCHER POUR OUVRIR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <footer className="ptac-bas">
                <span className="cache-mobile">[↑ ↓] CHOISIR</span>
                <span className="cache-mobile">[ENTRÉE] OUVRIR</span>
                <span className="cache-mobile">[ÉCHAP] {choix ? "RETOUR" : "FERMER"}</span>
                <button type="button" className="droite ptac-quitter" onClick={retour}>
                  <Icone nom={choix ? "arrow_back" : "close"} /> {choix ? <T>retour</T> : "fermer"}
                </button>
              </footer>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
