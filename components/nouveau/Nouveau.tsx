"use client";

/**
 * Page test : le nouveau site, avec le style et les animations des paramètres partout.
 * Fond noir pur, barre du haut (constellation + cheval + ODYSSÉE), menu numéroté,
 * Accueil, Qui suis-je, Projets (tuiles de mission + intérieur), recherche, vrais Paramètres.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icone, type NomIcone } from "@/components/Icone";
import { LocaleProvider } from "@/components/Locale";
import { Parametres } from "@/components/Parametres";
import { Logo } from "@/components/Logo";
import { LogoOdyssee } from "@/components/LogoOdyssee";
import { CompteEndur } from "@/components/Countdown";
import { ProjetsPanorama } from "@/components/ProjetsPanorama";
import { TopBlur } from "@/components/TopBlur";

type Vue = "accueil" | "qui" | "projets";
type Media = { id: string; kind: "photo" | "video" | "audio" | "fichier"; nom: string };
type Etoile = { id: string; titre: string; texte: string; auteur: string; date: string; genre?: "citation" | "projet"; medias: Media[]; coeurs?: number };
type Rubrique = "citations" | "projets" | "evenements";

const OUVERTURE = new Date("2026-12-01T00:00:00+01:00").getTime();
const DEBUT_ENDU = new Date("2026-07-23T00:00:00+02:00").getTime();
const AUBE_DEBUT = new Date("2026-12-03T00:00:00+01:00").getTime();
const AUBE_FIN = new Date("2027-06-03T00:00:00+02:00").getTime();
const CARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/%&";
const deux = (n: number) => String(n).padStart(2, "0");

/* ---------- sons ---------- */
let audio: AudioContext | null = null;
function bip(f = 1400, d = 0.035, v = 0.03, type: OscillatorType = "square") {
  try {
    if (localStorage.getItem("tac-sons") === "off") return;
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(v, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + d);
  } catch {}
}
const sonSurvol = () => bip(1800, 0.02, 0.018);
const sonValide = () => {
  bip(900, 0.05, 0.035);
  setTimeout(() => bip(1500, 0.06, 0.03), 55);
};
const sonRetour = () => bip(700, 0.05, 0.03);

/* ---------- outils ---------- */
function useMaintenant() {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    const maj = () => setT(Date.now());
    maj();
    const id = setInterval(maj, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
function decompte(t: number | null, cible: number) {
  const r = Math.max(0, cible - (t ?? cible));
  const s = Math.floor(r / 1000);
  return { j: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60, fini: t != null && r <= 0 };
}

function Decode({ texte, delai = 0, duree = 700 }: { texte: string; delai?: number; duree?: number }) {
  const [aff, setAff] = useState(() => texte.replace(/[^\s]/g, " "));
  useEffect(() => {
    let raf = 0;
    const debut = performance.now() + delai;
    const pas = (n: number) => {
      const p = Math.min(1, Math.max(0, (n - debut) / duree));
      setAff([...texte].map((c, i) => (c === " " || c === "\n" || i / texte.length < p ? c : p > 0 && Math.random() < 0.9 ? CARS[Math.floor(Math.random() * CARS.length)] : " ")).join(""));
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [texte, delai, duree]);
  return <>{aff}</>;
}

/** Nombre qui se décode puis compte jusqu'à sa valeur. */
function Compteur({ valeur, delai = 0 }: { valeur: number; delai?: number }) {
  const [v, setV] = useState<string>("··");
  useEffect(() => {
    let raf = 0;
    const debut = performance.now() + delai;
    const pas = (n: number) => {
      const e = n - debut;
      if (e < 0) setV("··");
      else if (e < 220) setV(CARS[Math.floor(Math.random() * 26)]! + CARS[26 + Math.floor(Math.random() * 10)]!);
      else {
        const p = Math.min(1, (e - 220) / 600);
        setV(deux(Math.round(valeur * (1 - Math.pow(1 - p, 3)))));
        if (p >= 1) return;
      }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [valeur, delai]);
  return <>{v}</>;
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
          <svg key={k} viewBox="0 0 7 6" shapeRendering="crispEdges" style={{ animationDelay: `${k * 70}ms` }} className={f === 1 ? "plein" : f > 0 ? "moitie" : ""}>
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
function Matrice() {
  let n = 0;
  return (
    <div className="matrice" aria-hidden="true">
      {["FRANCK J.H", "CHRISTEN"].map((l) => (
        <div key={l} className="matrice-ligne">
          {[...l].map((c, k) => {
            const g = GLYPHES[c] ?? GLYPHES[" "]!;
            return (
              <div key={k} className="matrice-lettre" style={{ gridTemplateColumns: `repeat(${g[0]!.length}, 1fr)` }}>
                {g.flatMap((r, y) => [...r].map((b, x) => <i key={`${x}-${y}`} className={b === "1" ? "on" : ""} style={b === "1" ? ({ "--d": n++ } as CSSProperties) : undefined} />))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Une ligne numérotée, comme dans les paramètres. */
function Ligne({
  n,
  icone,
  children,
  valeur,
  sel,
  onClick,
  onEnter,
  fermer,
  className = "",
}: {
  n: number;
  icone?: NomIcone;
  children: ReactNode;
  valeur?: ReactNode;
  sel?: boolean;
  onClick?: () => void;
  onEnter?: () => void;
  fermer?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={`p2-ligne${sel ? " sel" : ""} ${className}`} onMouseEnter={onEnter} onFocus={onEnter} onClick={onClick}>
      <b className="p2-num">{deux(n)}</b>
      {icone ? (
        <span className="p2-tuile">
          <Icone nom={icone} />
        </span>
      ) : null}
      <span className="p2-nom">{children}</span>
      {valeur !== undefined ? <em>{valeur}</em> : null}
      <span className="p2-chev">
        <Icone nom={fermer ? "close" : "chevron_right"} />
      </span>
      <Coins />
    </button>
  );
}

/* ---------- page ---------- */

export function Nouveau({ vue = "accueil" }: { vue?: Vue }) {
  return (
    <LocaleProvider>
      <Site depart={vue} />
    </LocaleProvider>
  );
}

const CHEMIN: Record<Vue, string> = { accueil: "/", qui: "/qui-suis-je", projets: "/projets" };

function Site({ depart }: { depart: Vue }) {
  const t = useMaintenant();
  const [pret, setPret] = useState(false);
  const [vue, setVue] = useState<Vue>(depart);
  const [etoiles, setEtoiles] = useState<Etoile[] | null>(null);
  const [rubrique, setRubrique] = useState<Rubrique | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [jingle, setJingle] = useState(0);
  const finJingle = useCallback(() => setJingle(0), []);
  const [traceOdy, setTraceOdy] = useState(0);
  useEffect(() => {
    // Le contenu est déjà là (pour les moteurs de recherche) ; ses animations repartent
    // quand le chargement PS2 s'efface.
    const racine = document.documentElement;
    const fini = () => !racine.classList.contains("intro-joue");
    let raf = 0;
    const obs = new MutationObserver(() => {
      if (fini()) {
        obs.disconnect();
        raf = requestAnimationFrame(() => setPret(true));
      }
    });
    if (fini()) raf = requestAnimationFrame(() => setPret(true));
    else obs.observe(racine, { attributes: true, attributeFilter: ["class"] });
    let vivant = true;
    fetch("/api/etoiles")
      .then((r) => r.json())
      .then((d: { etoiles?: Etoile[] }) => {
        if (vivant) setEtoiles(d.etoiles ?? []);
      })
      .catch(() => {
        if (vivant) setEtoiles([]);
      });
    return () => {
      vivant = false;
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Les changements de page mettent l'adresse à jour ; « précédent » du navigateur fonctionne.
  useEffect(() => {
    const p = () => {
      const v = (Object.keys(CHEMIN) as Vue[]).find((k) => CHEMIN[k] === window.location.pathname);
      if (v) {
        setVue(v);
        setRubrique(null);
      }
    };
    window.addEventListener("popstate", p);
    return () => window.removeEventListener("popstate", p);
  }, []);

  const aller = useCallback((v: Vue, r: Rubrique | null = null) => {
    sonValide();
    if (window.location.pathname !== CHEMIN[v]) window.history.pushState(null, "", CHEMIN[v]);
    setVue(v);
    setRubrique(r);
    window.scrollTo({ top: 0 });
  }, []);
  const retour = useCallback(() => {
    sonRetour();
    if (rubrique) setRubrique(null);
    else {
      setVue("accueil");
      window.history.pushState(null, "", "/");
    }
  }, [rubrique]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (document.documentElement.classList.contains("param-ouvert") || recherche) return;
      if (e.key === "Escape" && vue !== "accueil") retour();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [retour, vue, recherche]);

  const citations = useMemo(() => (etoiles ?? []).filter((e) => e.genre !== "projet" && e.texte?.trim()), [etoiles]);
  const projets = useMemo(() => (etoiles ?? []).filter((e) => e.genre === "projet"), [etoiles]);
  const d = t ? new Date(t) : null;
  const heure = d ? `${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}` : "--:--:--";
  const MENU: { id: Vue; nom: string; icone: NomIcone }[] = [
    { id: "accueil", nom: "ACCUEIL", icone: "home" },
    { id: "qui", nom: "QUI SUIS-JE", icone: "person" },
    { id: "projets", nom: "PROJETS", icone: "star" },
  ];

  return (
    <div className={`n${pret ? " pret" : ""}`}>
      <TopBlur />
      <header className="n-tete">
<span className="n-logos">
          <button
            type="button"
            className="n-logo"
            aria-label="Accueil"
            onClick={(e) => {
              const svg = e.currentTarget.querySelector("svg");
              if (svg) {
                svg.classList.remove("logo-rejoue");
                void svg.getBoundingClientRect();
                svg.classList.add("logo-rejoue");
              }
              setJingle((k) => k + 1);
              aller("accueil");
            }}
          >
            <Logo anime />
          </button>
          <i className="n-logos-sep" />
          <button type="button" className="n-logo-ody" aria-label="Odyssée" onClick={() => (sonValide(), setTraceOdy((k) => k + 1))}>
            <LogoOdyssee key={traceOdy} />
          </button>
        </span>
        <span className="n-outils">
          <span className="n-heure">{heure}</span>
          <button type="button" className="n-ic" aria-label="Rechercher" onClick={() => (sonValide(), setRecherche(true))}>
            <Icone nom="search" />
          </button>
          <Parametres />
        </span>
        <nav className="n-liens" aria-label="Navigation principale">
          {MENU.map((m, k) => (
            <button key={m.id} type="button" aria-current={vue === m.id ? "page" : undefined} style={{ "--i": k } as CSSProperties} onMouseEnter={sonSurvol} onClick={() => aller(m.id)}>
              {m.nom.toLowerCase()}
            </button>
          ))}
        </nav>
      </header>

      {(
        <main className="n-scene" key={`${vue}-${pret ? 1 : 0}`}>
          {vue === "accueil" ? <Accueil /> : null}
          {vue === "qui" ? <Qui /> : null}
          {vue === "projets" ? (
            <>
              <section className="n-sec n-pano">
                <CompteEndur>
                  <ProjetsPanorama
                    comptes={[
                      { nom: "citations", nombre: citations.length, couleur: "#b9a07a" },
                      { nom: "projets", nombre: projets.length, couleur: "#1ba1e2" },
                    ]}
                  />
                </CompteEndur>
              </section>
              <Tuiles t={t} citations={citations} projets={projets} charge={etoiles === null} initial={rubrique} />
            </>
          ) : null}
            <Suivant nom={vue === "accueil" ? "QUI SUIS-JE" : vue === "qui" ? "PROJETS" : "ACCUEIL"} aller={() => aller(vue === "accueil" ? "qui" : vue === "qui" ? "projets" : "accueil")} />
            <Pied />
        </main>
      )}

      <footer className="n-bas">
        <span className="cache-mobile">[ÉCHAP] RETOUR</span>
        <span className="cache-mobile">© FRANCK J.H. CHRISTEN</span>
        <span className="droite">ODYSSÉE 0.2</span>
      </footer>



      {jingle ? <Jingle key={jingle} fin={finJingle} /> : null}

      {recherche ? <Recherche etoiles={etoiles ?? []} fermer={() => (sonRetour(), setRecherche(false))} aller={(r) => (setRecherche(false), aller("projets", r))} /> : null}

    </div>
  );
}

/* ---------- Accueil ---------- */

function Accueil() {
  const [ouvert, setOuvert] = useState(-1);
  return (
    <>
      <section className="n-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/franck-enfant-900.webp" alt="" />
        <div className="n-hero-voile" />
        <Coins />
        <div className="n-hero-txt">
          <small>
            <Decode texte="// IDENTIFIÉ" duree={500} />
          </small>
          <h1 className="n-nom">
            <Decode texte="FRANCK J.H." delai={150} />
            <br />
            <Decode texte="CHRISTEN" delai={300} />
            <span>
              <Decode texte="H.M.B.K." delai={450} />
            </span>
          </h1>
          <p className="n-mono">
            <Decode texte="POLYMATHE" delai={650} />
          </p>
        </div>
      </section>

      <Section n="01" titre="BIENVENUE">
        <Tq i={0} className="p2-panneau n-bienvenue">
          <Coins />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/blason-christen.jpg" alt="Blason des Christen" />
          <i className="n-sep2" />
          <span className="n-constel-franck" aria-label="La constellation de Franck">
            <Logo anime />
          </span>
        </Tq>
        <p className="n-etiquette">LE BLASON DES CHRISTEN · LA CONSTELLATION DE FRANCK</p>
      </Section>

      <Section n="02 · EXPLORER" titre="FRANCK J.H. CHRISTEN">
        <div className="p2-liste n-accordeon">
          {ECOUTES.map((r, k) => (
            <Tq key={r.titre} i={k}>
              <div className={`n-ac n-ecoute${ouvert === k ? " ouvert" : ""}`}>
                <div className="n-ac-img" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" style={{ objectPosition: r.cadre }} />
                </div>
                <div className="n-ac-espace" />
                <Ligne
                  n={k + 1}
                  sel={ouvert === k}
                  onClick={() => {
                    sonValide();
                    setOuvert(ouvert === k ? -1 : k);
                  }}
                  onEnter={() => {
                    if (ouvert !== k) sonSurvol();
                  }}
                  className="n-ac-tete"
                >
                  {r.titre}
                </Ligne>
                <div className="n-ac-corps">
                  <p>{r.texte}</p>
                  <Lecteur src={r.audio} actif={ouvert === k} />
                  <small className="n-ecoute-legende">{r.legende}</small>
                </div>
              </div>
            </Tq>
          ))}
        </div>
      </Section>
    </>
  );
}

/** Les enregistrements de l'accueil : on ouvre, on regarde la peinture, on écoute. */
const ECOUTES = [
  {
    titre: "LA POLYMATHIE",
    texte: "Chercher partout, relier ce qui semble séparé.",
    image: "/explorer/polymathie.webp",
    cadre: "50% 28%",
    audio: "/explorer/polymathie.mp3",
    legende: "Benjamin Franklin, par David Martin (1767)",
  },
  {
    titre: "L’AUTOROMANTISME",
    texte: "Die Autoromantik nach Franck Christen. Avec Freya.",
    image: "/explorer/autoromantisme.webp",
    cadre: "50% 50%",
    audio: "/explorer/autoromantisme.mp3",
    legende: "Les mains qui se croisent et se serrent",
  },
];

function minutes(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Lecteur audio du site : lecture / pause, barre que l'on touche pour avancer, temps. Se met en pause si on referme. */
function Lecteur({ src, actif }: { src: string; actif: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [lit, setLit] = useState(false);
  const [t, setT] = useState(0);
  const [duree, setDuree] = useState(0);

  useEffect(() => {
    if (!actif) ref.current?.pause();
  }, [actif]);

  const basculer = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      // une seule écoute à la fois
      document.querySelectorAll<HTMLAudioElement>("audio.n-lecteur-son").forEach((x) => x !== a && x.pause());
      void a.play().catch(() => {});
    } else a.pause();
  };

  return (
    <div className={`n-lecteur${lit ? " lit" : ""}`}>
      <audio
        ref={ref}
        className="n-lecteur-son"
        src={src}
        preload="metadata"
        onPlay={() => setLit(true)}
        onPause={() => setLit(false)}
        onEnded={() => setLit(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuree(e.currentTarget.duration)}
      />
      <button type="button" className="n-lecteur-btn" onClick={basculer} aria-label={lit ? "Pause" : "Écouter"}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          {lit ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4.5v15l12.5-7.5z" />}
        </svg>
      </button>
      <span className="n-lecteur-t">{minutes(t)}</span>
      <input
        type="range"
        className="n-lecteur-barre"
        min={0}
        max={duree || 1}
        step={0.1}
        value={t}
        aria-label="Avancer dans l’enregistrement"
        style={{ ["--p" as string]: `${duree ? (t / duree) * 100 : 0}%` } as CSSProperties}
        onChange={(e) => {
          const a = ref.current;
          const v = Number(e.target.value);
          if (a) a.currentTime = v;
          setT(v);
        }}
      />
      <span className="n-lecteur-t">{minutes(duree)}</span>
    </div>
  );
}

/**
 * Le jingle du logo, comme dans la vidéo de Franck : sur le noir, la constellation se trace (1,5 s),
 * reste un instant, puis se floute et s'efface (2,1 → 2,7 s) pendant que la musique finit.
 */
function Jingle({ fin }: { fin: () => void }) {
  useEffect(() => {
    let son: HTMLAudioElement | null = null;
    let muet = false;
    try {
      muet = localStorage.getItem("tac-sons") === "off";
    } catch {}
    if (!muet) {
      son = new Audio("/audio/jingle.mp3");
      son.volume = 0.8;
      void son.play().catch(() => {});
    }
    const id = window.setTimeout(fin, 3300);
    return () => {
      window.clearTimeout(id);
      if (son) {
        const s = son;
        // on laisse la fin du jingle se faire entendre en douceur
        const f = window.setInterval(() => {
          s.volume = Math.max(0, s.volume - 0.08);
          if (s.volume <= 0) {
            s.pause();
            window.clearInterval(f);
          }
        }, 120);
      }
    };
  }, [fin]);
  return (
    <div className="n-jingle" onClick={fin} aria-hidden="true">
      <Logo className="n-jingle-logo" anime />
    </div>
  );
}

function Section({ n, titre, children }: { n: string; titre: string; children: ReactNode }) {
  return (
    <section className="n-sec">
      <div className="ptac-titre n-titre">
        <small>{`// ${n}`}</small>
        <h2>
          <Decode texte={titre} duree={550} />
        </h2>
      </div>
      {children}
    </section>
  );
}

function Suivant({ nom, aller }: { nom: string; aller: () => void }) {
  return (
    <section className="n-sec">
      <button type="button" className="n-suiv" onClick={aller} onMouseEnter={sonSurvol}>
        <small>{"// SUIVANT"}</small>
        <b>{nom}</b>
        <Icone nom="chevron_right" />
        <Coins />
      </button>
    </section>
  );
}

/** Code pixelisé (illisible) : un toucher le rend net une demi-seconde, puis il se repixelise. Reflet vert blanc verdâtre. */
function Secret({ texte }: { texte: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const [net, setNet] = useState(false);
  useEffect(() => {
    const c = toile.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const W = 76;
    const H = 22;
    const peindre = (t: number) => {
      const r = window.devicePixelRatio || 1;
      const echelle = net ? r : 0.16; // très peu de pixels quand c'est caché
      c.width = Math.max(1, Math.round(W * echelle));
      c.height = Math.max(1, Math.round(H * echelle));
      ctx.setTransform(echelle, 0, 0, echelle, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const x = ((t / 1600) % 1) * W * 2 - W;
      const g = ctx.createLinearGradient(x, 0, x + W, 0);
      g.addColorStop(0, "#3fd47a");
      g.addColorStop(0.5, "#f2fff6");
      g.addColorStop(1, "#3fd47a");
      ctx.fillStyle = g;
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(texte.split("").join(" "), W / 2, H / 2 + 1);
      raf = requestAnimationFrame(peindre);
    };
    raf = requestAnimationFrame(peindre);
    return () => cancelAnimationFrame(raf);
  }, [net, texte]);
  useEffect(() => {
    if (!net) return;
    const id = window.setTimeout(() => setNet(false), 500);
    return () => window.clearTimeout(id);
  }, [net]);
  return (
    <button type="button" className={`n-secret${net ? " net" : ""}`} onClick={() => setNet(true)} aria-label="Code caché : toucher pour l’afficher un instant">
      <canvas ref={toile} />
    </button>
  );
}

function Pied() {
  return (
    <footer className="n-pied">
      <Matrice />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/blason-christen.jpg" alt="" className="n-blason" />
      <p className="n-code">
        CODE D’AAKANOS · <Secret texte="6458" />
      </p>
      <p>© FRANCK J.H. CHRISTEN H.M.B.K. · ODYSSÉE 0.2</p>
    </footer>
  );
}

/* ---------- Qui suis-je ---------- */

const ALBUM = [
  { kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg", nom: "VIDÉO" },
  { kind: "photo" as const, src: "/media/franck.jpg", poster: "/media/franck.jpg", nom: "PHOTO" },
];
const RAPPORT = [
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K.",
  "Je suis né en 2007 en France.",
  "Je suis né différent : TTHPI, profondément et exceptionnellement surdoué, et TDAH.",
  "Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder.",
  "Depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment.",
  "Ce site, il sert à quoi ?",
  "À publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymath au quotidien.",
];

function Qui() {
  const [info, setInfo] = useState(false);
  return (
    <>
      <Section n="DOSSIER 01" titre="QUI SUIS-JE">
        <Album />
      </Section>
      <section className="n-sec">
        <Tq i={1} className="p2-panneau n-rapport">
          <Coins />
          <small>{"// RAPPORT"}</small>
          {RAPPORT.map((l, k) => (
            <p key={k} className={k === 5 ? "q" : k === 6 ? "r" : ""} style={{ animationDelay: `${300 + k * 140}ms` }}>
              <b>{deux(k + 1)}</b>
              {l}
            </p>
          ))}
          <p className="p2-decode">
            <Decode texte="FIN DU RAPPORT" delai={1400} duree={500} />
            <b>▌</b>
          </p>
        </Tq>
      </section>
      <section className="n-sec">
        <div className="p2-liste">
          <Tq i={2}>
            <Ligne n={1} icone="info" sel={info} fermer={info} onClick={() => (sonValide(), setInfo((o) => !o))}>
              INFORMATION
            </Ligne>
          </Tq>
          {info ? (
            <div className="n-info">
              <p className="p2-texte">
                Ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. Suivez le compte Instagram de Franck et peut-être serez-vous averti des nouveautés.
              </p>
              <a className="p2-canal" href="https://www.instagram.com/fjhchristenhmbk/" target="_blank" rel="noopener noreferrer">
                <span className="p2-tuile">
                  <Icone nom="photo_camera" />
                </span>
                <span>
                  <small>INSTAGRAM</small>
                  <b>@fjhchristenhmbk</b>
                </span>
                <Icone nom="chevron_right" />
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

/** L'album en « stories » : barres en segments, toucher à gauche / à droite, pause, son. */
function Album() {
  const [k, setK] = useState(0);
  const [p, setP] = useState(0);
  const [pause, setPause] = useState(false);
  const [muet, setMuet] = useState(true);
  const [duree, setDuree] = useState(5000);
  const m = ALBUM[k]!;
  useEffect(() => {
    if (pause) return;
    let raf = 0;
    let avant = performance.now();
    const pas = (n: number) => {
      const dt = n - avant;
      avant = n;
      setP((x) => {
        const v = x + dt / (m.kind === "video" ? duree : 5000);
        if (v >= 1) {
          setK((i) => (i + 1) % ALBUM.length);
          return 0;
        }
        return v;
      });
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [pause, k, duree, m.kind]);
  const aller = (pasK: number) => {
    sonSurvol();
    setK((i) => (i + pasK + ALBUM.length) % ALBUM.length);
    setP(0);
  };
  return (
    <Tq i={0} className="n-story">
      <div className="n-story-segs">
        {ALBUM.map((_, i) => (
          <i key={i}>
            <b style={{ width: `${i < k ? 100 : i === k ? p * 100 : 0}%` }} />
          </i>
        ))}
      </div>
      {m.kind === "video" ? (
        <video key={m.src} src={m.src} poster={m.poster} autoPlay loop playsInline muted={muet} onLoadedMetadata={(e) => setDuree(e.currentTarget.duration * 1000 || 5000)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={m.src} src={m.src} alt="" />
      )}
      <button type="button" className="n-story-g" aria-label="Précédent" onClick={() => aller(-1)} />
      <button type="button" className="n-story-d" aria-label="Suivant" onClick={() => aller(1)} />
      <div className="n-story-bas">
        <span>
          {m.nom} · {deux(k + 1)}/{deux(ALBUM.length)}
        </span>
        <button type="button" aria-label={pause ? "Lecture" : "Pause"} onClick={() => setPause((x) => !x)}>
          <Icone nom={pause ? "play_arrow" : "pause"} />
        </button>
        <button type="button" aria-label={muet ? "Activer le son" : "Couper le son"} onClick={() => setMuet((x) => !x)}>
          <Icone nom={muet ? "volume_off" : "volume_up"} />
        </button>
      </div>
      <Coins />
    </Tq>
  );
}

function Titre({ sous, children }: { sous: string; children: string }) {
  return (
    <div className="ptac-titre n-titre">
      <small>
        <Decode texte={sous} duree={450} />
      </small>
      <h2>
        <Decode texte={children} delai={80} duree={550} />
      </h2>
    </div>
  );
}

/* ---------- Projets : tuiles ---------- */

function Tuiles({ t, citations, projets, charge, initial }: { t: number | null; citations: Etoile[]; projets: Etoile[]; charge: boolean; initial: Rubrique | null }) {
  const [face, setFace] = useState(0);
  const [sel, setSel] = useState<Rubrique | null>(initial);
  useEffect(() => {
    const id = setInterval(() => setFace((f) => f + 1), 5000);
    return () => clearInterval(id);
  }, []);
  const c = decompte(t, OUVERTURE);
  const pE = t ? Math.min(1, Math.max(0, (t - DEBUT_ENDU) / (OUVERTURE - DEBUT_ENDU))) : 0;
  const finis = t == null ? 0 : [OUVERTURE, AUBE_FIN].filter((f) => t >= f).length;
  const derCit = citations[0];
  const derPro = projets[0];
  const choisir = (r: Rubrique) => {
    sonValide();
    setSel(r);
  };
  const etat = (r: Rubrique) => (sel === r ? " grand" : sel ? " reduit" : "");
  const dedans = (r: Rubrique) => (
    <div className="pt-dedans">
      <button type="button" className="pt-fermer" aria-label="Revenir aux tuiles" onClick={() => (sonRetour(), setSel(null))}>
        <Icone nom="close" />
      </button>
      <Interieur t={t} rubrique={r} citations={citations} projets={projets} />
    </div>
  );
  return (
    <div className="n-page">
      <Titre sous="// SÉLECTION DE MISSION">PROJETS</Titre>
      {charge ? <p className="p2-decode">RÉCEPTION…</p> : null}
      <div className={`pts sel-${sel ?? "aucun"}`}>
        <div className={`tq pt pt-cit${face % 3 === 1 && !sel ? " retourne" : ""}${etat("citations")}`} style={{ "--i": 0, gridArea: "a" } as CSSProperties}>
          <div className="pt-fond" />
          {sel === "citations" ? (
            dedans("citations")
          ) : (
            <button type="button" className="pt-btn" onClick={() => choisir("citations")} onMouseEnter={sonSurvol} aria-label="Citations">
              <div className="pt-int">
                <div className="pt-face">
                  <small>{"// INTERCEPTIONS"}</small>
                  <div className="pt-n">
                    <Compteur valeur={citations.length} delai={250} />
                  </div>
                  <b>CITATIONS</b>
                </div>
                <div className="pt-face dos">
                  <small>{"// DERNIÈRE"}</small>
                  <q>{derCit ? derCit.texte : "—"}</q>
                </div>
              </div>
              <Segments p={citations.length ? 1 : 0} delai={500} />
            </button>
          )}
          <Coins />
        </div>
        <div className={`tq pt pt-pro${face % 3 === 2 && !sel ? " retourne" : ""}${etat("projets")}`} style={{ "--i": 1, gridArea: "b" } as CSSProperties}>
          <div className="pt-fond" />
          {sel === "projets" ? (
            dedans("projets")
          ) : (
            <button type="button" className="pt-btn" onClick={() => choisir("projets")} onMouseEnter={sonSurvol} aria-label="Projets">
              <div className="pt-int">
                <div className="pt-face">
                  <small>{"// MISSIONS"}</small>
                  <div className="pt-n">
                    <Compteur valeur={projets.length} delai={350} />
                  </div>
                  <b>PROJETS</b>
                </div>
                <div className="pt-face dos">
                  <small>{"// DERNIER"}</small>
                  <q>{derPro ? derPro.titre : "—"}</q>
                </div>
              </div>
              <Segments p={Math.min(1, projets.length / 24)} delai={600} />
            </button>
          )}
          <Coins />
        </div>
        <div className={`tq pt pt-eve large${etat("evenements")}`} style={{ "--i": 2, gridArea: "c" } as CSSProperties}>
          <div className="pt-fond" />
          {sel === "evenements" ? (
            dedans("evenements")
          ) : (
            <button type="button" className="pt-btn" onClick={() => choisir("evenements")} onMouseEnter={sonSurvol} aria-label="Événements">
              <small>{"// OPÉRATIONS"}</small>
              <div className="pt-ligne">
                <div className="pt-n">
                  <Compteur valeur={finis} delai={450} />
                </div>
                <b>ÉVÉNEMENTS</b>
              </div>
              <em className="cpt">
                ENDURREISEN · {deux(c.j)}J {deux(c.h)}H {deux(c.m)}M {deux(c.s)}S
              </em>
              <Segments p={pE} delai={700} />
            </button>
          )}
          <Coins />
        </div>
      </div>
    </div>
  );
}

/* ---------- Projets : intérieur ---------- */

type Element = { id: string; titre: string; texte: string; date?: string; auteur?: string; medias?: Media[]; coeurs?: number; compte?: { cible: number; avant: string } };

function Interieur({ t, rubrique, citations, projets }: { t: number | null; rubrique: Rubrique; citations: Etoile[]; projets: Etoile[] }) {
  const [sel, setSel] = useState(0);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const elements: Element[] =
    rubrique === "citations"
      ? citations.map((c) => ({ id: c.id, titre: c.texte, texte: c.texte, date: c.date, auteur: c.auteur, medias: c.medias, coeurs: c.coeurs }))
      : rubrique === "projets"
        ? projets.map((p) => ({ id: p.id, titre: p.titre || p.texte, texte: p.texte, date: p.date, medias: p.medias, coeurs: p.coeurs }))
        : [
            { id: "endu", titre: "ENDURREISEN", texte: "Le compte à rebours de l’ouverture des projets.", date: "01.12.2026", compte: { cible: OUVERTURE, avant: "OUVERTURE DANS" } },
            {
              id: "aube",
              titre: "L’AUBE",
              texte: "Six mois, du 3 décembre 2026 au 3 juin 2027.",
              date: "03.12.2026 → 03.06.2027",
              compte: t != null && t >= AUBE_DEBUT ? { cible: AUBE_FIN, avant: "FIN DANS" } : { cible: AUBE_DEBUT, avant: "DÉBUT DANS" },
            },
          ];
  const titre = rubrique === "citations" ? "CITATIONS" : rubrique === "projets" ? "PROJETS" : "ÉVÉNEMENTS";
  const icone: NomIcone = rubrique === "citations" ? "format_quote" : rubrique === "projets" ? "star" : "schedule";
  const actif = ouvert ?? sel;
  const e = elements[actif];

  return (
    <div className="pt-int-page">
      <div className="ptac-titre n-titre pt-titre">
        <small>{`// ${deux(elements.length)} ${rubrique === "citations" ? "INTERCEPTIONS" : rubrique === "projets" ? "MISSIONS" : "OPÉRATIONS"}`}</small>
        <h2>
          <Decode texte={titre} duree={500} />
        </h2>
      </div>
      <div className={`n-int${ouvert !== null ? " ouvert" : ""}`}>
        <div className="p2-liste">
          {elements.length === 0 ? <p className="p2-decode">AUCUN ÉLÉMENT POUR L’INSTANT.</p> : null}
          {elements.map((x, k) => (
            <Tq key={x.id} i={k}>
              <Ligne
                n={k + 1}
                icone={icone}
                sel={actif === k}
                valeur={x.date ? x.date.slice(0, 10) : undefined}
                onEnter={() => {
                  if (ouvert === null && sel !== k) sonSurvol();
                  if (ouvert === null) setSel(k);
                }}
                onClick={() => {
                  sonValide();
                  setSel(k);
                  setOuvert(ouvert === k ? null : k);
                }}
                className={`n-l${ouvert !== null && ouvert !== k ? " estompe" : ""}`}
              >
                {x.titre.length > 60 ? `${x.titre.slice(0, 58)}…` : x.titre}
              </Ligne>
            </Tq>
          ))}
        </div>
        {e ? (
          <div className="p2-panneau n-detail" key={`${e.id}-${ouvert === null ? "a" : "o"}`}>
            <Coins />
            <small>{`// ${deux(actif + 1)} · ${titre}`}</small>
            {rubrique === "citations" ? (
              <blockquote className="n-cit">« {e.texte} »</blockquote>
            ) : (
              <h3>
                <Decode texte={e.titre} duree={500} />
              </h3>
            )}
            {e.medias?.length ? (
              <div className="n-medias">
                {e.medias.slice(0, 4).map((m) =>
                  m.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={`/api/media/${m.id}`} alt="" />
                  ) : m.kind === "video" ? (
                    <video key={m.id} src={`/api/media/${m.id}`} controls playsInline />
                  ) : m.kind === "audio" ? (
                    <audio key={m.id} src={`/api/media/${m.id}`} controls />
                  ) : (
                    <a key={m.id} href={`/api/media/${m.id}`} className="n-fichier">
                      <Icone nom="edit" /> {m.nom}
                    </a>
                  ),
                )}
              </div>
            ) : null}
            {rubrique !== "citations" && e.texte && e.texte !== e.titre ? <p className="p2-texte">{e.texte}</p> : null}
            {e.compte ? (
              <p className="n-compte">
                {e.compte.avant}{" "}
                {(() => {
                  const c = decompte(t, e.compte.cible);
                  return c.fini ? "TERMINÉ" : `${deux(c.j)}J ${deux(c.h)}H ${deux(c.m)}M ${deux(c.s)}S`;
                })()}
              </p>
            ) : null}
            <div className="n-meta">
              {e.auteur ? (
                <span>
                  <small>AUTEUR</small>
                  {e.auteur}
                </span>
              ) : null}
              {e.date ? (
                <span>
                  <small>DATE</small>
                  {e.date}
                </span>
              ) : null}
              {e.medias?.length ? (
                <span>
                  <small>MÉDIAS</small>
                  {e.medias.length}
                </span>
              ) : null}
              {typeof e.coeurs === "number" ? (
                <span>
                  <small>♥</small>
                  {e.coeurs}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Recherche ---------- */

function Recherche({ etoiles, fermer, aller }: { etoiles: Etoile[]; fermer: () => void; aller: (r: Rubrique) => void }) {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const res = q.trim() ? etoiles.filter((e) => norm(`${e.titre} ${e.texte} ${e.auteur}`).includes(norm(q))).slice(0, 12) : [];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [fermer]);
  return (
    <div className="n-rech" role="dialog" aria-label="Recherche">
      <div className="n-rech-in">
        <div className="ptac-titre n-titre">
          <small>{"// RECHERCHE"}</small>
          <h2>RECHERCHER</h2>
        </div>
        <div className="n-champ-r">
          <Icone nom="search" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="UN MOT, UN PROJET, UNE CITATION…" />
          <button type="button" onClick={fermer} aria-label="Fermer">
            <Icone nom="close" />
          </button>
        </div>
        <div className="p2-liste">
          {res.map((e, k) => (
            <Tq key={e.id} i={k}>
              <Ligne n={k + 1} icone={e.genre === "projet" ? "star" : "format_quote"} valeur={e.genre === "projet" ? "PROJET" : "CITATION"} onClick={() => aller(e.genre === "projet" ? "projets" : "citations")}>
                {(e.titre || e.texte).slice(0, 60)}
              </Ligne>
            </Tq>
          ))}
          {q.trim() && res.length === 0 ? <p className="p2-decode">AUCUN RÉSULTAT.</p> : null}
        </div>
      </div>
    </div>
  );
}
