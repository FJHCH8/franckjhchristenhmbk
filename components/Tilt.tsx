"use client";

import { useEffect } from "react";

const HIT = "a, button, summary, [role='button'], .etoile-hit";
const SKIP = ".nav, .lang, .toggle, .album";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const RELEASE_MS = 550;
const TAU = 0.042;
const FADE_IN = "color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease";
const FADE_OUT = `color 0.45s ${EASE}, border-color 0.45s ${EASE}, box-shadow 0.45s ${EASE}, background-color 0.45s ${EASE}`;

type Pose = { rx: number; ry: number; z: number; s: number };

type Gesture = {
  el: HTMLElement;
  cur: Pose;
  goal: Pose;
  mode: "track" | "release";
  from: Pose;
  started: number;
  last: number;
};

function calm() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pick(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const el = target.closest(HIT);
  if (!(el instanceof HTMLElement)) return null;
  if (el.closest(SKIP)) return null;
  if (el.matches("input, textarea, select")) return null;
  return el;
}

function copy(pose: Pose): Pose {
  return { rx: pose.rx, ry: pose.ry, z: pose.z, s: pose.s };
}

function paint(el: HTMLElement, pose: Pose) {
  el.style.transform = `perspective(480px) rotateX(${pose.rx.toFixed(3)}deg) rotateY(${pose.ry.toFixed(3)}deg) translateZ(${pose.z.toFixed(3)}px) scale(${pose.s.toFixed(4)})`;
}

function aim(el: HTMLElement, x: number, y: number): Pose {
  const box = el.getBoundingClientRect();
  const px = (x - box.left) / Math.max(1, box.width) - 0.5;
  const py = (y - box.top) / Math.max(1, box.height) - 0.5;
  const small = el.classList.contains("etoile-fermer");
  return {
    rx: Math.max(small ? -6 : -12, Math.min(small ? 6 : 12, -py * (small ? 12 : 22))),
    ry: Math.max(small ? -8 : -14, Math.min(small ? 8 : 14, px * (small ? 16 : 28))),
    z: small ? -4 : -8,
    s: small ? 0.992 : 0.985,
  };
}

function eased(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 0.66;
  const bx = -0.24;
  const ax = 0.58;
  const cy = 3;
  const by = -3;
  const ay = 1;
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

export function Tilt() {
  useEffect(() => {
    const gestures: Gesture[] = [];
    let frame = 0;
    let held: { id: number; el: HTMLElement } | null = null;

    const kick = () => {
      if (frame) return;
      const step = (now: number) => {
        frame = 0;
        for (let i = gestures.length - 1; i >= 0; i -= 1) {
          const gesture = gestures[i]!;
          if (!gesture.el.isConnected) {
            gestures.splice(i, 1);
            continue;
          }
          if (gesture.mode === "track") {
            const dt = gesture.last ? Math.min(0.05, (now - gesture.last) / 1000) : 0.016;
            gesture.last = now;
            const k = 1 - Math.exp(-dt / TAU);
            gesture.cur.rx += (gesture.goal.rx - gesture.cur.rx) * k;
            gesture.cur.ry += (gesture.goal.ry - gesture.cur.ry) * k;
            gesture.cur.z += (gesture.goal.z - gesture.cur.z) * k;
            gesture.cur.s += (gesture.goal.s - gesture.cur.s) * k;
            paint(gesture.el, gesture.cur);
            continue;
          }
          const t = Math.min(1, (now - gesture.started) / RELEASE_MS);
          const e = eased(t);
          gesture.cur.rx = gesture.from.rx * (1 - e);
          gesture.cur.ry = gesture.from.ry * (1 - e);
          gesture.cur.z = gesture.from.z * (1 - e);
          gesture.cur.s = gesture.from.s + (1 - gesture.from.s) * e;
          if (t < 1) {
            paint(gesture.el, gesture.cur);
            continue;
          }
          const el = gesture.el;
          const stamp = el.style.transition;
          el.style.transform = "";
          gestures.splice(i, 1);
          window.setTimeout(() => {
            if (el.style.transition === stamp) el.style.transition = "";
          }, 40);
        }
        if (gestures.length) frame = window.requestAnimationFrame(step);
      };
      frame = window.requestAnimationFrame(step);
    };

    const down = (event: PointerEvent) => {
      if (event.button !== 0 || calm()) return;
      const el = pick(event.target);
      if (!el) return;
      held = { id: event.pointerId, el };
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* the browser may already own the gesture */
      }
      let gesture = gestures.find((item) => item.el === el);
      if (!gesture) {
        gesture = { el, cur: { rx: 0, ry: 0, z: 0, s: 1 }, goal: aim(el, event.clientX, event.clientY), mode: "track", from: { rx: 0, ry: 0, z: 0, s: 1 }, started: 0, last: 0 };
        gestures.push(gesture);
      }
      gesture.mode = "track";
      gesture.goal = aim(el, event.clientX, event.clientY);
      gesture.last = 0;
      el.style.transition = `transform 0s linear, ${FADE_IN}`;
      void el.offsetWidth;
      el.classList.add("is-tilting");
      kick();
    };

    const move = (event: PointerEvent) => {
      if (!held || event.pointerId !== held.id || calm()) return;
      const gesture = gestures.find((item) => item.el === held?.el && item.mode === "track");
      if (!gesture) return;
      gesture.goal = aim(gesture.el, event.clientX, event.clientY);
    };

    const up = (event: PointerEvent) => {
      if (!held || event.pointerId !== held.id) return;
      const gesture = gestures.find((item) => item.el === held?.el && item.mode === "track");
      held = null;
      if (!gesture) return;
      gesture.mode = "release";
      gesture.from = copy(gesture.cur);
      gesture.started = performance.now();
      gesture.el.style.transition = `transform 0s linear, ${FADE_OUT}`;
      void gesture.el.offsetWidth;
      gesture.el.classList.remove("is-tilting");
      kick();
    };

    document.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, []);

  return null;
}
