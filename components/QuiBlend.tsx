"use client";

import { useEffect } from "react";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function measure(height: string) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;left:0;top:0;height:${height};width:0;visibility:hidden;pointer-events:none`;
  document.body.appendChild(probe);
  const value = probe.offsetHeight;
  probe.remove();
  return value;
}

function stableRange() {
  const span = measure("72lvh") || window.innerHeight * 0.72;
  const room = Math.max(1, document.documentElement.scrollHeight - (measure("100lvh") || window.innerHeight));
  return Math.max(240, Math.min(span, room));
}

export function QuiBlend() {
  useEffect(() => {
    const field = document.querySelector(".skin-field, .photo-field");
    const sky = document.querySelector(".projets-sky");
    const sharp = field?.querySelector<HTMLElement>(".skin-sharp");
    const mid = field?.querySelector<HTMLElement>(".skin-mid");
    const far = field?.querySelector<HTMLElement>(".skin-far");
    if (!(field instanceof HTMLElement) || !(sky instanceof HTMLElement) || !sharp || !mid || !far) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Scroll-timeline on the fixed photo locks or crashes WebKit, including iPhone.
    // The scroll listener below keeps the same fade without taking over the gesture.
    const driven = false;
    let frame = 0;
    let alive = true;
    let shown = 0;
    let last = performance.now();
    let range = stableRange();
    let width = window.innerWidth;
    let night = false;
    let lastWrite = "";

    const write = (progress: number) => {
      const lite = document.documentElement.dataset.power === "lite" || reduce.matches;
      const blur = clamp(progress / 0.78);
      const sharpV = lite ? 1 : 1 - clamp((blur - 0.02) / 0.48);
      const midV = lite ? 0 : clamp((blur - 0.08) / 0.36) * (1 - clamp((blur - 0.52) / 0.34));
      const farV = lite ? 0 : clamp((blur - 0.4) / 0.42);
      const veil = 1 - clamp((progress - 0.22) / 0.78);
      const stars = clamp((progress - 0.08) / 0.8);
      const zoom = lite ? 1 : 1 + blur * 0.07;
      const key = `${sharpV.toFixed(3)}|${midV.toFixed(3)}|${farV.toFixed(3)}|${veil.toFixed(3)}|${stars.toFixed(3)}|${zoom.toFixed(4)}`;
      if (key === lastWrite) return;
      lastWrite = key;
      sharp.style.opacity = sharpV.toFixed(3);
      mid.style.opacity = midV.toFixed(3);
      far.style.opacity = farV.toFixed(3);
      field.style.opacity = veil.toFixed(3);
      field.style.setProperty("--qui-zoom", zoom.toFixed(4));
      sky.style.opacity = stars.toFixed(3);
      const nextNight = progress > 0.62;
      if (nextNight !== night) {
        night = nextNight;
        document.documentElement.classList.toggle("qui-night", night);
      }
    };

    const tick = (now: number) => {
      if (!alive || document.hidden) {
        frame = 0;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = clamp(window.scrollY / range);
      if (reduce.matches) shown = target;
      else {
        const follow = 1 - Math.exp(-dt / 0.09);
        shown += (target - shown) * follow;
        if (Math.abs(target - shown) < 0.0006) shown = target;
      }
      write(shown);
      if (shown !== target) frame = window.requestAnimationFrame(tick);
      else frame = 0;
    };

    const wake = () => {
      if (frame || document.hidden || driven) return;
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    };

    const onOrientation = () => {
      if (Math.abs(window.innerWidth - width) < 48) return;
      width = window.innerWidth;
      range = stableRange();
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      wake();
    };

    const syncNight = () => {
      const progress = clamp(window.scrollY / range);
      const next = progress > 0.62;
      if (next === night) return;
      night = next;
      document.documentElement.classList.toggle("qui-night", night);
    };

    const boot = async () => {
      const images = [...field.querySelectorAll("img")];
      await Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => undefined) : Promise.resolve())));
      if (!alive) return;
      field.classList.add("is-ready");
      syncNight();
      if (driven) {
        document.documentElement.classList.add("qui-driven");
        return;
      }
      shown = clamp(window.scrollY / range);
      write(shown);
      wake();
    };

    const note = document.querySelector(".qui-note");
    const lines = [...document.querySelectorAll<HTMLElement>(".qui-line")];
    if (reduce.matches) {
      note?.classList.add("is-shown");
      lines.forEach((line) => line.classList.add("is-in"));
    }
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add(entry.target.classList.contains("qui-line") ? "is-in" : "is-shown");
          reveal.unobserve(entry.target);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );
    if (note) reveal.observe(note);
    if (!reduce.matches) lines.forEach((line) => reveal.observe(line));

    void boot();
    window.addEventListener("scroll", syncNight, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncNight);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      sky.style.opacity = "";
      field.style.opacity = "";
      field.style.removeProperty("--qui-zoom");
      sharp.style.opacity = "";
      mid.style.opacity = "";
      far.style.opacity = "";
      document.documentElement.classList.remove("qui-driven", "qui-night");
      reveal.disconnect();
    };
  }, []);

  return null;
}
