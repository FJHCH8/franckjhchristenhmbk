"use client";

import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const active = pathname === "/projets";

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = layer?.querySelector("canvas");
    if (!active || !layer || !canvas) return;
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
      if (!reduce.matches) time += dt;
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const reach = Math.hypot(width, height) * 0.72;
      const poleX = width * 0.5;
      const poleY = height * 0.42;
      const spin = reduce.matches ? 0 : time * 0.045;
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
        ctx.globalAlpha = Math.max(0.18, star.alpha * twinkle);
        ctx.fillStyle = star.depth > 0.72 ? "#fff4e4" : "#f4f7ff";
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce.matches && !document.hidden) frame = window.requestAnimationFrame(draw);
    };

    const onOrientation = () => {
      const nextW = Math.round(layer.clientWidth);
      if (Math.abs(nextW - width) < 48) return;
      lockSize();
    };

    const onVisibility = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (document.hidden || reduce.matches) return;
      last = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    let boot = 0;
    lockSize();
    if (layer.clientHeight < 2) {
      boot = window.requestAnimationFrame(() => {
        stars = [];
        width = 1;
        height = 1;
        lockSize();
      });
    }
    last = performance.now();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.cancelAnimationFrame(boot);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={layerRef} className="projets-sky" aria-hidden="true">
      <canvas />
    </div>
  );
}
