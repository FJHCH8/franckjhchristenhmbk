"use client";

import { useEffect, useRef, useState } from "react";
import { createGalaxie } from "@/lib/galaxie";

type Star = {
  radius: number;
  angle: number;
  size: number;
  alpha: number;
  phase: number;
  depth: number;
};

function createStars(width: number, height: number, density = 1) {
  const count = Math.round(Math.min(420, Math.max(70, (width * height) / 9000)) * density);
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

/** Ancien ciel en 2D : utilisé seulement si WebGL n'est pas disponible. */
function ciel2d(layer: HTMLDivElement, canvas: HTMLCanvasElement): (() => void) | undefined {
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
      if (rebuild) stars = createStars(width, height, lite ? 0.38 : 1);
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
          : 0.62 + 0.38 * Math.sin(time * (0.55 + star.depth * 0.35) + star.phase) * Math.sin(time * 0.17 + star.phase * 1.7);
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
}

export function ProjetsSky() {
  const layerRef = useRef<HTMLDivElement>(null);
  const [vivant, setVivant] = useState(0);

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = layer?.querySelector("canvas");
    if (!layer || !canvas) return;
    const lite = document.documentElement.dataset.power === "lite";
    const galaxie = createGalaxie(canvas, lite);
    if (!galaxie) return ciel2d(layer, canvas);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Un départ différent à chaque visite : la galaxie n'a jamais la même allure.
    let time = 400 + Math.random() * 4000;
    let last = performance.now();
    let frame = 0;
    let width = 0;
    let height = 0;
    let scrollDrift = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, life: 0, target: 0 };
    // Sur téléphone, 30 images par seconde suffisent au ciel et laissent le défilement fluide.
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    // Le ciel évolue lentement : 24 images par seconde suffisent, et soulagent tout le reste
    // (chaque surface en verre dépoli refait son flou à chaque image du ciel).
    const minStep = lite || touch ? 1000 / 12 : 1000 / 24;
    // Pendant le défilement, le ciel se fige : tout le calcul va au défilement.
    let figeJusqua = 0;
    const onDefile = () => {
      figeJusqua = performance.now() + 220;
    };
    window.addEventListener("scroll", onDefile, { passive: true });
    let lastDraw = 0;
    let checks = 0;
    let visible = true;

    const size = () => {
      const w = Math.max(1, layer.clientWidth);
      const h = Math.max(1, layer.clientHeight);
      if (Math.abs(w - width) < 2 && Math.abs(h - height) < 2) return;
      width = w;
      height = h;
      const dpr = Math.min(window.devicePixelRatio || 1, lite || touch ? 0.5 : 0.85);
      galaxie.resize(w, h, dpr);
    };

    const paint = (now: number) => {
      frame = 0;
      if (now - lastDraw < minStep || now < figeJusqua) {
        frame = window.requestAnimationFrame(paint);
        return;
      }
      lastDraw = now;
      // Quand une photo recouvre entièrement le ciel, inutile de le dessiner.
      if (checks++ % 20 === 0) visible = Number(getComputedStyle(layer).opacity) > 0.01;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const still = reduce.matches;
      if (!still) time += dt;
      const target = window.scrollY / Math.max(1, window.innerHeight);
      scrollDrift += (target - scrollDrift) * Math.min(1, dt * 3);
      pointer.life += (pointer.target - pointer.life) * Math.min(1, dt * 2.5);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 6);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 6);
      if (visible) galaxie.render({
        time,
        // Un tour complet en un peu plus d'une heure : à peine perceptible, comme le vrai ciel.
        rot: time * 0.0016,
        driftX: time * 0.0042,
        driftY: scrollDrift * 0.05 + time * 0.0011,
        pointerX: pointer.x,
        pointerY: pointer.y,
        pointer: still ? 0 : pointer.life,
      });
      if (!still && !document.hidden) frame = window.requestAnimationFrame(paint);
    };

    const wake = () => {
      if (frame || document.hidden) return;
      last = performance.now();
      frame = window.requestAnimationFrame(paint);
    };

    const onPointer = (event: PointerEvent) => {
      const h = Math.max(1, height);
      pointer.tx = ((event.clientX - width / 2) / h) * 2;
      pointer.ty = -((event.clientY - h / 2) / h) * 2;
      pointer.target = 1;
      wake();
    };
    const onLeave = () => {
      pointer.target = 0;
    };
    const onResize = () => {
      size();
      wake();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    const onRestored = () => setVivant((value) => value + 1);

    size();
    wake();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("visibilitychange", wake);
    reduce.addEventListener("change", wake);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onDefile);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", wake);
      reduce.removeEventListener("change", wake);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      galaxie.dispose();
    };
  }, [vivant]);

  return (
    <div ref={layerRef} className="projets-sky" aria-hidden="true">
      <canvas key={vivant} />
    </div>
  );
}
