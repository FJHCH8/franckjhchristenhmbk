/**
 * Micro-sons d'interface, synthétisés en direct (aucun fichier à charger).
 * Ils restent muets tant que le visiteur ne les a pas activés lui-même.
 */

const CLE = "fjch-sons";
let contexte: AudioContext | null = null;
let actif: boolean | null = null;
let dernier = 0;

export function sonsActifs() {
  if (actif === null) {
    try {
      actif = localStorage.getItem(CLE) === "1";
    } catch {
      actif = false;
    }
  }
  return actif;
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!contexte) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    contexte = new Ctor();
  }
  if (contexte.state === "suspended") void contexte.resume();
  return contexte;
}

export function reglerSons(on: boolean) {
  actif = on;
  try {
    localStorage.setItem(CLE, on ? "1" : "0");
  } catch {
    /* navigation privée */
  }
  if (on) audio();
  window.dispatchEvent(new Event("fjch-sons"));
}

function enveloppe(ctx: AudioContext, gain: number, attack: number, release: number) {
  const node = ctx.createGain();
  const t = ctx.currentTime;
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(gain, t + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  node.connect(ctx.destination);
  return node;
}

/** Survol : un tic cristallin, très court. */
export function tic() {
  if (!sonsActifs()) return;
  const now = performance.now();
  if (now - dernier < 45) return;
  dernier = now;
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2600 + Math.random() * 500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1700, ctx.currentTime + 0.05);
  osc.connect(enveloppe(ctx, 0.018, 0.004, 0.06));
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

/** Clic : une petite goutte boisée. */
export function clic() {
  if (!sonsActifs()) return;
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(720, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12);
  osc.connect(enveloppe(ctx, 0.06, 0.005, 0.16));
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/** Changement de page : un souffle filtré qui monte puis s'éteint. */
export function souffle() {
  if (!sonsActifs()) return;
  const ctx = audio();
  if (!ctx) return;
  const duree = 0.9;
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * duree), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filtre = ctx.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.Q.value = 1.4;
  filtre.frequency.setValueAtTime(320, ctx.currentTime);
  filtre.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + duree * 0.55);
  filtre.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duree);
  source.connect(filtre);
  filtre.connect(enveloppe(ctx, 0.05, duree * 0.4, duree * 0.6));
  source.start();
  source.stop(ctx.currentTime + duree);
}
