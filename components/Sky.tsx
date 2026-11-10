"use client";

import { useEffect, useRef, useState } from "react";
import { Aurora, NightStars } from "@/components/NightStars";
import { collectObstacles, createDrop, stepDrop, type Drop, type Obstacle, type Splash } from "@/lib/rain";
import { VISIT_RAINBOW, visitHas, visitSet } from "@/lib/visit";
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

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

type Phase = "idle" | "dissolving" | "hidden" | "reforming";

type CloudFx = {
  phase: Phase;
  at: number;
};

type Hit = {
  index: number;
  x: number;
  y: number;
  rx: number;
  ry: number;
  depth: number;
};

type Weather = {
  phase: "idle" | "raining" | "rainbow" | "reform";
  cloudIndex: number;
  drops: Drop[];
  splashes: Splash[];
  spawnLeft: number;
  spawnAcc: number;
  mark: number;
  originX: number;
  originY: number;
  originW: number;
};

const THEME_MS = 1150;
const RAINBOW_ON = 3400;
const RAINBOW_FADE = 900;
const RAINBOW_BANDS = [
  { r: 346, color: "rgba(196, 52, 52, 0.55)" },
  { r: 339, color: "rgba(214, 118, 46, 0.52)" },
  { r: 332, color: "rgba(214, 186, 72, 0.5)" },
  { r: 325, color: "rgba(78, 164, 96, 0.5)" },
  { r: 318, color: "rgba(62, 132, 198, 0.52)" },
  { r: 311, color: "rgba(98, 90, 186, 0.46)" },
];

function arcPath(radius: number) {
  const cx = 400;
  const cy = 390;
  return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
}

function cloudLook(fx: CloudFx | undefined, now: number) {
  if (!fx || fx.phase === "idle") return { alpha: 1, scale: 1, haze: 0 };
  if (fx.phase === "hidden") return { alpha: 0, scale: 1, haze: 0 };
  const elapsed = now - fx.at;
  if (fx.phase === "dissolving") {
    const t = Math.min(1, elapsed / 680);
    return { alpha: 1 - t * t, scale: 1 + t * 0.12, haze: Math.sin(t * Math.PI) * 0.75 };
  }
  const t = Math.min(1, elapsed / 1680);
  const eased = 1 - Math.pow(1 - t, 3);
  return { alpha: Math.min(1, eased * 1.12), scale: 0.58 + 0.42 * eased, haze: (1 - eased) * 0.9 };
}

function isBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, textarea, select, label, img, .glass, p, h1, h2, blockquote, figcaption, li, dt, dd, .nav, .toggle, .crests, .footer, .night-star",
    ),
  );
}

function Rainbow({ on }: { on: boolean }) {
  return (
    <div className={on ? "rainbow is-on" : "rainbow"} aria-hidden="true">
      <svg viewBox="0 0 800 420" role="presentation">
        {RAINBOW_BANDS.map((band) => (
          <path key={band.r} d={arcPath(band.r)} fill="none" stroke={band.color} strokeWidth="5" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
}

export function Sky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const [rainbowOn, setRainbowOn] = useState(false);
  const [auroraOn, setAuroraOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rainCanvas = rainRef.current;
    if (!canvas || !rainCanvas) return;
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const rainContext = rainCanvas.getContext("2d", { alpha: true });
    if (!context || !rainContext) return;
    const ctx = context;
    const rctx = rainContext;

    let viewW = 1;
    let viewH = 1;
    let sprites: SkySprites = createSprites();
    let clouds: SkyBody[] = [];
    let stars: SkyBody[] = [];
    let cloudFx: CloudFx[] = [];
    let hits: Hit[] = [];
    let mode: SkyMode = readMode();
    let themeMix = mode === "sombre" ? 1 : 0;
    let themeFrom = themeMix;
    let themeTo = themeMix;
    let themeStart = 0;
    let scrollTarget = window.scrollY;
    let scroll = window.scrollY;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    let time = 0;
    let last = performance.now();
    let raf = 0;
    let running = true;
    let reduce = prefersReducedMotion();
    const timers = new Set<number>();
    let weather: Weather = {
      phase: "idle",
      cloudIndex: -1,
      drops: [],
      splashes: [],
      spawnLeft: 0,
      spawnAcc: 0,
      mark: 0,
      originX: 0,
      originY: 0,
      originW: 160,
    };

    const clearSkyCursor = () => {
      if (document.documentElement.dataset.sky) delete document.documentElement.dataset.sky;
    };

    const cancelWeather = () => {
      weather = {
        phase: "idle",
        cloudIndex: -1,
        drops: [],
        splashes: [],
        spawnLeft: 0,
        spawnAcc: 0,
        mark: 0,
        originX: weather.originX,
        originY: weather.originY,
        originW: weather.originW,
      };
      for (const fx of cloudFx) fx.phase = "idle";
      setRainbowOn(false);
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      rctx.clearRect(0, 0, viewW, viewH);
    };

    const resizeCanvas = (node: HTMLCanvasElement, nodeCtx: CanvasRenderingContext2D) => {
      const narrow = viewW < 760;
      const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.6);
      node.width = Math.round(viewW * dpr);
      node.height = Math.round(viewH * dpr);
      nodeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let builtW = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const widthShift = Math.abs(nextW - viewW);
      const heightShift = Math.abs(nextH - viewH);
      if (builtW > 0 && widthShift < 2 && heightShift < 72) return;
      const rebuild = builtW === 0 || widthShift >= 2;
      viewW = nextW;
      viewH = nextH;
      resizeCanvas(canvas, ctx);
      resizeCanvas(rainCanvas, rctx);
      if (rebuild) {
        builtW = nextW;
        const bodies = createBodies(viewW);
        clouds = bodies.clouds;
        stars = bodies.stars;
        cloudFx = clouds.map(() => ({ phase: "idle", at: 0 }));
        if (weather.phase !== "idle") cancelWeather();
      }
      draw();
    };

    const farShift = (depth: number, scrollMotion: number, pointerMotion: number) => {
      const speed = (0.055 + depth * 1.2) * scrollMotion;
      return {
        x: pointer.x * (12 + depth * 20) * pointerMotion,
        y: -scroll * speed + pointer.y * 10 * pointerMotion,
      };
    };

    const drawSun = (scrollMotion: number, pointerMotion: number, veil: number) => {
      const shift = farShift(0.04, scrollMotion, pointerMotion);
      const size = Math.min(viewW * 0.72, 640);
      ctx.globalAlpha = veil;
      ctx.drawImage(sprites.sun, viewW * 0.58 - size * 0.28 + shift.x, viewH * 0.02 + shift.y, size, size);
    };

    const drawGalaxy = (scrollMotion: number, pointerMotion: number, veil: number) => {
      const shift = farShift(0.03, scrollMotion, pointerMotion);
      const bandW = Math.max(viewW * 1.45, 900);
      const bandH = bandW * (420 / 1400);
      ctx.save();
      ctx.translate(viewW * 0.5 + shift.x, viewH * 0.4 + shift.y);
      ctx.rotate(-0.42);
      ctx.globalAlpha = 0.95 * veil;
      ctx.drawImage(sprites.galaxy, -bandW / 2, -bandH / 2, bandW, bandH);
      ctx.restore();
    };

    const drawMoon = (scrollMotion: number, pointerMotion: number, veil: number) => {
      const shift = farShift(0.1, scrollMotion, pointerMotion);
      const moon = Math.min(viewW * 0.48, 460);
      ctx.globalAlpha = veil;
      ctx.drawImage(sprites.moon, viewW * 0.72 + shift.x, viewH * 0.08 + shift.y, moon, moon);
    };

    const drawCloud = (
      body: SkyBody,
      index: number,
      scrollMotion: number,
      pointerMotion: number,
      ambient: number,
      veil: number,
      now: number,
    ) => {
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
      const fx = cloudFx[index];
      const look = cloudLook(fx, now);
      if (point.y < -size.height || point.y > viewH + size.height * 0.2) return;
      if (look.alpha <= 0.01 && look.haze <= 0.01) return;
      const cx = point.x;
      const cy = point.y - size.height * 0.08;
      const dw = size.width * look.scale;
      const dh = size.height * look.scale;
      const dx = cx - dw * 0.5;
      const dy = cy - dh * 0.5;
      if (look.haze > 0.02) {
        const haze = sprites.hazes[body.sprite];
        if (haze) {
          ctx.globalAlpha = look.haze * veil;
          ctx.drawImage(haze, dx, dy, dw, dh);
        }
      }
      if (look.alpha > 0.02) {
        const sprite = body.depth < 0.35 ? sprites.hazes[body.sprite] : sprites.clouds[body.sprite];
        if (!sprite) return;
        ctx.globalAlpha = body.alpha * (0.4 + body.depth * 0.6) * look.alpha * veil;
        ctx.drawImage(sprite, dx, dy, dw, dh);
      }
      if (weather.cloudIndex === index && (fx?.phase === "dissolving" || fx?.phase === "idle")) {
        weather.originX = cx;
        weather.originY = cy + size.height * 0.22;
        weather.originW = size.width * 0.72;
      }
      if (
        veil > 0.55 &&
        themeMix < 0.45 &&
        fx?.phase === "idle" &&
        body.depth >= 0.35 &&
        size.width > 110 &&
        point.x > -40 &&
        point.x < viewW + 40
      ) {
        hits.push({
          index,
          x: cx,
          y: cy,
          rx: size.width * 0.34,
          ry: size.height * 0.27,
          depth: body.depth,
        });
      }
    };

    const drawStar = (body: SkyBody, scrollMotion: number, pointerMotion: number, ambient: number, veil: number) => {
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
      const alpha = starAlpha(body, time, ambient) * (0.62 + body.depth * 0.38) * veil;
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

    const drawScene = (scene: SkyMode, veil: number, scrollMotion: number, pointerMotion: number, ambient: number, now: number) => {
      if (veil <= 0.001) return;
      if (scene === "clair") {
        drawSun(scrollMotion, pointerMotion, veil);
        clouds.forEach((cloud, index) => drawCloud(cloud, index, scrollMotion, pointerMotion, ambient, veil, now));
        return;
      }
      drawGalaxy(scrollMotion, pointerMotion, veil);
      let moonDrawn = false;
      for (const star of stars) {
        if (!moonDrawn && star.depth >= 0.14) {
          drawMoon(scrollMotion, pointerMotion, veil);
          moonDrawn = true;
        }
        drawStar(star, scrollMotion, pointerMotion, ambient, veil);
      }
      if (!moonDrawn) drawMoon(scrollMotion, pointerMotion, veil);
    };

    const drawRain = () => {
      rctx.clearRect(0, 0, viewW, viewH);
      rctx.lineCap = "round";
      for (const drop of weather.drops) {
        const len = Math.max(7, Math.min(18, drop.vy * 0.011));
        rctx.strokeStyle = "rgba(62, 98, 128, 0.28)";
        rctx.lineWidth = 2.3;
        rctx.beginPath();
        rctx.moveTo(drop.x, drop.y);
        rctx.lineTo(drop.x - drop.vx * 0.012, drop.y - len);
        rctx.stroke();
        rctx.strokeStyle = drop.bounced ? "rgba(255,255,255,0.72)" : "rgba(244, 250, 255, 0.92)";
        rctx.lineWidth = 1.15;
        rctx.beginPath();
        rctx.moveTo(drop.x, drop.y);
        rctx.lineTo(drop.x - drop.vx * 0.01, drop.y - len);
        rctx.stroke();
      }
      for (const splash of weather.splashes) {
        rctx.globalAlpha = Math.max(0, splash.life);
        rctx.strokeStyle = "rgba(255,255,255,0.85)";
        rctx.lineWidth = 1.1;
        rctx.beginPath();
        rctx.ellipse(splash.x, splash.y, 8 * (1.5 - splash.life), 2.4, 0, 0, Math.PI * 2);
        rctx.stroke();
        rctx.globalAlpha = 1;
      }
    };

    const draw = (now = performance.now()) => {
      const scrollMotion = reduce ? 0.28 : 1;
      const pointerMotion = reduce ? 0 : 1;
      const ambient = reduce ? 0 : 1;
      hits = [];
      ctx.clearRect(0, 0, viewW, viewH);
      ctx.globalAlpha = 1;
      if (themeMix < 1) drawScene("clair", 1 - themeMix, scrollMotion, pointerMotion, ambient, now);
      if (themeMix > 0) drawScene("sombre", themeMix, scrollMotion, pointerMotion, ambient, now);
      ctx.globalAlpha = 1;
      if (weather.drops.length || weather.splashes.length) drawRain();
      else rctx.clearRect(0, 0, viewW, viewH);
    };

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.add(id);
    };

    const finishRainbow = () => {
      setRainbowOn(false);
      const index = weather.cloudIndex;
      schedule(() => {
        if (weather.cloudIndex !== index) return;
        const fx = cloudFx[index];
        if (fx) {
          fx.phase = reduce ? "idle" : "reforming";
          fx.at = performance.now();
        }
        weather.phase = "reform";
        weather.mark = performance.now();
        wake();
        draw();
      }, reduce ? 0 : RAINBOW_FADE);
    };

    const startRain = (hit: Hit) => {
      const fx = cloudFx[hit.index];
      if (!fx || weather.phase !== "idle") return;
      if (visitHas(VISIT_RAINBOW)) return;
      visitSet(VISIT_RAINBOW);
      const now = performance.now();
      weather = {
        phase: reduce ? "rainbow" : "raining",
        cloudIndex: hit.index,
        drops: [],
        splashes: [],
        spawnLeft: reduce ? 0 : 62,
        spawnAcc: 0,
        mark: now,
        originX: hit.x,
        originY: hit.y + hit.ry * 0.65,
        originW: hit.rx * 1.7,
      };
      fx.phase = reduce ? "hidden" : "dissolving";
      fx.at = now;
      clearSkyCursor();
      if (reduce) {
        setRainbowOn(true);
        schedule(() => {
          setRainbowOn(false);
          if (cloudFx[hit.index]) cloudFx[hit.index] = { phase: "idle", at: performance.now() };
          if (weather.cloudIndex === hit.index) weather.phase = "idle";
          draw();
        }, 2000);
        draw();
        return;
      }
      wake();
    };

    const pickCloud = (x: number, y: number) => {
      let best: Hit | null = null;
      for (const hit of hits) {
        const nx = (x - hit.x) / hit.rx;
        const ny = (y - hit.y) / hit.ry;
        if (nx * nx + ny * ny > 1) continue;
        if (!best || hit.depth > best.depth) best = hit;
      }
      return best;
    };

    const advanceWeather = (dt: number, now: number) => {
      for (let index = 0; index < cloudFx.length; index += 1) {
        const fx = cloudFx[index];
        if (!fx) continue;
        if (fx.phase === "dissolving" && now - fx.at >= 680) fx.phase = "hidden";
        if (fx.phase === "reforming" && now - fx.at >= 1680) fx.phase = "idle";
      }

      if (weather.phase === "raining") {
        weather.spawnAcc += dt;
        while (weather.spawnLeft > 0 && weather.spawnAcc >= 0.0075) {
          weather.spawnAcc -= 0.0075;
          weather.spawnLeft -= 1;
          weather.drops.push(createDrop(weather.originX, weather.originY, weather.originW));
        }
        let obstacles: Obstacle[] = [];
        if (weather.drops.length) obstacles = collectObstacles(viewH);
        for (const drop of weather.drops) stepDrop(drop, dt, obstacles, viewW, viewH, weather.splashes);
        weather.drops = weather.drops.filter((drop) => drop.alive);
        const fx = cloudFx[weather.cloudIndex];
        if (weather.spawnLeft <= 0 && weather.drops.length === 0 && fx?.phase !== "dissolving") {
          weather.phase = "rainbow";
          weather.mark = now;
          setRainbowOn(true);
          schedule(finishRainbow, RAINBOW_ON);
        }
      } else if (weather.phase === "reform") {
        const fx = cloudFx[weather.cloudIndex];
        if (!fx || fx.phase === "idle") weather.phase = "idle";
      }
      if (weather.splashes.length) {
        for (const splash of weather.splashes) splash.life -= dt * 3.4;
        weather.splashes = weather.splashes.filter((splash) => splash.life > 0);
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) time += dt;
      if (reduce) themeMix = themeTo;
      else if (themeMix !== themeTo) {
        const t = Math.min(1, (now - themeStart) / THEME_MS);
        themeMix = themeFrom + (themeTo - themeFrom) * easeInOut(t);
        if (t >= 1) themeMix = themeTo;
      }
      scrollTarget = window.scrollY;
      const scrollBlend = reduce ? 1 : 1 - Math.exp(-dt / 0.085);
      scroll += (scrollTarget - scroll) * scrollBlend;
      const pointerBlend = reduce ? 1 : 1 - Math.exp(-dt / 0.12);
      pointer.x += (pointerTarget.x - pointer.x) * pointerBlend;
      pointer.y += (pointerTarget.y - pointer.y) * pointerBlend;
      if (Math.abs(scrollTarget - scroll) < 0.2) scroll = scrollTarget;
      advanceWeather(dt, now);
      draw(now);
      const themeSettled = themeMix === themeTo;
      const weatherSettled = weather.phase === "idle";
      const settled =
        reduce &&
        themeSettled &&
        weatherSettled &&
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
      if (!reduce) {
        pointerTarget.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
        pointerTarget.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
        wake();
      }
      const blocked = isBlockedTarget(event.target);
      const onSea = document.documentElement.dataset.page === "qui-suis-je";
      const hovered =
        !onSea && mode === "clair" && themeMix < 0.45 && weather.phase === "idle" && !blocked
          ? pickCloud(event.clientX, event.clientY)
          : null;
      if (hovered) document.documentElement.dataset.sky = "cloud";
      else clearSkyCursor();
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
        clearSkyCursor();
        wake();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.documentElement.dataset.page === "qui-suis-je") return;
      if (mode !== "clair" || themeMix > 0.4 || weather.phase !== "idle") return;
      if (isBlockedTarget(event.target)) return;
      const hit = pickCloud(event.clientX, event.clientY);
      if (!hit) return;
      startRain(hit);
    };

    const syncMode = () => {
      const next = readMode();
      const nextTo = next === "sombre" ? 1 : 0;
      mode = next;
      if (nextTo !== themeTo) {
        themeFrom = themeMix;
        themeTo = nextTo;
        themeStart = performance.now();
        if (reduce) themeMix = nextTo;
        if (next === "sombre") cancelWeather();
      }
      clearSkyCursor();
      draw();
      wake();
    };

    const onMotion = (event: MediaQueryListEvent) => {
      reduce = event.matches;
      if (reduce) {
        themeMix = themeTo;
        if (weather.phase !== "idle") cancelWeather();
      }
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
    window.addEventListener("click", onClick);
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
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      clearSkyCursor();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("click", onClick);
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
    <>
      <div className="sky" aria-hidden="true">
        <div className="sky-gradient sky-gradient-clair" />
        <div className="sky-gradient sky-gradient-sombre" />
        <canvas ref={canvasRef} />
        <div className="sky-vignette sky-vignette-clair" />
        <div className="sky-vignette sky-vignette-sombre" />
        <Aurora on={auroraOn} />
        <Rainbow on={rainbowOn} />
      </div>
      <canvas ref={rainRef} className="rain-layer" aria-hidden="true" />
      <NightStars onAurora={setAuroraOn} />
    </>
  );
}
