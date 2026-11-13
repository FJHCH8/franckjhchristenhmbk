"use client";

import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from "react";
import { createHips } from "@/components/hips";

type Figure = {
  id: string;
  nom: string;
  cheval: boolean;
  ra: number;
  dec: number;
  segments: [number, number][][];
};

type Aim = { ra: number; dec: number };

function sph(ra: number, dec: number): [number, number, number] {
  const r = (((ra % 360) + 360) % 360) * (Math.PI / 180);
  const d = dec * (Math.PI / 180);
  const cd = Math.cos(d);
  return [cd * Math.cos(r), Math.sin(d), cd * Math.sin(r)];
}

function cross(a: number[], b: number[]) {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

function norm(v: number[]) {
  const l = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
  return [v[0]! / l, v[1]! / l, v[2]! / l];
}

function basis(ra: number, dec: number) {
  const forward = sph(ra, dec);
  const pole = Math.abs(forward[1]) > 0.96 ? [1, 0, 0] : [0, 1, 0];
  const right = norm(cross(pole, forward));
  const up = norm(cross(forward, right));
  return { forward, right, up };
}

function project(p: [number, number, number], cam: ReturnType<typeof basis>, fov: number, w: number, h: number) {
  const z = p[0] * cam.forward[0]! + p[1] * cam.forward[1]! + p[2] * cam.forward[2]!;
  if (z <= 0.05) return null;
  const x = p[0] * cam.right[0]! + p[1] * cam.right[1]! + p[2] * cam.right[2]!;
  const y = p[0] * cam.up[0]! + p[1] * cam.up[1]! + p[2] * cam.up[2]!;
  const f = (h * 0.5) / Math.tan((fov * Math.PI) / 360);
  return { x: w / 2 + (x / z) * f, y: h / 2 - (y / z) * f, z };
}

const STAR_VS = `
attribute vec3 aPos;
attribute float aMag;
attribute float aBv;
uniform vec3 uF;
uniform vec3 uR;
uniform vec3 uU;
uniform float uFov;
uniform vec2 uRes;
uniform float uTime;
uniform float uTwinkle;
uniform float uGold;
uniform float uLimit;
varying vec3 vColor;
varying float vAlpha;
vec3 tone(float bv) {
  float t = clamp(bv, -0.4, 1.8);
  float r = t < 0.0 ? 0.72 : clamp(0.86 + t * 0.18, 0.0, 1.0);
  float g = t < 0.0 ? 0.84 : clamp(0.92 - t * 0.16, 0.45, 1.0);
  float b = t < 0.0 ? 1.0 : clamp(1.0 - t * 0.48, 0.4, 1.0);
  return vec3(r, g, b);
}
void main() {
  if (aMag > uLimit) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(1.0);
    return;
  }
  float z = dot(aPos, uF);
  float x = dot(aPos, uR);
  float y = dot(aPos, uU);
  float f = (uRes.y * 0.5) / tan(uFov * 0.00872665);
  vec2 p = vec2(x / max(z, 0.02), y / max(z, 0.02)) * f;
  gl_Position = vec4(p.x / (uRes.x * 0.5), p.y / (uRes.y * 0.5), z <= 0.02 ? 2.0 : 0.5, 1.0);
  float px = clamp((12.6 - aMag) * (36.0 / max(uFov, 8.0)), 0.0, 30.0);
  if (uGold > 0.5) px *= 1.45;
  float tw = uTwinkle > 0.5 ? 0.88 + 0.12 * sin(uTime * (1.4 + fract(aMag) * 5.0) + aPos.x * 20.0) : 1.0;
  gl_PointSize = px * tw;
  vColor = uGold > 0.5 ? vec3(1.0, 0.86, 0.55) : tone(aBv);
  vAlpha = clamp(0.28 + (7.2 - aMag) * 0.12, 0.18, 1.0) * tw * (z > 0.02 ? 1.0 : 0.0);
}
`;

const STAR_FS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float core = smoothstep(0.42, 0.18, d);
  gl_FragColor = vec4(vColor, core * vAlpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  return prog;
}

const NOMS = [
  { nom: "Markab", ra: 346.19, dec: 15.21 },
  { nom: "Scheat", ra: 345.94, dec: 28.08 },
  { nom: "Algenib", ra: 3.31, dec: 15.18 },
  { nom: "Enif", ra: 326.05, dec: 9.88 },
  { nom: "Kitalpha", ra: 318.96, dec: 5.25 },
  { nom: "Caph", ra: 2.29, dec: 59.15 },
  { nom: "Schedar", ra: 10.13, dec: 56.54 },
  { nom: "Ruchbah", ra: 21.45, dec: 60.24 },
];

function solveHomography(src: Array<[number, number]>, dst: Array<[number, number]>) {
  const rows = src.flatMap(([x, y], index) => {
    const [X, Y] = dst[index]!;
    return [
      [x, y, 1, 0, 0, 0, -X * x, -X * y, X],
      [0, 0, 0, x, y, 1, -Y * x, -Y * y, Y],
    ];
  });
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++) if (Math.abs(rows[row]![col]!) > Math.abs(rows[pivot]![col]!)) pivot = row;
    const swap = rows[col]!;
    rows[col] = rows[pivot]!;
    rows[pivot] = swap;
    const div = rows[col]![col] || 1e-8;
    for (let c = col; c < 9; c++) rows[col]![c] = rows[col]![c]! / div;
    for (let row = 0; row < 8; row++) {
      if (row === col) continue;
      const factor = rows[row]![col]!;
      for (let c = col; c < 9; c++) rows[row]![c] = rows[row]![c]! - factor * rows[col]![c]!;
    }
  }
  return rows.map((row) => row[8]!);
}

function applyH(h: number[], x: number, y: number) {
  const w = h[6]! * x + h[7]! * y + 1;
  return [(h[0]! * x + h[1]! * y + h[2]!) / w, (h[3]! * x + h[4]! * y + h[5]!) / w] as const;
}

function paintPlate(ctx: CanvasRenderingContext2D, img: HTMLImageElement, src: Array<[number, number]>, dst: Array<[number, number]>) {
  const h = solveHomography(src, dst);
  const steps = 5;
  for (let j = 0; j < steps; j++) {
    for (let i = 0; i < steps; i++) {
      const uv = [
        [i / steps, j / steps],
        [(i + 1) / steps, j / steps],
        [i / steps, (j + 1) / steps],
        [(i + 1) / steps, (j + 1) / steps],
      ] as Array<[number, number]>;
      const screen = uv.map(([u, v]) => applyH(h, u * img.width, v * img.height));
      const source = uv.map(([u, v]) => [u * img.width, v * img.height]);
      for (const [a, b, c] of [[0, 1, 2], [1, 3, 2]] as Array<[number, number, number]>) {
        const s0 = source[a]!;
        const s1 = source[b]!;
        const s2 = source[c]!;
        const d0 = screen[a]!;
        const d1 = screen[b]!;
        const d2 = screen[c]!;
        const denom = s0[0]! * (s1[1]! - s2[1]!) + s1[0]! * (s2[1]! - s0[1]!) + s2[0]! * (s0[1]! - s1[1]!);
        if (Math.abs(denom) < 0.001) continue;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(d0[0]!, d0[1]!);
        ctx.lineTo(d1[0]!, d1[1]!);
        ctx.lineTo(d2[0]!, d2[1]!);
        ctx.closePath();
        ctx.clip();
        ctx.setTransform(
          (d0[0]! * (s1[1]! - s2[1]!) + d1[0]! * (s2[1]! - s0[1]!) + d2[0]! * (s0[1]! - s1[1]!)) / denom,
          (d0[1]! * (s1[1]! - s2[1]!) + d1[1]! * (s2[1]! - s0[1]!) + d2[1]! * (s0[1]! - s1[1]!)) / denom,
          (d0[0]! * (s2[0]! - s1[0]!) + d1[0]! * (s0[0]! - s2[0]!) + d2[0]! * (s1[0]! - s0[0]!)) / denom,
          (d0[1]! * (s2[0]! - s1[0]!) + d1[1]! * (s0[0]! - s2[0]!) + d2[1]! * (s1[0]! - s0[0]!)) / denom,
          (d0[0]! * (s1[0]! * s2[1]! - s2[0]! * s1[1]!) + d1[0]! * (s2[0]! * s0[1]! - s0[0]! * s2[1]!) + d2[0]! * (s0[0]! * s1[1]! - s1[0]! * s0[1]!)) / denom,
          (d0[1]! * (s1[0]! * s2[1]! - s2[0]! * s1[1]!) + d1[1]! * (s2[0]! * s0[1]! - s0[0]! * s2[1]!) + d2[1]! * (s0[0]! * s1[1]! - s1[0]! * s0[1]!)) / denom,
        );
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      }
    }
  }
}

const PEG_PLATE = [
  { ra: 326.05, dec: 9.88, u: 0.86, v: 0.44 },
  { ra: 345.94, dec: 28.08, u: 0.48, v: 0.24 },
  { ra: 346.19, dec: 15.21, u: 0.52, v: 0.62 },
  { ra: 3.31, dec: 15.18, u: 0.22, v: 0.5 },
];
const EQU_PLATE = [
  { ra: 318.96, dec: 5.25, u: 0.5, v: 0.62 },
  { ra: 318.68, dec: 10.01, u: 0.42, v: 0.32 },
  { ra: 320.72, dec: 6.81, u: 0.68, v: 0.5 },
  { ra: 317.59, dec: 10.13, u: 0.32, v: 0.3 },
];

export function Planetarium({
  etoiles,
  open,
  view,
  onSpots,
}: {
  etoiles: { id: string; ra: number; dec: number; seuil: number }[];
  open: number;
  view: MutableRefObject<Aim>;
  onSpots: (spots: { id: string; x: number; y: number }[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const etoilesRef = useRef(etoiles);
  const openLive = useRef(open);
  const onSpotsRef = useRef(onSpots);
  useLayoutEffect(() => {
    etoilesRef.current = etoiles;
    openLive.current = open;
    onSpotsRef.current = onSpots;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = glRef.current;
    const ink = inkRef.current;
    const labels = labelRef.current;
    if (!wrap || !canvas || !ink || !labels) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    const ctx2 = ink.getContext("2d");
    if (!gl || !ctx2) return;

    const lite = document.documentElement.dataset.power === "lite";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const starsProg = program(gl, STAR_VS, STAR_FS);
    const hips = createHips(gl, lite);
    const pegPlate = new Image();
    pegPlate.src = "/ciel/pegase.png";
    const equPlate = new Image();
    equPlate.src = "/ciel/petit-cheval.png";
    let dead = false;
    let raf = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;
    const aim = { ra: 15.3, dec: 60 };
    let user = 1;
    let yawV = 0;
    let pitchV = 0;
    let last = performance.now();
    let lastSpotAt = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;

    const starPos = gl.createBuffer();
    const starMag = gl.createBuffer();
    const starBv = gl.createBuffer();
    const faintPos = gl.createBuffer();
    const faintMag = gl.createBuffer();
    const faintBv = gl.createBuffer();
    const goldPos = gl.createBuffer();
    const goldMag = gl.createBuffer();
    const goldBv = gl.createBuffer();
    let starCount = 0;
    let faintCount = 0;
    let figures: Figure[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(2, rect.width);
      height = Math.max(2, rect.height);
      dpr = Math.min(lite ? 1 : 1.5, window.devicePixelRatio || 1);
      for (const node of [canvas, ink]) {
        node.width = Math.floor(width * dpr);
        node.height = Math.floor(height * dpr);
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    const fovNow = () => {
      const base = 40 + openRef.current * 34;
      return Math.min(86, Math.max(8, base * user));
    };
    const openRef = { current: open };

    const draw = (now: number) => {
      if (dead) return;
      if (location.hash === "#pegase" && wrap.dataset.lock !== "1") {
        aim.ra = 341.6;
        aim.dec = 19.5;
        user = 0.48;
        wrap.dataset.lock = "1";
      }
      if (location.hash === "#petit-cheval" && wrap.dataset.lock !== "1") {
        aim.ra = 318.4;
        aim.dec = 8.5;
        user = 0.36;
        wrap.dataset.lock = "1";
      }
      if (location.hash === "#centre" && wrap.dataset.lock !== "1") {
        aim.ra = 266.4;
        aim.dec = -28.9;
        user = 0.9;
        wrap.dataset.lock = "1";
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) {
        aim.ra = (aim.ra + yawV * dt * 60) % 360;
        aim.dec = Math.max(-84, Math.min(84, aim.dec + pitchV * dt * 60));
        const damp = lite ? 0.86 : 0.92;
        yawV *= damp;
        pitchV *= damp;
        if (Math.abs(zoomV) > 0.0002) {
          user = Math.min(1.05, Math.max(0.18, user * Math.exp(zoomV)));
          zoomV *= reduce ? 0 : 0.88;
        }
      }
      view.current = { ra: ((aim.ra % 360) + 360) % 360, dec: aim.dec };
      wrap.dataset.ra = view.current.ra.toFixed(1);
      wrap.dataset.dec = view.current.dec.toFixed(1);
      const fov = fovNow();
      const cam = basis(aim.ra, aim.dec);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const setCam = (prog: WebGLProgram) => {
        gl.uniform3f(gl.getUniformLocation(prog, "uF"), cam.forward[0]!, cam.forward[1]!, cam.forward[2]!);
        gl.uniform3f(gl.getUniformLocation(prog, "uR"), cam.right[0]!, cam.right[1]!, cam.right[2]!);
        gl.uniform3f(gl.getUniformLocation(prog, "uU"), cam.up[0]!, cam.up[1]!, cam.up[2]!);
        gl.uniform1f(gl.getUniformLocation(prog, "uFov"), fov);
        gl.uniform2f(gl.getUniformLocation(prog, "uRes"), canvas.width, canvas.height);
      };
      const hipsState = hips.draw(cam.forward, cam.right, cam.up, fov, width, height);
      wrap.dataset.tiles = hipsState.ready ? "1" : "0";
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(starsProg);
      setCam(starsProg);
      gl.uniform1f(gl.getUniformLocation(starsProg, "uTime"), now / 1000);
      gl.uniform1f(gl.getUniformLocation(starsProg, "uTwinkle"), reduce || lite ? 0 : 1);
      gl.uniform1f(gl.getUniformLocation(starsProg, "uGold"), 0);
      gl.uniform1f(gl.getUniformLocation(starsProg, "uLimit"), Math.min(10.4, 6.05 + Math.max(0, 72 - fov) * 0.12));
      const bindStars = (posBuf: WebGLBuffer | null, magBuf: WebGLBuffer | null, bvBuf: WebGLBuffer | null, count: number) => {
        const p = gl.getAttribLocation(starsProg, "aPos");
        const m = gl.getAttribLocation(starsProg, "aMag");
        const b = gl.getAttribLocation(starsProg, "aBv");
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.enableVertexAttribArray(p);
        gl.vertexAttribPointer(p, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, magBuf);
        gl.enableVertexAttribArray(m);
        gl.vertexAttribPointer(m, 1, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bvBuf);
        gl.enableVertexAttribArray(b);
        gl.vertexAttribPointer(b, 1, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, count);
      };
      if (starCount) bindStars(starPos, starMag, starBv, starCount);
      if (faintCount) bindStars(faintPos, faintMag, faintBv, faintCount);
      const zoom = Math.max(0, Math.min(1, (78 - fov) / 70));
      const gold = etoilesRef.current.filter((item) => zoom + 0.001 >= item.seuil);
      if (gold.length) {
        const pos = new Float32Array(gold.length * 3);
        const mag = new Float32Array(gold.length);
        const bv = new Float32Array(gold.length);
        gold.forEach((item, index) => {
          const p = sph(item.ra, item.dec);
          pos.set(p, index * 3);
          mag[index] = 0.2 + 0.35 * Math.sin(now / 700 + index);
          bv[index] = 1.4;
        });
        gl.bindBuffer(gl.ARRAY_BUFFER, goldPos);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, goldMag);
        gl.bufferData(gl.ARRAY_BUFFER, mag, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, goldBv);
        gl.bufferData(gl.ARRAY_BUFFER, bv, gl.DYNAMIC_DRAW);
        gl.uniform1f(gl.getUniformLocation(starsProg, "uGold"), 1);
        bindStars(goldPos, goldMag, goldBv, gold.length);
      }
      const spots = gold
        .map((item) => {
          const p = project(sph(item.ra, item.dec), cam, fov, width, height);
          return p ? { id: item.id, x: p.x, y: p.y } : null;
        })
        .filter((item): item is { id: string; x: number; y: number } => Boolean(item));
      if (now - lastSpotAt > 90) {
        lastSpotAt = now;
        onSpotsRef.current(spots);
      }
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.clearRect(0, 0, width, height);
      labels.replaceChildren();
      const figureAlpha = Math.max(0, Math.min(1, (68 - fov) / 26));
      if (figureAlpha > 0.05) {
        ctx2.lineWidth = Math.max(0.7, Math.min(width, height) / 700);
        ctx2.strokeStyle = `rgba(190, 206, 232, ${figureAlpha * 0.45})`;
        ctx2.shadowBlur = 0;
        ctx2.beginPath();
        for (const figure of figures) {
          for (const segment of figure.segments) {
            let pen = false;
            for (const pair of segment) {
              const point = project(sph(pair[0], pair[1]), cam, fov, width, height);
              if (!point) {
                pen = false;
                continue;
              }
              if (!pen) ctx2.moveTo(point.x, point.y);
              else ctx2.lineTo(point.x, point.y);
              pen = true;
            }
          }
        }
        ctx2.stroke();
        for (const figure of figures) {
          const center = project(sph(figure.ra, figure.dec), cam, fov, width, height);
          if (!center) continue;
          const dist = Math.hypot(center.x - width / 2, center.y - height / 2);
          const near = dist < Math.min(width, height) * 0.46;
          if (figure.cheval && near) {
            const plate = figure.id === "Equ" ? equPlate : pegPlate;
            const anchors = figure.id === "Equ" ? EQU_PLATE : PEG_PLATE;
            const placed = anchors
              .map((anchor) => {
                const point = project(sph(anchor.ra, anchor.dec), cam, fov, width, height);
                return point ? { ...anchor, x: point.x, y: point.y } : null;
              })
              .filter((anchor): anchor is (typeof anchors)[number] & { x: number; y: number } => Boolean(anchor));
            if (plate.complete && plate.naturalWidth > 0 && placed.length === 4) {
              ctx2.save();
              ctx2.globalCompositeOperation = "screen";
              ctx2.globalAlpha = Math.max(0.35, figureAlpha) * (1 - dist / (Math.min(width, height) * 0.95));
              ctx2.filter = "none";
              paintPlate(
                ctx2,
                plate,
                placed.map((anchor) => [anchor.u * plate.naturalWidth, anchor.v * plate.naturalHeight]),
                placed.map((anchor) => [anchor.x, anchor.y]),
              );
              ctx2.restore();
            }
          }
          if (near) {
            const node = document.createElement("span");
            node.className = "const-nom";
            node.style.transform = `translate3d(${center.x}px, ${center.y}px, 0)`;
            node.style.opacity = String(figureAlpha);
            node.textContent = figure.nom;
            labels.appendChild(node);
          }
        }
        if (fov < 52) {
          for (const star of NOMS) {
            const point = project(sph(star.ra, star.dec), cam, fov, width, height);
            if (!point) continue;
            if (Math.hypot(point.x - width / 2, point.y - height / 2) > Math.min(width, height) * 0.48) continue;
            const node = document.createElement("span");
            node.className = "etoile-nom";
            node.style.transform = `translate3d(${point.x + 8}px, ${point.y - 10}px, 0)`;
            node.textContent = star.nom;
            labels.appendChild(node);
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    void (async () => {
      const [bin, faint, fig] = await Promise.all([
        fetch("/ciel/etoiles.bin").then((res) => res.arrayBuffer()),
        fetch("/ciel/faibles.bin").then((res) => res.arrayBuffer()),
        fetch("/ciel/figures.json").then((res) => res.json()) as Promise<{ cadre: Aim; constellations: Figure[] }>,
      ]);
      if (dead) return;
      aim.ra = fig.cadre.ra;
      aim.dec = fig.cadre.dec;
      if (location.hash === "#pegase" || location.hash === "#petit-cheval") {
        const id = location.hash === "#pegase" ? "Peg" : "Equ";
        const figure = fig.constellations.find((item) => item.id === id);
        if (figure) {
          aim.ra = figure.ra;
          aim.dec = figure.dec;
          user = id === "Peg" ? 0.52 : 0.4;
        }
      }
      if (location.hash === "#centre") {
        aim.ra = 266.4;
        aim.dec = -28.9;
        user = 0.9;
      }
      figures = fig.constellations;
      const viewBin = new DataView(bin);
      const total = bin.byteLength / 8;
      const pos: number[] = [];
      const mag: number[] = [];
      const bv: number[] = [];
      for (let i = 0; i < total; i++) {
        const ra = ((viewBin.getInt16(i * 8, true) / 100) % 360 + 360) % 360;
        const dec = viewBin.getInt16(i * 8 + 2, true) / 100;
        const magnitude = viewBin.getInt16(i * 8 + 4, true) / 100;
        const color = viewBin.getInt16(i * 8 + 6, true) / 100;
        if (lite && magnitude > 4.4) continue;
        pos.push(...sph(ra, dec));
        mag.push(magnitude);
        bv.push(color);
      }
      starCount = mag.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, starPos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, starMag);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mag), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, starBv);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bv), gl.STATIC_DRAW);
      const faintView = new DataView(faint);
      const faintTotal = lite ? Math.min(8000, faint.byteLength / 8) : faint.byteLength / 8;
      const fpos: number[] = [];
      const fmag: number[] = [];
      const fbv: number[] = [];
      for (let i = 0; i < faintTotal; i++) {
        const ra = ((faintView.getInt16(i * 8, true) / 100) % 360 + 360) % 360;
        const dec = faintView.getInt16(i * 8 + 2, true) / 100;
        fpos.push(...sph(ra, dec));
        fmag.push(faintView.getInt16(i * 8 + 4, true) / 100);
        fbv.push(faintView.getInt16(i * 8 + 6, true) / 100);
      }
      faintCount = fmag.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, faintPos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fpos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, faintMag);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fmag), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, faintBv);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fbv), gl.STATIC_DRAW);
      raf = requestAnimationFrame(draw);
    })().catch(() => undefined);

    let zoomV = 0;
    let gestureScale = 1;
    const clampUser = (value: number) => Math.min(1.05, Math.max(0.18, value));
    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const fov = fovNow();
      const cam = basis(aim.ra, aim.dec);
      const ndcX = (x / Math.max(1, rect.width) - 0.5) * 2;
      const ndcY = (0.5 - y / Math.max(1, rect.height)) * 2;
      const tan = Math.tan((fov * Math.PI) / 360);
      const vx = ndcX * tan * (rect.width / Math.max(1, rect.height));
      const vy = ndcY * tan;
      user = clampUser(user * factor);
      const tan2 = Math.tan((fovNow() * Math.PI) / 360);
      const vx2 = ndcX * tan2 * (rect.width / Math.max(1, rect.height));
      const vy2 = ndcY * tan2;
      const cosDec = Math.cos((aim.dec * Math.PI) / 180) || 0.2;
      aim.ra += ((vx - vx2) * 180) / Math.PI / cosDec;
      aim.dec = Math.max(-84, Math.min(84, aim.dec + ((vy - vy2) * 180) / Math.PI));
      void cam;
    };
    const rotateBy = (dx: number, dy: number) => {
      const fov = fovNow();
      yawV += -dx * (fov / height) * 0.22;
      pitchV += dy * (fov / height) * 0.22;
    };
    const down = (event: PointerEvent) => {
      wrap.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      }
    };
    const move = (event: PointerEvent) => {
      const prev = pointers.get(event.pointerId);
      if (!prev) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        if (pinch > 0) zoomAt((a!.x + b!.x) / 2, (a!.y + b!.y) / 2, dist / pinch);
        pinch = dist;
        return;
      }
      rotateBy(event.clientX - prev.x, event.clientY - prev.y);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      pinch = 0;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const pinch = event.ctrlKey || event.metaKey;
      const step = Math.max(-0.35, Math.min(0.35, event.deltaY / (pinch ? 180 : 420)));
      zoomV += step * 0.2;
      zoomAt(event.clientX, event.clientY, Math.exp(step));
    };
    const stopGesture = (event: Event) => event.preventDefault();
    const onGesture = (event: Event) => {
      event.preventDefault();
      const scale = (event as Event & { scale?: number; clientX?: number; clientY?: number }).scale ?? 1;
      if (gestureScale > 0 && scale > 0) {
        zoomAt(event instanceof MouseEvent ? event.clientX : width / 2, event instanceof MouseEvent ? event.clientY : height / 2, gestureScale / scale);
      }
      gestureScale = scale;
    };
    wrap.addEventListener("pointerdown", down);
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);
    wrap.addEventListener("wheel", wheel, { passive: false });
    wrap.addEventListener("gesturestart", stopGesture, { passive: false });
    wrap.addEventListener("gesturechange", onGesture, { passive: false });

    const tickOpen = () => {
      openRef.current = openLive.current;
    };
    const openTimer = window.setInterval(tickOpen, 50);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearInterval(openTimer);
      observer.disconnect();
      wrap.removeEventListener("pointerdown", down);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
      wrap.removeEventListener("wheel", wheel);
      wrap.removeEventListener("gesturestart", stopGesture);
      wrap.removeEventListener("gesturechange", onGesture);
      gl.deleteBuffer(starPos);
      gl.deleteBuffer(starMag);
      gl.deleteBuffer(starBv);
      gl.deleteBuffer(faintPos);
      gl.deleteBuffer(faintMag);
      gl.deleteBuffer(faintBv);
      gl.deleteBuffer(goldPos);
      gl.deleteBuffer(goldMag);
      gl.deleteBuffer(goldBv);
      hips.dispose();
    };
    // The sky stays mounted while scrolling; `open` is read from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div className="planet" ref={wrapRef}>
      <canvas ref={glRef} className="planet-gl" />
      <canvas ref={inkRef} className="planet-ink" aria-hidden="true" />
      <div ref={labelRef} className="planet-labels" />
      <div className="planet-air" aria-hidden="true" />
    </div>
  );
}
