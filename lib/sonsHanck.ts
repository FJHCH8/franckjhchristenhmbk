/** Les petits sons du terrain Hanck (actualité) : le « fiouuu » d'un lancer et le « bonk » 8 bits d'un logo qui tombe. */
let ctx: AudioContext | null = null;
function contexte(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
// Sur iPhone, le son n'est permis qu'après un toucher : on le débloque au premier.
if (typeof window !== "undefined") {
  const debloquer = () => {
    const c = contexte();
    if (!c) return;
    try {
      const s = c.createBufferSource();
      s.buffer = c.createBuffer(1, 1, 22050);
      s.connect(c.destination);
      s.start(0);
    } catch {}
    if (c.state === "running") for (const ev of ["pointerdown", "touchend", "keydown"]) window.removeEventListener(ev, debloquer, true);
  };
  for (const ev of ["pointerdown", "touchend", "keydown"]) window.addEventListener(ev, debloquer, true);
}

export function sonLancer() {
  const c = contexte();
  if (!c) return;
  const t = c.currentTime;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.35), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 3;
  f.frequency.setValueAtTime(600, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

export function sonChoc(force: number) {
  const c = contexte();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(220 + Math.random() * 80, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(Math.min(0.12, 0.02 + force * 0.00005), t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.13);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.15);
}
