"use client";

import { useEffect, useRef } from "react";
import {
  cloudSize,
  createBodies,
  createSprites,
  projectBody,
  starAlpha,
  starDrawSize,
  type SkyBody,
  type SkyMode,
  type SkySprites,
} from "@/lib/sky";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readMode(): SkyMode {
  return document.documentElement.dataset.theme === "sombre" ? "sombre" : "clair";
}

export function Sky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return;
    const ctx = context;

    let viewW = 1;
    let viewH = 1;
    let sprites: SkySprites = createSprites();
    let clouds: SkyBody[] = [];
    let stars: SkyBody[] = [];
    let mode: SkyMode = readMode();
    let scrollTarget = window.scrollY;
    let scroll = window.scrollY;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    let time = 0;
    let last = performance.now();
    let raf = 0;
    let running = true;
    let reduce = prefersReducedMotion();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewW = Math.max(1, rect.width);
      viewH = Math.max(1, rect.height);
      const narrow = viewW < 760;
      const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.6);
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bodies = createBodies(viewW);
      clouds = bodies.clouds;
      stars = bodies.stars;
    };

    const farShift = (depth: number, scrollMotion: number, pointerMotion: number) => {
      const speed = (0.055 + depth * 1.2) * scrollMotion;
      return {
        x: pointer.x * (12 + depth * 20) * pointerMotion,
        y: -scroll * speed + pointer.y * 10 * pointerMotion,
      };
    };

    const drawSun = (scrollMotion: number, pointerMotion: number) => {
      const shift = farShift(0.04, scrollMotion, pointerMotion);
      const size = Math.min(viewW * 0.72, 640);
      ctx.globalAlpha = 1;
      ctx.drawImage(sprites.sun, viewW * 0.58 - size * 0.28 + shift.x, viewH * 0.02 + shift.y, size, size);
    };

    const drawGalaxy = (scrollMotion: number, pointerMotion: number) => {
      const shift = farShift(0.03, scrollMotion, pointerMotion);
      const bandW = Math.max(viewW * 1.45, 900);
      const bandH = bandW * (420 / 1400);
      ctx.save();
      ctx.translate(viewW * 0.5 + shift.x, viewH * 0.4 + shift.y);
      ctx.rotate(-0.42);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(sprites.galaxy, -bandW / 2, -bandH / 2, bandW, bandH);
      ctx.restore();
    };

    const drawMoon = (scrollMotion: number, pointerMotion: number) => {
      const shift = farShift(0.1, scrollMotion, pointerMotion);
      const moon = Math.min(viewW * 0.48, 460);
      ctx.globalAlpha = 1;
      ctx.drawImage(sprites.moon, viewW * 0.72 + shift.x, viewH * 0.08 + shift.y, moon, moon);
    };

    const drawCloud = (body: SkyBody, scrollMotion: number, pointerMotion: number, ambient: number) => {
      const point = projectBody(
        body,
        viewW,
        viewH,
        scroll,
        pointer.x,
        pointer.y,
        time,
        scrollMotion,
        pointerMotion,
        ambient,
      );
      const size = cloudSize(body, viewW);
      if (point.y < -size.height || point.y > viewH + size.height * 0.2) return;
      const sprite = body.depth < 0.35 ? sprites.hazes[body.sprite] : sprites.clouds[body.sprite];
      if (!sprite) return;
      ctx.globalAlpha = body.alpha * (0.4 + body.depth * 0.6);
      ctx.drawImage(sprite, point.x - size.width * 0.5, point.y - size.height * 0.58, size.width, size.height);
    };

    const drawStar = (body: SkyBody, scrollMotion: number, pointerMotion: number, ambient: number) => {
      const point = projectBody(
        body,
        viewW,
        viewH,
        scroll,
        pointer.x,
        pointer.y,
        time,
        scrollMotion,
        pointerMotion,
        ambient,
      );
      const size = starDrawSize(body, viewW);
      if (point.y < -size || point.y > viewH + size || point.x < -size || point.x > viewW + size) return;
      const alpha = starAlpha(body, time, ambient) * (0.62 + body.depth * 0.38);
      ctx.globalAlpha = alpha;
      if (body.depth < 0.2 && body.sprite === 0) {
        ctx.fillStyle = "#f7f8ff";
        const dot = Math.max(1, size * 0.16);
        ctx.fillRect(point.x, point.y, dot, dot);
        return;
      }
      const sheet = body.sprite === 2 ? sprites.spark : body.phase < 0.55 ? sprites.glowWarm : sprites.glow;
      ctx.drawImage(sheet, point.x - size * 0.5, point.y - size * 0.5, size, size);
    };

    const draw = () => {
      const scrollMotion = reduce ? 0.28 : 1;
      const pointerMotion = reduce ? 0 : 1;
      const ambient = reduce ? 0 : 1;
      ctx.clearRect(0, 0, viewW, viewH);
      ctx.globalAlpha = 1;
      if (mode === "clair") {
        drawSun(scrollMotion, pointerMotion);
        for (const cloud of clouds) drawCloud(cloud, scrollMotion, pointerMotion, ambient);
      } else {
        drawGalaxy(scrollMotion, pointerMotion);
        let moonDrawn = false;
        for (const star of stars) {
          if (!moonDrawn && star.depth >= 0.14) {
            drawMoon(scrollMotion, pointerMotion);
            moonDrawn = true;
          }
          drawStar(star, scrollMotion, pointerMotion, ambient);
        }
        if (!moonDrawn) drawMoon(scrollMotion, pointerMotion);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) time += dt;
      const follow = reduce ? 1 : 0.16;
      scroll += (scrollTarget - scroll) * follow;
      pointer.x += (pointerTarget.x - pointer.x) * (reduce ? 1 : 0.065);
      pointer.y += (pointerTarget.y - pointer.y) * (reduce ? 1 : 0.065);
      if (Math.abs(scrollTarget - scroll) < 0.15) scroll = scrollTarget;
      draw();
      const settled =
        reduce &&
        scroll === scrollTarget &&
        Math.abs(pointer.x - pointerTarget.x) < 0.001 &&
        Math.abs(pointer.y - pointerTarget.y) < 0.001;
      if (settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (document.hidden) return;
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      scrollTarget = window.scrollY;
      wake();
    };

    const onPointer = (event: PointerEvent) => {
      if (reduce) return;
      pointerTarget.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
      pointerTarget.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
      wake();
    };

    const releasePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
        wake();
      }
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
        wake();
      }
    };

    const syncMode = () => {
      mode = readMode();
      draw();
      wake();
    };

    const onMotion = (event: MediaQueryListEvent) => {
      reduce = event.matches;
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      wake();
    };

    resize();
    draw();
    raf = requestAnimationFrame(tick);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const themeObserver = new MutationObserver(syncMode);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerup", releasePointer, { passive: true });
    window.addEventListener("pointercancel", releasePointer, { passive: true });
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("themechange", syncMode);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotion);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("themechange", syncMode);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotion);
      sprites = undefined as unknown as SkySprites;
    };
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-gradient" />
      <canvas ref={canvasRef} />
      <div className="sky-vignette" />
    </div>
  );
}
