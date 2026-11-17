"use client";

import { useEffect, useRef } from "react";

type Ton = "ame" | "ciel" | "nature";

function Plaque() {
  return (
    <svg className="gemme-plaque" viewBox="0 0 40 54" aria-hidden="true">
      <polygon points="20,1.5 7,15 20,21" fill="var(--g2)" />
      <polygon points="20,1.5 33,15 20,21" fill="var(--g1)" />
      <polygon points="7,15 20,21 9,35 20,52.5" fill="var(--g3)" />
      <polygon points="33,15 20,21 31,35 20,52.5" fill="var(--g4)" />
      <polygon points="20,21 9,35 31,35" fill="var(--g2)" opacity="0.9" />
      <polygon points="9,35 20,52.5 31,35" fill="var(--g5)" opacity="0.55" />
      <polygon points="17,16 23,16 20,28" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function easeOut(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x1 = 0.16;
  const y1 = 1;
  const x2 = 0.3;
  const y2 = 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sample = (u: number, a: number, b: number, c: number) => ((a * u + b) * u + c) * u;
  const slope = (u: number, a: number, b: number, c: number) => (3 * a * u + 2 * b) * u + c;
  let u = t;
  for (let i = 0; i < 8; i += 1) {
    const x = sample(u, ax, bx, cx) - t;
    const dx = slope(u, ax, bx, cx);
    if (Math.abs(x) < 1e-5 || Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - x / dx));
  }
  return sample(u, ay, by, cy);
}

export function Gemme({
  tone,
  petit = false,
  pose = "tourne",
  eclat = false,
  onFace,
}: {
  tone: Ton;
  petit?: boolean;
  pose?: "tourne" | "face";
  eclat?: boolean;
  onFace?: () => void;
}) {
  const spinRef = useRef<HTMLSpanElement>(null);
  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;

  useEffect(() => {
    const spin = spinRef.current;
    if (!spin) return;
    let frame = 0;
    let alive = true;
    if (pose !== "face") {
      spin.style.animation = "";
      spin.style.transform = "";
      return () => {
        alive = false;
        window.cancelAnimationFrame(frame);
      };
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      spin.style.animation = "none";
      spin.style.transform = "rotateY(0deg)";
      onFaceRef.current?.();
      return () => {
        alive = false;
      };
    }
    const matrix = new DOMMatrix(getComputedStyle(spin).transform);
    let angle = (Math.atan2(matrix.m13, matrix.m11) * 180) / Math.PI;
    if (!Number.isFinite(angle)) angle = 0;
    angle = ((angle % 360) + 360) % 360;
    const reste = (360 - angle) % 360 || 360;
    const target = angle + 720 + reste;
    const debut = performance.now();
    const duree = 1200;
    spin.style.animation = "none";
    const step = (now: number) => {
      if (!alive) return;
      const t = Math.min(1, (now - debut) / duree);
      const y = angle + (target - angle) * easeOut(t);
      spin.style.transform = `rotateY(${y.toFixed(3)}deg)`;
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
        return;
      }
      spin.style.transform = `rotateY(${target}deg)`;
      onFaceRef.current?.();
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
    };
  }, [pose]);

  const classes = ["gemme", `gemme-${tone}`, petit ? "gemme-petit" : "", eclat ? "is-liberant" : ""].filter(Boolean).join(" ");
  return (
    <span className={classes} aria-hidden="true">
      <span className="gemme-halo" />
      <span className="gemme-scene">
        <span className="gemme-pivot">
          <span className="gemme-spin" ref={spinRef}>
            <span className="gemme-avant">
              <Plaque />
            </span>
            <span className="gemme-dos">
              <Plaque />
            </span>
            <span className="gemme-reflet" />
          </span>
        </span>
      </span>
      <span className="gemme-etincelle" />
      <span className="gemme-etincelle gemme-etincelle-b" />
    </span>
  );
}
