"use client";

/**
 * L'état système d'AakanOS : Wi-Fi, Bluetooth, mode avion, son, luminosité, fond d'écran,
 * options pour les développeurs, toasts. Plus les sous-écrans des Réglages (Jelly Bean 4.1, Holo).
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { estMuet, regleMuet, sonSynth } from "./sonsSynth";
import { SONNERIES, choixSons, jouerSonnerie, nomSonnerie, type Categorie } from "./sonneries";
import { son } from "./sonsAndroid";
import { volumes, type Canal } from "./volume";
import { ouvrirAppli } from "./Memoire";
import { LogoAakanos } from "./LogoAakanos";
import { CAPACITE_TELEPHONE, SYSTEME_TELEPHONE, occupeTelephone, tailleOctets } from "./stockageTelephone";
import { creerStore } from "./session";

/** Le « tic » d'Android quand on règle un volume (VolumeIncremental, AOSP), pas plus d'un toutes les 150 ms. */
let dernierBip = 0;
function bipVolume(k: Canal) {
  const t = Date.now();
  if (t - dernierBip < 150) return;
  dernierBip = t;
  son("volume", 1, k);
}

export type Fond = "faisceaux" | "savane" | "holo" | "nebuleuse";
export const FONDS: { id: Fond; nom: string }[] = [
  { id: "faisceaux", nom: "Faisceaux" },
  { id: "savane", nom: "Savane de nuit" },
  { id: "holo", nom: "Grille Holo" },
  { id: "nebuleuse", nom: "Nébuleuse" },
];

export type Systeme = {
  wifi: boolean;
  bt: boolean;
  avion: boolean;
  muet: boolean;
  sonsTouches: boolean;
  lum: number;
  fond: Fond;
  dev: boolean;
  touches: boolean;
  limites: boolean;
  h24: boolean;
  regler: (p: Partial<Omit<Systeme, "regler">>) => void;
};

const defaut: Omit<Systeme, "regler"> = { wifi: true, bt: false, avion: false, muet: false, sonsTouches: true, lum: 0.8, fond: "faisceaux", dev: false, touches: false, limites: false, h24: true };
export const SystemeCtx = createContext<Systeme>({ ...defaut, regler: () => {} });
export const useSysteme = () => useContext(SystemeCtx);

export function useEtatSysteme(): Systeme {
  const [e, setE] = useState(defaut);
  useEffect(() => {
    try {
      const brut = sessionStorage.getItem("aakanos-systeme");
      const lu = brut ? (JSON.parse(brut) as Partial<typeof defaut>) : {};
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local au montage
      setE((x) => ({ ...x, ...lu, muet: estMuet() }));
    } catch {}
  }, []);
  const regler = (p: Partial<typeof defaut>) =>
    setE((x) => {
      const n = { ...x, ...p };
      if (p.muet !== undefined) regleMuet(p.muet);
      try {
        const { muet: _m, ...garde } = n;
        void _m;
        sessionStorage.setItem("aakanos-systeme", JSON.stringify(garde));
      } catch {}
      return n;
    });
  return { ...e, regler };
}

/** Un toast Holo, comme Toast.makeText(...).show(). */
export function toast(texte: string) {
  window.dispatchEvent(new CustomEvent("aakanos-toast", { detail: texte }));
}

export function Toasts() {
  const [t, setT] = useState<{ id: number; txt: string; sort: boolean } | null>(null);
  useEffect(() => {
    let a = 0;
    let b = 0;
    const f = (e: Event) => {
      const id = Date.now();
      window.clearTimeout(a);
      window.clearTimeout(b);
      setT({ id, txt: (e as CustomEvent<string>).detail, sort: false });
      a = window.setTimeout(() => setT((x) => (x && x.id === id ? { ...x, sort: true } : x)), 2300);
      b = window.setTimeout(() => setT((x) => (x && x.id === id ? null : x)), 2600);
    };
    window.addEventListener("aakanos-toast", f);
    return () => window.removeEventListener("aakanos-toast", f);
  }, []);
  return t ? (
    <div key={t.id} className={`os-toast${t.sort ? " sort" : ""}`} role="status">
      {t.txt}
    </div>
  ) : null;
}

/** Démarrage : écran noir, les quatre étoiles apparaissent une à une, puis le nom (≈ 3 s). */
export function Demarrage({ fini }: { fini: () => void }) {
  const [sort, setSort] = useState(false);
  useEffect(() => {
    sonSynth("boot");
    const a = window.setTimeout(() => setSort(true), 2800);
    const b = window.setTimeout(fini, 3200);
    return () => (window.clearTimeout(a), window.clearTimeout(b));
  }, [fini]);
  return (
    <div className={`os-boot${sort ? " sort" : ""}`} onClick={() => (setSort(true), window.setTimeout(fini, 300))}>
      <LogoAakanos taille={220} anime className="os-boot-logo" />
      <b className="os-boot-nom" data-nom="AakanOS">
        AakanOS
      </b>
      <small>ODYSSÉE 0.2</small>
    </div>
  );
}

/** Les ronds qui montrent où l'on touche (option pour les développeurs). */
export function Touches() {
  const [pts, setPts] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const f = (e: PointerEvent) => {
      const o = document.querySelector(".os")?.getBoundingClientRect();
      if (!o) return;
      const id = e.timeStamp + Math.random();
      setPts((p) => [...p, { id, x: e.clientX - o.left, y: e.clientY - o.top }]);
      window.setTimeout(() => setPts((p) => p.filter((q) => q.id !== id)), 450);
    };
    window.addEventListener("pointerdown", f, true);
    return () => window.removeEventListener("pointerdown", f, true);
  }, []);
  return (
    <>
      {pts.map((p) => (
        <i key={p.id} className="os-touche" style={{ left: p.x, top: p.y }} />
      ))}
    </>
  );
}

/* ---------------- Composants Holo ---------------- */

export function Interrupteur({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`holo-switch${on ? " on" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
    >
      <span>{on ? "OUI" : "NON"}</span>
      <i />
    </button>
  );
}

export function Curseur({ valeur, onChange, min = 0, max = 1 }: { valeur: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prendre = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (x - r.left) / r.width));
    onChange(min + v * (max - min));
  };
  const pc = ((valeur - min) / (max - min)) * 100;
  return (
    <div
      ref={ref}
      className="holo-curseur"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        prendre(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && prendre(e.clientX)}
    >
      <i style={{ width: `${pc}%` }} />
      <b style={{ left: `${pc}%` }} />
    </div>
  );
}

function Ligne({ titre, sous, droite, onClick }: { titre: string; sous?: ReactNode; droite?: ReactNode; onClick?: () => void }) {
  return (
    <div className={`reg2-ligne${onClick ? " cliquable" : ""}`} onClick={onClick} role={onClick ? "button" : undefined}>
      <span className="reg-t">
        <b>{titre}</b>
        {sous ? <small>{sous}</small> : null}
      </span>
      {droite}
    </div>
  );
}
function Titre({ children }: { children: ReactNode }) {
  return <div className="os-titre-holo">{children}</div>;
}
export function Dlg({ titre, children, fermer }: { titre: string; children: ReactNode; fermer: () => void }) {
  return (
    <div className="dlg-fond" onClick={fermer}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-titre">{titre}</div>
        {children}
      </div>
    </div>
  );
}

/** Le sélecteur de sonnerie de Jelly Bean : liste à boutons radio, chaque choix se fait entendre. */
const TITRES_SONS: Record<Categorie, string> = { appel: "Sonnerie du téléphone", notif: "Notification par défaut", alarme: "Sonnerie de l’alarme" };
export function ChoixSonnerie({ categorie, valeur, choisir, fermer }: { categorie: Categorie; valeur: string; choisir: (f: string) => void; fermer: () => void }) {
  const [sel, setSel] = useState(valeur);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);
  const ecouter = (f: string) => {
    stop.current();
    setSel(f);
    stop.current = jouerSonnerie(f, false, categorie === "alarme" ? "alarme" : "sonnerie");
  };
  return (
    <Dlg titre={TITRES_SONS[categorie]} fermer={fermer}>
      <div className="dlg-liste-sons">
        {SONNERIES[categorie].map((f) => (
          <button key={f} className="dlg-choix" onClick={() => ecouter(f)}>
            <span translate="no">{nomSonnerie(f)}</span> <i className={sel === f ? "on" : ""} />
          </button>
        ))}
      </div>
      <div className="dlg-boutons">
        <button onClick={fermer}>Annuler</button>
        <button onClick={() => (choisir(sel), fermer())}>OK</button>
      </div>
    </Dlg>
  );
}

/* ---------------- Sous-écrans des Réglages ---------------- */

export type EcranReglage = "wifi" | "bluetooth" | "affichage" | "son" | "stockage" | "batterie" | "dateheure" | "dev";

type ReseauWifi = { nom: string; force: number; verrou: boolean; sorte: "sam" | "faux" | "loin" };
const RESEAUX: ReseauWifi[] = [
  { nom: "Sam telecom", force: 4, verrou: false, sorte: "sam" },
  { nom: "Le cul de Celjo", force: 3, verrou: true, sorte: "faux" },
  { nom: "Tu n’a pas de wifi pauvre con?", force: 2, verrou: true, sorte: "faux" },
  { nom: "Cabinet_Invités", force: 1, verrou: false, sorte: "loin" },
];
const memoireWifi = creerStore<{ reseau: string | null }>("wifi-reseau", { reseau: null });

function Cadenas() {
  return (
    <svg className="reg2-cadenas" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4z" fill="#9aa" />
    </svg>
  );
}

function Signal({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={["M12 21l2.2-2.6a3 3 0 0 0-4.4 0z", "M7.6 15.7a6.3 6.3 0 0 1 8.8 0l-1.6 1.9a4 4 0 0 0-5.6 0z", "M4.9 12.4a10.4 10.4 0 0 1 14.2 0l-1.7 2a7.8 7.8 0 0 0-10.8 0z", "M2.2 9.2a14.5 14.5 0 0 1 19.6 0l-1.7 2a11.9 11.9 0 0 0-16.2 0z"][i]} fill={i < n ? "#33b5e5" : "#3a3a3a"} />
      ))}
    </svg>
  );
}

export function SousReglage({ ecran }: { ecran: EcranReglage }) {
  const s = useSysteme();
  const [dlg, setDlg] = useState<null | { t: string; corps: ReactNode }>(null);
  const [cherche, setCherche] = useState(false);
  const [mdp, setMdp] = useState("");
  const sons = choixSons.useValeur();
  const vols = volumes.useValeur();
  const [choixSon, setChoixSon] = useState<Categorie | null>(null);
  const [heure, setHeure] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setHeure(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const corps = (() => {
    switch (ecran) {
      case "wifi":
        return <EcranWifi s={s} setMdp={setMdp} setDlg={setDlg} />;
      case "bluetooth":
        return (
          <>
            <Ligne titre="Bluetooth" droite={<Interrupteur on={s.bt && !s.avion} onChange={(v) => (s.avion ? toast("Désactivez d’abord le mode Avion") : (s.regler({ bt: v }), v && (setCherche(true), window.setTimeout(() => setCherche(false), 3200))))} />} />
            {s.bt && !s.avion ? (
              <>
                <Ligne titre="Hanck 7 Pro Max" sous="Visible par tous les appareils Bluetooth à proximité (2:00)" />
                <Titre>APPAREILS DISPONIBLES {cherche ? <i className="reg2-tourne" /> : null}</Titre>
                {cherche ? <p className="os-vide">Recherche en cours…</p> : <p className="os-vide">Aucun appareil Bluetooth à proximité. Même pas une enceinte.</p>}
                <button className="reg2-bouton" onClick={() => (setCherche(true), window.setTimeout(() => setCherche(false), 3200))}>
                  RECHERCHER DES APPAREILS
                </button>
              </>
            ) : (
              <p className="os-vide">Activez le Bluetooth pour voir les appareils à proximité.</p>
            )}
          </>
        );
      case "affichage":
        return (
          <>
            <Titre>LUMINOSITÉ</Titre>
            <div className="reg2-lum">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#888"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" /></svg>
              <Curseur valeur={s.lum} onChange={(v) => s.regler({ lum: Math.max(0.15, v) })} />
              <b>{Math.round(s.lum * 100)} %</b>
            </div>
            <Titre>FOND D’ÉCRAN</Titre>
            <div className="reg2-fonds">
              {FONDS.map((f, i) => (
                <button key={f.id} className={`reg2-fond${s.fond === f.id ? " on" : ""}`} style={{ animationDelay: `${i * 50}ms` }} onClick={() => (s.regler({ fond: f.id }), toast(`Fond d’écran : ${f.nom}`))}>
                  <span className={`os-fond fond-${f.id}`}>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <b>{f.nom}</b>
                </button>
              ))}
            </div>
            <Ligne titre="Veille" sous="Après 1 minute d’inactivité" onClick={() => toast("La veille est gérée par Casto")} />
            <Ligne titre="Taille de police" sous="Normale" />
          </>
        );
      case "son":
        return (
          <>
            <Ligne titre="Mode silencieux" sous={s.muet ? "Aucun son système" : "Les sons sont activés"} droite={<Interrupteur on={s.muet} onChange={(v) => s.regler({ muet: v })} />} />
            <Titre>VOLUMES</Titre>
            <div className="reg2-vol">
              {(
                [
                  ["sonnerie", "Sonnerie et notifications"],
                  ["media", "Musique, vidéo, jeux"],
                  ["alarme", "Alarmes"],
                ] as const
              ).map(([k, n]) => (
                <div key={n}>
                  <small>{n}</small>
                  <Curseur
                    valeur={s.muet ? 0 : vols[k]}
                    onChange={(v) => {
                      if (s.muet) s.regler({ muet: false });
                      volumes.ecrire((x) => ({ ...x, [k]: v }));
                      bipVolume(k);
                    }}
                  />
                </div>
              ))}
            </div>
            <Titre>SYSTÈME</Titre>
            <Ligne titre="Sonnerie du téléphone" sous={<span translate="no">{nomSonnerie(sons.appel)}</span>} onClick={() => setChoixSon("appel")} />
            <Ligne titre="Notification par défaut" sous={<span translate="no">{nomSonnerie(sons.notif)}</span>} onClick={() => setChoixSon("notif")} />
            <Ligne titre="Alarme par défaut" sous={<span translate="no">{nomSonnerie(sons.alarme)}</span>} onClick={() => setChoixSon("alarme")} />
            <Ligne titre="Sons des touches" droite={<Interrupteur on={s.sonsTouches} onChange={(v) => s.regler({ sonsTouches: v })} />} />
          </>
        );
      case "stockage":
        return <Stockage />;
      case "batterie":
        return (
          <>
            <div className="reg2-batt">
              <svg viewBox="0 0 300 110" width="100%" height="120" aria-hidden="true">
                <defs>
                  <linearGradient id="bt-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#33b5e5" stopOpacity=".55" />
                    <stop offset="1" stopColor="#33b5e5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="reg2-batt-trait" d="M0 12 L60 24 L120 40 L160 46 L200 58 L260 70 L300 78" fill="none" stroke="#33b5e5" strokeWidth="2.5" />
                <path d="M0 12 L60 24 L120 40 L160 46 L200 58 L260 70 L300 78 V110 H0z" fill="url(#bt-g)" />
              </svg>
              <small>Sur batterie depuis 6 h 12 min · 75 %</small>
            </div>
            {[
              ["Écran", 41],
              ["Sam-Telecom", 23],
              ["Pulpüs market", 14],
              ["Veille du téléphone", 12],
              ["Nounou Browser", 6],
              ["Système AakanOS", 4],
            ].map(([n, p], i) => (
              <div key={n} className="reg2-conso" style={{ animationDelay: `${i * 50}ms` }}>
                <b>{n}</b>
                <span>{p} %</span>
                <i style={{ width: `${p}%` }} />
              </div>
            ))}
          </>
        );
      case "dateheure":
        return (
          <>
            <Ligne titre="Date et heure automatiques" sous="Utiliser l’heure fournie par Sam-Telecom" droite={<Interrupteur on onChange={() => toast("Réglé par Sam-Telecom")} />} />
            <Ligne titre="Fuseau horaire automatique" sous="Heure normale d’Europe centrale (Paris)" droite={<Interrupteur on onChange={() => toast("Réglé par Sam-Telecom")} />} />
            <Ligne titre="Date" sous={heure.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} />
            <Ligne titre="Heure" sous={heure.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: !s.h24 })} />
            <Ligne titre="Format 24 heures" sous="13:00" droite={<Interrupteur on={s.h24} onChange={(v) => s.regler({ h24: v })} />} />
            <Ligne titre="Format de date" sous="31/12/2026" />
          </>
        );
      case "dev":
        return (
          <>
            <p className="reg2-avert">Ces paramètres sont destinés exclusivement à une utilisation pour le développement. Ils peuvent entraîner l’arrêt de AakanOS ou un fonctionnement inattendu.</p>
            <Titre>SAISIE</Titre>
            <Ligne titre="Afficher les touchers" sous="Afficher un repère visuel pour les touchers" droite={<Interrupteur on={s.touches} onChange={(v) => s.regler({ touches: v })} />} />
            <Titre>DESSIN</Titre>
            <Ligne titre="Afficher les limites de mise en page" sous="Afficher les limites de clip, les marges, etc." droite={<Interrupteur on={s.limites} onChange={(v) => s.regler({ limites: v })} />} />
            <Titre>CASTO</Titre>
            <Ligne titre="Rester beau" sous="L’écran ne se met jamais en veille pendant que Casto se regarde" droite={<Interrupteur on onChange={() => toast("Impossible de désactiver : Casto est trop beau")} />} />
            <Ligne titre="Ne plus être développeur" onClick={() => (s.regler({ dev: false, touches: false, limites: false }), toast("Options pour les développeurs masquées"))} />
          </>
        );
    }
  })();

  return (
    <div className="app-defile reg2">
      {corps}
      {choixSon ? (
        <ChoixSonnerie categorie={choixSon} valeur={sons[choixSon]} choisir={(f) => choixSons.ecrire((x) => ({ ...x, [choixSon]: f }))} fermer={() => setChoixSon(null)} />
      ) : null}
      {dlg ? (
        <Dlg titre={dlg.t} fermer={() => setDlg(null)}>
          <div className="dlg-corps">
            <small>Sécurité : WPA2 PSK · Puissance du signal : bonne</small>
            <input className="holo-champ" type="password" placeholder="Mot de passe" value={mdp} onChange={(e) => setMdp(e.target.value)} autoFocus />
          </div>
          <div className="dlg-boutons">
            <button onClick={() => setDlg(null)}>Annuler</button>
            <button
              disabled={mdp.length < 8}
              onClick={() => {
                setDlg(null);
                toast("Problème d’authentification");
              }}
            >
              Se connecter
            </button>
          </div>
        </Dlg>
      ) : null}
    </div>
  );
}

/* ---------------- Stockage : celui du téléphone (les mêmes chiffres que Fichiers) ---------------- */

function Stockage() {
  const capacite = CAPACITE_TELEPHONE;
  const utilise = occupeTelephone();
  const systeme = SYSTEME_TELEPHONE;
  const fichiers = Math.max(0, utilise - systeme);
  const part = utilise / capacite;
  return (
    <>
      <Titre>LE STOCKAGE DU TÉLÉPHONE</Titre>
      <div className="reg2-stock">
        <i style={{ width: `${Math.max(part * 100, 2)}%`, background: "#33b5e5" }} />
      </div>
      <Ligne titre="Espace total" sous={tailleOctets(capacite)} />
      <Ligne titre="Utilisé" sous={tailleOctets(utilise)} droite={<i className="reg2-pastille" style={{ background: "#33b5e5" }} />} />
      <Ligne titre="Système" sous={tailleOctets(systeme)} />
      <Ligne titre="Fichiers" sous={tailleOctets(fichiers)} />
      <Ligne titre="Disponible" sous={tailleOctets(Math.max(0, capacite - utilise))} />
      <p className="reg2-note">Le stockage du téléphone : la mémoire interne de ce Hanck 7 Pro Max, la même que celle de Fichiers.</p>
    </>
  );
}

function EcranWifi({
  s,
  setMdp,
  setDlg,
}: {
  s: ReturnType<typeof useSysteme>;
  setMdp: (v: string) => void;
  setDlg: (v: { t: string; corps: ReactNode } | null) => void;
}) {
  const { reseau } = memoireWifi.useValeur();
  const [etape, setEtape] = useState<null | { nom: string; phase: "connexion" | "ip" | "loin" }>(null);
  const tenter = (r: ReseauWifi) => {
    if (r.verrou) {
      setMdp("");
      setDlg({ t: r.nom, corps: null });
      return;
    }
    setEtape({ nom: r.nom, phase: "connexion" });
    const t1 = r.sorte === "loin" ? 2200 : 800;
    const t2 = r.sorte === "loin" ? 4000 : 1100;
    window.setTimeout(() => setEtape({ nom: r.nom, phase: "ip" }), t1);
    window.setTimeout(() => {
      if (r.sorte === "loin") {
        setEtape({ nom: r.nom, phase: "loin" });
        return;
      }
      setEtape(null);
      memoireWifi.ecrire({ reseau: r.nom });
      toast("Connecté à Sam telecom. Pas d’internet.");
      ouvrirAppli("nounou", "captif-sam");
    }, t1 + t2);
  };
  return (
    <>
      <Ligne titre="Wi-Fi" droite={<Interrupteur on={s.wifi && !s.avion} onChange={(v) => (s.avion ? toast("Désactivez d’abord le mode Avion") : s.regler({ wifi: v }))} />} />
      {s.wifi && !s.avion ? (
        <>
          <Titre>RÉSEAUX WI-FI</Titre>
          {RESEAUX.map((r, i) => (
            <div key={r.nom} className="reg2-reseau" style={{ animationDelay: `${i * 60}ms` }}>
              <Ligne
                titre={r.nom}
                sous={
                  etape?.nom === r.nom && etape.phase === "connexion"
                    ? "Connexion…"
                    : etape?.nom === r.nom && etape.phase === "ip"
                      ? "Obtention d’une adresse IP…"
                      : reseau === r.nom
                        ? "Connecté · Pas d’internet"
                        : r.verrou
                          ? "Sécurisé par WPA2"
                          : "Ouvert"
                }
                droite={
                  <span className="reg2-wifi-ic">
                    {r.verrou ? <Cadenas /> : null}
                    <Signal n={r.force} />
                  </span>
                }
                onClick={() => !etape && tenter(r)}
              />
            </div>
          ))}
          {etape?.phase === "loin" ? (
            <Dlg titre={etape.nom} fermer={() => setEtape(null)}>
              <p className="dlg-corps">Distance du wifi trop loin, impossible de se connecter</p>
              <div className="dlg-boutons">
                <button onClick={() => setEtape(null)}>OK</button>
              </div>
            </Dlg>
          ) : null}
        </>
      ) : (
        <p className="os-vide">{s.avion ? "Mode Avion activé" : "Pour afficher les réseaux disponibles, activez le Wi-Fi."}</p>
      )}
    </>
  );
}
