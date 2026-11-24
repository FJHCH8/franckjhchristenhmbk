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
/** La pochette par défaut du lecteur, pour un titre sans pochette. */
export const POCHETTE_INCONNUE = "/aakanos/musique/pochette-inconnue.svg";

export type Piste = { titre: string; artiste: string; album: string; annee?: string; genre?: string; duree: number; octets: number; morceaux: string[]; pochette: string; pochetteMini: string; dossier: string; date: string };
/** Les titres du téléphone : chacun en morceaux base64 sous /aakanos/musique/. */
export const PISTES: Piste[] = [
  {
    titre: "Les Aléas De L'amour",
    artiste: "Belyyeloshadi Orchestra",
    album: "Les Aléas De L'amour",
    duree: 231,
    octets: 9_251_520,
    morceaux: [1, 2, 3, 4, 5].map((n) => `/aakanos/musique/les-aleas-de-l-amour.mp3.b64.${n}`),
    pochette: POCHETTE,
    pochetteMini: POCHETTE_MINI,
    dossier: "Belyyeloshadi Orchestra",
    date: "24/11/2026 19:03",
  },
  {
    titre: "Merry Fkng Christmas",
    artiste: "Rafayel Obaateppi",
    album: "Merry Fkng Christmas",
    duree: 186,
    octets: 4_462_549,
    morceaux: [1, 2, 3].map((n) => `/aakanos/musique/merry-fkng-christmas.mp3.b64.${n}`),
    pochette: POCHETTE_INCONNUE,
    pochetteMini: POCHETTE_INCONNUE,
    dossier: "Rafayel Obaateppi",
    date: "24/11/2026 21:28",
  },
];
export const TITRE = PISTES[0]!;
/* ---------------- Les fiches modifiées par Franck (code d'édition du site) ----------------
 * Seule exception à la remise à zéro du téléphone : enregistrées côté serveur, pour tout le monde.
 * Les titres gardent leurs données d'origine tant qu'ils n'ont pas été modifiés. */
type Fiche = { titre?: string; artiste?: string; album?: string; annee?: string; genre?: string; pochette?: string; maj?: number };
const URL_FICHES = "/aakanos/musique-edition";
let fiches: Record<string, Fiche> = {};
let fusion: Piste[] = PISTES;
let fichesDemandees = false;
const abonnesFiches = new Set<() => void>();
function poserFiches(f: Record<string, Fiche>) {
  fiches = f ?? {};
  fusion = PISTES.map((p, k) => {
    const x = fiches[String(k)];
    if (!x) return p;
    const pochette = x.pochette ? `${URL_FICHES}/pochette/${x.pochette}` : null;
    return {
      ...p,
      titre: x.titre || p.titre,
      artiste: x.artiste || p.artiste,
      album: x.album || p.album,
      annee: x.annee || p.annee,
      genre: x.genre || p.genre,
      pochette: pochette ?? p.pochette,
      pochetteMini: pochette ?? p.pochetteMini,
      dossier: x.artiste || p.dossier,
    };
  });
  abonnesFiches.forEach((f2) => f2());
}
function demanderFiches() {
  if (fichesDemandees || typeof window === "undefined") return;
  fichesDemandees = true;
  fetch(URL_FICHES, { cache: "no-store", credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { fiches?: Record<string, Fiche> } | null) => d?.fiches && poserFiches(d.fiches))
    .catch(() => {
      fichesDemandees = false;
    });
}
/** Les titres, avec les fiches modifiées (titre, artiste, album, année, genre, pochette). */
export const usePistes = () =>
  useSyncExternalStore(
    (f) => {
      abonnesFiches.add(f);
      demanderFiches();
      return () => abonnesFiches.delete(f);
    },
    () => fusion,
    () => PISTES,
  );

const pisteCourante = () => Math.min(PISTES.length - 1, Math.max(0, memoireMusique.lire().piste ?? 0));

export function IconeMusique({ taille = 56 }: { taille?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="os-icone" src="/aakanos/music.png" width={taille} height={taille} alt="" draggable={false} />;
}

/* ---------------- Le lecteur (un seul pour tout le téléphone, comme MediaPlaybackService) ---------------- */

type Repetition = "non" | "tout" | "un";
type Reglages = { aleatoire: boolean; repetition: Repetition; position: number; file: boolean; casque: boolean; piste?: number };
export const memoireMusique = creerStore<Reglages>("musique", { aleatoire: false, repetition: "non", position: 0, file: false, casque: false });

type Etat = { charge: "rien" | "chargement" | "pret" | "erreur"; lecture: boolean; position: number; duree: number; progres: number; piste: number };
let etat: Etat = { charge: "rien", lecture: false, position: 0, duree: TITRE.duree, progres: 0, piste: 0 };
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
/** Un lecteur par titre (chargé à la première écoute), un seul joue à la fois. */
const lecteurs: (HTMLAudioElement | null)[] = PISTES.map(() => null);
const chargements: (Promise<boolean> | null)[] = PISTES.map(() => null);

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

async function chargerTitre(k: number): Promise<boolean> {
  if (lecteurs[k]) return true;
  const piste = PISTES[k]!;
  publier({ charge: "chargement", progres: 0 });
  try {
    const parties: string[] = [];
    for (const [i, url] of piste.morceaux.entries()) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      parties.push((await r.text()).trim());
      publier({ progres: (i + 1) / piste.morceaux.length });
    }
    const bin = atob(parties.join(""));
    const o = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    const a = new Audio(URL.createObjectURL(new Blob([o], { type: "audio/mpeg" })));
    a.preload = "auto";
    const moi = () => audio === a;
    a.addEventListener("timeupdate", () => moi() && publier({ position: a.currentTime }));
    a.addEventListener("loadedmetadata", () => moi() && publier({ duree: a.duration || piste.duree }));
    a.addEventListener("play", () => moi() && publier({ lecture: true }));
    a.addEventListener("pause", () => {
      if (!moi()) return;
      publier({ lecture: false });
      memoireMusique.ecrire((m) => ({ ...m, position: a.currentTime }));
    });
    a.addEventListener("ended", () => {
      if (!moi()) return;
      const m = memoireMusique.lire();
      a.currentTime = 0;
      if (m.repetition === "un") return void a.play().catch(() => {});
      const k2 = prochaine(1);
      // dernier titre sans répétition : on s'arrête
      if (m.repetition === "non" && !m.aleatoire && k2 <= k) return publier({ lecture: false, position: 0 });
      void changer(k2, true);
    });
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      try {
        ctx ??= new Ctor();
        if (!coupure) {
          coupure = ctx.createGain();
          coupure.connect(sortie(ctx, "media"));
        }
        ctx.createMediaElementSource(a).connect(coupure);
      } catch {
        // sans Web Audio : le volume passe par l'élément audio
      }
    }
    lecteurs[k] = a;
    return true;
  } catch {
    publier({ charge: "erreur" });
    chargements[k] = null;
    return false;
  }
}

/** Le titre suivant (sens 1) ou précédent (sens −1) ; en aléatoire, un autre titre au hasard. */
function prochaine(sens: 1 | -1) {
  const k = pisteCourante();
  if (memoireMusique.lire().aleatoire && PISTES.length > 1) {
    const autres = PISTES.map((_, i) => i).filter((i) => i !== k);
    return autres[Math.floor(Math.random() * autres.length)]!;
  }
  return (k + sens + PISTES.length) % PISTES.length;
}

/** Passe à un autre titre (depuis le début) ; il joue si demandé. */
export async function changer(k: number, lire: boolean) {
  const avant = audio;
  if (avant && pisteCourante() !== k) avant.pause();
  memoireMusique.ecrire((m) => ({ ...m, piste: k, position: pisteCourante() === k ? m.position : 0, file: true }));
  audio = lecteurs[k] ?? null;
  publier({ piste: k, position: 0, duree: PISTES[k]!.duree, lecture: false });
  chargements[k] ??= chargerTitre(k);
  if (!(await chargements[k])) return toast("Ce type de fichier audio n'est pas compatible avec le lecteur.");
  audio = lecteurs[k]!;
  if (avant !== audio) audio.currentTime = 0;
  publier({ charge: "pret", position: audio.currentTime, duree: audio.duration || PISTES[k]!.duree });
  if (lire) await jouer();
}

export async function jouer() {
  memoireMusique.ecrire((m) => ({ ...m, file: true }));
  const k = pisteCourante();
  if (!chargement || etat.piste !== k || !audio) {
    chargements[k] ??= chargerTitre(k);
    chargement = chargements[k];
    if (await chargement) {
      const premier = !audio;
      audio = lecteurs[k]!;
      if (premier) {
        const p = memoireMusique.lire().position;
        if (p > 0) audio.currentTime = p;
      }
      publier({ charge: "pret", piste: k, position: audio.currentTime, duree: audio.duration || PISTES[k]!.duree });
    }
  }
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
/** « Précédent » : au début du titre s'il a déjà joué plus de 3 s, sinon le titre d'avant (comme Jelly Bean). */
function precedent() {
  if (etat.position > 3 || PISTES.length < 2) return chercher(0);
  void changer(prochaine(-1), etat.lecture);
}
function suivant() {
  void changer(prochaine(1), etat.lecture);
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
function Pochette({ taille, mini, piste }: { taille: number; mini?: boolean; piste?: number }) {
  const k = memoireMusique.useValeur().piste ?? 0;
  const pistes = usePistes();
  const p = pistes[piste ?? k] ?? TITRE;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="mu-pochette" src={mini ? p.pochetteMini : p.pochette} width={taille} height={taille} alt="" draggable={false} />;
}

/** La notification « en cours de lecture » du rideau (MediaPlaybackService : icône, titre, artiste). */
export function NotifMusique({ ouvrir }: { ouvrir: (e: Element) => void }) {
  const l = useLecteur();
  const m = memoireMusique.useValeur();
  const pistes = usePistes();
  if (!m.file || l.charge !== "pret") return null;
  return (
    <div className="os-notif-bloc">
      <button className="os-notif mu-notif" onClick={(e) => ouvrir(e.currentTarget)}>
        <span className="os-notif-ic">
          <Pochette taille={40} mini />
        </span>
        <span className="os-notif-t">
          <b translate="no">{(pistes[m.piste ?? 0] ?? TITRE).titre}</b>
          <span translate="no">{(pistes[m.piste ?? 0] ?? TITRE).artiste}</span>
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
  const [choix, setChoix] = useState(0);
  const l = useLecteur();
  const m = memoireMusique.useValeur();
  const pistes = usePistes();
  const courant = pistes[m.piste ?? 0] ?? TITRE;
  useRetour(ecran !== "liste", () => setEcran((e) => (e === "album" && onglet === "artistes" ? "artiste" : "liste")));
  useEffect(() => {
    // ouverte depuis Fichiers (Music/…/Les Aléas De L'amour.mp3) : lecture directe
    const c = prendreCible("musique");
    if (c?.startsWith("jouer")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture depuis une autre appli
      setEcran("lecture");
      const k = Number(c.split(":")[1] ?? 0) || 0;
      if (k !== (memoireMusique.lire().piste ?? 0) || !etat.lecture) void changer(k, true);
    }
  }, []);
  const lancer = (k: number) => {
    setEcran("lecture");
    if (k === (m.piste ?? 0) && etat.charge === "pret") void jouer();
    else void changer(k, true);
  };

  if (ecran === "lecture") return <EcranLecture />;

  const ligneTitre = (k: number) => {
    const p = pistes[k]!;
    return (
      <button key={k} type="button" className="mu-ligne" data-piste={k} onClick={() => lancer(k)}>
        <span className="mu-ligne-t">
          <b translate="no">{p.titre}</b>
          <span translate="no">{p.artiste}</span>
        </span>
        {m.file && l.lecture && (m.piste ?? 0) === k ? <Img n="music-indicator_ic_mp_playing_list" t={27} /> : null}
        <span className="mu-duree">{mmss(p.duree)}</span>
      </button>
    );
  };
  const tous = PISTES.map((_, k) => k);

  let corps: ReactNode;
  if (ecran === "artiste" || ecran === "album" || ecran === "playlist") {
    corps = (
      <>
        {ecran === "artiste" ? (
          <button type="button" className="mu-ligne mu-ligne-image" onClick={() => setEcran("album")}>
            <Pochette taille={64} mini piste={choix} />
            <span className="mu-ligne-t">
              <b translate="no">{pistes[choix]!.album}</b>
              <span>1 titre</span>
            </span>
          </button>
        ) : ecran === "album" ? (
          ligneTitre(choix)
        ) : (
          [...tous].reverse().map(ligneTitre)
        )}
      </>
    );
  } else if (onglet === "artistes") {
    corps = tous.map((k) => (
      <button key={k} type="button" className="mu-ligne mu-ligne-image" onClick={() => (setChoix(k), setEcran("artiste"))}>
        <Img n="music-ic_mp_artist_list" t={64} />
        <span className="mu-ligne-t">
          <b translate="no">{pistes[k]!.artiste}</b>
          <span>1 album, 1 titre</span>
        </span>
      </button>
    ));
  } else if (onglet === "albums") {
    corps = tous.map((k) => (
      <button key={k} type="button" className="mu-ligne mu-ligne-image" onClick={() => (setChoix(k), setEcran("album"))}>
        <Pochette taille={64} mini piste={k} />
        <span className="mu-ligne-t">
          <b translate="no">{pistes[k]!.album}</b>
          <span translate="no">{pistes[k]!.artiste}</span>
        </span>
      </button>
    ));
  } else if (onglet === "titres") {
    corps = (
      <>
        <button type="button" className="mu-ligne mu-aleatoire" onClick={() => (memoireMusique.ecrire((x) => ({ ...x, aleatoire: true })), lancer(Math.floor(Math.random() * PISTES.length)))}>
          <Img n="music-ic_mp_shuffle_on_btn" t={40} />
          <span className="mu-ligne-t">
            <b>Lecture aléatoire</b>
          </span>
        </button>
        {tous.map(ligneTitre)}
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
          {ecran === "artiste" ? pistes[choix]!.artiste : ecran === "album" ? pistes[choix]!.album : "Ajoutés récemment"}
        </div>
      )}
      <div className="mu-liste">{corps}</div>
      {m.file && l.charge !== "rien" && onglet !== "radio" ? (
        <button type="button" className="mu-ecoute" onClick={() => setEcran("lecture")}>
          <span className="mu-ligne-t">
            <b translate="no">{courant.titre}</b>
            <span translate="no">{courant.artiste}</span>
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
  const [edition, setEdition] = useState(false);
  const appui = useRef<number | null>(null);
  const pistes = usePistes();
  const courant = pistes[m.piste ?? 0] ?? TITRE;
  const duree = l.duree || courant.duree;
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
        <div
          className="mu-grande-pochette"
          onPointerDown={() => {
            // appui long sur la pochette : « Modifier » (code d'édition demandé)
            appui.current = window.setTimeout(() => setEdition(true), 700);
          }}
          onPointerUp={() => appui.current && window.clearTimeout(appui.current)}
          onPointerLeave={() => appui.current && window.clearTimeout(appui.current)}
        >
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
          <button type="button" data-son="tick" aria-label="File d'attente" onClick={() => toast(`${PISTES.length} titres`)}>
            <Img n="music-ic_mp_current_playlist_btn" t={48} />
          </button>
          <button type="button" data-son="tick" aria-label="Lecture aléatoire" aria-pressed={m.aleatoire} onClick={aleatoire}>
            <Img n={m.aleatoire ? "music-ic_mp_shuffle_on_btn" : "music-ic_mp_shuffle_off_btn"} t={48} />
          </button>
          <button type="button" data-son="tick" aria-label="Répétition" onClick={repetition}>
            <Img n={m.repetition === "non" ? "music-ic_mp_repeat_off_btn" : m.repetition === "tout" ? "music-ic_mp_repeat_all_btn" : "music-ic_mp_repeat_once_btn"} t={48} />
          </button>
          <button type="button" data-son="tick" className="mu-plus" aria-label="Modifier" title="Modifier" onClick={() => setEdition(true)}>
            ⋮
          </button>
        </div>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_artist_playback" t={32} />
        <b translate="no">{courant.artiste}</b>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_album_playback" t={32} />
        <span translate="no">{courant.album}</span>
      </div>
      <div className="mu-info">
        <Img n="music-ic_mp_song_playback" t={32} />
        <span translate="no">{courant.titre}</span>
      </div>
      {courant.annee || courant.genre ? (
        <div className="mu-info mu-info-plus" translate="no">
          {[courant.annee, courant.genre].filter(Boolean).join(" · ")}
        </div>
      ) : null}
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
      {edition ? <EditionTitre k={m.piste ?? 0} fermer={() => setEdition(false)} /> : null}
    </div>
  );
}

/* ---------------- Modifier un titre : avec le code d'édition du site (même TOTP, même session) ---------------- */

async function envoyerEdition(url: string, jeton: string, init: RequestInit) {
  const r = await fetch(url, { ...init, credentials: "same-origin", headers: { ...(init.headers ?? {}), "x-edition-jeton": jeton } });
  const d = (await r.json().catch(() => ({}))) as { jeton?: string; erreur?: string; fiches?: Record<string, Fiche> };
  if (!r.ok) throw new Error(d.erreur || "L’enregistrement a échoué.");
  if (d.fiches) poserFiches(d.fiches);
  return d.jeton || jeton;
}

function EditionTitre({ k, fermer }: { k: number; fermer: () => void }) {
  const p = usePistes()[k] ?? TITRE;
  const origine = PISTES[k] ?? TITRE;
  const [jeton, setJeton] = useState<string | null>(null);
  const [verif, setVerif] = useState(true);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [champs, setChamps] = useState({ titre: p.titre, artiste: p.artiste, album: p.album, annee: p.annee ?? "", genre: p.genre ?? "" });
  const [image, setImage] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [sansPochette, setSansPochette] = useState(false);
  useEffect(() => {
    let vivant = true;
    fetch("/api/edition/session", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ok?: boolean; jeton?: string }) => vivant && d.ok && d.jeton && setJeton(d.jeton))
      .catch(() => {})
      .finally(() => vivant && setVerif(false));
    return () => {
      vivant = false;
    };
  }, []);
  useEffect(() => {
    if (!image) return;
    const u = URL.createObjectURL(image);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- aperçu local de l'image choisie
    setApercu(u);
    return () => URL.revokeObjectURL(u);
  }, [image]);

  const entrer = async () => {
    if (code.length !== 6 || occupe) return;
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/edition/session", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; jeton?: string; erreur?: string };
      if (!r.ok || !d.ok || !d.jeton) throw new Error(d.erreur || "Ce code n’est pas accepté.");
      setJeton(d.jeton);
      window.dispatchEvent(new CustomEvent("fjch-edition-ok", { detail: d.jeton }));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le code n’a pas pu être vérifié.");
    } finally {
      setCode("");
      setOccupe(false);
    }
  };
  const enregistrer = async () => {
    if (!jeton || occupe) return;
    setOccupe(true);
    setErreur("");
    try {
      let j = jeton;
      if (image) {
        const f = new FormData();
        f.set("piste", String(k));
        f.set("fichier", image);
        j = await envoyerEdition(`${URL_FICHES}/pochette`, j, { method: "POST", body: f });
      }
      j = await envoyerEdition(URL_FICHES, j, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ piste: k, ...champs, ...(sansPochette && !image ? { pochette: null } : {}) }),
      });
      setJeton(j);
      toast("Titre modifié pour tout le monde.");
      fermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L’enregistrement a échoué.");
    } finally {
      setOccupe(false);
    }
  };
  const champ = (nom: keyof typeof champs, libelle: string, max: number, reserve?: string) => (
    <label className="mu-ed-champ">
      <small>{libelle}</small>
      <input className="holo-champ" value={champs[nom]} maxLength={max} placeholder={reserve} translate="no" onChange={(e) => setChamps({ ...champs, [nom]: e.target.value })} />
    </label>
  );

  return (
    <div className="dlg-fond mu-ed" onClick={(e) => e.target === e.currentTarget && fermer()}>
      <div className="dlg" role="dialog" aria-label="Modifier le titre">
        <div className="dlg-titre">Modifier le titre</div>
        {verif ? (
          <div className="dlg-corps">
            <small>Vérification…</small>
          </div>
        ) : !jeton ? (
          <form
            className="dlg-corps"
            onSubmit={(e) => {
              e.preventDefault();
              void entrer();
            }}
          >
            <small>Entre le code à six chiffres pour ouvrir l’édition.</small>
            <input
              className="holo-champ mu-ed-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label="Code à six chiffres"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
            />
            {erreur ? <small className="mu-ed-erreur" role="alert">{erreur}</small> : null}
            <div className="dlg-boutons">
              <button type="button" onClick={fermer}>Annuler</button>
              <button type="submit" disabled={code.length !== 6 || occupe}>{occupe ? "vérification…" : "OK"}</button>
            </div>
          </form>
        ) : (
          <div className="dlg-corps mu-ed-corps">
            <div className="mu-ed-pochette">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercu ?? (sansPochette ? origine.pochette : p.pochette)} width={96} height={96} alt="" draggable={false} />
              <span>
                <label className="mu-ed-fichier">
                  Changer la pochette
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => (setImage(e.target.files?.[0] ?? null), setSansPochette(false))} />
                </label>
                {p.pochette !== origine.pochette || image ? (
                  <button type="button" className="mu-ed-lien" onClick={() => (setImage(null), setApercu(null), setSansPochette(true))}>
                    Pochette d’origine
                  </button>
                ) : null}
              </span>
            </div>
            {champ("titre", "Titre", 120, origine.titre)}
            {champ("artiste", "Artiste", 120, origine.artiste)}
            {champ("album", "Album", 120, origine.album)}
            {champ("annee", "Année", 12)}
            {champ("genre", "Genre", 60)}
            {erreur ? <small className="mu-ed-erreur" role="alert">{erreur}</small> : null}
            <div className="dlg-boutons">
              <button type="button" onClick={fermer}>Annuler</button>
              <button type="button" disabled={occupe} onClick={() => void enregistrer()}>{occupe ? "Envoi…" : "Enregistrer"}</button>
            </div>
          </div>
        )}
      </div>
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
