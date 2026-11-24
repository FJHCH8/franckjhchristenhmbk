/**
 * Les vraies sonneries d'Android 4.2 Jelly Bean (AOSP, frameworks/base/data/sounds, licence Apache 2.0,
 * voir public/aakanos/sons/NOTICE.txt) : 5 sonneries, 5 notifications, 5 alarmes, au choix dans les Réglages.
 */
import { creerStore } from "./session";
import { estMuet } from "./sonsSynth";
import { sortie, type Canal } from "./volume";

export type Categorie = "appel" | "notif" | "alarme";

export const SONNERIES: Record<Categorie, string[]> = {
  appel: ["Andromeda", "Cassiopeia", "Orion", "Perseus", "Pyxis"],
  notif: ["Capella", "Pixiedust", "Tejat", "Proxima", "Deneb"],
  alarme: ["Cesium", "Argon", "Hassium", "Oxygen", "Platinum"],
};
const NOMS: Record<string, string> = { Pixiedust: "Pixie Dust" };
export const nomSonnerie = (f: string) => NOMS[f] ?? f;

/** Les sons de départ du téléphone (aussi après « Réinitialiser le téléphone »). */
export const SONS_DEPART: Record<Categorie, string> = { appel: "Orion", notif: "Pixiedust", alarme: "Argon" };
/** Les choix du visiteur, gardés dans la session comme le reste du téléphone. */
export const choixSons = creerStore<Record<Categorie, string>>("sons", SONS_DEPART);

let ctx: AudioContext | null = null;
function contexte(): AudioContext | null {
  if (typeof window === "undefined" || estMuet()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function versOctets(t: string): ArrayBuffer {
  const bin = atob(t.trim());
  const o = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
  return o.buffer;
}

const cache = new Map<string, Promise<AudioBuffer | null>>();
function charger(c: AudioContext, f: string) {
  let p = cache.get(f);
  if (!p) {
    // Capella était déjà là en MP3 ; les autres sont rangés en MP3 encodé en base64 (fichiers texte).
    const brut = f === "Capella";
    p = fetch(`/aakanos/sons/${f}.mp3${brut ? "" : ".b64"}`)
      .then((r) => (r.ok ? (brut ? r.arrayBuffer() : r.text().then(versOctets)) : Promise.reject(new Error(String(r.status)))))
      .then((b) => c.decodeAudioData(b))
      .catch(() => null);
    cache.set(f, p);
  }
  return p;
}

/** Joue un fichier (en boucle pour une alarme ou une sonnerie) ; renvoie de quoi l'arrêter. */
export function jouerSonnerie(f: string, boucle = false, canal: Canal = "sonnerie"): () => void {
  const c = contexte();
  if (!c) return () => {};
  let src: AudioBufferSourceNode | null = null;
  let fini = false;
  void charger(c, f).then((b) => {
    if (!b || fini) return;
    src = c.createBufferSource();
    src.buffer = b;
    src.loop = boucle;
    src.connect(sortie(c, canal));
    src.start();
  });
  return () => {
    fini = true;
    try {
      src?.stop();
    } catch {}
  };
}

/** La notification choisie (Pixie Dust par défaut). */
export function jouerNotification() {
  jouerSonnerie(choixSons.lire().notif);
}
