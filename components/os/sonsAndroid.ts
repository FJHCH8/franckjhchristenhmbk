/**
 * Les sons officiels d'Android 4.1 Jelly Bean (AOSP, frameworks/base/data/sounds, licence Apache 2.0) :
 * le « tick » des touches, le clavier, le verrouillage, la notification Capella.
 * Plus les tonalités du téléphone, générées comme sur un vrai réseau : DTMF du pavé, tonalité de retour d'appel.
 */
const FICHIERS = {
  tick: "Effect_Tick",
  touche: "KeypressStandard",
  effacer: "KeypressDelete",
  entree: "KeypressReturn",
  verrou: "Lock",
  deverrou: "Unlock",
  notif: "Capella",
} as const;
export type NomSon = keyof typeof FICHIERS;

let ctx: AudioContext | null = null;
const tampons: Partial<Record<NomSon, AudioBuffer>> = {};
let chargement: Promise<void> | null = null;

function contexte(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    // Sur iPhone, sans cela, le mode silencieux coupe les sons générés.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {}
    }
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

export function prechargerSons() {
  const c = contexte();
  if (!c) return Promise.resolve();
  chargement ??= Promise.all(
    (Object.keys(FICHIERS) as NomSon[]).map(async (nom) => {
      try {
        const r = await fetch(`/aakanos/sons/${FICHIERS[nom]}.mp3`);
        tampons[nom] = await c.decodeAudioData(await r.arrayBuffer());
      } catch {}
    }),
  ).then(() => undefined);
  return chargement;
}

export function son(nom: NomSon, volume = 1) {
  const c = contexte();
  if (!c) return;
  const b = tampons[nom];
  if (!b) {
    void prechargerSons().then(() => tampons[nom] && son(nom, volume));
    return;
  }
  const s = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  s.buffer = b;
  s.connect(g).connect(c.destination);
  s.start();
}

const DTMF: Record<string, [number, number]> = {
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
  "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
};

/** La double fréquence d'une touche du pavé (DTMF), 150 ms. */
export function dtmf(touche: string) {
  const c = contexte();
  const f = DTMF[touche];
  if (!c || !f) return;
  const t0 = c.currentTime;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.09, t0 + 0.01);
  g.gain.setValueAtTime(0.09, t0 + 0.14);
  g.gain.linearRampToValueAtTime(0, t0 + 0.16);
  g.connect(c.destination);
  for (const hz of f) {
    const o = c.createOscillator();
    o.frequency.value = hz;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + 0.17);
  }
}

/** Tonalité de retour d'appel française : 440 Hz, 1,5 s de son, 3,5 s de silence. Renvoie de quoi l'arrêter. */
export function tonaliteRetour(): () => void {
  const c = contexte();
  if (!c) return () => {};
  const g = c.createGain();
  g.connect(c.destination);
  const o = c.createOscillator();
  o.frequency.value = 440;
  o.connect(g);
  const t0 = c.currentTime + 0.3;
  g.gain.setValueAtTime(0, c.currentTime);
  for (let k = 0; k < 6; k++) {
    const t = t0 + k * 5;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.02);
    g.gain.setValueAtTime(0.08, t + 1.5);
    g.gain.linearRampToValueAtTime(0, t + 1.52);
  }
  o.start();
  return () => {
    try {
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(0, c.currentTime);
      o.stop(c.currentTime + 0.05);
    } catch {}
  };
}

/* ---------- Sons des applis (générés) ---------- */

function bruit(c: AudioContext, duree: number) {
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duree)), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

/** Des pièces qui tombent et tintent. */
export function sonPieces(n = 6) {
  const c = contexte();
  if (!c) return;
  for (let i = 0; i < n; i++) {
    const t = c.currentTime + i * 0.075 + Math.random() * 0.03;
    const f = 2600 + Math.random() * 1600;
    for (const [mult, vol] of [[1, 0.09], [2.76, 0.045], [5.4, 0.02]] as const) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = f * mult;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18 + Math.random() * 0.1);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.3);
    }
  }
}

/** La compteuse de billets : un « brrrrt » de papier, puis un « ka-ching ». */
export function sonBillets() {
  const c = contexte();
  if (!c) return;
  const t0 = c.currentTime;
  for (let i = 0; i < 16; i++) {
    const t = t0 + i * 0.034;
    const s = bruit(c, 0.022);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2800 + (i % 3) * 300;
    f.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  }
  const t = t0 + 0.62;
  for (const [hz, vol] of [[1318, 0.08], [1976, 0.06], [2637, 0.04], [3951, 0.02]] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = hz;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 1.2);
  }
}

/** Le trombone triste : « wah wah wah waaaah ». */
export function sonTromboneTriste() {
  const c = contexte();
  if (!c) return;
  const notes: [number, number][] = [[233, 0.42], [220, 0.42], [208, 0.42], [196, 1.5]];
  let t = c.currentTime + 0.05;
  for (const [hz, d] of notes) {
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(hz, t);
    f.type = "lowpass";
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(1400, t + 0.12);
    f.frequency.linearRampToValueAtTime(700, t + d);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.05);
    g.gain.setValueAtTime(0.11, t + d - 0.08);
    g.gain.linearRampToValueAtTime(0, t + d);
    if (d > 1) {
      const lfo = c.createOscillator();
      const prof = c.createGain();
      lfo.frequency.value = 6;
      prof.gain.value = 5;
      lfo.connect(prof).connect(o.frequency);
      lfo.start(t + 0.3);
      lfo.stop(t + d);
    }
    o.connect(f).connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + d + 0.02);
    t += d;
  }
}

/** La guitare wah-wah des vieux films coquins : « bow-chicka-bow-wow ». */
export function sonWahWah() {
  const c = contexte();
  if (!c) return;
  const t0 = c.currentTime + 0.05;
  const coups: [number, number, number, boolean][] = [
    // [début, durée, fréquence, wah ouvert ?]
    [0, 0.34, 82.4, true],
    [0.36, 0.09, 164.8, false],
    [0.48, 0.09, 164.8, false],
    [0.6, 0.34, 98, true],
    [0.98, 0.7, 82.4, true],
  ];
  for (const [deb, d, hz, wah] of coups) {
    const t = t0 + deb;
    for (const det of [0, 4]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz * 2 + det;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 6;
      f.frequency.setValueAtTime(wah ? 350 : 1800, t);
      if (wah) {
        f.frequency.exponentialRampToValueAtTime(2200, t + d * 0.45);
        f.frequency.exponentialRampToValueAtTime(400, t + d);
      }
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(wah ? 0.16 : 0.1, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(f).connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    }
  }
}
