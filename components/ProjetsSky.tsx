"use client";

import { useEffect, useRef } from "react";

type Star = {
  radius: number;
  angle: number;
  size: number;
  alpha: number;
  phase: number;
  depth: number;
};

function createStars(width: number, height: number) {
  const count = Math.round(Math.min(420, Math.max(160, (width * height) / 9000)));
  const stars: Star[] = [];
  for (let index = 0; index < count; index += 1) {
    const depth = Math.random();
    stars.push({
      radius: Math.pow(Math.random(), 0.72),
      angle: Math.random() * Math.PI * 2,
      size: 0.4 + depth * 1.35,
      alpha: 0.25 + depth * 0.75,
      phase: Math.random() * Math.PI * 2,
      depth,
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
    let time = 0;
    let last = performance.now();
    let frame = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -9999, y: -9999, life: 0, hot: false };

    const playing = () => {
      const page = document.documentElement.dataset.page;
      return (page === "etoile" || page === "qui-suis-je") && !document.hidden;
    };

    const lockSize = () => {
      const nextW = Math.max(1, Math.round(layer.clientWidth));
      const nextH = Math.max(1, Math.round(layer.clientHeight));
      if (nextW === width && nextH === height && stars.length) return;
      const rebuild = stars.length === 0;
      width = nextW;
      height = nextH;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuild) stars = createStars(width, height);
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
      const reach = Math.hypot(width, height) * 0.72;
      const poleX = width * 0.5;
      const poleY = height * 0.42;
      const spin = reduce.matches ? 0 : time * 0.045;
      const ring = 36 + (1 - pointer.life) * 120;
      for (const star of stars) {
        const angle = star.angle + spin * (0.9 + star.depth * 0.1);
        const orbit = 18 + star.radius * reach;
        const x = poleX + Math.cos(angle) * orbit;
        const y = poleY + Math.sin(angle) * orbit * 0.92;
        if (x < -8 || y < -8 || x > width + 8 || y > height + 8) continue;
        const twinkle = reduce.matches
          ? 1
          : 0.62 +
            0.38 *
              Math.sin(time * (0.55 + star.depth * 0.35) + star.phase) *
              Math.sin(time * 0.17 + star.phase * 1.7);
        let boost = 0;
        if (!reduce.matches && pointer.life > 0.03) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          const near = Math.max(0, 1 - distance / 170);
          const ripple = Math.max(0, 1 - Math.abs(distance - ring) / 26);
          boost = pointer.life * (near * 0.62 + ripple * 0.4);
        }
        ctx.globalAlpha = Math.min(1, Math.max(0.18, star.alpha * twinkle) + boost);
        ctx.fillStyle = star.depth > 0.72 ? "#fff4e4" : "#f4f7ff";
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
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
