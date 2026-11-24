/**
 * Les trois volumes du téléphone (Réglages › Son), comme sur Android :
 * « Sonnerie et notifications » (aussi les sons système et les touches), « Musique, vidéo, jeux » (les sons des applis)
 * et « Alarmes ». Chaque son passe par la sortie de son canal ; le mode silencieux coupe tout en amont.
 */
import { creerStore } from "./session";

export type Canal = "sonnerie" | "media" | "alarme";
export const VOLUMES_DEPART: Record<Canal, number> = { sonnerie: 0.7, media: 0.55, alarme: 0.85 };
export const volumes = creerStore<Record<Canal, number>>("volumes", VOLUMES_DEPART);

/** Le gain d'un canal : 1 à la position d'origine du curseur, 0 tout à gauche. */
const gain = (k: Canal) => Math.min(1.5, Math.max(0, volumes.lire()[k] / VOLUMES_DEPART[k]));

const sorties = new WeakMap<AudioContext, Partial<Record<Canal, GainNode>>>();

/** Le point d'entrée d'un canal dans un contexte audio (à la place de ctx.destination). */
export function sortie(c: AudioContext, k: Canal = "sonnerie"): AudioNode {
  let m = sorties.get(c);
  if (!m) sorties.set(c, (m = {}));
  let g = m[k];
  if (!g) {
    g = c.createGain();
    g.connect(c.destination);
    m[k] = g;
  }
  g.gain.value = gain(k);
  return g;
}
