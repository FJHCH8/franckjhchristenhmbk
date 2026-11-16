"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  phase: number;
  tw: number;
  tone: number;
};

function createStars(width: number, height: number, density = 1) {
  const count = Math.round(Math.min(2600, Math.max(720, (width * height) / 360)) * density);
  const stars: Star[] = [];
  for (let index = 0; index < count; index += 1) {
    const depth = Math.random();
    const fine = depth < 0.88;
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: fine ? 0.32 + Math.random() * 0.55 : 1 + Math.random() * 1.05,
      a: fine ? 0.35 + depth * 0.5 : 0.78 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      tw: depth > 0.62 ? 0.25 + Math.random() * 0.45 : 0,
      tone: Math.random(),
    });
  }
  return stars;
}

export function ProjetsSky() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = layer?.querySelector("canvas");
    if (!layer || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    const ctx = context;

    let width = 1;
    let height = 1;
    let stars: Star[] = [];
    let milky: HTMLImageElement | null = null;
    let time = 0;
    let last = performance.now();
    let frame = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -9999, y: -9999, life: 0, hot: false };

    const playing = () => {
      const page = document.documentElement.dataset.page;
      return (page === "etoile" || page === "qui-suis-je" || page === "a-propos" || page === "contact" || page === "projets") && !document.hidden;
    };

    const lockSize = () => {
      const nextW = Math.max(1, Math.round(layer.clientWidth));
      const nextH = Math.max(1, Math.round(layer.clientHeight));
      if (nextW === width && nextH === height && stars.length) return;
      const rebuild = stars.length === 0;
      width = nextW;
      height = nextH;
      const lite = document.documentElement.dataset.power === "lite";
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuild) stars = createStars(width, height, lite ? 0.55 : 1);
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce.matches && playing()) time += dt;
      if (!pointer.hot) pointer.life *= 0.94;
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      if (milky) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(milky, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }
      const drift = reduce.matches ? 0 : time * 1.1;
      for (const star of stars) {
        const x = ((star.x * width + drift * (0.12 + star.r * 0.04)) % (width + 6) + width + 6) % (width + 6) - 3;
        const y = star.y * height;
        const twinkle = !reduce.matches && star.tw ? 0.82 + 0.18 * Math.sin(time * star.tw + star.phase) : 1;
        ctx.globalAlpha = Math.min(1, star.a * twinkle);
        ctx.fillStyle = star.tone < 0.14 ? "#c5d4ff" : star.tone > 0.88 ? "#ffe4c4" : "#f5f7ff";
        if (star.r < 0.9) ctx.fillRect(x, y, star.r, star.r);
        else {
          ctx.beginPath();
          ctx.arc(x, y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduce.matches && pointer.life > 0.04) {
        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 150);
        glow.addColorStop(0, `rgba(255, 252, 245, ${0.14 * pointer.life})`);
        glow.addColorStop(1, "rgba(255, 252, 245, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 150, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const alive = playing() && !reduce.matches;
      const fading = pointer.life > 0.04;
      if (alive || fading) frame = window.requestAnimationFrame(draw);
      else frame = 0;
    };

    const wake = () => {
      if (frame || document.hidden) return;
      if (!playing() && pointer.life <= 0.04) return;
      last = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    const placePointer = (event: PointerEvent) => {
      if (reduce.matches || document.documentElement.dataset.page !== "etoile") return;
      const rect = layer.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.life = 1;
      pointer.hot = true;
      wake();
    };

    const releasePointer = () => {
      pointer.hot = false;
      wake();
    };

    const onOrientation = () => {
      const nextW = Math.round(layer.clientWidth);
      if (Math.abs(nextW - width) < 48) return;
      lockSize();
      wake();
    };

    const onPage = () => {
      if (!playing()) {
        pointer.hot = false;
        pointer.life = 0;
        return;
      }
      wake();
    };

    let boot = 0;
    const picture = new Image();
    picture.decoding = "async";
    picture.onload = () => {
      milky = picture;
      wake();
    };
    picture.src = "/ciel/voie-organique.webp";
    lockSize();
    if (layer.clientHeight < 2) {
      boot = window.requestAnimationFrame(() => {
        stars = [];
        width = 1;
        height = 1;
        lockSize();
        wake();
      });
    }
    wake();
    const pageObserver = new MutationObserver(onPage);
    pageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-page"] });
    window.addEventListener("pointermove", placePointer, { passive: true });
    window.addEventListener("pointerdown", placePointer, { passive: true });
    window.addEventListener("pointerup", releasePointer, { passive: true });
    window.addEventListener("pointercancel", releasePointer, { passive: true });
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onPage);
    return () => {
      picture.onload = null;
      window.cancelAnimationFrame(boot);
      window.cancelAnimationFrame(frame);
      pageObserver.disconnect();
      window.removeEventListener("pointermove", placePointer);
      window.removeEventListener("pointerdown", placePointer);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onPage);
    };
  }, []);

  return (
    <div ref={layerRef} className="projets-sky" aria-hidden="true">
      <canvas />
    </div>
  );
}
