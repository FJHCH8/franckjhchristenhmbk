"use client";

import { useEffect } from "react";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function QuiBlend() {
  useEffect(() => {
    const field = document.querySelector(".skin-field");
    const sky = document.querySelector(".projets-sky");
    if (!(field instanceof HTMLElement) || !(sky instanceof HTMLElement)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let range = Math.max(320, field.clientHeight * 0.7);
    let width = field.clientWidth;

    const apply = () => {
      frame = 0;
      const progress = clamp(window.scrollY / range);
      if (reduce.matches) {
        field.style.setProperty("--qui-sharp", "1");
        field.style.setProperty("--qui-mid", "0");
        field.style.setProperty("--qui-far", "0");
        field.style.setProperty("--qui-zoom", "1");
        field.style.opacity = (1 - progress).toFixed(3);
        sky.style.opacity = progress.toFixed(3);
        return;
      }
      const blur = clamp(progress / 0.78);
      const sharp = 1 - clamp((blur - 0.02) / 0.48);
      const mid = clamp((blur - 0.08) / 0.36) * (1 - clamp((blur - 0.52) / 0.34));
      const far = clamp((blur - 0.4) / 0.42);
      const veil = 1 - clamp((progress - 0.22) / 0.78);
      const stars = clamp((progress - 0.08) / 0.8);
      field.style.setProperty("--qui-sharp", sharp.toFixed(3));
      field.style.setProperty("--qui-mid", mid.toFixed(3));
      field.style.setProperty("--qui-far", far.toFixed(3));
      field.style.setProperty("--qui-zoom", (1 + blur * 0.055).toFixed(4));
      field.style.opacity = veil.toFixed(3);
      sky.style.opacity = stars.toFixed(3);
    };

    const onScroll = () => {
      if (frame || document.hidden) return;
      frame = window.requestAnimationFrame(apply);
    };

    const onOrientation = () => {
      if (Math.abs(field.clientWidth - width) < 48) return;
      width = field.clientWidth;
      range = Math.max(320, field.clientHeight * 0.7);
      onScroll();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      onScroll();
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      sky.style.opacity = "";
      field.style.opacity = "";
    };
  }, []);

  return null;
}
