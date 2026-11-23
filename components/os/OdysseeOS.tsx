"use client";

/**
 * Odyssée, version test : le site comme un vrai système de téléphone, style Jelly Bean (Holo).
 * Verrouillage à anneau → bureau (recherche, horloge, icônes, dock) → tiroir d'applis,
 * rideau de notifications tiré du haut, applis ouvertes en zoom depuis leur icône,
 * barre de navigation ◁ ⌂ ▭ (retour, accueil, applis récentes).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as PE } from "react";
import { LogoOdyssee } from "@/components/LogoOdyssee";
import { IconeAncienne, type NomAppli } from "./IconesAnciennes";

type Appli = { id: NomAppli; nom: string; url: string; externe?: boolean };

const APPLIS: Appli[] = [
  { id: "qui", nom: "Qui suis-je", url: "/qui-suis-je" },
  { id: "projets", nom: "Projets", url: "/projets" },
  { id: "album", nom: "Album", url: "/qui-suis-je#album" },
  { id: "citations", nom: "Citations", url: "/projets" },
  { id: "aaka", nom: "Aaka", url: "/?parametres=oeuf" },
  { id: "contact", nom: "Contact", url: "/?parametres=contact" },
  { id: "instagram", nom: "Instagram", url: "https://instagram.com/fjhchristenhmbk", externe: true },
  { id: "reglages", nom: "Réglages", url: "/?parametres=langue" },
  { id: "recherche", nom: "Recherche", url: "" },
  { id: "endurreisen", nom: "Endurreisen", url: "/projets" },
  { id: "langue", nom: "Langue", url: "/?parametres=langue" },
  { id: "odyssee", nom: "Odyssée", url: "/?parametres=systeme" },
];
const par = (id: NomAppli) => APPLIS.find((a) => a.id === id)!;
const PAGE1: NomAppli[] = ["qui", "projets", "album", "citations", "aaka", "contact", "instagram", "reglages"];
const PAGE2: NomAppli[] = ["endurreisen", "langue", "odyssee", "recherche"];
const DOCK: NomAppli[] = ["qui", "projets", "album", "contact"];
const OUVERTURE = new Date("2026-12-01T00:00:00+01:00");

// Ce qu'on cache des pages du site quand elles tournent dans une appli.
const CSS_APPLI = `
.header,.footer,.rail,.intro,.chargement,.power-boot,.powerboot,.skip,.son-bouton,.suite{display:none!important}
body{padding-top:0!important}
`;

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const deux = (n: number) => String(n).padStart(2, "0");

function useMaintenant() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    const maj = () => setT(new Date());
    maj();
    const id = setInterval(maj, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function joursAvant(t: Date | null) {
  if (!t) return 0;
  return Math.max(0, Math.ceil((OUVERTURE.getTime() - t.getTime()) / 86400000));
}

type Fenetre = { appli: Appli; depuis: { x: number; y: number } | null };

export function OdysseeOS() {
  const t = useMaintenant();
  const [verrou, setVerrou] = useState(true);
  const [tiroir, setTiroir] = useState(false);
  const [onglet, setOnglet] = useState<"applis" | "widgets">("applis");
  const [rideau, setRideau] = useState(false);
  const [recents, setRecents] = useState(false);
  const [recherche, setRecherche] = useState(false);
  const [requete, setRequete] = useState("");
  const [page, setPage] = useState(0);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [fermeture, setFermeture] = useState(false);
  const [historique, setHistorique] = useState<Appli[]>([]);
  const [effacees, setEffacees] = useState<string[]>([]);

  const heure = t ? `${deux(t.getHours())}:${deux(t.getMinutes())}` : "--:--";
  const date = t ? `${JOURS[t.getDay()]} ${t.getDate()} ${MOIS[t.getMonth()]}` : "";
  const jours = joursAvant(t);

  const ouvrir = useCallback((a: Appli, el?: Element | null) => {
    if (a.id === "recherche") {
      setRecherche(true);
      setTiroir(false);
      return;
    }
    if (a.externe) {
      window.open(a.url, "_blank", "noopener");
      return;
    }
    setFermeture(false);
    const r = el?.getBoundingClientRect();
    const o = document.querySelector(".os")?.getBoundingClientRect();
    setFenetre({ appli: a, depuis: r && o ? { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2 } : null });
    setHistorique((h) => [a, ...h.filter((x) => x.id !== a.id)].slice(0, 6));
    setTiroir(false);
    setRecents(false);
    setRecherche(false);
    setRideau(false);
  }, []);

  const fermerFenetre = useCallback(() => {
    if (!fenetre) return;
    setFermeture(true);
    setTimeout(() => {
      setFenetre(null);
      setFermeture(false);
    }, 260);
  }, [fenetre]);

  const retour = () => {
    if (rideau) return setRideau(false);
    if (recents) return setRecents(false);
    if (recherche) return setRecherche(false);
    if (fenetre) return fermerFenetre();
    if (tiroir) return setTiroir(false);
    if (page) return setPage(0);
  };
  const accueil = () => {
    setRideau(false);
    setRecents(false);
    setRecherche(false);
    setTiroir(false);
    setPage(0);
    fermerFenetre();
  };

  // Touche Échap = retour
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && retour();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // Glisser le bureau à gauche / droite pour changer de page
  const glisse = useRef<{ x: number; y: number } | null>(null);
  const [decalage, setDecalage] = useState(0);
  const debutGlisse = (e: PE) => {
    glisse.current = { x: e.clientX, y: e.clientY };
  };
  const moveGlisse = (e: PE) => {
    if (!glisse.current) return;
    const dx = e.clientX - glisse.current.x;
    if (Math.abs(dx) > 8) setDecalage(dx);
  };
  const finGlisse = (e: PE) => {
    if (!glisse.current) return;
    const dx = e.clientX - glisse.current.x;
    const dy = e.clientY - glisse.current.y;
    glisse.current = null;
    setDecalage(0);
    if (dx < -60) setPage(1);
    else if (dx > 60) setPage(0);
    else if (dy < -80) setTiroir(true);
  };

  // Tirer la barre d'état vers le bas pour le rideau
  const tirage = useRef<number | null>(null);
  const [tire, setTire] = useState(0);

  const notifs = [
    {
      id: "citation",
      icone: "citations" as NomAppli,
      titre: "Nouvelle citation",
      texte: "« Une seconde ne détruit pas la minute, mais elle la change. »",
      auteur: "Franck J.H. Christen",
      h: "11:20",
      appli: par("citations"),
    },
    {
      id: "endurreisen",
      icone: "endurreisen" as NomAppli,
      titre: "Endurreisen",
      texte: jours ? `Ouverture dans ${jours} jour${jours > 1 ? "s" : ""}` : "C'est ouvert",
      h: "10:00",
      appli: par("endurreisen"),
    },
    {
      id: "maj",
      icone: "odyssee" as NomAppli,
      titre: "Odyssée 0.1 (test)",
      texte: "Mise à jour installée",
      h: "09:12",
      appli: par("odyssee"),
    },
  ].filter((n) => !effacees.includes(n.id));

  const resultats = APPLIS.filter((a) =>
    a.nom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .includes(requete.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")),
  );

  return (
    <div className="os">
      <div className="os-fond" />

      {/* Barre d'état */}
      <div
        className="os-statut"
        onPointerDown={(e) => {
          tirage.current = e.clientY;
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => tirage.current !== null && setTire(Math.max(0, e.clientY - tirage.current))}
        onPointerUp={() => {
          if (tirage.current !== null && (tire > 60 || tire < 4)) setRideau(true);
          tirage.current = null;
          setTire(0);
        }}
      >
        <span className="os-statut-g">
          {!verrou && notifs.length > 0 && (
            <>
              {notifs.some((n) => n.id === "citation") && <i className="os-mini">❞</i>}
              {notifs.some((n) => n.id === "endurreisen") && <i className="os-mini">◷</i>}
            </>
          )}
        </span>
        <span className="os-statut-d">
          <b className="os-barres">
            <i />
            <i />
            <i />
            <i />
          </b>
          <b className="os-batt" />
          {heure}
        </span>
      </div>

      {verrou ? (
        <Verrouillage heure={heure} date={date} jours={jours} onOuvrir={(cible) => {
          setVerrou(false);
          if (cible === "recherche") setRecherche(true);
          if (cible === "album") setTimeout(() => ouvrir(par("album")), 350);
        }} />
      ) : (
        <>
          {/* Bureau */}
          <div className={`os-bureau${tiroir || fenetre ? " os-recule" : ""}`}>
            <button className="os-cherche" onClick={() => setRecherche(true)}>
              <b>Odyssée</b>
              <span />
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#ccc" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </button>

            <div
              className="os-pages"
              onPointerDown={debutGlisse}
              onPointerMove={moveGlisse}
              onPointerUp={finGlisse}
              onPointerCancel={() => {
                glisse.current = null;
                setDecalage(0);
              }}
              style={{ "--page": page, "--dx": `${decalage}px` } as CSSProperties}
            >
              <div className="os-page">
                <div className="os-horloge">
                  <div className="os-horloge-h">{heure}</div>
                  <div className="os-horloge-d">{date.split(" ").slice(0, 3).join(" ")}</div>
                </div>
                <Grille ids={PAGE1} ouvrir={ouvrir} />
              </div>
              <div className="os-page">
                <button className="os-widget-compte" onClick={(e) => ouvrir(par("endurreisen"), e.currentTarget)}>
                  <IconeAncienne nom="endurreisen" taille={44} />
                  <div>
                    <b>{jours}</b>
                    <span>jours avant Endurreisen</span>
                  </div>
                </button>
                <Grille ids={PAGE2} ouvrir={ouvrir} />
              </div>
            </div>

            <div className="os-points">
              <i className={page === 0 ? "on" : ""} onClick={() => setPage(0)} />
              <i className={page === 1 ? "on" : ""} onClick={() => setPage(1)} />
            </div>

            <div className="os-dock">
              {DOCK.slice(0, 2).map((id) => (
                <Icone key={id} a={par(id)} ouvrir={ouvrir} sansNom />
              ))}
              <button className="os-tous" aria-label="Toutes les applis" onClick={() => setTiroir(true)}>
                <span>
                  {Array.from({ length: 6 }, (_, i) => (
                    <i key={i} />
                  ))}
                </span>
              </button>
              {DOCK.slice(2).map((id) => (
                <Icone key={id} a={par(id)} ouvrir={ouvrir} sansNom />
              ))}
            </div>
          </div>

          {/* Tiroir d'applis */}
          <div className={`os-tiroir${tiroir ? " ouvert" : ""}`} aria-hidden={!tiroir}>
            <div className="os-onglets">
              <button className={onglet === "applis" ? "on" : ""} onClick={() => setOnglet("applis")}>
                APPLIS
              </button>
              <button className={onglet === "widgets" ? "on" : ""} onClick={() => setOnglet("widgets")}>
                WIDGETS
              </button>
              <button className="os-onglets-loupe" aria-label="Rechercher" onClick={() => setRecherche(true)}>
                <IconeAncienne nom="recherche" taille={26} />
              </button>
            </div>
            {onglet === "applis" ? (
              <Grille ids={APPLIS.map((a) => a.id)} ouvrir={ouvrir} cle={tiroir ? "o" : "f"} />
            ) : (
              <div className="os-widgets">
                <div className="os-widget-apercu">
                  <div className="os-horloge-h" style={{ fontSize: 44 }}>{heure}</div>
                  <span>Horloge numérique · 4 × 2</span>
                </div>
                <div className="os-widget-apercu">
                  <div className="os-widget-compte" style={{ margin: 0 }}>
                    <IconeAncienne nom="endurreisen" taille={40} />
                    <div>
                      <b>{jours}</b>
                      <span>jours avant Endurreisen</span>
                    </div>
                  </div>
                  <span>Compte à rebours · 4 × 1</span>
                </div>
                <div className="os-widget-apercu">
                  <div className="os-cherche" style={{ margin: 0, pointerEvents: "none" }}>
                    <b>Odyssée</b>
                  </div>
                  <span>Recherche · 4 × 1</span>
                </div>
              </div>
            )}
          </div>

          {/* Fenêtre d'appli */}
          {fenetre && <FenetreAppli f={fenetre} fermeture={fermeture} onRetour={fermerFenetre} />}

          {/* Recherche */}
          {recherche && (
            <div className="os-recherche">
              <div className="os-recherche-barre">
                <IconeAncienne nom="recherche" taille={28} />
                <input autoFocus placeholder="Rechercher dans Odyssée" value={requete} onChange={(e) => setRequete(e.target.value)} />
                <button onClick={() => (requete ? setRequete("") : setRecherche(false))}>✕</button>
              </div>
              <div className="os-titre-holo">APPLIS</div>
              {resultats.filter((a) => a.id !== "recherche").map((a) => (
                <button key={a.id} className="os-ligne" onClick={(e) => ouvrir(a, e.currentTarget)}>
                  <IconeAncienne nom={a.id} taille={40} />
                  <span>{a.nom}</span>
                </button>
              ))}
              {resultats.length === 0 && <p className="os-vide">Aucun résultat</p>}
            </div>
          )}

          {/* Applis récentes */}
          {recents && (
            <div className="os-recents" onClick={() => setRecents(false)}>
              {historique.length === 0 && <p className="os-vide">Aucune appli récente</p>}
              {historique.map((a, i) => (
                <button
                  key={a.id}
                  className="os-recent"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    ouvrir(a, e.currentTarget);
                  }}
                >
                  <div className="os-recent-vignette">
                    <span>{a.nom}</span>
                  </div>
                  <IconeAncienne nom={a.id} taille={40} />
                  <b>{a.nom}</b>
                </button>
              ))}
            </div>
          )}

          {/* Rideau de notifications */}
          <div
            className={`os-rideau${rideau ? " ouvert" : ""}`}
            style={!rideau && tire ? ({ transform: `translateY(calc(-100% + ${tire}px))`, transition: "none" } as CSSProperties) : undefined}
          >
            <div className="os-rideau-tete">
              <div className="os-rideau-h">{heure}</div>
              <div className="os-rideau-d">
                {date.split(" ")[0]?.toUpperCase()}
                <br />
                {date.split(" ").slice(1).join(" ").toUpperCase()} {t?.getFullYear()}
              </div>
              <button className="os-rideau-reglages" aria-label="Réglages" onClick={(e) => ouvrir(par("reglages"), e.currentTarget)}>
                <IconeAncienne nom="reglages" taille={30} />
              </button>
            </div>
            {notifs.map((n, i) => (
              <div key={n.id} className="os-notif-bloc">
                <button className={`os-notif${i === 0 ? " grande" : ""}`} onClick={(e) => ouvrir(n.appli, e.currentTarget)}>
                  <span className="os-notif-ic">
                    <IconeAncienne nom={n.icone} taille={40} />
                  </span>
                  <span className="os-notif-t">
                    <b>{n.titre}</b>
                    <span>{n.texte}</span>
                    {i === 0 && n.auteur && <em>{n.auteur}</em>}
                  </span>
                  <span className="os-notif-h">{n.h}</span>
                </button>
                {i === 0 && (
                  <div className="os-notif-actions">
                    <button onClick={(e) => ouvrir(n.appli, e.currentTarget)}>OUVRIR</button>
                    <button onClick={() => setEffacees((x) => [...x, n.id])}>IGNORER</button>
                  </div>
                )}
              </div>
            ))}
            {notifs.length > 0 ? (
              <button className="os-effacer" onClick={() => setEffacees(["citation", "endurreisen", "maj"])}>
                EFFACER
              </button>
            ) : (
              <p className="os-vide">Aucune notification</p>
            )}
            <button className="os-rideau-poignee" aria-label="Fermer" onClick={() => setRideau(false)} />
          </div>
        </>
      )}

      {/* Barre de navigation */}
      <nav className="os-nav">
        <button aria-label="Retour" onClick={retour}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M17 4L6 12l11 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
        <button aria-label="Accueil" onClick={accueil}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 12L12 5l8 7M6.5 10v9h11v-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
        <button aria-label="Applis récentes" onClick={() => !verrou && setRecents((r) => !r)}>
          <svg viewBox="0 0 24 24" width="26" height="26"><rect x="5" y="6" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M9 3h12v12" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
        </button>
      </nav>
    </div>
  );
}

function Icone({ a, ouvrir, sansNom }: { a: Appli; ouvrir: (a: Appli, el?: Element | null) => void; sansNom?: boolean }) {
  return (
    <button className="os-app" onClick={(e) => ouvrir(a, e.currentTarget.querySelector("svg"))}>
      <IconeAncienne nom={a.id} taille={sansNom ? 52 : 56} />
      {!sansNom && <span>{a.nom}</span>}
    </button>
  );
}

function Grille({ ids, ouvrir, cle }: { ids: NomAppli[]; ouvrir: (a: Appli, el?: Element | null) => void; cle?: string }) {
  return (
    <div className="os-grille" key={cle}>
      {ids.map((id, i) => (
        <div key={id} className="os-grille-case" style={{ animationDelay: `${i * 25}ms` }}>
          <Icone a={par(id)} ouvrir={ouvrir} />
        </div>
      ))}
    </div>
  );
}

function Verrouillage({
  heure,
  date,
  jours,
  onOuvrir,
}: {
  heure: string;
  date: string;
  jours: number;
  onOuvrir: (cible: "bureau" | "recherche" | "album") => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [actif, setActif] = useState(false);
  const [part, setPart] = useState(false);
  const depart = useRef<{ x: number; y: number } | null>(null);
  const R = 115;

  const cible = (x: number, y: number): "bureau" | "recherche" | "album" | null => {
    if (Math.hypot(x, y) < R * 0.75) return null;
    const a = (Math.atan2(y, x) * 180) / Math.PI;
    if (a > -135 && a < -45) return "recherche";
    if (a > 135 || a < -135) return "album";
    return "bureau";
  };

  const fin = () => {
    const c = cible(pos.x, pos.y);
    depart.current = null;
    setActif(false);
    if (c) {
      setPart(true);
      setTimeout(() => onOuvrir(c), 380);
    } else setPos({ x: 0, y: 0 });
  };

  const d = Math.hypot(pos.x, pos.y);
  const proche = cible(pos.x, pos.y);

  return (
    <div className={`os-verrou${part ? " part" : ""}`}>
      <div className="os-verrou-heure">
        {heure.slice(0, 2)}
        <span>:</span>
        {heure.slice(3)}
      </div>
      <div className="os-verrou-date">{date}</div>
      <div className="os-verrou-info">Endurreisen · dans {jours} jours</div>

      <div className={`os-anneau${actif ? " actif" : ""}`}>
        <span className={`os-cible haut${proche === "recherche" ? " on" : ""}`}>
          <IconeAncienne nom="recherche" taille={34} />
        </span>
        <span className={`os-cible gauche${proche === "album" ? " on" : ""}`}>
          <IconeAncienne nom="album" taille={34} />
        </span>
        <span className={`os-cible droite${proche === "bureau" ? " on" : ""}`}>
          <i />
        </span>
        <div
          className="os-centre"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: actif ? "none" : undefined } as CSSProperties}
          onPointerDown={(e) => {
            depart.current = { x: e.clientX, y: e.clientY };
            setActif(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!depart.current) return;
            let x = e.clientX - depart.current.x;
            let y = e.clientY - depart.current.y;
            const l = Math.hypot(x, y);
            if (l > R) {
              x = (x / l) * R;
              y = (y / l) * R;
            }
            setPos({ x, y });
          }}
          onPointerUp={fin}
          onPointerCancel={fin}
          onDoubleClick={() => onOuvrir("bureau")}
        >
          <LogoOdyssee />
        </div>
        <div className="os-anneau-halo" style={{ opacity: actif ? 0.3 + (d / R) * 0.7 : 0 }} />
      </div>
      <p className="os-verrou-aide">Fais glisser le cheval vers le cercle pour déverrouiller</p>
    </div>
  );
}

function FenetreAppli({ f, fermeture, onRetour }: { f: Fenetre; fermeture: boolean; onRetour: () => void }) {
  const [charge, setCharge] = useState(false);

  // Zoom depuis l'icône
  const origine = f.depuis ? `${f.depuis.x}px ${f.depuis.y}px` : "50% 50%";

  return (
    <div
      className={`os-fenetre${fermeture ? " ferme" : ""}`}
      style={{ transformOrigin: origine } as CSSProperties}
    >
      <div className="os-barre-action">
        <button className="os-barre-retour" onClick={onRetour} aria-label="Retour">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 5l-7 7 7 7" fill="none" stroke="#ccc" strokeWidth="2.2" /></svg>
          <IconeAncienne nom={f.appli.id} taille={34} />
        </button>
        <b>{f.appli.nom}</b>
        <span className="os-barre-menu">⋮</span>
      </div>
      <div className="os-fenetre-corps">
        {!charge && (
          <div className="os-charge">
            <i />
          </div>
        )}
        <iframe
          key={f.appli.url}
          src={f.appli.url}
          title={f.appli.nom}
          onLoad={(e) => {
            try {
              const doc = e.currentTarget.contentDocument;
              if (doc) {
                const s = doc.createElement("style");
                s.textContent = CSS_APPLI;
                doc.head.appendChild(s);
              }
            } catch {}
            setCharge(true);
          }}
        />
      </div>
    </div>
  );
}
