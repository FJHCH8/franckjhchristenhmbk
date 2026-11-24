"use client";

/**
 * Page test : le site en interface « tactique » (menu de jeu futuriste) × animations Metro.
 * Écran de connexion, menu numéroté (souris, toucher ou flèches du clavier), pages qui entrent
 * en tourniquet, textes qui se décodent, tuiles vivantes qui se retournent, radar, petits sons.
 */
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Icone } from "@/components/Icone";
import { LogoOdyssee } from "@/components/LogoOdyssee";

type Vue = "accueil" | "qui" | "projets" | "citations" | "album" | "parametres";
type Etoile = { id: string; titre: string; texte: string; auteur: string; date: string; genre?: "citation" | "projet" };

const MENU: { id: Vue | "instagram"; nom: string }[] = [
  { id: "qui", nom: "QUI SUIS-JE" },
  { id: "projets", nom: "PROJETS" },
  { id: "citations", nom: "CITATIONS" },
  { id: "album", nom: "ALBUM" },
  { id: "parametres", nom: "PARAMÈTRES" },
  { id: "instagram", nom: "INSTAGRAM" },
];
const OUVERTURE = new Date("2026-12-01T00:00:00+01:00").getTime();
const DEBUT_ENDU = new Date("2026-07-23T00:00:00+02:00").getTime();
const AUBE_DEBUT = new Date("2026-12-03T00:00:00+01:00").getTime();
const AUBE_FIN = new Date("2027-06-03T00:00:00+02:00").getTime();
const CARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/%&";
const deux = (n: number) => String(n).padStart(2, "0");

/* ---------- sons (bips discrets, Web Audio) ---------- */
let audio: AudioContext | null = null;
function bip(f = 1400, d = 0.035, v = 0.035, type: OscillatorType = "square") {
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
const sonSurvol = () => bip(1800, 0.02, 0.02);
const sonValide = () => {
  bip(900, 0.05, 0.04);
  setTimeout(() => bip(1500, 0.06, 0.035), 55);
};

/* ---------- petits outils ---------- */
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

/** Texte qui se décode lettre par lettre. */
function Decode({ texte, delai = 0, duree = 900 }: { texte: string; delai?: number; duree?: number }) {
  const [aff, setAff] = useState(() => texte.replace(/[^\s]/g, " "));
  useEffect(() => {
    let raf = 0;
    const debut = performance.now() + delai;
    const pas = (n: number) => {
      const p = Math.min(1, Math.max(0, (n - debut) / duree));
      setAff(
        [...texte]
          .map((c, i) => (c === " " || c === "\n" || i / texte.length < p ? c : p > 0 && Math.random() < 0.9 ? CARS[Math.floor(Math.random() * CARS.length)] : " "))
          .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [texte, delai, duree]);
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

function Segments({ p, n = 30 }: { p: number; n?: number }) {
  return (
    <div className="segs">
      {Array.from({ length: n }, (_, k) => (
        <i key={k} className={k < Math.round(p * n) ? "on" : ""} style={{ "--k": k } as CSSProperties} />
      ))}
    </div>
  );
}

/** Élément qui entre en tourniquet (animation Metro), décalé selon son rang. */
function T({ i, children, className = "", as: Tag = "div" }: { i: number; children: ReactNode; className?: string; as?: "div" | "section" | "figure" }) {
  return (
    <Tag className={`tq ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </Tag>
  );
}

/* ---------- la page ---------- */

export function Tactique() {
  const t = useMaintenant();
  const [charge, setCharge] = useState(0);
  const [pret, setPret] = useState(false);
  const [vue, setVue] = useState<Vue>("accueil");
  const [sel, setSel] = useState(0);
  const [glitch, setGlitch] = useState(0);
  const [etoiles, setEtoiles] = useState<Etoile[] | null>(null);

  // Écran de connexion
  useEffect(() => {
    const debut = performance.now();
    let raf = 0;
    const pas = (n: number) => {
      const p = Math.min(1, (n - debut) / 1500);
      setCharge(p);
      if (p < 1) raf = requestAnimationFrame(pas);
      else setTimeout(() => setPret(true), 250);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
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
    };
  }, []);

  const aller = useCallback((id: Vue | "instagram") => {
    sonValide();
    if (id === "instagram") {
      window.open("https://instagram.com/fjhchristenhmbk", "_blank", "noopener");
      return;
    }
    setGlitch((g) => g + 1);
    setVue(id);
    const k = MENU.findIndex((m) => m.id === id);
    if (k >= 0) setSel(k);
  }, []);

  // Clavier : flèches pour choisir, Entrée pour ouvrir, Échap pour revenir
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        sonSurvol();
        setSel((s) => (s + 1) % MENU.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        sonSurvol();
        setSel((s) => (s - 1 + MENU.length) % MENU.length);
      } else if (e.key === "Enter") {
        if (["INPUT", "TEXTAREA", "BUTTON", "A"].includes((e.target as HTMLElement).tagName)) return;
        aller(MENU[sel]!.id);
      }
      else if (e.key === "Escape") {
        if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
        setGlitch((g) => g + 1);
        bip(700, 0.05, 0.035);
        setVue("accueil");
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aller, sel]);

  const d = t ? new Date(t) : null;
  const date = d ? `${deux(d.getDate())}.${deux(d.getMonth() + 1)}.${d.getFullYear()}` : "--.--.----";
  const heure = d ? `${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}` : "--:--:--";
  const citations = (etoiles ?? []).filter((e) => e.genre !== "projet" && e.texte?.trim());

  return (
    <div className={`tac${pret ? " pret" : ""}${vue === "parametres" ? " flou" : ""}`}>
      <div className="tac-fond" />
      <div className="tac-grille" />
      <div className="tac-vignette" />

      {/* Écran de connexion */}
      <div className={`tac-boot${pret ? " fini" : ""}`} aria-hidden={pret}>
        <div className="tac-boot-logo">◢ ODYSSÉE</div>
        <div className="tac-boot-txt">
          {charge < 0.35 ? "INITIALISATION…" : charge < 0.7 ? "DÉCHIFFREMENT DU PROFIL…" : charge < 1 ? "CONNEXION…" : "CONNEXION ÉTABLIE"}
        </div>
        <Segments p={charge} n={24} />
        <div className="tac-boot-pct">{Math.round(charge * 100)} %</div>
      </div>

      <header className="tac-haut">
        <span className="tac-logo">◢ ODYSSÉE</span>
        <span className="cache-mobile">CONNEXION ÉTABLIE</span>
        <span className="cache-mobile">{date}</span>
        <span className="ambre">{heure}</span>
        <span className="droite cache-mobile">FJHC // H.M.B.K.</span>
      </header>

      {pret ? (
        <>
          <nav className="tac-menu" aria-label="Menu">
            {MENU.map((m, k) => (
              <button
                key={m.id}
                className={`tac-item${(vue === m.id || (vue === "accueil" && sel === k)) ? " sel" : ""}${vue === m.id ? " actif" : ""}`}
                style={{ "--i": k } as CSSProperties}
                onMouseEnter={() => {
                  if (sel !== k) sonSurvol();
                  setSel(k);
                }}
                onClick={() => aller(m.id)}
              >
                <b>{deux(k + 1)}</b>
                <span>{m.nom}</span>
                <em>◄</em>
              </button>
            ))}
            {vue !== "accueil" ? (
              <button
                className="tac-retour"
                onClick={() => {
                  bip(700, 0.05, 0.035);
                  setGlitch((g) => g + 1);
                  setVue("accueil");
                }}
              >
                [ÉCHAP] ACCUEIL
              </button>
            ) : null}
          </nav>

          <main className="tac-scene" key={vue}>
            {vue === "accueil" ? <Accueil t={t} citations={citations} aller={aller} /> : null}
            {vue === "qui" ? <Qui /> : null}
            {vue === "projets" ? <Projets t={t} etoiles={etoiles} /> : null}
            {vue === "citations" ? <Citations liste={citations} charge={etoiles === null} /> : null}
            {vue === "album" ? <Album /> : null}
            {vue === "parametres" ? <Parametres /> : null}
          </main>
        </>
      ) : null}

      <div className="tac-glitch" key={glitch} />
      <div className="tac-balayage" />

      <footer className="tac-bas">
        <span className="cache-mobile">[↑ ↓] CHOISIR</span>
        <span className="cache-mobile">[ENTRÉE] OUVRIR</span>
        <span className="cache-mobile">[ÉCHAP] RETOUR</span>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- autre disposition racine : rechargement complet voulu */}
        <a href="/" className="droite">
          SITE CLASSIQUE ↗
        </a>
        <span className="cache-mobile">SIGNAL ▮▮▮▮▯</span>
      </footer>
    </div>
  );
}

/* ---------- vues ---------- */

function Accueil({ t, citations, aller }: { t: number | null; citations: Etoile[]; aller: (v: Vue) => void }) {
  const c = decompte(t, OUVERTURE);
  const p = t ? Math.min(1, Math.max(0, (t - DEBUT_ENDU) / (OUVERTURE - DEBUT_ENDU))) : 0;
  const [face, setFace] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFace((f) => f + 1), 5000);
    return () => clearInterval(id);
  }, []);
  const cit = citations.length ? citations[face % citations.length] : null;
  return (
    <>
      <div className="tac-nom">
        <small>
          <Decode texte="// IDENTIFIÉ" duree={500} />
        </small>
        <h1>
          <Decode texte="FRANCK J.H." delai={150} />
          <br />
          <Decode texte="CHRISTEN" delai={300} />
          <span>
            <Decode texte="H.M.B.K." delai={500} />
          </span>
        </h1>
        <p>
          <Decode texte="POLYMATHE · NÉ EN 2007 · FRANCE" delai={700} duree={700} />
        </p>
      </div>
      <div className="tac-tuiles">
        <T i={0}>
          <button className="tuile t-ambre" onClick={() => aller("projets")}>
            <div className={`tuile-int${face % 2 ? " retournee" : ""}`}>
              <div className="face">
                <small>OPÉRATION</small>
                <b>ENDURREISEN</b>
                <div className="cpt">
                  {deux(c.j)}
                  <i>J</i> {deux(c.h)}
                  <i>H</i> {deux(c.m)}
                  <i>M</i> {deux(c.s)}
                  <i>S</i>
                </div>
                <Segments p={p} n={22} />
              </div>
              <div className="face dos">
                <small>OPÉRATION SUIVANTE</small>
                <b>L’AUBE</b>
                <div className="cpt petit">03.12 → 03.06 · 6 MOIS</div>
              </div>
            </div>
            <Coins />
          </button>
        </T>
        <T i={1}>
          <button className="tuile t-noir" onClick={() => aller("citations")}>
            <div className="tuile-glisse" key={face}>
              <small>INTERCEPTÉ · CITATION</small>
              <q>{cit ? cit.texte : "…"}</q>
            </div>
            <Coins />
          </button>
        </T>
        <T i={2}>
          <a className="tuile t-noir t-msg" href="mailto:franckjhchristen@gmail.com">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aakanos/gael.jpg" alt="" />
            <div>
              <small>TRANSMISSION</small>
              <b>CONTACT</b>
              <span>franckjhchristen@gmail.com</span>
            </div>
            <Coins />
          </a>
        </T>
      </div>
    </>
  );
}

function Titre({ sous, children }: { sous: string; children: string }) {
  return (
    <div className="tac-titre">
      <small>
        <Decode texte={sous} duree={500} />
      </small>
      <h2>
        <Decode texte={children} delai={100} duree={600} />
      </h2>
    </div>
  );
}

const CHAMPS: [string, string][] = [
  ["NOM", "FRANCK J.H. CHRISTEN H.M.B.K."],
  ["NAISSANCE", "2007 · FRANCE"],
  ["STATUT", "POLYMATHE"],
  ["PROFIL", "TTHPI · TDAH"],
  ["LANGUES", "FRANÇAIS · TAVISSIV (AAKA)"],
  ["NIVEAU D’ACCÈS", "PUBLIC"],
];

function Qui() {
  return (
    <div className="v-qui">
      <Titre sous="// DOSSIER 01">QUI SUIS-JE</Titre>
      <T i={0} className="dossier-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/franck.jpg" alt="" />
        <div className="viseur" />
        <span className="cible">CIBLE VERROUILLÉE</span>
        <Coins />
      </T>
      <div className="champs">
        {CHAMPS.map(([a, b], k) => (
          <T key={a} i={k + 1}>
            <small>{a}</small>
            <b>
              <Decode texte={b} delai={250 + k * 90} duree={500} />
            </b>
          </T>
        ))}
      </div>
      <T i={7} className="bio">
        <small>{"// RAPPORT"}</small>
        <p>Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder.</p>
        <p>Je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment.</p>
        <p className="decode">
          <Decode texte="CE SITE SERT À PUBLIER CE QUE JE FAIS, AU QUOTIDIEN, EN TANT QUE POLYMATHE." delai={900} duree={1800} />
          <i>▌</i>
        </p>
      </T>
    </div>
  );
}

function Projets({ t, etoiles }: { t: number | null; etoiles: Etoile[] | null }) {
  const e = decompte(t, OUVERTURE);
  const pE = t ? Math.min(1, Math.max(0, (t - DEBUT_ENDU) / (OUVERTURE - DEBUT_ENDU))) : 0;
  const aubeEnCours = t != null && t >= AUBE_DEBUT;
  const pA = t && aubeEnCours ? Math.min(1, (t - AUBE_DEBUT) / (AUBE_FIN - AUBE_DEBUT)) : 0;
  const a = decompte(t, aubeEnCours ? AUBE_FIN : AUBE_DEBUT);
  const projets = (etoiles ?? []).filter((x) => x.genre === "projet");
  return (
    <div className="v-projets">
      <Titre sous="// SÉLECTION DE MISSION">PROJETS</Titre>
      <div className="missions">
        <T i={0} className="mission sel">
          <div className="m-num">01</div>
          <div>
            <small>ÉVÉNEMENT · {e.fini ? "TERMINÉ" : "EN COURS"}</small>
            <b>ENDURREISEN</b>
            <span>OUVERTURE LE 01.12.2026</span>
            <Segments p={pE} />
            <em>
              {Math.round(pE * 100)} % · {deux(e.j)}J {deux(e.h)}H {deux(e.m)}M {deux(e.s)}S
            </em>
          </div>
          <Coins />
        </T>
        <T i={1} className="mission">
          <div className="m-num">02</div>
          <div>
            <small>ÉVÉNEMENT · {aubeEnCours ? "EN COURS" : "VERROUILLÉ"}</small>
            <b>L’AUBE</b>
            <span>03.12.2026 → 03.06.2027 · 6 MOIS</span>
            <Segments p={pA} />
            <em>
              {aubeEnCours ? "FIN DANS" : "DÉBUT DANS"} {deux(a.j)}J {deux(a.h)}H
            </em>
          </div>
          <Coins />
        </T>
        {projets.map((p, k) => (
          <T key={p.id} i={k + 2} className="mission">
            <div className="m-num">{deux(k + 3)}</div>
            <div>
              <small>PROJET</small>
              <b>{p.titre.toUpperCase()}</b>
              <span>{p.texte}</span>
            </div>
            <Coins />
          </T>
        ))}
      </div>
      <T i={3} className="radar">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#ffb000" strokeOpacity=".5" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#ffb000" strokeOpacity=".3" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="#ffb000" strokeOpacity=".3" />
          <path d="M100 10v180M10 100h180" stroke="#ffb000" strokeOpacity=".25" />
          <g className="radar-balai">
            <path d="M100 100L100 10A90 90 0 0 1 178 55z" fill="url(#balai)" />
          </g>
          <defs>
            <linearGradient id="balai" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffb000" stopOpacity=".35" />
              <stop offset="1" stopColor="#ffb000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle className="radar-pt" cx="140" cy="62" r="4" fill="#ffb000" />
          <circle className="radar-pt b" cx="70" cy="130" r="3" fill="#fff" />
          <circle className="radar-pt c" cx="120" cy="150" r="3" fill="#ffb000" />
        </svg>
        <small>CIBLES · {2 + projets.length}</small>
      </T>
    </div>
  );
}

function Citations({ liste, charge }: { liste: Etoile[]; charge: boolean }) {
  return (
    <div className="v-citations">
      <Titre sous="// INTERCEPTIONS">CITATIONS</Titre>
      {charge ? <div className="tac-attente">RÉCEPTION…</div> : null}
      <div className="cits">
        {liste.map((c, k) => (
          <T key={c.id} i={k} className="cit">
            <small>
              INTERCEPTÉ · {c.date || "—"} · {c.auteur.toUpperCase()}
            </small>
            <q>{c.texte}</q>
            <Coins />
          </T>
        ))}
      </div>
    </div>
  );
}

const MEDIAS = [
  { kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg", nom: "VIDÉO" },
  { kind: "photo" as const, src: "/media/franck.jpg", poster: "/media/franck.jpg", nom: "PHOTO" },
];

function Album() {
  const [ouvert, setOuvert] = useState<number | null>(null);
  const m = ouvert !== null ? MEDIAS[ouvert]! : null;
  return (
    <div className="v-album">
      <Titre sous="// ARCHIVES VISUELLES">ALBUM</Titre>
      <div className="album">
        {MEDIAS.map((x, k) => (
          <T key={x.src} i={k}>
            <button className="tuile a-tuile" onClick={() => (sonValide(), setOuvert(k))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.poster} alt="" />
              <span>
                {x.kind === "video" ? "▶ " : ""}
                {x.nom} · {deux(k + 1)}
              </span>
              <Coins />
            </button>
          </T>
        ))}
      </div>
      {m ? (
        <div className="visionneuse" onClick={() => setOuvert(null)}>
          {m.kind === "video" ? (
            <video src={m.src} poster={m.poster} autoPlay loop playsInline muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.src} alt="" />
          )}
          <span>[TOUCHER] FERMER</span>
          <Coins />
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Paramètres : Odyssée × tactique ---------- */

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
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

/** Ton nom en points : il s'allume point par point, de gauche à droite. */
function Matrice() {
  const lignes = ["FRANCK J.H", "CHRISTEN"];
  let n = 0;
  return (
    <div className="matrice" aria-label="Franck J.H Christen">
      {lignes.map((l) => (
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

const TRAITS_CHEVAL = 19;
const RUBRIQUES = [
  { id: "langue", nom: "LANGUE", icone: "language" },
  { id: "contact", nom: "CONTACT", icone: "mail" },
  { id: "apropos", nom: "À PROPOS", icone: "info" },
  { id: "systeme", nom: "SYSTÈME", icone: "phone_iphone" },
  { id: "edition", nom: "ÉDITION", icone: "edit" },
  { id: "oeuf", nom: "EASTER EGG", icone: "egg_alt" },
] as const;
type Rubrique = (typeof RUBRIQUES)[number]["id"];

function Parametres() {
  const lire = (k: string, d: string) => {
    try {
      return (typeof window !== "undefined" && localStorage.getItem(k)) || d;
    } catch {
      return d;
    }
  };
  const ecrire = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  };
  const [langue, setLangue] = useState(() => lire("fjch-lang", "fr"));
  const [sons, setSons] = useState(() => lire("tac-sons", "on"));
  const [survol, setSurvol] = useState(0);
  const [ouvert, setOuvert] = useState<Rubrique | null>(null);
  const [partant, setPartant] = useState<Rubrique | null>(null);

  const valeurs: Record<Rubrique, string> = {
    langue: langue === "tavissiv" ? "TAVISSIV" : "FRANÇAIS",
    contact: "2 CANAUX",
    apropos: "",
    systeme: "ODYSSÉE 0.1",
    edition: "VERROUILLÉ",
    oeuf: "AAKA",
  };

  const choisir = (id: Rubrique) => {
    sonValide();
    setPartant(id);
    window.setTimeout(() => {
      setPartant(null);
      setOuvert(id);
    }, 300);
  };
  const fermer = () => {
    bip(700, 0.05, 0.035);
    setOuvert(null);
  };

  useEffect(() => {
    if (!ouvert) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fermer();
      }
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  });

  const lignes = ouvert ? RUBRIQUES.filter((r) => r.id === ouvert) : RUBRIQUES;

  return (
    <div className={`v-param2${ouvert ? " ouvert" : ""}`}>
      <Titre sous="// OPTIONS">PARAMÈTRES</Titre>
      <div className="p2-gauche">
        <div className="p2-liste" key={ouvert ?? "liste"}>
          {lignes.map((r) => {
            const k = RUBRIQUES.findIndex((x) => x.id === r.id);
            const sel = ouvert ? true : survol === k;
            return (
              <T key={r.id} i={ouvert ? 0 : k}>
                <button
                  className={`p2-ligne${sel ? " sel" : ""}${partant && partant !== r.id ? " part" : ""}${partant === r.id ? " choisie" : ""}`}
                  onMouseEnter={() => {
                    if (!ouvert && survol !== k) sonSurvol();
                    if (!ouvert) setSurvol(k);
                  }}
                  onClick={() => (ouvert ? fermer() : choisir(r.id))}
                >
                  <b className="p2-num">{deux(k + 1)}</b>
                  <span className="p2-tuile">
                    <Icone nom={r.icone} />
                  </span>
                  <span className="p2-nom">{r.nom}</span>
                  <em>{valeurs[r.id]}</em>
                  <span className="p2-chev">
                    <Icone nom={ouvert ? "close" : "chevron_right"} />
                  </span>
                  <Coins />
                </button>
              </T>
            );
          })}
        </div>
        {!ouvert ? <Matrice /> : null}
      </div>

      <div className="p2-droite">
        {ouvert ? (
          <div className="p2-panneau" key={ouvert}>
            <Coins />
            <small>{`// ${deux(RUBRIQUES.findIndex((x) => x.id === ouvert) + 1)} · ${RUBRIQUES.find((x) => x.id === ouvert)!.nom}`}</small>
            {ouvert === "langue" ? (
              <PanneauLangue
                langue={langue}
                choisir={(l) => {
                  sonValide();
                  setLangue(l);
                  ecrire("fjch-lang", l);
                }}
              />
            ) : null}
            {ouvert === "contact" ? <PanneauContact /> : null}
            {ouvert === "apropos" ? <PanneauAPropos /> : null}
            {ouvert === "systeme" ? (
              <PanneauSysteme
                sons={sons}
                basculer={() => {
                  const v = sons === "off" ? "on" : "off";
                  setSons(v);
                  ecrire("tac-sons", v);
                  if (v === "on") sonValide();
                }}
              />
            ) : null}
            {ouvert === "edition" ? <PanneauEdition /> : null}
            {ouvert === "oeuf" ? <PanneauAaka /> : null}
            <button className="p2-fermer" onClick={fermer}>
              <Icone nom="arrow_back" /> RETOUR
            </button>
          </div>
        ) : (
          <div className="p2-panneau p2-apercu" key={survol}>
            <Coins />
            <small>{`// ${deux(survol + 1)} · ${RUBRIQUES[survol]!.nom}`}</small>
            <p className="p2-decode">
              <Decode
                texte={
                  [
                    "CHOISIS LA LANGUE DU SITE : FRANÇAIS OU TAVISSIV.",
                    "DEUX CHEMINS MÈNENT JUSQU’À FRANCK.",
                    "CE QU’EST CE SITE, ET POURQUOI.",
                    "ODYSSÉE 0.1 · LE SYSTÈME DU SITE ET SES MISES À JOUR.",
                    "RÉSERVÉ À FRANCK · CODE À 6 CHIFFRES.",
                    "ÉCRIS EN TAVISSIV, LIS EN AAKA.",
                  ][survol]!
                }
                duree={450}
              />
              <b>▌</b>
            </p>
            <span className="p2-touche">[ENTRÉE] OU TOUCHER POUR OUVRIR</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PanneauLangue({ langue, choisir }: { langue: string; choisir: (l: string) => void }) {
  return (
    <>
      <h3>
        <Decode texte="Choisis la langue du site" duree={500} />
      </h3>
      {[
        { id: "fr", nom: <span>FRANÇAIS</span>, sous: "BRETAGNE" },
        { id: "tavissiv", nom: <span className="tav">tavissiv</span>, sous: "ÉCRITURE AAKA" },
      ].map((o, k) => (
        <T key={o.id} i={k + 1}>
          <button className={`p2-radio${langue === o.id ? " sel" : ""}`} onClick={() => choisir(o.id)}>
            <i />
            {o.nom}
            <em>{o.sous}</em>
          </button>
        </T>
      ))}
      <p className="p2-decode">
        <Decode texte="LE TAVISSIV S’ÉCRIT EN AAKA, L’ALPHABET DE FRANCK." delai={300} duree={900} />
        <b>▌</b>
      </p>
    </>
  );
}

function PanneauContact() {
  const canaux = [
    { icone: "mail" as const, nom: "E-MAIL", valeur: "franckjhchristen@gmail.com", lien: "mailto:franckjhchristen@gmail.com" },
    { icone: "photo_camera" as const, nom: "INSTAGRAM", valeur: "@fjhchristenhmbk", lien: "https://instagram.com/fjhchristenhmbk" },
  ];
  return (
    <>
      <h3>
        <Decode texte="Deux chemins mènent jusqu’à Franck" duree={600} />
      </h3>
      {canaux.map((c, k) => (
        <T key={c.nom} i={k + 1}>
          <a className="p2-canal" href={c.lien} target={c.lien.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => sonValide()}>
            <span className="p2-tuile">
              <Icone nom={c.icone} />
            </span>
            <span>
              <small>{c.nom}</small>
              <b>{c.valeur}</b>
            </span>
            <Icone nom="chevron_right" />
          </a>
        </T>
      ))}
      <p className="p2-texte">Une idée, une question, un projet à partager ?</p>
    </>
  );
}

function PanneauAPropos() {
  return (
    <>
      <h3>
        <Decode texte="Ce site" duree={400} />
      </h3>
      <T i={1}>
        <p className="p2-texte">
          Le site de Franck J.H. Christen H.M.B.K. : publier ce qu’il fait, au quotidien, pour ceux qui veulent comprendre ce que fait un polymathe.
        </p>
      </T>
      <T i={2}>
        <p className="p2-texte">Les projets s’ouvrent avec Endurreisen, le 1ᵉʳ décembre 2026. L’aube suit, du 3 décembre au 3 juin.</p>
      </T>
    </>
  );
}

function PanneauSysteme({ sons, basculer }: { sons: string; basculer: () => void }) {
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
  return (
    <div className="p2-sys">
      <div className="p2-sys-logo">
        <LogoOdyssee />
        <span className="p2-trace">
          TRACÉ {deux(trace)}/{TRAITS_CHEVAL}
        </span>
      </div>
      <div className="p2-sys-nom">
        <Decode texte="ODYSSÉE" delai={200} duree={700} />
      </div>
      <div className="p2-sys-v">VERSION 0.1 · FJHC</div>
      <Segments p={trace / TRAITS_CHEVAL} n={30} />
      <small className="p2-h">{"// HISTORIQUE"}</small>
      {[
        ["0.1", "23 NOVEMBRE 2026", "ACTUELLE"],
        ["0.0", "9 NOVEMBRE 2026", ""],
      ].map(([v, d, e], k) => (
        <T key={v} i={k + 2}>
          <div className={`p2-ver${k === 0 ? " act" : ""}`}>
            <b>{v}</b>
            <span>{d}</span>
            <em>{e}</em>
          </div>
        </T>
      ))}
      <button className="p2-ver p2-sons" onClick={basculer}>
        <b>
          <Icone nom={sons === "off" ? "volume_off" : "volume_up"} />
        </b>
        <span>SONS DE L’INTERFACE</span>
        <em>{sons === "off" ? "◄ COUPÉS ►" : "◄ ACTIVÉS ►"}</em>
      </button>
    </div>
  );
}

function PanneauEdition() {
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
      if (!r.ok || !d.ok) throw new Error(d.erreur || "CODE REFUSÉ");
      setEtat("ok");
      setMsg("ACCÈS AUTORISÉ");
      sonValide();
      try {
        sessionStorage.setItem("fjch-edition-ouvrir", "1");
      } catch {}
      window.setTimeout(() => window.location.assign("/projets"), 900);
    } catch (e) {
      setEtat("erreur");
      setMsg((e as Error).message?.toUpperCase() || "CODE REFUSÉ");
      bip(220, 0.18, 0.05, "sawtooth");
      window.setTimeout(() => {
        setCode("");
        setEtat("");
      }, 700);
    }
  };
  const appui = (k: string) => {
    if (etat === "verif" || etat === "ok") return;
    if (k === "⌫") {
      bip(900, 0.03, 0.025);
      return setCode((c) => c.slice(0, -1));
    }
    if (code.length >= 6) return;
    sonSurvol();
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
      <div className={`p2-code ${etat}`}>
        {Array.from({ length: 6 }, (_, k) => (
          <i key={k} className={k < code.length ? "plein" : ""}>
            {k < code.length ? "•" : ""}
          </i>
        ))}
      </div>
      <div className="p2-pave">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k ? (
            <button key={i} onClick={() => appui(k)} aria-label={k === "⌫" ? "Effacer" : k}>
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
      <T i={1}>
        <textarea className="p2-saisie" value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} spellCheck={false} aria-label="Texte à transcrire" />
      </T>
      <T i={2} className="p2-aaka">
        <small>{"// AAKA"}</small>
        <p className="tav" lang="x-tavissiv">
          {texte || " "}
        </p>
      </T>
    </>
  );
}
