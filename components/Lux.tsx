"use client";

import { useEffect } from "react";

const SELECTOR = ".glass, .ice, .qui-note, .scroll-mark, .album-card";

export function Lux() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let current: HTMLElement | null = null;
    let rx = 0;
    let ry = 0;

    const paint = () => {
      frame = 0;
      if (!current) return;
      current.style.transform = `perspective(900px) rotateX(${ry.toFixed(2)}deg) rotateY(${rx.toFixed(2)}deg)`;
    };

    const clear = (node: HTMLElement | null) => {
      if (!node) return;
      node.classList.remove("is-lit");
      node.style.transition = "";
      node.style.transform = "";
    };

    const onMove = (event: PointerEvent) => {
      if (reduce.matches || document.hidden) return;
      const target = (event.target as Element | null)?.closest(SELECTOR);
      if (!(target instanceof HTMLElement)) {
        if (current) clear(current);
        current = null;
        return;
      }
      if (current !== target) {
        clear(current);
        current = target;
        current.style.transition = "none";
        current.classList.add("is-lit");
      }
      const box = target.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width - 0.5;
      const ny = (event.clientY - box.top) / box.height - 0.5;
      rx = nx * 3.2;
      ry = -ny * 2.4;
      target.style.setProperty("--mx", `${event.clientX - box.left}px`);
      target.style.setProperty("--my", `${event.clientY - box.top}px`);
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onEnd = () => {
      clear(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", onEnd, { passive: true });
    document.addEventListener("pointercancel", onEnd, { passive: true });
    document.addEventListener("pointerleave", onEnd);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("pointercancel", onEnd);
      document.removeEventListener("pointerleave", onEnd);
      clear(current);
    };
  }, []);

  return null;
}
