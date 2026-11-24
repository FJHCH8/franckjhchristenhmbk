"use client";

/**
 * Page test : le site en interface « tactique » (menu de jeu futuriste) × animations Metro.
 * Écran de connexion, menu numéroté (souris, toucher ou flèches du clavier), pages qui entrent
 * en tourniquet, textes qui se décodent, tuiles vivantes qui se retournent, radar, petits sons.
 */
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";

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
      } else if (e.key === "Enter") aller(MENU[sel]!.id);
      else if (e.key === "Escape" || e.key === "Backspace") {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
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
    <div className={`tac${pret ? " pret" : ""}`}>
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

function Parametres() {
  const lire = (k: string, d: string) => {
    try {
      return (typeof window !== "undefined" && localStorage.getItem(k)) || d;
    } catch {
      return d;
    }
  };
  const [langue, setLangue] = useState(() => lire("fjch-lang", "fr"));
  const [sons, setSons] = useState(() => lire("tac-sons", "on"));
  const [onglet, setOnglet] = useState(0);
  const [ligne, setLigne] = useState(0);
  const ecrire = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  };
  const opts: { nom: string; valeur: string; aide: string; changer?: () => void; lien?: string }[] =
    onglet === 0
      ? [
          {
            nom: "LANGUE",
            valeur: langue === "tavissiv" ? "TAVISSIV (AAKA)" : "FRANÇAIS (BRETAGNE)",
            aide: "Choisis la langue du site. Le Tavissiv s’écrit en Aaka, l’alphabet de Franck.",
            changer: () => {
              const v = langue === "tavissiv" ? "fr" : "tavissiv";
              setLangue(v);
              ecrire("fjch-lang", v);
            },
          },
          {
            nom: "SONS",
            valeur: sons === "off" ? "COUPÉS" : "ACTIVÉS",
            aide: "Les petits bips du menu, quand on survole et quand on valide.",
            changer: () => {
              const v = sons === "off" ? "on" : "off";
              setSons(v);
              ecrire("tac-sons", v);
            },
          },
          { nom: "APPARENCE", valeur: "TEST TACTIQUE", aide: "Tu regardes la version test. Le site classique reste en ligne.", lien: "/" },
        ]
      : onglet === 1
        ? [
            { nom: "E-MAIL", valeur: "FRANCKJHCHRISTEN@GMAIL.COM", aide: "Une idée, une question, un projet à partager ?", lien: "mailto:franckjhchristen@gmail.com" },
            { nom: "INSTAGRAM", valeur: "@FJHCHRISTENHMBK", aide: "Deux chemins mènent jusqu’à Franck.", lien: "https://instagram.com/fjhchristenhmbk" },
          ]
        : [
            { nom: "SYSTÈME", valeur: "ODYSSÉE 0.1", aide: "Mise à jour du 23 novembre 2026. Version précédente : 0.0 (9 novembre 2026)." },
            { nom: "INTERFACE", valeur: "TACTIQUE × METRO", aide: "Version test de la nouvelle interface du site." },
          ];
  const o = opts[Math.min(ligne, opts.length - 1)]!;
  return (
    <div className="v-param">
      <Titre sous="// OPTIONS">PARAMÈTRES</Titre>
      <div className="onglets">
        {["GÉNÉRAL", "CONTACT", "SYSTÈME"].map((n, k) => (
          <button
            key={n}
            className={k === onglet ? "on" : ""}
            onClick={() => {
              sonSurvol();
              setOnglet(k);
              setLigne(0);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="opts" key={onglet}>
        {opts.map((x, k) => (
          <T key={x.nom} i={k}>
            <button
              className={`opt${k === ligne ? " sel" : ""}`}
              onMouseEnter={() => {
                if (k !== ligne) sonSurvol();
                setLigne(k);
              }}
              onClick={() => {
                setLigne(k);
                if (x.changer) {
                  sonValide();
                  x.changer();
                } else if (x.lien) {
                  sonValide();
                  window.open(x.lien, x.lien.startsWith("http") ? "_blank" : "_self");
                }
              }}
            >
              <span>{x.nom}</span>
              <b>{x.changer ? `◄ ${x.valeur} ►` : x.valeur}</b>
            </button>
          </T>
        ))}
      </div>
      <T i={4} className="aide">
        <small>{`// ${o.nom}`}</small>
        <p key={o.nom}>
          <Decode texte={o.aide} duree={500} />
        </p>
        <b className="tav">franck</b>
        <Coins />
      </T>
    </div>
  );
}
