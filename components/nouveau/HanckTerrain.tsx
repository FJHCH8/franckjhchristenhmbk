"use client";

/**
 * Actualité « Hanck 7 Pro Max » : un paysage en 8 bits où tombent les logos de ses applis
 * (Sam, le requin, Peepo, Pulpüs, Nounou, Gypsy… et le téléphone lui-même).
 * Ils rebondissent, roulent, se cognent ; on les attrape du doigt, on les déplace, on les lance.
 */
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { sonChoc, sonLancer } from "@/lib/sonsHanck";

const muet = () => {
  try {
    return localStorage.getItem("tac-sons") === "off";
  } catch {
    return false;
  }
};

type Corps = { x: number; y: number; vx: number; vy: number; a: number; va: number; r: number; tenu: boolean };

const OBJETS: { id: string; taille: number; rendu: ReactNode }[] = [
  // eslint-disable-next-line @next/next/no-img-element
  { id: "hanck", taille: 58, rendu: <img src="/media/hanck/hanck.png" alt="Hanck 7 Pro Max" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "sam", taille: 62, rendu: <img src="/media/hanck/sam.png" alt="Sam-Telecom" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "requin", taille: 60, rendu: <img src="/media/hanck/requin.png" alt="Sharkobank" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "peepo", taille: 60, rendu: <img src="/media/hanck/peepo.png" alt="Peeporn" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "pulpus", taille: 54, rendu: <img src="/media/hanck/pulpus.png" alt="Pulpüs market" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "nounou", taille: 54, rendu: <img src="/media/hanck/nounou.svg" alt="Nounou" draggable={false} /> },
  // eslint-disable-next-line @next/next/no-img-element
  { id: "gypsy", taille: 66, rendu: <img src="/media/hanck/gypsy.svg" alt="Gypsy" draggable={false} /> },
];

const G = 1900; // gravité, px/s²
const SOL = 0.19; // part de la hauteur occupée par la terre

export function HanckTerrain() {
  const terrain = useRef<HTMLDivElement>(null);
  const elements = useRef<(HTMLDivElement | null)[]>([]);
  const corps = useRef<Corps[]>([]);
  const aJoue = useRef(false);
  const prise = useRef<{ i: number; dx: number; dy: number; px: number; py: number; t: number } | null>(null);

  const lacher = useCallback(() => {
    const t = terrain.current;
    if (!t) return;
    const w = t.clientWidth;
    corps.current = OBJETS.map((o, i) => ({
      x: 40 + Math.random() * Math.max(10, w - 80),
      y: -80 - i * 110,
      vx: (Math.random() - 0.5) * 120,
      vy: 0,
      a: (Math.random() - 0.5) * 0.6,
      va: 0,
      r: o.taille * 0.46,
      tenu: false,
    }));
  }, []);

  useEffect(() => {
    const t = terrain.current;
    if (!t) return;
    lacher();
    let raf = 0;
    let avant = performance.now();
    let visible = true;
    const obs = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
    });
    obs.observe(t);
    const pas = (n: number) => {
      raf = requestAnimationFrame(pas);
      const dt = Math.min(1 / 30, (n - avant) / 1000);
      avant = n;
      if (!visible) return;
      const W = t.clientWidth;
      const H = t.clientHeight;
      const sol = H * (1 - SOL);
      const cs = corps.current;
      for (const c of cs) {
        if (c.tenu) continue;
        c.vy += G * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.a += c.va * dt;
        if (c.y + c.r > sol) {
          // un petit « bonk » s'il tombe assez vite (seulement après un geste du visiteur)
          if (c.vy > 420 && !muet()) sonChoc(c.vy);
          c.y = sol - c.r;
          c.vy = Math.abs(c.vy) > 60 ? -c.vy * 0.38 : 0;
          c.vx *= 0.9;
          c.va = c.vx / c.r; // il roule
        }
        if (c.x - c.r < 0) {
          c.x = c.r;
          c.vx = Math.abs(c.vx) * 0.5;
        }
        if (c.x + c.r > W) {
          c.x = W - c.r;
          c.vx = -Math.abs(c.vx) * 0.5;
        }
        c.va *= 0.995;
      }
      // les logos se cognent entre eux
      for (let i = 0; i < cs.length; i++) {
        for (let j = i + 1; j < cs.length; j++) {
          const a = cs[i]!;
          const b = cs[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const min = a.r + b.r;
          if (d >= min) continue;
          const nx = dx / d;
          const ny = dy / d;
          const recouvre = min - d;
          const pa = a.tenu ? 0 : b.tenu ? 1 : 0.5;
          const pb = 1 - pa;
          a.x -= nx * recouvre * pa;
          a.y -= ny * recouvre * pa;
          b.x += nx * recouvre * pb;
          b.y += ny * recouvre * pb;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = -(1 + 0.4) * rel * 0.5;
            if (!a.tenu) {
              a.vx -= imp * nx;
              a.vy -= imp * ny;
            }
            if (!b.tenu) {
              b.vx += imp * nx;
              b.vy += imp * ny;
            }
          }
        }
      }
      cs.forEach((c, i) => {
        const el = elements.current[i];
        if (el) el.style.transform = `translate(${(c.x - OBJETS[i]!.taille / 2).toFixed(1)}px, ${(c.y - OBJETS[i]!.taille / 2).toFixed(1)}px) rotate(${c.a.toFixed(3)}rad)`;
      });
    };
    raf = requestAnimationFrame(pas);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [lacher]);

  const point = (e: React.PointerEvent) => {
    const r = terrain.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="hanck">
      <div className="hanck-terrain" ref={terrain}>
        {OBJETS.map((o, i) => (
          <div
            key={o.id}
            className="hanck-corps"
            ref={(el) => {
              elements.current[i] = el;
            }}
            style={{ width: o.taille, height: o.taille }}
            onPointerDown={(e) => {
              const c = corps.current[i];
              if (!c) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = point(e);
              c.tenu = true;
              c.vx = c.vy = 0;
              prise.current = { i, dx: c.x - p.x, dy: c.y - p.y, px: p.x, py: p.y, t: performance.now() };
            }}
            onPointerMove={(e) => {
              const pr = prise.current;
              if (!pr || pr.i !== i) return;
              const c = corps.current[i]!;
              const p = point(e);
              const n = performance.now();
              const dt = Math.max(1, n - pr.t) / 1000;
              c.vx = (p.x - pr.px) / dt;
              c.vy = (p.y - pr.py) / dt;
              c.x = p.x + pr.dx;
              c.y = p.y + pr.dy;
              c.va = c.vx / c.r / 3;
              pr.px = p.x;
              pr.py = p.y;
              pr.t = n;
            }}
            onPointerUp={() => {
              const pr = prise.current;
              if (!pr || pr.i !== i) return;
              const c = corps.current[i]!;
              c.tenu = false;
              // on le lance : la vitesse du doigt, un peu limitée
              const v = Math.hypot(c.vx, c.vy);
              if (v > 2400) {
                c.vx *= 2400 / v;
                c.vy *= 2400 / v;
              }
              prise.current = null;
              aJoue.current = true;
              if (v > 500 && !muet()) sonLancer();
            }}
            onPointerCancel={() => {
              const c = corps.current[i];
              if (c) c.tenu = false;
              prise.current = null;
            }}
          >
            {o.rendu}
          </div>
        ))}
        <div className="hanck-titre">
          <small>{"// NOUVEAU"}</small>
          <b>HANCK 7 PRO MAX</b>
          <span>archives d’Odyssée 0.2</span>
        </div>
        <button type="button" className="hanck-relancer" onClick={() => ((aJoue.current = true), lacher())}>
          ↻ lâcher encore
        </button>
      </div>
      <p className="hanck-aide">Attrape les logos, déplace-les, lance-les.</p>
    </div>
  );
}
