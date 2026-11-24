/**
 * Sons originaux d'AakanOS, synthétisés en direct (Web Audio) : démarrage, retour, erreurs, bulles, mode développeur, message envoyé.
 * Aucun fichier son : tout est calculé ici. Plus l'interrupteur « muet » de tout le téléphone.
 */
const CLE_MUET = "aakanos-muet";

export function estMuet(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(CLE_MUET) === "1";
  } catch {
    return false;
  }
}
export function regleMuet(m: boolean) {
  try {
    sessionStorage.setItem(CLE_MUET, m ? "1" : "0");
  } catch {}
  window.dispatchEvent(new CustomEvent("aakanos-muet", { detail: m }));
}

let ctx: AudioContext | null = null;
function c(): AudioContext | null {
  if (typeof window === "undefined" || estMuet()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

/** Une note douce : oscillateur + enveloppe. */
function note(a: AudioContext, f: number, debut: number, duree: number, vol = 0.18, type: OscillatorType = "sine", glisse?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, debut);
  if (glisse) o.frequency.exponentialRampToValueAtTime(glisse, debut + duree);
  g.gain.setValueAtTime(0.0001, debut);
  g.gain.exponentialRampToValueAtTime(vol, debut + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  o.connect(g).connect(a.destination);
  o.start(debut);
  o.stop(debut + duree + 0.02);
}

export type SonSynth = "envoye" | "boot" | "retour" | "erreur" | "bulle" | "dev";

export function sonSynth(nom: SonSynth) {
  const a = c();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (nom) {
    case "boot": {
      // Un accord qui s'ouvre lentement : ré – la – ré – fa#, avec un léger scintillement.
      [293.66, 440, 587.33, 739.99].forEach((f, i) => note(a, f, t + i * 0.16, 1.9 - i * 0.2, 0.09, "sine"));
      [1174.66, 1479.98].forEach((f, i) => note(a, f, t + 0.7 + i * 0.12, 0.9, 0.035, "triangle"));
      break;
    }
    case "envoye":
      // un « fuit » qui part vers le haut
      note(a, 600, t, 0.16, 0.08, "sine", 1500);
      break;
    case "retour":
      note(a, 523.25, t, 0.14, 0.09, "sine", 392);
      break;
    case "erreur":
      note(a, 311.13, t, 0.16, 0.12, "square", 300);
      note(a, 233.08, t + 0.15, 0.26, 0.1, "square", 220);
      break;
    case "bulle":
      note(a, 1046.5, t, 0.09, 0.06, "sine", 1568);
      break;
    case "dev":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(a, f, t + i * 0.07, 0.2, 0.07, "triangle"));
      break;
  }
}
