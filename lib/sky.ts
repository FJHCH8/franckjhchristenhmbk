/**
 * Layered sky camera.
 * Scroll down lowers the viewpoint: near bodies sweep upward faster than far ones.
 * Scroll up climbs back through the same layers. Pointer offset shifts near layers more.
 */

export type SkyMode = "clair" | "sombre";

type Puff = { x: number; y: number; rx: number; ry: number };

export type SkyBody = {
  kind: "cloud" | "star";
  x: number;
  y: number;
  depth: number;
  scale: number;
  alpha: number;
  phase: number;
  drift: number;
  twinkle: number;
  sprite: number;
};

export type SkySprites = {
  clouds: HTMLCanvasElement[];
  hazes: HTMLCanvasElement[];
  glow: HTMLCanvasElement;
  glowWarm: HTMLCanvasElement;
  spark: HTMLCanvasElement;
  sun: HTMLCanvasElement;
  moon: HTMLCanvasElement;
  galaxy: HTMLCanvasElement;
};

export type Projection = {
  x: number;
  y: number;
  depth: number;
};

const CLOUD_SHAPES: Puff[][] = [
  [
    { x: 120, y: 210, rx: 78, ry: 48 },
    { x: 190, y: 176, rx: 96, ry: 64 },
    { x: 280, y: 150, rx: 118, ry: 78 },
    { x: 372, y: 168, rx: 108, ry: 70 },
    { x: 450, y: 198, rx: 84, ry: 52 },
    { x: 210, y: 214, rx: 130, ry: 46 },
    { x: 340, y: 220, rx: 150, ry: 44 },
    { x: 250, y: 132, rx: 54, ry: 40 },
    { x: 400, y: 150, rx: 48, ry: 36 },
  ],
  [
    { x: 90, y: 200, rx: 70, ry: 36 },
    { x: 170, y: 188, rx: 96, ry: 42 },
    { x: 270, y: 176, rx: 120, ry: 48 },
    { x: 380, y: 184, rx: 110, ry: 40 },
    { x: 480, y: 198, rx: 78, ry: 34 },
    { x: 230, y: 206, rx: 150, ry: 30 },
    { x: 360, y: 208, rx: 130, ry: 28 },
  ],
  [
    { x: 210, y: 230, rx: 90, ry: 48 },
    { x: 250, y: 180, rx: 78, ry: 62 },
    { x: 292, y: 128, rx: 64, ry: 54 },
    { x: 330, y: 168, rx: 70, ry: 50 },
    { x: 360, y: 214, rx: 86, ry: 46 },
    { x: 250, y: 214, rx: 120, ry: 36 },
    { x: 300, y: 104, rx: 36, ry: 28 },
  ],
  [
    { x: 160, y: 200, rx: 86, ry: 58 },
    { x: 230, y: 168, rx: 70, ry: 50 },
    { x: 300, y: 196, rx: 60, ry: 40 },
    { x: 390, y: 176, rx: 100, ry: 66 },
    { x: 470, y: 200, rx: 74, ry: 46 },
    { x: 200, y: 220, rx: 90, ry: 32 },
    { x: 420, y: 214, rx: 110, ry: 34 },
  ],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintCloud(ctx: CanvasRenderingContext2D, puffs: Puff[], hazy: boolean) {
  for (const puff of puffs) {
    const shadow = ctx.createRadialGradient(
      puff.x,
      puff.y + puff.ry * 0.45,
      puff.rx * 0.08,
      puff.x,
      puff.y + puff.ry * 0.2,
      puff.rx,
    );
    shadow.addColorStop(0, hazy ? "rgba(96, 138, 176, 0.3)" : "rgba(62, 104, 146, 0.5)");
    shadow.addColorStop(1, "rgba(96, 132, 168, 0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(puff.x, puff.y + puff.ry * 0.28, puff.rx * 0.98, puff.ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const puff of puffs) {
    const body = ctx.createRadialGradient(
      puff.x - puff.rx * 0.18,
      puff.y - puff.ry * 0.32,
      puff.rx * 0.04,
      puff.x,
      puff.y,
      Math.max(puff.rx, puff.ry),
    );
    if (hazy) {
      body.addColorStop(0, "rgba(232, 242, 250, 0.72)");
      body.addColorStop(0.48, "rgba(198, 220, 236, 0.32)");
      body.addColorStop(1, "rgba(198, 220, 236, 0)");
    } else {
      body.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      body.addColorStop(0.42, "rgba(255, 255, 255, 0.78)");
      body.addColorStop(0.74, "rgba(214, 230, 242, 0.28)");
      body.addColorStop(1, "rgba(214, 230, 242, 0)");
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(puff.x, puff.y, puff.rx, puff.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hazy) return;

  for (const puff of puffs) {
    const light = ctx.createRadialGradient(
      puff.x - puff.rx * 0.28,
      puff.y - puff.ry * 0.42,
      0,
      puff.x - puff.rx * 0.05,
      puff.y - puff.ry * 0.16,
      puff.rx * 0.62,
    );
    light.addColorStop(0, "rgba(255,255,255,0.9)");
    light.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(
      puff.x - puff.rx * 0.12,
      puff.y - puff.ry * 0.28,
      puff.rx * 0.5,
      puff.ry * 0.34,
      -0.25,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function bakeCloud(puffs: Puff[], hazy: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(40, 36);
  if (hazy) ctx.filter = "blur(10px)";
  paintCloud(ctx, puffs, hazy);
  ctx.filter = "none";
  return canvas;
}

function bakeGlow(warm: boolean, spikes: boolean) {
  const size = spikes ? 192 : 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const cx = size / 2;
  const glow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  const core = warm ? "rgba(255, 236, 214, 1)" : "rgba(255, 255, 255, 1)";
  const mid = warm ? "rgba(255, 214, 170, 0.4)" : "rgba(214, 228, 255, 0.42)";
  const edge = warm ? "rgba(255, 214, 170, 0)" : "rgba(214, 228, 255, 0)";
  const fringe = warm ? "rgba(255, 214, 170, 0.08)" : "rgba(214, 228, 255, 0.08)";
  glow.addColorStop(0, core);
  glow.addColorStop(0.07, core);
  glow.addColorStop(0.16, mid);
  glow.addColorStop(0.42, fringe);
  glow.addColorStop(1, edge);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  if (spikes) {
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.06);
    ctx.lineTo(cx, size * 0.94);
    ctx.moveTo(size * 0.06, cx);
    ctx.lineTo(size * 0.94, cx);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.moveTo(size * 0.18, size * 0.18);
    ctx.lineTo(size * 0.82, size * 0.82);
    ctx.moveTo(size * 0.82, size * 0.18);
    ctx.lineTo(size * 0.18, size * 0.82);
    ctx.stroke();
  }
  return canvas;
}

function bakeSun() {
  const size = 768;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const cx = size / 2;
  const glow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  glow.addColorStop(0, "rgba(255, 253, 248, 1)");
  glow.addColorStop(0.07, "rgba(255, 248, 230, 0.98)");
  glow.addColorStop(0.15, "rgba(255, 232, 186, 0.72)");
  glow.addColorStop(0.3, "rgba(255, 210, 150, 0.22)");
  glow.addColorStop(0.52, "rgba(255, 206, 150, 0.06)");
  glow.addColorStop(1, "rgba(255, 206, 150, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function bakeMoon() {
  const size = 720;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 96;
  const haloReach = radius * 2.8;
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, haloReach);
  halo.addColorStop(0, "rgba(214, 224, 255, 0.42)");
  halo.addColorStop(0.4, "rgba(214, 224, 255, 0.1)");
  halo.addColorStop(1, "rgba(214, 224, 255, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloReach, 0, Math.PI * 2);
  ctx.fill();

  const disc = ctx.createRadialGradient(cx - radius * 0.34, cy - radius * 0.38, radius * 0.08, cx, cy, radius);
  disc.addColorStop(0, "rgba(255, 253, 248, 1)");
  disc.addColorStop(0.58, "rgba(244, 240, 232, 1)");
  disc.addColorStop(0.84, "rgba(216, 210, 198, 0.96)");
  disc.addColorStop(1, "rgba(216, 210, 198, 0)");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(146, 140, 128, 0.3)";
  ctx.beginPath();
  ctx.ellipse(cx + 18, cy + 8, 28, 18, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 24, cy - 12, 14, 11, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return canvas;
}

function bakeGalaxy() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const band = ctx.createLinearGradient(0, 40, 0, 380);
  band.addColorStop(0, "rgba(170, 188, 255, 0)");
  band.addColorStop(0.5, "rgba(186, 204, 255, 0.2)");
  band.addColorStop(1, "rgba(170, 188, 255, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 1400, 420);
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createLinearGradient(0, 0, 1400, 0);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(0.12, "rgba(0,0,0,1)");
  mask.addColorStop(0.88, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 1400, 420);
  ctx.globalCompositeOperation = "source-over";
  for (const knot of [
    { x: 280, a: 0.1 },
    { x: 700, a: 0.16 },
    { x: 1040, a: 0.09 },
  ]) {
    const glow = ctx.createRadialGradient(knot.x, 210, 0, knot.x, 210, 240);
    glow.addColorStop(0, `rgba(206, 216, 255, ${knot.a})`);
    glow.addColorStop(1, "rgba(206, 216, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(knot.x - 240, 0, 480, 420);
  }
  return canvas;
}

export function createSprites(): SkySprites {
  return {
    clouds: CLOUD_SHAPES.map((shape) => bakeCloud(shape, false)),
    hazes: CLOUD_SHAPES.map((shape) => bakeCloud(shape, true)),
    glow: bakeGlow(false, false),
    glowWarm: bakeGlow(true, false),
    spark: bakeGlow(false, true),
    sun: bakeSun(),
    moon: bakeMoon(),
    galaxy: bakeGalaxy(),
  };
}

const CLOUD_LAYERS = [
  { depth: 0.06, count: 7, scale: [0.72, 1.05], alpha: 0.42 },
  { depth: 0.22, count: 6, scale: [0.8, 1.12], alpha: 0.55 },
  { depth: 0.4, count: 5, scale: [0.86, 1.16], alpha: 0.68 },
  { depth: 0.6, count: 4, scale: [0.9, 1.2], alpha: 0.8 },
  { depth: 0.8, count: 3, scale: [0.96, 1.24], alpha: 0.9 },
  { depth: 1, count: 2, scale: [1.02, 1.28], alpha: 0.96 },
];

const STAR_LAYERS = [
  { depth: 0.04, count: 96, scale: [0.85, 1.25], alpha: 0.7, sprite: 0 },
  { depth: 0.16, count: 58, scale: [1, 1.55], alpha: 0.78, sprite: 0 },
  { depth: 0.34, count: 32, scale: [1.2, 2], alpha: 0.86, sprite: 1 },
  { depth: 0.52, count: 16, scale: [1.5, 2.3], alpha: 0.92, sprite: 1 },
  { depth: 0.74, count: 9, scale: [1.8, 2.8], alpha: 1, sprite: 2 },
  { depth: 0.94, count: 5, scale: [2.2, 3.3], alpha: 1, sprite: 2 },
];

export function createBodies(viewportWidth: number): { clouds: SkyBody[]; stars: SkyBody[] } {
  const rand = mulberry32(0x51e1);
  const density = viewportWidth < 760 ? 0.62 : 1;
  const clouds: SkyBody[] = [];
  const stars: SkyBody[] = [];

  CLOUD_LAYERS.forEach((layer, layerIndex) => {
    const count = Math.max(2, Math.round(layer.count * density));
    for (let index = 0; index < count; index += 1) {
      const span = layer.scale[1] - layer.scale[0];
      clouds.push({
        kind: "cloud",
        x: (index + 0.18 + rand() * 0.64) / count,
        y: (index * 0.618 + rand() * 0.42 + layerIndex * 0.07) % 1,
        depth: layer.depth,
        scale: layer.scale[0] + rand() * span,
        alpha: layer.alpha,
        phase: rand() * Math.PI * 2,
        drift: 0.08 + rand() * 0.18,
        twinkle: 0,
        sprite: Math.floor(rand() * CLOUD_SHAPES.length),
      });
    }
  });

  STAR_LAYERS.forEach((layer, layerIndex) => {
    const count = Math.max(3, Math.round(layer.count * density));
    for (let index = 0; index < count; index += 1) {
      const span = layer.scale[1] - layer.scale[0];
      const roll = rand();
      stars.push({
        kind: "star",
        x: (index + rand()) / count,
        y: (index * 0.707 + rand() * 0.5 + layerIndex * 0.05) % 1,
        depth: layer.depth,
        scale: layer.scale[0] + rand() * span,
        alpha: layer.alpha * (0.75 + rand() * 0.25),
        phase: rand() * Math.PI * 2,
        drift: 0.05 + rand() * 0.12,
        twinkle: roll > 0.72 ? 0.35 + rand() * 0.9 : 0,
        sprite: roll > 0.86 ? 2 : layer.sprite,
      });
    }
  });

  return { clouds, stars };
}

export function layerSpeed(depth: number) {
  return 0.055 + Math.pow(depth, 1.18) * 1.5;
}

export function wrapHeight(viewH: number, depth: number) {
  return viewH * (2.55 + depth * 2.35);
}

export function projectBody(
  body: SkyBody,
  viewW: number,
  viewH: number,
  scroll: number,
  pointerX: number,
  pointerY: number,
  time: number,
  scrollMotion: number,
  pointerMotion: number,
  ambient: number,
): Projection {
  const depth = body.depth;
  const wrap = wrapHeight(viewH, depth);
  const travel = scroll * layerSpeed(depth) * scrollMotion;
  const yRaw = body.y * wrap - travel;
  const wrapped = ((yRaw % wrap) + wrap) % wrap;
  let y = wrapped - wrap * 0.18;
  const ny = (y - viewH * 0.5) / viewH;
  y += ny * depth * viewH * 0.07 * scrollMotion;

  const drift = Math.sin(time * body.drift + body.phase) * (10 + depth * 26) * ambient;
  let x = body.x * (viewW + 160) - 80 + drift;
  x += pointerX * (16 + depth * 78) * pointerMotion;
  y += pointerY * (10 + depth * 42) * pointerMotion;
  x += (body.x - 0.5) * depth * Math.abs(ny) * viewW * 0.1 * scrollMotion;

  return { x, y, depth };
}

export function cloudSize(body: SkyBody, viewW: number) {
  const responsive = Math.max(0.62, Math.min(viewW / 1180, 1.18));
  const width = (210 + body.depth * 620) * body.scale * responsive;
  return { width, height: width * (400 / 640) };
}

export function starDrawSize(body: SkyBody, viewW: number) {
  const responsive = Math.max(0.8, Math.min(viewW / 1100, 1.25));
  return body.scale * (8 + body.depth * 20) * responsive;
}

export function starAlpha(body: SkyBody, time: number, ambient: number) {
  if (!body.twinkle || ambient === 0) return body.alpha;
  return body.alpha * (0.68 + 0.32 * Math.sin(time * body.twinkle + body.phase));
}
