"use client";

import { useEffect, useRef } from "react";
import { Album } from "@/components/Album";
import { InfoNote } from "@/components/InfoNote";
import { Block } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { DropsMark } from "@/components/TitleMarks";

const BIO =
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France. Je suis né différent, avec le syndrome du THPI. Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder. Depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment. Ce site, il sert à quoi ? À publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymath au quotidien.";

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) {
  const puffs = [
    { x: -86, y: 16, rx: 78, ry: 40, p: 0.2 },
    { x: -28, y: -18, rx: 96, ry: 54, p: 1.1 },
    { x: 42, y: -6, rx: 88, ry: 48, p: 2.2 },
    { x: 96, y: 18, rx: 70, ry: 36, p: 3.1 },
    { x: 8, y: 22, rx: 120, ry: 34, p: 0.6 },
  ];
  ctx.save();
  ctx.translate(cx, cy);
  for (const puff of puffs) {
    const breathe = 1 + Math.sin(time * 0.33 + puff.p) * 0.07 + Math.sin(time * 0.17 + puff.p * 1.7) * 0.04;
    const rx = puff.rx * breathe;
    const ry = puff.ry * (2 - breathe * 0.92);
    const ox = puff.x + Math.sin(time * 0.21 + puff.p) * 3.5;
    const oy = puff.y + Math.cos(time * 0.19 + puff.p) * 2.2;
    const shade = ctx.createRadialGradient(ox - rx * 0.2, oy + ry * 0.35, rx * 0.1, ox, oy, rx);
    shade.addColorStop(0, "rgba(120, 48, 28, 0.28)");
    shade.addColorStop(1, "rgba(120, 48, 28, 0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(ox, oy + ry * 0.28, rx, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    const body = ctx.createRadialGradient(ox - rx * 0.25, oy - ry * 0.3, rx * 0.05, ox, oy, Math.max(rx, ry));
    body.addColorStop(0, "rgba(255, 236, 214, 0.9)");
    body.addColorStop(0.45, "rgba(255, 214, 176, 0.62)");
    body.addColorStop(1, "rgba(255, 160, 96, 0)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const twinkle = 0.62 + 0.38 * Math.sin(time * 2.4) * Math.sin(time * 0.7 + 0.6);
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
  glow.addColorStop(0, `rgba(255, 236, 210, ${0.8 * twinkle})`);
  glow.addColorStop(0.22, `rgba(255, 186, 120, ${0.28 * twinkle})`);
  glow.addColorStop(1, "rgba(255, 186, 120, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.75 + 0.25 * twinkle;
  ctx.fillStyle = "#fff6ea";
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(1.4, -1.4, 13, 0);
  ctx.quadraticCurveTo(1.4, 1.4, 0, 13);
  ctx.quadraticCurveTo(-1.4, 1.4, -13, 0);
  ctx.quadraticCurveTo(-1.4, -1.4, 0, -13);
  ctx.fill();
  ctx.restore();
}

function paintSky(ctx: CanvasRenderingContext2D, w: number, horizon: number, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#000000");
  sky.addColorStop(0.38, "#120306");
  sky.addColorStop(0.66, "#6a140c");
  sky.addColorStop(0.84, "#c24112");
  sky.addColorStop(1, "#f0a15a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 2);
  const pulse = 0.86 + 0.14 * Math.sin(time * 0.21) * Math.sin(time * 0.053 + 1.2);
  const glow = ctx.createRadialGradient(w * 0.5, horizon + 6, 8, w * 0.5, horizon * 0.92, w * 0.58);
  glow.addColorStop(0, `rgba(255, 176, 92, ${0.5 * pulse})`);
  glow.addColorStop(0.38, `rgba(180, 42, 16, ${0.22 * pulse})`);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon + 2);
}

function paintSea(ctx: CanvasRenderingContext2D, w: number, h: number, horizon: number, time: number) {
  const water = ctx.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, "#1a3e68");
  water.addColorStop(0.16, "#0d2748");
  water.addColorStop(0.52, "#071833");
  water.addColorStop(1, "#040c1c");
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon - 6, w, h - horizon + 8);

  const bands = 7;
  for (let band = 0; band < bands; band += 1) {
    const depth = band / bands;
    const y0 = horizon + 10 + depth * (h - horizon) * 0.72;
    const amp = 5 + depth * 11;
    const freq = 0.0065 - depth * 0.002;
    const speed = 0.55 + depth * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) {
      const swell = Math.sin(x * freq + time * speed + band) * amp;
      const chop = Math.sin(x * freq * 2.4 - time * (0.9 + depth) + band * 1.7) * amp * 0.38;
      ctx.lineTo(x, y0 + swell + chop);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    const alpha = 0.045 + depth * 0.05;
    ctx.fillStyle = `rgba(148, 186, 214, ${alpha})`;
    ctx.fill();
  }

  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const y =
      horizon +
      Math.sin(x * 0.012 + time * 0.8) * 7 +
      Math.sin(x * 0.027 - time * 1.25) * 3.2 +
      Math.sin(x * 0.008 + time * 0.35) * 5;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(240, 168, 96, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawReflection(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  centerX: number,
  top: number,
  width: number,
  height: number,
  time: number,
  night: number,
) {
  const rows = Math.max(1, source.height);
  for (let row = 0; row < rows; row += 1) {
    const fade = Math.max(0, 1 - row / rows);
    const wobble =
      Math.sin(row * 0.22 + time * 1.6) * (2.2 + row * 0.045) + Math.sin(row * 0.09 - time * 0.85) * 1.6;
    ctx.globalAlpha = fade * fade * mix(0.42, 0.3, night);
    ctx.drawImage(source, 0, row, source.width, 1, centerX - width / 2 + wobble, top + row, width, 1.6);
  }
  ctx.globalAlpha = 1;
}

export function QuiScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const title = titleRef.current;
    if (!canvas || !title) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d");
    if (!textCtx) return;

    let time = 0;
    let last = performance.now();
    let frame = 0;
    let paintedH = 0;
    let paintedLabel = "";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;

    const paintTitle = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const style = getComputedStyle(title);
      const visual = parseFloat(title.style.getPropertyValue("--visual")) || parseFloat(style.fontSize);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(title.getBoundingClientRect().height * dpr));
      textCanvas.width = width;
      textCanvas.height = height;
      textCtx.setTransform(1, 0, 0, 1, 0, 0);
      textCtx.clearRect(0, 0, width, height);
      textCtx.font = `${style.fontWeight} ${visual * dpr}px ${style.fontFamily}`;
      textCtx.fillStyle = "#fff6ea";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      const label = title.textContent?.replace(/\s+/g, " ").trim() || "Qui suis-je";
      textCtx.fillText(label, width / 2, height / 2);
      paintedH = title.getBoundingClientRect().height;
      paintedLabel = label;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintTitle();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce.matches) time += dt;

      const box = title.getBoundingClientRect();
      const label = title.textContent?.replace(/\s+/g, " ").trim() || "";
      if (Math.abs(box.height - paintedH) > 0.6 || label !== paintedLabel) paintTitle();

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const horizon = h * 0.47;
      ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
      ctx.clearRect(0, 0, w, h);
      paintSky(ctx, w, horizon, time);
      drawCloud(ctx, w * 0.24, horizon * 0.28, time);
      drawStar(ctx, w * 0.8, h * 0.09, time);
      paintSea(ctx, w, h, horizon, time);

      const titleBottom = box.bottom - rect.top;
      const gap = Math.max(10, horizon - titleBottom);
      drawReflection(ctx, textCanvas, w / 2, horizon + gap * 0.35, box.width, box.height, time, 0);
      if (!document.hidden) frame = window.requestAnimationFrame(tick);
    };

    resize();
    const titleObserver = new MutationObserver(() => {
      if (alive) paintTitle();
    });
    titleObserver.observe(title, { childList: true, characterData: true, subtree: true });
    document.fonts?.ready.then(() => {
      if (alive) resize();
    }).catch(() => undefined);
    frame = window.requestAnimationFrame(tick);
    const onVisibility = () => {
      window.cancelAnimationFrame(frame);
      if (document.hidden) return;
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      titleObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <section className="qui-sea" aria-labelledby="titre-qui">
        <canvas ref={canvasRef} aria-hidden="true" />
        <ScrollTitle id="titre-qui" text="Qui suis-je" titleRef={titleRef} tone="sea" icon={<DropsMark />} max={5.4} min={2.15} />
      </section>
      <section className="qui-follow scroll-reveal">
        <Album />
        <div className="qui-note">
          <p>
            <Block lines={["100%", "98%", "96%", "94%", "90%", "84%", "62%"]}>{BIO}</Block>
          </p>
        </div>
        <InfoNote />
      </section>
    </>
  );
}
