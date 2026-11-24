"use client";

/**
 * Musique : l'appli Musique d'Android 4.1 (AOSP packages/apps/Music, licence Apache 2.0) :
 * onglets Artistes / Albums / Titres / Playlists, barre « À l'écoute » en bas, écran de lecture
 * (pochette, aléatoire, répétition, précédent / lecture / suivant, barre de progression).
 * Un seul titre préchargé : « Les Aléas De L'amour » de Belyyeloshadi Orchestra (fichier de Franck,
 * servi par le site en cinq morceaux base64 et reconstitué dans le navigateur).
 * Plus un onglet Radio FM : comme sur un vrai téléphone, il faut un casque filaire pour antenne,
 * et même « branché », aucune station n'est captée. Aucun micro, aucun matériel réel n'est utilisé.
 * Le son passe par le volume « Musique, vidéo, jeux » des Réglages et se tait en mode silencieux.
 * Sons d'interface : uniquement des effets AOSP Jelly Bean (Effect_Tick, Dock, Undock, LowBattery), rien de synthétisé.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRetour } from "./OdysseeOS";
import { creerStore } from "./session";
import { estMuet } from "./sonsSynth";
import { son } from "./sonsAndroid";
import { toast } from "./Systeme";
import { prendreCible } from "./Memoire";
import { sortie, volumes } from "./volume";

const A = "/aakanos/aosp";
export const POCHETTE = "/aakanos/musique/belyyeloshadi-orchestra-pochette.svg";
export const POCHETTE_MINI = "/aakanos/musique/belyyeloshadi-orchestra-pochette-mini.svg";
const MORCEAUX = [1, 2, 3, 4, 5].map((n) => `/aakanos/musique/les-aleas-de-l-amour.mp3.b64.${n}`);

export const TITRE = {
  titre: "Les Aléas De L'amour",
  artiste: "Belyyeloshadi Orchestra",
  album: "Les Aléas De L'amour",
  duree: 231,
  octets: 9_251_520,
};

export function IconeMusique({ taille = 56 }: { taille?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="os-icone" src="/aakanos/music.png" width={taille} height={taille} alt="" draggable={false} />;
}

/* ---------------- Le lecteur (un seul pour tout le téléphone, comme MediaPlaybackService) ---------------- */

type Repetition = "non" | "tout" | "un";
type Reglages = { aleatoire: boolean; repetition: Repetition; position: number; file: boolean; casque: boolean };
export const memoireMusique = creerStore<Reglages>("musique", { aleatoire: false, repetition: "non", position: 0, file: false, casque: false });

type Etat = { charge: "rien" | "chargement" | "pret" | "erreur"; lecture: boolean; position: number; duree: number; progres: number };
let etat: Etat = { charge: "rien", lecture: false, position: 0, duree: TITRE.duree, progres: 0 };
const abonnes = new Set<() => void>();
const publier = (e: Partial<Etat>) => {
  etat = { ...etat, ...e };
  abonnes.forEach((f) => f());
};
const ETAT_SERVEUR = etat;
export const useLecteur = () =>
  useSyncExternalStore(
    (f) => (abonnes.add(f), () => abonnes.delete(f)),
    () => etat,
    () => ETAT_SERVEUR,
  );

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let coupure: GainNode | null = null;
let chargement: Promise<boolean> | null = null;

/** Le volume « Musique » des Réglages et le mode silencieux, appliqués en direct. */
function appliquerVolume() {
  const muet = estMuet();
  if (coupure && ctx) {
    coupure.gain.value = muet ? 0 : 1;
    sortie(ctx, "media");
  } else if (audio) {
    const v = volumes.lire().media / 0.55;
    audio.volume = muet ? 0 : Math.min(1, Math.max(0, v));
  }
}
if (typeof window !== "undefined") {
  volumes.abonner(appliquerVolume);
  window.addEventListener("aakanos-muet", appliquerVolume);
}

async function chargerTitre(): Promise<boolean> {
  if (audio) return true;
  publier({ charge: "chargement", progres: 0 });
  try {
    const parties: string[] = [];
    for (const [i, url] of MORCEAUX.entries()) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      parties.push((await r.text()).trim());
      publier({ progres: (i + 1) / MORCEAUX.length });
    }
    const bin = atob(parties.join(""));
    const o = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    const a = new Audio(URL.createObjectURL(new Blob([o], { type: "audio/mpeg" })));
    a.preload = "auto";
    a.addEventListener("timeupdate", () => publier({ position: a.currentTime }));
    a.addEventListener("loadedmetadata", () => publier({ duree: a.duration || TITRE.duree }));
    a.addEventListener("play", () => publier({ lecture: true }));
    a.addEventListener("pause", () => {
      publier({ lecture: false });
      memoireMusique.ecrire((m) => ({ ...m, position: a.currentTime }));
    });
    a.addEventListener("ended", () => {
      const r = memoireMusique.lire().repetition;
      a.currentTime = 0;
      if (r !== "non") void a.play().catch(() => {});
      else publier({ lecture: false, position: 0 });
    });
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      try {
        ctx = new Ctor();
        coupure = ctx.createGain();
        ctx.createMediaElementSource(a).connect(coupure).connect(sortie(ctx, "media"));
      } catch {
        ctx = null;
        coupure = null;
      }
    }
    audio = a;
    const p = memoireMusique.lire().position;
    if (p > 0) a.currentTime = p;
    appliquerVolume();
    publier({ charge: "pret", position: p });
    return true;
  } catch {
    publier({ charge: "erreur" });
    chargement = null;
    return false;
  }
}

export async function jouer() {
  memoireMusique.ecrire((m) => ({ ...m, file: true }));
  chargement ??= chargerTitre();
  if (!(await chargement) || !audio) return toast("Ce type de fichier audio n'est pas compatible avec le lecteur.");
  if (ctx?.state === "suspended") await ctx.resume().catch(() => {});
  appliquerVolume();
  await audio.play().catch(() => publier({ lecture: false }));
}
export function pause() {
  audio?.pause();
}
export const basculer = () => (etat.lecture ? pause() : void jouer());
export function chercher(s: number) {
  publier({ position: s });
  if (audio) audio.currentTime = s;
  memoireMusique.ecrire((m) => ({ ...m, position: s }));
}
/** Un seul titre : « précédent » et « suivant » repartent du début, comme une file d'un titre. */
function precedent() {
  chercher(0);
}
function suivant() {
  chercher(0);
  const m = memoireMusique.lire();
  if (m.repetition === "non" && !m.aleatoire) pause();
}

/* ---------------- Les petits morceaux d'interface ---------------- */

const mmss = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

function Img({ n, t, alt = "" }: { n: string; t?: number; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${A}/${n}.svg`} width={t} height={t} alt={alt} draggable={false} />;
}
function Pochette({ taille, mini }: { taille: number; mini?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="mu-pochette" src={mini ? POCHETTE_MINI : POCHETTE} width={taille} height={taille} alt="" draggable={false} />;
}

/** La notification « en cours de lecture » du rideau (MediaPlaybackService : icône, titre, artiste). */
export function NotifMusique({ ouvrir }: { ouvrir: (e: Element) => void }) {
  const l = useLecteur();
  const m = memoireMusique.useValeur();
  if (!m.file || l.charge !== "pret") return null;
  return (
    <div className="os-notif-bloc">
      <button className="os-notif mu-notif" onClick={(e) => ouvrir(e.currentTarget)}>
        <span className="os-notif-ic">
          <Pochette taille={40} mini />
        </span>
        <span className="os-notif-t">
          <b translate="no">{TITRE.titre}</b>
          <span translate="no">{TITRE.artiste}</span>
        </span>
        <span className="os-notif-h">{l.lecture ? <Img n="music-stat_notify_musicplayer" /> : null}</span>
      </button>
    </div>
  );
}
/** L'icône de la barre d'état pendant la lecture. */
export function StatutMusique() {
  const l = useLecteur();
  if (!l.lecture) return null;
  return (
    <i className="os-mini mu-statut">
      <Img n="music-stat_notify_musicplayer" />
    </i>
  );
}

/* ---------------- L'appli ---------------- */

type Onglet = "artistes" | "albums" | "titres" | "playlists" | "radio";
const ONGLETS: { id: Onglet; nom: string; ic: string }[] = [
  { id: "artistes", nom: "Artistes", ic: "music-ic_tab_artists" },
  { id: "albums", nom: "Albums", ic: "music-ic_tab_albums" },
  { id: "titres", nom: "Titres", ic: "music-ic_tab_songs" },
  { id: "playlists", nom: "Playlists", ic: "music-ic_tab_playlists" },
  { id: "radio", nom: "Radio FM", ic: "stat_sys_headset" },
];
const memoireOnglet = creerStore<Onglet>("musique-onglet", "titres");

export function AppMusique() {
  const onglet = memoireOnglet.useValeur();
  const [ecran, setEcran] = useState<"liste" | "lecture" | "artiste" | "album" | "playlist">("liste");
  const l = useLecteur();
  const m = memoireMusique.useValeur();
  useRetour(ecran !== "liste", () => setEcran((e) => (e === "album" && onglet === "artistes" ? "artiste" : "liste")));
  useEffect(() => {
    // ouverte depuis Fichiers (Music/…/Les Aléas De L'amour.mp3) : lecture directe
    if (prendreCible("musique") === "jouer") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture depuis une autre appli
      setEcran("lecture");
      void jouer();
    }
  }, []);
  const lancer = () => {
    setEcran("lecture");
    void jouer();
  };

  if (ecran === "lecture") return <EcranLecture />;

  const ligneTitre = (
    <button type="button" className="mu-ligne" onClick={lancer}>
      <span className="mu-ligne-t">
        <b translate="no">{TITRE.titre}</b>
        <span translate="no">{TITRE.artiste}</span>
      </span>
      {m.file && l.lecture ? <Img n="music-indicator_ic_mp_playing_list" t={27} /> : null}
      <span className="mu-duree">{mmss(TITRE.duree)}</span>
    </button>
  );

  let corps: ReactNode;
  if (ecran === "artiste" || ecran === "album" || ecran === "playlist") {
    corps = (
      <>
        {ecran === "artiste" ? (
          <button type="button" className="mu-ligne mu-ligne-image" onClick={() => setEcran("album")}>
            <Pochette taille={64} mini />
            <span className="mu-ligne-t">
              <b translate="no">{TITRE.album}</b>
              <span>1 titre</span>
            </span>
          </button>
        ) : (
          ligneTitre
        )}
      </>
    );
  } else if (onglet === "artistes") {
    corps = (
      <button type="button" className="mu-ligne mu-ligne-image" onClick={() => setEcran("artiste")}>
        <Img n="music-ic_mp_artist_list" t={64} />
        <span className="mu-ligne-t">
          <b translate="no">{TITRE.artiste}</b>
          <span>1 album, 1 titre</span>
        </span>
      </button>
    );
  } else if (onglet === "albums") {
    corps = (
      <button type="button" className="mu-ligne mu-ligne-image" onClick={() => setEcran("album")}>
        <Pochette taille={64} mini />
        <span className="mu-ligne-t">
          <b translate="no">{TITRE.album}</b>
          <span translate="no">{TITRE.artiste}</span>
        </span>
      </button>
    );
  } else if (onglet === "titres") {
    corps = (
      <>
        <button type="button" className="mu-ligne mu-aleatoire" onClick={() => (memoireMusique.ecrire((x) => ({ ...x, aleatoire: true })), lancer())}>
          <Img n="music-ic_mp_shuffle_on_btn" t={40} />
          <span className="mu-ligne-t">
            <b>Lecture aléatoire</b>
          </span>
        </button>
        {ligneTitre}
      </>
    );
  } else if (onglet === "playlists") {
    corps = (
      <>
        <button type="button" className="mu-ligne mu-ligne-image" onClick={() => setEcran("playlist")}>
          <Img n="music-ic_mp_playlist_recently_added_list" t={64} />
          <span className="mu-ligne-t">
            <b>Ajoutés récemment</b>
          </span>
        </button>
        <button type="button" className="mu-ligne mu-ligne-image" onClick={() => toast("La playlist sélectionnée est vide.")}>
          <Img n="music-ic_mp_playlist_list" t={64} />
          <span className="mu-ligne-t">
            <b>Mes enregistrements audio</b>
            <span>Aucun titre</span>
          </span>
        </button>
      </>
    );
  } else {
    corps = <Radio />;
  }

  return (
    <div className="mu">
      {ecran === "liste" ? (
        <div className="mu-onglets" role="tablist">
          {ONGLETS.map((o) => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`mu-onglet${onglet === o.id ? " on" : ""}`} onClick={() => memoireOnglet.ecrire(o.id)}>
              <Img n={o.id === "radio" ? o.ic : `${o.ic}_${onglet === o.id ? "selected" : "unselected"}`} t={o.id === "radio" ? 24 : 32} />
              <span>{o.nom}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mu-sous-titre" translate={ecran === "playlist" ? undefined : "no"}>
          {ecran === "artiste" ? TITRE.artiste : ecran === "album" ? TITRE.album : "Ajoutés récemment"}
        </div>
      )}
      <div className="mu-liste">{corps}</div>
      {m.file && l.charge !== "rien" && onglet !== "radio" ? (
        <button type="button" className="mu-ecoute" onClick={() => setEcran("lecture")}>
          <span className="mu-ligne-t">
            <b translate="no">{TITRE.titre}</b>
            <span translate="no">{TITRE.artiste}</span>
          </span>
          {l.lecture ? <Img n="music-indicator_ic_mp_playing_list" t={27} /> : null}
        </button>
      ) : null}
    </div>
  );
}

/* ---------------- Écran de lecture (MediaPlaybackActivity, audio_player.xml) ---------------- */

function EcranLecture() {
  const l = useLecteur();
  const m = memoireMusique.useValeur();
  const [glisse, setGlisse] = useState<number | null>(null);
  const duree = l.duree || TITRE.duree;
  const pos = glisse ?? l.position;
  const aleatoire = () => {
    const v = !m.aleatoire;
    memoireMusique.ecrire((x) => ({ ...x, aleatoire: v, repetition: v && x.repetition === "un" ? "tout" : x.repetition }));
    toast(v ? "La lecture aléatoire est activée." : "La lecture aléatoire est désactivée.");
  };
  const repetition = () => {
    const r: Repetition = m.repetition === "non" ? "tout" : m.repetition === "tout" ? "un" : "non";
    memoireMusique.ecrire((x) => ({ ...x, repetition: r, aleatoire: r === "un" ? false : x.aleatoire }));
    toast(r === "non" ? "La lecture en boucle est désactivée." : r === "un" ? "Lecture en boucle du titre" : "Lecture en boucle de tous les titres");
  };
  return (
    <div className="mu mu-lecture">
      <div className="mu-haut">
        <div className="mu-grande-pochette">
          <Pochette taille={220} />
          {l.charge === "chargement" ? (
            <span className="mu-charge" role="status">
              <span className="mu-charge-barre">
                <i style={{ width: `${Math.round(l.progres * 100)}%` }} />
              </span>
              <span>Chargement…</span>
            </span>
          ) : null}
        </div>
        <div className="mu-cote">
          <button type="button" data-son="tick" aria-label="File d'attente" onClick={() => toast("1 titre")}>
            <Img n="music-ic_mp_current_playlist_btn" t={48} />
          </button>
          <button type="button" data-son="tick" aria-label="Lecture aléatoire" aria-pressed={m.aleatoire} onClick={aleatoire}>
            <Img n={m.aleatoire ? "music-ic_mp_shuffle_on_btn" : "music-ic_mp_shuffle_off_btn"} t={48} />
          </button>
          <button type="button" data-son="tick" aria-label="Répétition" onClick={repetition}>
            <Img n={m.repetition === "non" ? "music-ic_mp_repeat_off_btn" : m.repetition === "tout" ? "music-ic_mp_repeat_all_btn" : "music-ic_mp_repeat_once_btn"} t={48} />
          </button>
        </div>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_artist_playback" t={32} />
        <b translate="no">{TITRE.artiste}</b>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_album_playback" t={32} />
        <span translate="no">{TITRE.album}</span>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_song_playback" t={32} />
        <span translate="no">{TITRE.titre}</span>
      </div>
      <div className="mu-commandes">
        <span className="mu-temps">{mmss(pos)}</span>
        <span className="mu-boutons">
          <button type="button" data-son="tick" aria-label="Précédent" onClick={precedent}>
            <Img n="ic_media_previous" t={40} />
          </button>
          <button type="button" className="mu-play" aria-label={l.lecture ? "Pause" : "Lecture"} onClick={basculer}>
            <Img n={l.lecture ? "ic_media_pause" : "ic_media_play"} t={40} />
          </button>
          <button type="button" data-son="tick" aria-label="Suivant" onClick={suivant}>
            <Img n="ic_media_next" t={40} />
          </button>
        </span>
        <span className="mu-temps">{mmss(duree)}</span>
      </div>
      <input
        className="mu-progression"
        type="range"
        min={0}
        max={Math.round(duree)}
        step={1}
        value={Math.round(pos)}
        aria-label="Position"
        style={{ "--p": `${(pos / duree) * 100}%` } as CSSProperties}
        onChange={(e) => setGlisse(Number(e.target.value))}
        onPointerUp={(e) => (chercher(Number((e.target as HTMLInputElement).value)), setGlisse(null))}
        onKeyUp={(e) => (chercher(Number((e.target as HTMLInputElement).value)), setGlisse(null))}
      />
    </div>
  );
}

/* ---------------- Radio FM : il faut un casque filaire comme antenne ---------------- */

function Radio() {
  const m = memoireMusique.useValeur();
  const [freq, setFreq] = useState(87.5);
  const [recherche, setRecherche] = useState(false);
  const [echec, setEchec] = useState(false);
  const minuterie = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (minuterie.current) window.clearInterval(minuterie.current);
    },
    [],
  );
  const brancher = (v: boolean) => {
    son(v ? "dock" : "undock", 0.6);
    memoireMusique.ecrire((x) => ({ ...x, casque: v }));
    setEchec(false);
  };
  const balayer = (sens: 1 | -1) => {
    if (recherche) return;
    setEchec(false);
    setRecherche(true);
    let f = freq;
    let pas = 0;
    minuterie.current = window.setInterval(() => {
      f = Math.round((f + sens * 0.1) * 10) / 10;
      if (f > 108) f = 87.5;
      if (f < 87.5) f = 108;
      setFreq(f);
      // chaque arrêt du balayage sur une fréquence : le « tick » AOSP (Effect_Tick), sans rien capter
      if (pas % 41 === 0) son("tick", 0.5, "media");
      if (++pas >= 205) {
        window.clearInterval(minuterie.current!);
        minuterie.current = null;
        setRecherche(false);
        setEchec(true);
        son("batterie", 0.5);
      }
    }, 22);
  };
  if (!m.casque)
    return (
      <div className="mu-radio">
        <div className="mu-radio-vide">
          <Img n="stat_sys_headset" t={72} />
          <b>Branchez un casque filaire : il sert d’antenne FM.</b>
          <p>La radio FM de ce téléphone capte les ondes par le fil du casque. Sans casque, pas d’antenne, pas de radio.</p>
          <button type="button" className="jb-bouton" onClick={() => brancher(true)}>
            Simuler un casque branché
          </button>
        </div>
      </div>
    );
  return (
    <div className="mu-radio">
      <div className="mu-radio-cadran">
        <span className="mu-radio-freq" translate="no">
          {freq.toFixed(1)}
          <small>MHz</small>
        </span>
        <span className="mu-radio-etat">{recherche ? "Recherche des stations…" : echec ? "Aucune station trouvée" : "Signal trop faible"}</span>
        <span className="mu-radio-echelle" aria-hidden="true">
          <i style={{ left: `${((freq - 87.5) / 20.5) * 100}%` }} />
        </span>
        <span className="mu-radio-graduations" aria-hidden="true" translate="no">
          <span>88</span>
          <span>92</span>
          <span>96</span>
          <span>100</span>
          <span>104</span>
          <span>108</span>
        </span>
      </div>
      <div className="mu-radio-boutons">
        <button type="button" data-son="tick" className="jb-bouton" disabled={recherche} onClick={() => balayer(-1)} aria-label="Rechercher vers le bas">
          ◀◀
        </button>
        <button type="button" data-son="tick" className="jb-bouton" disabled={recherche} onClick={() => balayer(1)}>
          Rechercher
        </button>
        <button type="button" data-son="tick" className="jb-bouton" disabled={recherche} onClick={() => balayer(1)} aria-label="Rechercher vers le haut">
          ▶▶
        </button>
      </div>
      {echec ? (
        <div className="mu-radio-echec" role="alert">
          <Img n="ic_dialog_alert_holo_dark" t={32} />
          <span>
            <b>Aucune station trouvée</b>
            <small>Signal trop faible. Le casque est branché, mais aucune station n’émet assez fort jusqu’ici.</small>
          </span>
        </div>
      ) : null}
      <button type="button" className="jb-bouton mu-radio-debrancher" disabled={recherche} onClick={() => brancher(false)}>
        Débrancher le casque
      </button>
    </div>
  );
}
