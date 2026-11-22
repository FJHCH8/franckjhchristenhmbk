/**
 * Sons du site, presque de cinéma : gouttes d'eau, souffles profonds, verre qui éclate,
 * le tout dans une réverbération. Une musique, « Nostalgia », qui démarre et s'arrête
 * comme un vinyle : elle accélère ou ralentit, monte ou descend en ton, grésille.
 * Tout reste muet tant que le visiteur ne l'a pas activé lui-même.
 */

const CLE = "fjch-sons";
const MUSIQUE = "/audio/nostalgia.mp3";
const VOLUME_MUSIQUE = 0.32;

type Graphe = {
  ctx: AudioContext;
  sortie: GainNode;
  reverb: ConvolverNode;
  bruit: AudioBuffer;
};

type Platine = {
  element: HTMLAudioElement;
  filtre: BiquadFilterNode;
  volume: GainNode;
  grain: GainNode;
  anim: number;
};

let graphe: Graphe | null = null;
let platine: Platine | null = null;
let actif: boolean | null = null;
let musiqueVoulue = false;
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

/** Réponse impulsionnelle générée : une salle sombre et profonde, sans fichier à charger. */
function salle(ctx: AudioContext, duree = 2.6) {
  const longueur = Math.round(ctx.sampleRate * duree);
  const ir = ctx.createBuffer(2, longueur, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal += 1) {
    const data = ir.getChannelData(canal);
    for (let i = 0; i < longueur; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / longueur, 3.2);
  }
  return ir;
}

function audio(): Graphe | null {
  if (typeof window === "undefined") return null;
  if (!graphe) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const sortie = ctx.createGain();
    sortie.gain.value = 0.9;
    const reverb = ctx.createConvolver();
    reverb.buffer = salle(ctx);
    const humide = ctx.createGain();
    humide.gain.value = 0.42;
    sortie.connect(ctx.destination);
    reverb.connect(humide);
    humide.connect(ctx.destination);
    const bruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = bruit.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    graphe = { ctx, sortie, reverb, bruit };
  }
  if (graphe.ctx.state === "suspended") void graphe.ctx.resume();
  return graphe;
}

/** Enveloppe vers la sortie sèche et vers la réverbération. */
function voie(g: Graphe, gain: number, attaque: number, extinction: number, humide = 0.6, depart = 0) {
  const t = g.ctx.currentTime + depart;
  const node = g.ctx.createGain();
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(gain, t + attaque);
  node.gain.exponentialRampToValueAtTime(0.0001, t + attaque + extinction);
  node.connect(g.sortie);
  const envoi = g.ctx.createGain();
  envoi.gain.value = humide;
  node.connect(envoi);
  envoi.connect(g.reverb);
  return { node, t };
}

/** Une goutte d'eau : un ton qui remonte très vite, comme une bulle qui éclate à la surface. */
function goutte(g: Graphe, f0: number, f1: number, duree: number, gain: number, depart = 0, humide = 0.7) {
  const { node, t } = voie(g, gain, 0.003, duree, humide, depart);
  const osc = g.ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + duree * 0.45);
  osc.connect(node);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

function souffleBruit(g: Graphe, opts: { de: number; vers: number; fin: number; duree: number; gain: number; q?: number; type?: BiquadFilterType; depart?: number; humide?: number }) {
  const { node, t } = voie(g, opts.gain, opts.duree * 0.38, opts.duree * 0.62, opts.humide ?? 0.8, opts.depart ?? 0);
  const source = g.ctx.createBufferSource();
  source.buffer = g.bruit;
  source.loop = true;
  const filtre = g.ctx.createBiquadFilter();
  filtre.type = opts.type ?? "bandpass";
  filtre.Q.value = opts.q ?? 1.2;
  filtre.frequency.setValueAtTime(opts.de, t);
  filtre.frequency.exponentialRampToValueAtTime(opts.vers, t + opts.duree * 0.5);
  filtre.frequency.exponentialRampToValueAtTime(opts.fin, t + opts.duree);
  source.connect(filtre);
  filtre.connect(node);
  source.start(t);
  source.stop(t + opts.duree + 0.1);
}

function basse(g: Graphe, f0: number, f1: number, duree: number, gain: number, depart = 0) {
  const { node, t } = voie(g, gain, 0.02, duree, 0.3, depart);
  const osc = g.ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + duree);
  osc.connect(node);
  osc.start(t);
  osc.stop(t + duree + 0.1);
}

/** Survol : une petite goutte cristalline. */
export function tic() {
  if (!sonsActifs()) return;
  const now = performance.now();
  if (now - dernier < 60) return;
  dernier = now;
  const g = audio();
  if (!g) return;
  const f = 1300 + Math.random() * 500;
  goutte(g, f, f * 2.1, 0.09, 0.018);
}

/** Clic : une goutte ronde qui tombe dans l'eau. */
export function clic() {
  if (!sonsActifs()) return;
  const g = audio();
  if (!g) return;
  const f = 420 + Math.random() * 80;
  goutte(g, f, f * 2.6, 0.16, 0.07);
  basse(g, 120, 70, 0.18, 0.04);
}

/** Changement de page : un souffle qui traverse l'espace, porté par une basse profonde. */
export function souffle() {
  if (!sonsActifs()) return;
  const g = audio();
  if (!g) return;
  souffleBruit(g, { de: 180, vers: 1900, fin: 420, duree: 1.3, gain: 0.07, q: 0.9 });
  souffleBruit(g, { de: 3000, vers: 7000, fin: 2500, duree: 0.9, gain: 0.015, q: 0.7, type: "highpass", depart: 0.15 });
  basse(g, 62, 34, 1.6, 0.13, 0.05);
}

/** Le bocal éclate : du verre qui tinte et se brise, puis l'eau qui jaillit. */
export function eclat() {
  if (!sonsActifs()) return;
  const g = audio();
  if (!g) return;
  basse(g, 90, 30, 1.2, 0.18);
  souffleBruit(g, { de: 5000, vers: 9000, fin: 3000, duree: 0.35, gain: 0.08, q: 0.5, type: "highpass" });
  for (let i = 0; i < 14; i += 1) {
    const f = 2200 + Math.random() * 4800;
    const { node, t } = voie(g, 0.02 + Math.random() * 0.025, 0.002, 0.25 + Math.random() * 0.5, 0.8, Math.random() * 0.55);
    const osc = g.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, t);
    osc.connect(node);
    osc.start(t);
    osc.stop(t + 1);
  }
  souffleBruit(g, { de: 600, vers: 1400, fin: 300, duree: 1.4, gain: 0.06, q: 0.8, depart: 0.12 });
  for (let i = 0; i < 6; i += 1) goutte(g, 300 + Math.random() * 500, 1200 + Math.random() * 900, 0.18, 0.04, 0.3 + Math.random() * 0.9);
}

/** Une pièce prise : trois gouttes sombres et lentes. */
export function sang() {
  if (!sonsActifs()) return;
  const g = audio();
  if (!g) return;
  basse(g, 70, 40, 0.8, 0.08);
  [0, 0.35, 0.8].forEach((depart, i) => goutte(g, 180 - i * 20, 520 - i * 60, 0.22, 0.05, depart, 0.9));
}

/* ───────────────────────── Musique et platine ───────────────────────── */

function grain(ctx: AudioContext) {
  // Craquements de vinyle : de rares impulsions sur un souffle très bas.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const pop = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0;
    data[i] = pop + (Math.random() * 2 - 1) * 0.035;
  }
  return buffer;
}

function preparerPlatine(g: Graphe): Platine {
  if (platine) return platine;
  const element = new Audio(MUSIQUE);
  element.loop = true;
  element.preload = "auto";
  // La vitesse change aussi le ton, comme sur une platine.
  element.preservesPitch = false;
  (element as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
  (element as HTMLAudioElement & { mozPreservesPitch?: boolean }).mozPreservesPitch = false;
  const source = g.ctx.createMediaElementSource(element);
  const filtre = g.ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.value = 18000;
  const volume = g.ctx.createGain();
  volume.gain.value = 0;
  source.connect(filtre);
  filtre.connect(volume);
  volume.connect(g.ctx.destination);

  const craque = g.ctx.createBufferSource();
  craque.buffer = grain(g.ctx);
  craque.loop = true;
  const passe = g.ctx.createBiquadFilter();
  passe.type = "highpass";
  passe.frequency.value = 900;
  const grainGain = g.ctx.createGain();
  grainGain.gain.value = 0;
  craque.connect(passe);
  passe.connect(grainGain);
  grainGain.connect(g.ctx.destination);
  craque.start();

  platine = { element, filtre, volume, grain: grainGain, anim: 0 };
  return platine;
}

/** Fait varier la vitesse de la platine image par image, avec le filtre et le grésillement. */
function virer(p: Platine, g: Graphe, de: number, vers: number, duree: number, fin?: () => void) {
  window.cancelAnimationFrame(p.anim);
  const t0 = performance.now();
  const monte = vers > de;
  const pas = (now: number) => {
    const t = Math.min(1, (now - t0) / duree);
    const e = monte ? 1 - (1 - t) ** 3 : t * t;
    const vitesse = de + (vers - de) * e;
    try {
      p.element.playbackRate = Math.max(0.5, vitesse);
    } catch {
      /* vitesse refusée par le navigateur */
    }
    const ouverture = monte ? e : 1 - e;
    p.filtre.frequency.setTargetAtTime(280 * Math.pow(64, ouverture), g.ctx.currentTime, 0.03);
    p.volume.gain.setTargetAtTime(VOLUME_MUSIQUE * Math.min(1, ouverture * 1.3), g.ctx.currentTime, 0.05);
    // Le grésillement est fort pendant le virage, presque absent ensuite.
    p.grain.gain.setTargetAtTime(0.012 + Math.sin(t * Math.PI) * 0.16, g.ctx.currentTime, 0.04);
    if (t < 1) p.anim = window.requestAnimationFrame(pas);
    else fin?.();
  };
  p.anim = window.requestAnimationFrame(pas);
}

function lancerMusique() {
  const g = audio();
  if (!g) return;
  const p = preparerPlatine(g);
  p.element.playbackRate = 0.5;
  void p.element.play().catch(() => undefined);
  virer(p, g, 0.5, 1, 1700);
}

function couperMusique() {
  const g = graphe;
  const p = platine;
  if (!g || !p) return;
  virer(p, g, p.element.playbackRate || 1, 0.5, 1500, () => {
    p.element.pause();
    p.grain.gain.setTargetAtTime(0, g.ctx.currentTime, 0.1);
  });
}

export function reglerSons(on: boolean) {
  actif = on;
  try {
    localStorage.setItem(CLE, on ? "1" : "0");
  } catch {
    /* navigation privée */
  }
  musiqueVoulue = on;
  if (on) lancerMusique();
  else couperMusique();
  window.dispatchEvent(new Event("fjch-sons"));
}

/**
 * Si le visiteur avait laissé le son allumé, la musique reprend au premier geste
 * (les navigateurs interdisent de lancer un son sans interaction).
 */
export function reprendreAuPremierGeste() {
  if (!sonsActifs() || musiqueVoulue) return () => undefined;
  const reprendre = () => {
    if (!sonsActifs() || musiqueVoulue) return;
    musiqueVoulue = true;
    lancerMusique();
  };
  window.addEventListener("pointerdown", reprendre, { once: true });
  window.addEventListener("keydown", reprendre, { once: true });
  return () => {
    window.removeEventListener("pointerdown", reprendre);
    window.removeEventListener("keydown", reprendre);
  };
}
