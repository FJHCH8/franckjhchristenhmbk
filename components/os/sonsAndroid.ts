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
