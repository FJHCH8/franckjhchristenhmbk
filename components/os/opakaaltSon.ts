/**
 * Opakaalt : toute la musique et tous les bruitages du jeu, en chiptune composé exprès pour lui
 * et synthétisé en direct (Web Audio : carrés, triangles, bruit blanc). Aucun fichier son, rien d'emprunté.
 * Tout passe par le canal « Musique, vidéo, jeux » du téléphone et se coupe en mode silencieux.
 */
import { estMuet } from "./sonsSynth";
import { sortie, volumes } from "./volume";

let ctx: AudioContext | null = null;
let maitre: GainNode | null = null;
let bruitBuf: AudioBuffer | null = null;

function c(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    maitre = ctx.createGain();
    maitre.connect(sortie(ctx, "media"));
    appliquer();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
function appliquer() {
  if (!ctx || !maitre) return;
  maitre.gain.value = estMuet() ? 0 : 1;
  sortie(ctx, "media");
}
if (typeof window !== "undefined") {
  volumes.abonner(appliquer);
  window.addEventListener("aakanos-muet", appliquer);
}
const out = () => maitre!;

function bruit(a: AudioContext) {
  if (!bruitBuf) {
    bruitBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = bruitBuf.getChannelData(0);
    let s = 0x2f6e2b1;
    for (let i = 0; i < d.length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
    }
  }
  return bruitBuf;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const NOTES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n: string): number | null {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTES[m[1]!]! + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

/** Une note : onde + enveloppe courte, comme une console 8 bits. */
function ton(a: AudioContext, f: number, t: number, d: number, type: OscillatorType, vol: number, glisse?: number, dest: AudioNode = out()) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(20, glisse), t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + Math.max(0.01, d * 0.6));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + d + 0.03);
}
function souffle(a: AudioContext, t: number, d: number, vol: number, filtre: BiquadFilterType, f1: number, f2?: number, q = 1, dest: AudioNode = out()) {
  const s = a.createBufferSource();
  s.buffer = bruit(a);
  s.loop = true;
  const bq = a.createBiquadFilter();
  bq.type = filtre;
  bq.Q.value = q;
  bq.frequency.setValueAtTime(f1, t);
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t + d);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(bq).connect(g).connect(dest);
  s.start(t, Math.random() * 1.5);
  s.stop(t + d + 0.05);
}

/* ---------------- Les musiques (compositions originales) ---------------- */

type Voix = { onde: OscillatorType | "batterie"; vol: number; notes: string };
type Piste = { bpm: number; voix: Voix[] };
const B = (s: string, n: number) => Array(n).fill(s).join(" ");

export const PISTES = {
  // La ville : balade tranquille Fa maj7 – Mi m7 – Ré m7 – Do
  menu: {
    bpm: 96,
    voix: [
      { onde: "square", vol: 0.05, notes: "A4/4 C5/2 E5/2 D5/4 C5/4 G4/4 B4/2 D5/2 C5/8 F4/4 A4/2 C5/2 B4/4 A4/4 G4/12 -/4" },
      { onde: "triangle", vol: 0.13, notes: "F2/4 C3/4 F2/4 C3/4 E2/4 B2/4 E2/4 B2/4 D2/4 A2/4 D2/4 A2/4 C2/4 G2/4 C2/4 G2/4" },
      { onde: "batterie", vol: 0.5, notes: B("k/4 h/4 s/4 h/4", 4) },
    ],
  },
  // La rue : petite marche sautillante en Do
  intro: {
    bpm: 132,
    voix: [
      { onde: "square", vol: 0.05, notes: "C5/2 E5/2 G5/2 E5/2 C5/2 E5/2 G5/4 A5/2 G5/2 E5/2 C5/2 D5/4 -/4 F5/2 E5/2 D5/2 C5/2 B4/2 C5/2 D5/4 C5/8 G4/4 -/4" },
      { onde: "triangle", vol: 0.13, notes: `${B("C3/2 G3/2", 4)} ${B("A2/2 E3/2", 4)} ${B("F2/2 C3/2", 4)} ${B("G2/2 D3/2", 4)}` },
      { onde: "batterie", vol: 0.5, notes: B("k/2 h/2 s/2 h/2", 8) },
    ],
  },
  // Le casino : lounge en La m7 – Ré7 – Sol – Mi m, basse qui marche
  casino: {
    bpm: 100,
    voix: [
      { onde: "square", vol: 0.04, notes: "E5/3 D5/1 C5/4 A4/4 G4/4 F#5/3 E5/1 D5/4 C5/8 B4/2 D5/2 G5/4 F#5/2 E5/2 D5/4 E5/12 -/4" },
      { onde: "triangle", vol: 0.14, notes: "A2/4 C3/4 E3/4 G3/4 D3/4 F#3/4 A3/4 C4/4 G2/4 B2/4 D3/4 F#3/4 E2/4 G2/4 B2/4 D3/4" },
      { onde: "batterie", vol: 0.4, notes: B("k/4 h/3 h/1 s/4 h/3 h/1", 4) },
    ],
  },
  // Morpion : vif et lumineux, en Sol
  morpion: {
    bpm: 140,
    voix: [
      { onde: "square", vol: 0.045, notes: "G5/2 B5/2 D6/2 B5/2 G5/2 B5/2 D6/4 C6/2 A5/2 F#5/2 A5/2 D6/8 B5/2 G5/2 E5/2 G5/2 C6/4 B5/4 A5/4 F#5/4 G5/8" },
      { onde: "triangle", vol: 0.13, notes: "G2/4 D3/4 G2/4 D3/4 D2/4 A2/4 D2/4 A2/4 E2/4 B2/4 C3/4 G2/4 D2/4 D3/4 G2/8" },
      { onde: "batterie", vol: 0.5, notes: B("k/2 h/2 s/2 h/2", 8) },
    ],
  },
  // Puissance 4 : ça cogne, en Ré mineur
  puissance4: {
    bpm: 150,
    voix: [
      { onde: "square", vol: 0.045, notes: "D5/2 F5/2 A5/2 D6/2 C6/2 A5/2 F5/4 Bb4/2 D5/2 F5/2 Bb5/2 A5/4 G5/4 A4/2 C#5/2 E5/2 A5/2 G5/2 E5/2 C#5/4 D5/4 A4/4 D5/8" },
      { onde: "triangle", vol: 0.14, notes: `${B("D2/2 D3/2", 4)} ${B("Bb1/2 Bb2/2", 4)} ${B("A1/2 A2/2", 4)} ${B("D2/2 D3/2", 4)}` },
      { onde: "batterie", vol: 0.55, notes: B("k/2 h/2 s/2 h/2 k/2 k/2 s/2 h/2", 4) },
    ],
  },
  // Échecs : tendu, en Mi mineur
  echecs: {
    bpm: 90,
    voix: [
      { onde: "square", vol: 0.04, notes: "E5/4 G5/4 F#5/4 B4/4 C5/4 E5/4 D#5/8 E5/4 B5/4 A5/4 G5/4 F#5/8 D#5/8" },
      { onde: "triangle", vol: 0.14, notes: "E2/8 E2/8 A2/8 B2/8 C3/8 A2/8 B2/16" },
      { onde: "batterie", vol: 0.35, notes: B("k/8 h/4 h/4", 4) },
    ],
  },
  // La victoire : jazz 8 bits qui swingue, Fa maj7 – Ré m7 – Sol m7 – Do7
  jazz: {
    bpm: 150,
    voix: [
      { onde: "square", vol: 0.045, notes: "A5/3 C6/1 A5/2 F5/2 G5/3 A5/1 G5/4 F5/2 D5/2 F5/2 A5/2 C6/8 Bb5/3 A5/1 G5/2 F5/2 E5/2 G5/2 Bb5/4 A5/8 -/2 C5/2 E5/2 G5/2" },
      { onde: "triangle", vol: 0.15, notes: "F2/4 A2/4 C3/4 E3/4 D2/4 F2/4 A2/4 C3/4 G2/4 Bb2/4 D3/4 F3/4 C3/4 E3/4 G3/4 Bb2/4" },
      { onde: "square", vol: 0.018, notes: "-/2 A3+C4+E4/2 -/4 -/2 A3+C4+E4/2 -/4 -/2 F3+A3+C4/2 -/4 -/2 F3+A3+C4/2 -/4 -/2 Bb3+D4+F4/2 -/4 -/2 Bb3+D4+F4/2 -/4 -/2 Bb3+E4+G4/2 -/4 -/2 Bb3+E4+G4/2 -/4" },
      { onde: "batterie", vol: 0.4, notes: B("k/4 h/3 h/1 s/4 h/3 h/1", 4) },
    ],
  },
  // La défaite : triste, en La mineur
  defaite: {
    bpm: 70,
    voix: [
      { onde: "square", vol: 0.04, notes: "E5/4 D5/4 C5/4 B4/4 A4/8 -/8 F4/4 E4/4 D4/4 C4/4 B3/12 -/4" },
      { onde: "triangle", vol: 0.14, notes: "A2/16 F2/16 D2/16 E2/16" },
    ],
  },
  // Qui suis-je : mystère un peu cabaret, en Fa# mineur
  quisuisje: {
    bpm: 118,
    voix: [
      { onde: "square", vol: 0.04, notes: "C#5/2 E5/2 G#5/4 E5/2 C#5/2 B4/4 A4/2 C#5/2 E5/4 D#5/8 C#5/2 F#5/2 A5/4 G#5/2 E5/2 C#5/4 B4/8 -/4" },
      { onde: "triangle", vol: 0.13, notes: "F#2/4 C#3/4 F#2/4 C#3/4 D2/4 A2/4 E2/4 B2/4 F#2/4 C#3/4 F#2/4 C#3/4 C#2/4 G#2/4 C#2/4 G#2/4" },
      { onde: "batterie", vol: 0.35, notes: B("k/4 h/2 h/2 s/4 h/4", 4) },
    ],
  },
  // Bataille navale : roulis grave, en Do mineur
  navale: {
    bpm: 108,
    voix: [
      { onde: "square", vol: 0.04, notes: "G4/4 Eb5/2 D5/2 C5/4 G4/4 Bb4/2 A4/2 G4/8 -/4 D5/2 F5/2 G5/4 Eb5/4 D5/8 C5/8" },
      { onde: "triangle", vol: 0.15, notes: "C2/4 G2/4 C3/4 G2/4 Ab1/4 Eb2/4 Ab2/4 Eb2/4 Bb1/4 F2/4 G2/4 D2/4 C2/4 G2/4 C2/8" },
      { onde: "batterie", vol: 0.45, notes: B("k/4 -/4 s/4 h/4 k/2 k/2 s/4 h/4", 2) },
    ],
  },
  // Baby-foot : rapide, sifflet, en Sib
  babyfoot: {
    bpm: 168,
    voix: [
      { onde: "square", vol: 0.05, notes: "F5/1 F5/1 Bb5/2 D6/2 F6/4 Eb6/2 C6/2 Bb5/2 A5/2 Bb5/4 F5/2 D5/2 F5/2 Bb5/2 C6/2 D6/2 Eb6/4 D6/2 Bb5/2 F5/4 -/4" },
      { onde: "triangle", vol: 0.13, notes: `${B("Bb2/2 F3/2", 4)} ${B("Eb2/2 Bb2/2", 4)} ${B("F2/2 C3/2", 4)} ${B("Bb2/2 F3/2", 4)}` },
      { onde: "batterie", vol: 0.55, notes: B("k/2 h/2 s/2 h/2", 8) },
    ],
  },
  // Le générique : guilleret, en Do
  credits: {
    bpm: 120,
    voix: [
      { onde: "square", vol: 0.045, notes: "E5/2 G5/2 C6/2 G5/2 E5/2 G5/2 C6/4 D6/2 C6/2 B5/2 A5/2 G5/8 F5/2 A5/2 C6/2 A5/2 G5/2 E5/2 C5/4 D5/4 G5/4 C5/8" },
      { onde: "triangle", vol: 0.13, notes: "C3/4 G2/4 C3/4 G2/4 G2/4 D3/4 G2/4 D3/4 F2/4 C3/4 A2/4 E2/4 G2/4 G2/4 C3/8" },
      { onde: "batterie", vol: 0.5, notes: B("k/2 h/2 s/2 h/2", 8) },
    ],
  },
} satisfies Record<string, Piste>;
export type NomPiste = keyof typeof PISTES;

type Evt = { notes: number[]; d: number } | { batt: string; d: number } | { d: number };
function analyser(v: Voix): Evt[] {
  return v.notes
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [n, ds] = tok.split("/");
      const d = Number(ds) || 1;
      if (!n || n === "-") return { d };
      if (v.onde === "batterie") return { batt: n, d };
      return { notes: n.split("+").map(midi).filter((x): x is number => x !== null), d };
    });
}

let joue: { nom: NomPiste; minuterie: number } | null = null;
type CoucheMus = { nom: NomPiste; minuterie: number; gain: GainNode };
let couches: CoucheMus[] = [];

export function musique(nom: NomPiste | null) {
  if (nom !== null) arreterMusiqueFin();
  if (nom !== "navale") arreterMusiqueNavale();
  if (couches.at(-1)?.nom === nom) return;
  const a = c();
  if (!a || !maitre) {
    if (joue) window.clearInterval(joue.minuterie);
    joue = nom ? { nom, minuterie: 0 } : null;
    return;
  }
  const fondu = 0.48;
  const maintenant = a.currentTime;
  for (const cch of couches) {
    cch.gain.gain.cancelScheduledValues(maintenant);
    cch.gain.gain.setValueAtTime(Math.max(0.0001, cch.gain.gain.value), maintenant);
    cch.gain.gain.linearRampToValueAtTime(0.0001, maintenant + fondu);
    window.setTimeout(() => {
      window.clearInterval(cch.minuterie);
      try { cch.gain.disconnect(); } catch { /* déjà coupé */ }
    }, fondu * 1000 + 40);
  }
  couches = [];
  joue = null;
  if (!nom) return;
  if (nom === "navale") {
    musiqueNavale();
    return;
  }
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, maintenant);
  g.gain.linearRampToValueAtTime(1, maintenant + fondu);
  g.connect(maitre);
  const p: Piste = PISTES[nom];
  const pas = 60 / p.bpm / 4;
  const pistes = p.voix.map((v) => ({ v, evts: analyser(v), i: 0, t: a.currentTime + 0.06 }));
  const planifier = () => {
    const fin = a.currentTime + 0.3;
    for (const pi of pistes) {
      while (pi.t < fin) {
        const e = pi.evts[pi.i]!;
        const d = e.d * pas;
        if ("notes" in e) for (const m of e.notes) ton(a, hz(m), pi.t, Math.max(0.05, d * 0.92), pi.v.onde as OscillatorType, pi.v.vol, undefined, g);
        else if ("batt" in e) {
          if (e.batt === "k") ton(a, 150, pi.t, 0.12, "sine", pi.v.vol * 0.5, 45, g);
          else if (e.batt === "s") souffle(a, pi.t, 0.12, pi.v.vol * 0.25, "bandpass", 1800, undefined, 0.8, g);
          else souffle(a, pi.t, 0.04, pi.v.vol * 0.12, "highpass", 7000, undefined, 1, g);
        }
        pi.t += d;
        pi.i = (pi.i + 1) % pi.evts.length;
      }
    }
  };
  planifier();
  const couche: CoucheMus = { nom, minuterie: window.setInterval(planifier, 120), gain: g };
  couches = [couche];
  joue = { nom, minuterie: couche.minuterie };
}

/* ---------------- La ville (ambiance du menu) ---------------- */

let ville: { src: AudioBufferSourceNode; g: GainNode; klaxons: number } | null = null;
export function ambianceVille(on: boolean) {
  if (!on) {
    if (ville) {
      window.clearInterval(ville.klaxons);
      try {
        ville.g.gain.setTargetAtTime(0, ville.g.context.currentTime, 0.2);
        ville.src.stop(ville.g.context.currentTime + 1);
      } catch {}
    }
    ville = null;
    return;
  }
  if (ville) return;
  const a = c();
  if (!a) return;
  // le grondement de la circulation : bruit filtré très grave, qui ondule
  const src = a.createBufferSource();
  src.buffer = bruit(a);
  src.loop = true;
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const g = a.createGain();
  g.gain.value = 0.05;
  const lfo = a.createOscillator();
  const lg = a.createGain();
  lfo.frequency.value = 0.13;
  lg.gain.value = 0.025;
  lfo.connect(lg).connect(g.gain);
  lfo.start();
  src.connect(lp).connect(g).connect(out());
  src.start();
  const klaxons = window.setInterval(() => {
    const t = a.currentTime + 0.05;
    const r = Math.random();
    if (r < 0.35) {
      // pouet-pouet
      const f = 330 + Math.floor(Math.random() * 3) * 60;
      ton(a, f, t, 0.13, "square", 0.025);
      ton(a, f * 1.26, t, 0.13, "square", 0.018);
      ton(a, f, t + 0.2, 0.22, "square", 0.025);
      ton(a, f * 1.26, t + 0.2, 0.22, "square", 0.018);
    } else if (r < 0.75) {
      // une voiture qui passe
      souffle(a, t, 1.6, 0.05, "bandpass", 300, 1200, 2);
      ton(a, 90, t, 1.5, "sawtooth", 0.012, 60);
    } else {
      // une sirène au loin
      for (let k = 0; k < 3; k++) {
        ton(a, 660, t + k * 0.6, 0.3, "triangle", 0.012, 880);
        ton(a, 880, t + k * 0.6 + 0.3, 0.3, "triangle", 0.012, 660);
      }
    }
  }, 2600);
  ville = { src, g, klaxons };
}

/* ---------------- Bruitages ---------------- */

export type Bruitage =
  | "menu" | "valider" | "blip-blond" | "blip-femboy" | "pas" | "boum" | "rougit" | "chargement" | "croix" | "rond"
  | "jeton" | "pion" | "prise" | "echec" | "erreur" | "manche-gagnee" | "manche-perdue" | "nul" | "jeu-gagne" | "jeu-perdu"
  | "coup-de-pied" | "envol" | "porte" | "coeur" | "soupir" | "aie" | "chaise" | "indice" | "miaou" | "coeurs"
  | "craie" | "secoue" | "clac" | "carte" | "buzzer" | "plouf" | "bombe" | "coule" | "tir" | "but" | "sifflet" | "foule";

export function bruitage(n: Bruitage) {
  const a = c();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (n) {
    case "menu": return ton(a, 660, t, 0.06, "square", 0.05), ton(a, 990, t + 0.06, 0.08, "square", 0.05);
    case "valider": return [523, 659, 784, 1046].forEach((f, i) => ton(a, f, t + i * 0.05, 0.08, "square", 0.05));
    case "blip-blond": return ton(a, 196 + Math.random() * 30, t, 0.04, "square", 0.035);
    case "blip-femboy": return ton(a, 880 + Math.random() * 120, t, 0.035, "square", 0.03);
    case "pas": return souffle(a, t, 0.05, 0.08, "lowpass", 600);
    case "boum":
      ton(a, 180, t, 0.35, "square", 0.12, 40);
      souffle(a, t, 0.3, 0.3, "lowpass", 2000, 200);
      return;
    case "rougit": return [784, 988, 1175, 1568].forEach((f, i) => ton(a, f, t + i * 0.07, 0.12, "triangle", 0.05, f * 1.05));
    case "coeurs": return [1046, 1318, 1568].forEach((f, i) => ton(a, f, t + i * 0.09, 0.1, "triangle", 0.04));
    case "chargement": return [262, 330, 392, 523].forEach((f, i) => ton(a, f, t + i * 0.25, 0.2, "square", 0.04));
    case "croix":
    case "craie":
      souffle(a, t, 0.07, 0.16, "bandpass", 4200, 2800, 2);
      ton(a, 880, t, 0.05, "square", 0.04);
      ton(a, 660, t + 0.05, 0.07, "square", 0.05);
      souffle(a, t + 0.04, 0.06, 0.1, "highpass", 5000);
      return;
    case "rond":
      souffle(a, t, 0.14, 0.12, "bandpass", 2400, 1800, 1.4);
      ton(a, 520, t, 0.14, "triangle", 0.07, 780);
      return;
    case "jeton":
    case "secoue":
      ton(a, 1400, t, 0.18, "square", 0.035, 400);
      souffle(a, t + 0.08, 0.08, 0.1, "bandpass", 2000, 800, 1);
      ton(a, 900, t + 0.16, 0.05, "square", 0.03, 500);
      ton(a, 200, t + 0.22, 0.07, "square", 0.06, 80);
      souffle(a, t + 0.24, 0.08, 0.16, "lowpass", 700);
      return;
    case "pion":
    case "clac":
      souffle(a, t, 0.04, 0.16, "bandpass", 1800, undefined, 2);
      ton(a, 280, t, 0.05, "square", 0.08, 140);
      ton(a, 180, t + 0.03, 0.06, "triangle", 0.05);
      return;
    case "prise":
      ton(a, 440, t, 0.08, "square", 0.08, 880);
      souffle(a, t + 0.02, 0.1, 0.18, "bandpass", 1200, 600, 1.5);
      ton(a, 160, t + 0.05, 0.1, "square", 0.07, 70);
      return;
    case "echec": return [988, 740, 988, 740].forEach((f, i) => ton(a, f, t + i * 0.08, 0.07, "square", 0.05));
    case "erreur": return ton(a, 150, t, 0.15, "square", 0.08), ton(a, 110, t + 0.15, 0.2, "square", 0.08);
    case "manche-gagnee": return [523, 659, 784, 1046, 1318].forEach((f, i) => ton(a, f, t + i * 0.08, 0.14, "square", 0.05));
    case "manche-perdue": return [392, 370, 349, 330].forEach((f, i) => ton(a, f, t + i * 0.18, 0.2, "square", 0.05));
    case "nul": return ton(a, 440, t, 0.15, "square", 0.05), ton(a, 440, t + 0.2, 0.15, "square", 0.05);
    case "jeu-gagne": return [523, 659, 784, 659, 784, 1046].forEach((f, i) => ton(a, f, t + i * 0.11, i === 5 ? 0.5 : 0.12, "square", 0.06));
    case "jeu-perdu": return [523, 494, 466, 440].forEach((f, i) => ton(a, f, t + i * 0.25, i === 3 ? 0.7 : 0.25, "square", 0.06, i === 3 ? 330 : undefined));
    case "coup-de-pied":
      ton(a, 90, t, 0.25, "square", 0.15, 30);
      souffle(a, t, 0.2, 0.4, "lowpass", 3000, 300);
      return;
    case "envol": return souffle(a, t, 2.2, 0.12, "bandpass", 300, 3000, 3), ton(a, 300, t, 2, "triangle", 0.04, 1600);
    case "porte": return ton(a, 220, t, 0.4, "sawtooth", 0.03, 180), souffle(a, t + 0.4, 0.1, 0.15, "lowpass", 800);
    case "coeur": return [0, 0.18].forEach((d) => ton(a, 70, t + d, 0.16, "sine", 0.25, 45));
    case "chaise": return ton(a, 140, t, 0.3, "sawtooth", 0.03, 90);
    case "indice": return [1318, 1568].forEach((f, i) => ton(a, f, t + i * 0.07, 0.1, "triangle", 0.05));
    case "miaou": return ton(a, 700, t, 0.45, "triangle", 0.06, 450), ton(a, 1050, t + 0.05, 0.35, "sine", 0.02, 700);
    case "soupir": {
      // un long soupir de bonheur, juste suggéré : un souffle qui s'ouvre puis retombe, avec un « mmh » grave
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.6);
      g.gain.setValueAtTime(1, t + 2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      g.connect(out());
      souffle(a, t, 3.6, 0.22, "bandpass", 1100, 450, 1.6, g);
      souffle(a, t, 3.6, 0.06, "bandpass", 2600, 1300, 2, g);
      ton(a, 196, t + 0.4, 3, "sine", 0.05, 150, g);
      ton(a, 392, t + 0.4, 3, "triangle", 0.01, 300, g);
      return;
    }
    case "aie": {
      // un cri de douleur 8 bits : « AÏÏÏEUUH » qui dégringole
      const bq = a.createBiquadFilter();
      bq.type = "bandpass";
      bq.frequency.value = 1100;
      bq.Q.value = 1.2;
      bq.connect(out());
      const o = a.createOscillator();
      const v = a.createOscillator();
      const vg = a.createGain();
      const g = a.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(520, t);
      o.frequency.linearRampToValueAtTime(760, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(220, t + 1.3);
      v.frequency.value = 9;
      vg.gain.value = 25;
      v.connect(vg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.04);
      g.gain.setValueAtTime(0.35, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(bq);
      o.start(t);
      v.start(t);
      o.stop(t + 1.5);
      v.stop(t + 1.5);
      return;
    }
    case "carte":
      souffle(a, t, 0.08, 0.12, "highpass", 5000, 2000);
      ton(a, 740, t + 0.04, 0.05, "triangle", 0.04);
      souffle(a, t + 0.07, 0.05, 0.08, "bandpass", 2500);
      return;
    case "buzzer":
      ton(a, 110, t, 0.28, "square", 0.1);
      ton(a, 146, t, 0.28, "square", 0.08);
      souffle(a, t, 0.2, 0.08, "lowpass", 400);
      return;
    case "plouf":
      souffle(a, t, 0.28, 0.22, "lowpass", 1400, 280);
      ton(a, 240, t, 0.18, "sine", 0.05, 70);
      souffle(a, t + 0.08, 0.2, 0.1, "bandpass", 900, 300, 0.8);
      return;
    case "bombe":
      ton(a, 90, t, 0.35, "square", 0.16, 35);
      souffle(a, t, 0.35, 0.32, "lowpass", 900, 120);
      ton(a, 220, t + 0.04, 0.12, "sawtooth", 0.05, 60);
      return;
    case "coule":
      ton(a, 196, t, 0.4, "triangle", 0.07, 80);
      ton(a, 146, t + 0.15, 0.45, "triangle", 0.06, 60);
      souffle(a, t + 0.1, 0.5, 0.18, "lowpass", 600, 80);
      return;
    case "tir":
      souffle(a, t, 0.08, 0.2, "bandpass", 3000, 800, 1);
      ton(a, 700, t, 0.06, "square", 0.05, 200);
      return;
    case "but":
    case "foule":
      for (let i = 0; i < 5; i++) souffle(a, t + i * 0.05, 0.35, 0.07, "bandpass", 800 + i * 200, 1600, 0.7);
      [523, 659, 784, 1046].forEach((f, i) => ton(a, f, t + 0.08 + i * 0.07, 0.14, "square", 0.05));
      return;
    case "sifflet":
      ton(a, 1480, t, 0.22, "triangle", 0.07, 1760);
      ton(a, 1760, t + 0.18, 0.28, "triangle", 0.06, 1480);
      return;
  }
}

/** La musique de fin (victoire + générique) : le morceau de Franck, en morceaux base64. */
const FIN_MORCEAUX = ["/aakanos/musique/fin-opakaalt.mp3.b64.1"];
let finAudio: HTMLAudioElement | null = null;
let finUrl: string | null = null;
let finCharge: Promise<HTMLAudioElement | null> | null = null;
let finQuandFini: (() => void) | null = null;

async function chargerFin(): Promise<HTMLAudioElement | null> {
  if (finAudio) return finAudio;
  try {
    const parties: string[] = [];
    for (const url of FIN_MORCEAUX) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      parties.push((await r.text()).trim());
    }
    const bin = atob(parties.join(""));
    const o = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    const blob = new Blob([o], { type: "audio/mpeg" });
    finUrl = URL.createObjectURL(blob);
    const a = new Audio(finUrl);
    a.preload = "auto";
    a.controls = false;
    a.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
    a.disableRemotePlayback = true;
    a.loop = true;
    a.addEventListener("contextmenu", (e) => e.preventDefault());
    a.addEventListener("ended", () => finQuandFini?.());
    const aCtx = c();
    if (aCtx && maitre) {
      try { aCtx.createMediaElementSource(a).connect(maitre); } catch { /* déjà branché */ }
    }
    finAudio = a;
    return a;
  } catch {
    finCharge = null;
    return null;
  }
}

/** Joue la musique de fin (boucle tant qu’on reste sur l’écran). Coupe le chiptune. */
export function musiqueFin() {
  musique(null);
  finCharge ??= chargerFin();
  void finCharge.then((a) => {
    if (!a || finAudio !== a) return;
    a.currentTime = a.currentTime || 0;
    void a.play().catch(() => {});
  });
}

export function arreterMusiqueFin() {
  finQuandFini = null;
  if (finAudio) {
    finAudio.pause();
    finAudio.removeAttribute("src");
    finAudio.load();
    finAudio = null;
  }
  if (finUrl) {
    URL.revokeObjectURL(finUrl);
    finUrl = null;
  }
  finCharge = null;
}

/** Coupe tout (sortie du jeu). */
export function silence() {
  musique(null);
  arreterMusiqueFin();
  arreterMusiqueNavale();
  ambianceVille(false);
}

/** Bataille navale : le morceau de Franck, lo-fi, en morceaux base64. Boucle seulement pendant ce jeu. */
const NAVALE_MORCEAUX = ["/aakanos/musique/navale-opakaalt.mp3.b64.1"];
let navaleAudio: HTMLAudioElement | null = null;
let navaleUrl: string | null = null;
let navaleCharge: Promise<HTMLAudioElement | null> | null = null;

async function chargerNavale(): Promise<HTMLAudioElement | null> {
  if (navaleAudio) return navaleAudio;
  try {
    const parties: string[] = [];
    for (const url of NAVALE_MORCEAUX) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      parties.push((await r.text()).trim());
    }
    const bin = atob(parties.join(""));
    const o = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    const blob = new Blob([o], { type: "audio/mpeg" });
    navaleUrl = URL.createObjectURL(blob);
    const a = new Audio(navaleUrl);
    a.preload = "auto";
    a.controls = false;
    a.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
    a.disableRemotePlayback = true;
    a.loop = true;
    a.addEventListener("contextmenu", (e) => e.preventDefault());
    const aCtx = c();
    if (aCtx && maitre) {
      try { aCtx.createMediaElementSource(a).connect(maitre); } catch { /* déjà branché */ }
    }
    navaleAudio = a;
    return a;
  } catch {
    navaleCharge = null;
    return null;
  }
}

function musiqueNavale() {
  navaleCharge ??= chargerNavale();
  void navaleCharge.then((a) => {
    if (!a || navaleAudio !== a) return;
    a.currentTime = a.currentTime || 0;
    void a.play().catch(() => {});
  });
}

export function arreterMusiqueNavale() {
  if (navaleAudio) {
    navaleAudio.pause();
    navaleAudio.removeAttribute("src");
    navaleAudio.load();
    navaleAudio = null;
  }
  if (navaleUrl) {
    URL.revokeObjectURL(navaleUrl);
    navaleUrl = null;
  }
  navaleCharge = null;
}
