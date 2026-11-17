"use client";

import { useEffect } from "react";

const HIT = "a, button, summary, [role='button'], .etoile-hit";
const SKIP = ".nav, .lang, .toggle";

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

const FADE = "color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease";

function pose(el: HTMLElement, x: number, y: number) {
  const box = el.getBoundingClientRect();
  const px = (x - box.left) / Math.max(1, box.width) - 0.5;
  const py = (y - box.top) / Math.max(1, box.height) - 0.5;
  const small = el.classList.contains("etoile-fermer");
  const rotY = Math.max(small ? -8 : -14, Math.min(small ? 8 : 14, px * (small ? 16 : 28)));
  const rotX = Math.max(small ? -6 : -12, Math.min(small ? 6 : 12, -py * (small ? 12 : 22)));
  const depth = small ? -4 : -8;
  const scale = small ? 0.992 : 0.985;
  el.style.transform = `perspective(480px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(${depth}px) scale(${scale})`;
}

export function Tilt() {
  useEffect(() => {
    let node: HTMLElement | null = null;

    const down = (event: PointerEvent) => {
      if (event.button !== 0 || calm()) return;
      const el = pick(event.target);
      if (!el) return;
      node = el;
      el.classList.add("is-tilting");
      el.style.transition = `transform 0s linear, ${FADE}`;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* the browser may already own the gesture */
      }
      pose(el, event.clientX, event.clientY);
    };

    const move = (event: PointerEvent) => {
      if (!node || calm()) return;
      pose(node, event.clientX, event.clientY);
    };

    const up = () => {
      if (!node) return;
      const el = node;
      node = null;
      el.classList.remove("is-tilting");
      el.style.transition = `transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), ${FADE}`;
      el.style.transform = "";
      window.setTimeout(() => {
        if (el.style.transition.startsWith("transform 0.55s")) el.style.transition = "";
      }, 580);
    };

    document.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, []);

  return null;
}
