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
  const reach = Math.hypot(width, height) * 0.72;
  for (let index = 0; index < count; index += 1) {
    const depth = Math.random();
    stars.push({
      radius: 18 + Math.pow(Math.random(), 0.72) * reach,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    let stars = createStars(1, 1);
    let width = 1;
    let height = 1;
    let time = 0;
    let last = performance.now();
    let frame = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = createStars(width, height);
    };

    const drawMoon = () => {
      const x = width * 0.82;
      const y = height * 0.3;
      const radius = Math.min(width, height) * 0.075;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#f4f1e8";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(radius * 0.42, -radius * 0.08, radius * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce.matches) time += dt;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const poleX = width * 0.5;
      const poleY = height * 0.46;
      const spin = reduce.matches ? 0 : time * 0.045;
      for (const star of stars) {
        const angle = star.angle + spin * (0.82 + star.depth * 0.18);
        const x = poleX + Math.cos(angle) * star.radius;
        const y = poleY + Math.sin(angle) * star.radius * 0.92;
        if (x < -8 || y < -8 || x > width + 8 || y > height + 8) continue;
        const twinkle = reduce.matches ? 1 : 0.55 + 0.45 * Math.sin(time * (0.8 + star.depth) + star.phase);
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = "#f7f8ff";
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawMoon();
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="projets-sky" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
