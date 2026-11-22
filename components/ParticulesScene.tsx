"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer, type Variable } from "three/examples/jsm/misc/GPUComputationRenderer.js";

/**
 * Les photos des chapitres deviennent des milliers de particules, échantillonnées sur
 * les pixels des images. Au défilement, elles se dispersent dans un vortex de bruit
 * « curl » puis se réassemblent en l'image suivante. Simulation GPGPU : positions et
 * vitesses vivent dans des textures calculées par la carte graphique.
 */

export type EtatParticules = {
  /** Avancée dans les chapitres : 0 = premier, 3 = dernier (valeurs intermédiaires pendant les glissements). */
  g: number;
  /** Le bocal tient encore, ou il a éclaté. */
  phase: "bocal" | "libre";
  /** 0 à 1 : fissure du bocal pendant qu'on appuie. */
  fissure: number;
  /** Instant de l'éclat (performance.now), 0 tant qu'il n'a pas eu lieu. */
  eclat: number;
  /** 0 à 1 : densité d'étoiles ; baisse en fondu quand on quitte la partie fluide. */
  densite: number;
  /** Décalage vertical de la scène, en pixels, pour qu'elle suive la page. */
  decalage: number;
};

export type Progression = MutableRefObject<EtatParticules>;

const CURL = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 snoiseVec3(vec3 x) {
  return vec3(snoise(x), snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)), snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4)));
}
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoiseVec3(p - dx); vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy); vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz); vec3 pz1 = snoiseVec3(p + dz);
  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;
  return normalize(vec3(x, y, z) / (2.0 * e) + 1e-5);
}
`;

const VITESSE = /* glsl */ `
uniform sampler2D uCibleA;
uniform sampler2D uCibleB;
uniform float uMorph;
uniform float uVortex;
uniform float uTemps;
uniform float uDelta;
uniform float uEchelle;
uniform vec3 uSouris;
uniform float uExplosion;
uniform float uFissure;
${CURL}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec4 a = texture2D(uCibleA, uv);
  vec4 b = texture2D(uCibleB, uv);
  // Chaque particule part à son heure : la transition se fait petit à petit.
  float h = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  float mi = clamp(uMorph * 1.7 - h * 0.7, 0.0, 1.0);
  float m = mi * mi * (3.0 - 2.0 * mi);
  float vortexIci = max(uVortex, sin(mi * 3.14159265));
  vec3 cible = mix(a.xyz * vec3(uEchelle, uEchelle, 1.0), b.xyz * vec3(uEchelle, uEchelle, 1.0), m);

  // Vortex : un tourbillon autour de l'axe, porté par un champ de bruit « curl ».
  vec3 curl = curlNoise(pos * 0.55 + vec3(0.0, 0.0, uTemps * 0.12));
  vec3 tourbillon = vec3(-pos.y, pos.x, 0.0) * 0.9 + vec3(0.0, 0.0, sin(length(pos.xy) * 2.0 - uTemps) * 0.4);
  vec3 flot = (curl * 2.2 + tourbillon) * vortexIci;

  // Ressort vers la cible, relâché pendant le vortex : la particule flotte avant de se poser.
  vec3 force = (cible - pos) * mix(6.0, 1.0, vortexIci) + flot * 2.6;
  // Souffle discret même au repos : l'image respire.
  force += curl * (0.12 + uFissure * 1.6) * (1.0 - vortexIci);

  // L'éclat du bocal : tout jaillit vers l'extérieur.
  force += normalize(pos + vec3(0.0, 0.0, 0.001)) * uExplosion * 26.0 + curl * uExplosion * 10.0;

  // Répulsion par la souris ou le doigt.
  vec2 d = pos.xy - uSouris.xy;
  float l = length(d);
  float rayon = 0.55;
  force.xy += normalize(d + 1e-5) * uSouris.z * pow(max(0.0, 1.0 - l / rayon), 2.0) * 38.0;

  vel = vel * pow(0.04, uDelta) + force * uDelta;
  gl_FragColor = vec4(vel, 1.0);
}
`;

const POSITION = /* glsl */ `
uniform float uDelta;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  gl_FragColor = vec4(pos + vel * uDelta, 1.0);
}
`;

const POINT_VERT = /* glsl */ `
uniform sampler2D uPos;
uniform sampler2D uCouleurA;
uniform sampler2D uCouleurB;
uniform float uMorph;
uniform float uVortex;
uniform float uTaille;
uniform float uTemps;
uniform float uDensite;
attribute vec2 aRef;
attribute float aHasard;
varying vec3 vCouleur;
varying float vAlpha;
void main() {
  vec3 pos = texture2D(uPos, aRef).xyz;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float h = fract(sin(dot(aRef, vec2(12.9898, 78.233))) * 43758.5453);
  float mi = clamp(uMorph * 1.7 - h * 0.7, 0.0, 1.0);
  float m = mi * mi * (3.0 - 2.0 * mi);
  float vortexIci = max(uVortex, sin(mi * 3.14159265));
  vec4 ca = texture2D(uCouleurA, aRef);
  vec4 cb = texture2D(uCouleurB, aRef);
  vec4 c = mix(ca, cb, m);
  // Pendant le vortex, les particules prennent la teinte bleutée des étoiles.
  vCouleur = mix(c.rgb, vec3(0.72, 0.82, 1.0) * (0.5 + c.a), vortexIci * 0.65);
  float scintille = 0.75 + 0.25 * sin(uTemps * (1.0 + aHasard * 3.0) + aHasard * 40.0);
  // Fondu en sortie de la partie fluide : de moins en moins d'étoiles.
  float garde = step(aHasard, uDensite);
  vAlpha = c.a * scintille * garde * smoothstep(0.0, 0.25, uDensite);
  gl_PointSize = uTaille * (0.55 + aHasard * 0.9) * (1.0 + vortexIci * 0.5) / -mv.z;
}
`;

const POINT_FRAG = /* glsl */ `
varying vec3 vCouleur;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = dot(p, p);
  float coeur = exp(-d * 34.0);
  float halo = exp(-d * 9.0) * 0.35;
  float a = (coeur + halo) * vAlpha * 0.85;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCouleur * a, a);
}
`;

type Cible = { pos: THREE.DataTexture; couleur: THREE.DataTexture };

function charger(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function texture(data: Float32Array, n: number) {
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

/** Échantillonne une image : plus un pixel est lumineux, plus il reçoit de particules. Le noir n'en reçoit aucune. */
function echantillonner(img: HTMLImageElement, n: number): Cible {
  const max = 260;
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = Math.round(ratio >= 1 ? max : max * ratio);
  const h = Math.round(ratio >= 1 ? max / ratio : max);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const poids = new Float32Array(w * h);
  let total = 0;
  for (let i = 0; i < w * h; i += 1) {
    const a = px[i * 4 + 3]! / 255;
    const lum = ((px[i * 4]! * 0.2126 + px[i * 4 + 1]! * 0.7152 + px[i * 4 + 2]! * 0.0722) / 255) * a;
    // Fondu ovale vers les bords : l'image devient une nébuleuse, sans cadre rectangulaire.
    const dx = ((i % w) / w - 0.5) / 0.5;
    const dy = (Math.floor(i / w) / h - 0.5) / 0.5;
    const bord = Math.max(0, Math.min(1, (1.05 - Math.hypot(dx * 0.92, dy)) / 0.45));
    const v = lum < 0.05 ? 0 : Math.pow(lum, 1.15) * bord * bord;
    total += v;
    poids[i] = total;
  }
  const count = n * n;
  const pos = new Float32Array(count * 4);
  const couleur = new Float32Array(count * 4);
  const largeur = ratio;
  for (let k = 0; k < count; k += 1) {
    const r = Math.random() * total;
    let lo = 0;
    let hi = w * h - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (poids[mid]! < r) lo = mid + 1;
      else hi = mid;
    }
    const x = lo % w;
    const y = Math.floor(lo / w);
    const R = px[lo * 4]! / 255;
    const G = px[lo * 4 + 1]! / 255;
    const B = px[lo * 4 + 2]! / 255;
    const lum = R * 0.2126 + G * 0.7152 + B * 0.0722;
    pos[k * 4] = ((x + Math.random()) / w - 0.5) * largeur;
    pos[k * 4 + 1] = -((y + Math.random()) / h - 0.5);
    pos[k * 4 + 2] = (lum - 0.5) * 0.22 + (Math.random() - 0.5) * 0.05;
    pos[k * 4 + 3] = 1;
    const eclat = 0.55 + lum * 0.9;
    couleur[k * 4] = Math.min(1, R * eclat * 0.96 + 0.04);
    couleur[k * 4 + 1] = Math.min(1, G * eclat * 0.98 + 0.05);
    couleur[k * 4 + 2] = Math.min(1, B * eclat + 0.1);
    couleur[k * 4 + 3] = 0.35 + lum * 0.65;
  }
  return { pos: texture(pos, n), couleur: texture(couleur, n) };
}

/** Nuage d'étoiles : l'état avant la première image et après la dernière. */
function nuage(n: number): Cible {
  const count = n * n;
  const pos = new Float32Array(count * 4);
  const couleur = new Float32Array(count * 4);
  for (let k = 0; k < count; k += 1) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    const r = 0.55 + Math.pow(Math.random(), 0.5) * 0.85;
    pos[k * 4] = Math.sin(v) * Math.cos(u) * r * 1.4;
    pos[k * 4 + 1] = Math.sin(v) * Math.sin(u) * r;
    pos[k * 4 + 2] = Math.cos(v) * r * 0.6;
    pos[k * 4 + 3] = 1;
    couleur[k * 4] = 0.78;
    couleur[k * 4 + 1] = 0.85;
    couleur[k * 4 + 2] = 1;
    couleur[k * 4 + 3] = 0.25 + Math.random() * 0.35;
  }
  return { pos: texture(pos, n), couleur: texture(couleur, n) };
}

/** Le bocal : un verre bombé au col étroit, et dedans un nuage dense de particules. */
function bocal(n: number): Cible {
  const count = n * n;
  const pos = new Float32Array(count * 4);
  const couleur = new Float32Array(count * 4);
  const lisse3 = (t: number) => t * t * (3 - 2 * t);
  const rayon = (y: number) => {
    if (y < -0.4) return 0.27 * Math.sqrt(Math.max(0, 1 - ((-0.4 - y) / 0.1) ** 2));
    if (y < 0.12) return 0.27 + 0.02 * Math.sin(((y + 0.4) / 0.52) * Math.PI);
    if (y < 0.3) return 0.27 + (0.15 - 0.27) * lisse3((y - 0.12) / 0.18);
    if (y < 0.4) return 0.15;
    return 0.18;
  };
  for (let k = 0; k < count; k += 1) {
    const tirage = Math.random();
    const angle = Math.random() * Math.PI * 2;
    let x: number;
    let y: number;
    let z: number;
    let c: [number, number, number, number];
    if (tirage < 0.34) {
      // Le verre : sa surface, plus dense sur les bords vus de face.
      y = -0.5 + Math.random() * 0.92;
      const r = rayon(y);
      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r * 0.7;
      const bord = Math.abs(Math.cos(angle));
      c = [0.82, 0.9, 1, 0.35 + bord * 0.65];
    } else if (tirage < 0.4) {
      // Le rebord du col.
      y = 0.4 + Math.random() * 0.03;
      x = Math.cos(angle) * 0.18;
      z = Math.sin(angle) * 0.18 * 0.7;
      c = [0.95, 0.97, 1, 0.95];
    } else {
      // Le nuage : dense au centre, effiloché vers les bords.
      const u = Math.random();
      const v = Math.random() * 2 - 1;
      const s = Math.pow(u, 0.62);
      y = -0.12 + v * 0.3 * s;
      const r = rayon(y) * 0.85 * Math.pow(Math.random(), 0.5) * (0.5 + 0.5 * s);
      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r * 0.7;
      const t = Math.random();
      c = [0.92 + 0.08 * t, 0.8 + 0.12 * (1 - t), 1, 0.55 + (1 - s) * 0.45];
    }
    // Un peu plus petit qu'une image : le bocal respire dans l'écran.
    pos[k * 4] = x * 0.86;
    pos[k * 4 + 1] = y * 0.86 - 0.02;
    pos[k * 4 + 2] = z * 0.86;
    pos[k * 4 + 3] = 1;
    couleur.set(c, k * 4);
  }
  return { pos: texture(pos, n), couleur: texture(couleur, n) };
}

/** Images de départ et d'arrivée, et le mélange, selon l'état. */
function etat(e: EtatParticules, dernier: number, maintenant: number): { a: number; b: number; m: number; vortex: number; explosion: number } {
  const BOCAL = dernier + 2;
  if (e.phase === "bocal") return { a: BOCAL, b: BOCAL, m: 0, vortex: 0.04 + e.fissure * 0.12, explosion: 0 };
  // Note : pendant une transition, le vortex est calculé par particule dans les shaders.
  const depuis = e.eclat ? (maintenant - e.eclat) / 1000 : 99;
  const explosion = Math.max(0, 1 - depuis / 0.7);
  if (depuis < 2.2) {
    const m = Math.min(1, Math.max(0, (depuis - 0.35) / 1.6));
    return { a: BOCAL, b: 0, m, vortex: explosion, explosion };
  }
  const g = Math.max(0, Math.min(dernier, e.g));
  const i = Math.min(dernier, Math.floor(g));
  const f = g - i;
  if (i >= dernier) return { a: dernier, b: dernier, m: 0, vortex: 0, explosion: 0 };
  // Le glissement d'un chapitre au suivant : l'image se disperse puis se recompose,
  // sur presque toute la course du défilement.
  const m = Math.min(1, Math.max(0, (f - 0.12) / 0.8));
  return { a: i, b: i + 1, m, vortex: 0, explosion: 0 };
}

function Particules({ images, progression, n }: { images: string[]; progression: Progression; n: number }) {
  const { gl, size, camera } = useThree();
  const souris = useRef({ x: 0, y: 0, nx: 0, ny: 0, force: 0, cible: 0 });
  const groupe = useRef<THREE.Group>(null);
  const etatRef = useRef<{
    gpu: GPUComputationRenderer;
    pos: Variable;
    vel: Variable;
    cibles: Cible[];
    temps: number;
  } | null>(null);

  const geometrie = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = n * n;
    const refs = new Float32Array(count * 2);
    const hasard = new Float32Array(count);
    for (let k = 0; k < count; k += 1) {
      refs[k * 2] = ((k % n) + 0.5) / n;
      refs[k * 2 + 1] = (Math.floor(k / n) + 0.5) / n;
      const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
      hasard[k] = x - Math.floor(x);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aRef", new THREE.BufferAttribute(refs, 2));
    geo.setAttribute("aHasard", new THREE.BufferAttribute(hasard, 1));
    return geo;
  }, [n]);

  const materiauRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uPos: { value: null as THREE.Texture | null },
      uCouleurA: { value: null as THREE.Texture | null },
      uCouleurB: { value: null as THREE.Texture | null },
      uMorph: { value: 0 },
      uVortex: { value: 0 },
      uTaille: { value: 22 },
      uTemps: { value: 0 },
      uDensite: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    let annule = false;
    void Promise.all(images.map(charger)).then((imgs) => {
      if (annule) return;
      const cibles = [...imgs.map((img) => echantillonner(img, n)), nuage(n), bocal(n)];
      const gpu = new GPUComputationRenderer(n, n, gl);
      if (!gl.capabilities.isWebGL2 || /iPhone|iPad|iPod/.test(navigator.userAgent)) gpu.setDataType(THREE.HalfFloatType);
      const depart = gpu.createTexture();
      const source = cibles[cibles.length - 2]!.pos.image.data as Float32Array;
      (depart.image.data as Float32Array).set(source);
      const pos = gpu.addVariable("texturePosition", POSITION, depart);
      const vel = gpu.addVariable("textureVelocity", VITESSE, gpu.createTexture());
      gpu.setVariableDependencies(pos, [pos, vel]);
      gpu.setVariableDependencies(vel, [pos, vel]);
      Object.assign(vel.material.uniforms, {
        uCibleA: { value: cibles[0]!.pos },
        uCibleB: { value: cibles[0]!.pos },
        uMorph: { value: 0 },
        uVortex: { value: 0 },
        uTemps: { value: 0 },
        uDelta: { value: 0.016 },
        uEchelle: { value: 1 },
        uSouris: { value: new THREE.Vector3(9, 9, 0) },
        uExplosion: { value: 0 },
        uFissure: { value: 0 },
      });
      Object.assign(pos.material.uniforms, { uDelta: { value: 0.016 } });
      let erreur = gpu.init();
      if (erreur) {
        gpu.setDataType(THREE.HalfFloatType);
        erreur = gpu.init();
      }
      if (erreur) {
        console.warn("particules:", erreur);
        return;
      }
      etatRef.current = { gpu, pos, vel, cibles, temps: 0 };
    });
    return () => {
      annule = true;
      etatRef.current?.gpu.dispose();
      etatRef.current?.cibles.forEach((c) => {
        c.pos.dispose();
        c.couleur.dispose();
      });
      etatRef.current = null;
    };
  }, [images, n, gl]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      souris.current.nx = (event.clientX / window.innerWidth) * 2 - 1;
      souris.current.ny = -(event.clientY / window.innerHeight) * 2 + 1;
      souris.current.cible = 1;
    };
    const onLeave = () => {
      souris.current.cible = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => () => geometrie.dispose(), [geometrie]);

  useFrame((state, delta) => {
    const sim = etatRef.current;
    if (!sim) return;
    const dt = Math.min(delta, 1 / 30);
    sim.temps += dt;
    const e = progression.current;
    const dernier = sim.cibles.length - 3;
    const { a, b, m, vortex, explosion } = etat(e, dernier, performance.now());

    // Taille visible du plan z = 0 : l'image occupe 78 % de la hauteur, sans déborder en largeur.
    const cam = camera as THREE.PerspectiveCamera;
    const hauteur = 2 * cam.position.z * Math.tan((cam.fov * Math.PI) / 360);
    const largeur = hauteur * (size.width / size.height);
    const echelle = Math.min(hauteur * 0.78, (largeur * 0.92) / 0.75);

    const s = souris.current;
    s.x += (s.nx * (largeur / 2) - s.x) * Math.min(1, dt * 10);
    s.y += (s.ny * (hauteur / 2) - s.y) * Math.min(1, dt * 10);
    s.force += (s.cible - s.force) * Math.min(1, dt * 3);

    const u = sim.vel.material.uniforms;
    u.uCibleA!.value = sim.cibles[a]!.pos;
    u.uCibleB!.value = sim.cibles[b]!.pos;
    u.uMorph!.value = m;
    u.uVortex!.value = vortex;
    u.uTemps!.value = sim.temps;
    u.uDelta!.value = dt;
    u.uEchelle!.value = echelle;
    // La scène suit la page : décalage vertical converti en unités du monde.
    const decalage = (-e.decalage / size.height) * hauteur;
    u.uExplosion!.value = explosion;
    u.uFissure!.value = e.phase === "bocal" ? e.fissure : 0;
    (u.uSouris!.value as THREE.Vector3).set(s.x, s.y - decalage, s.force * e.densite);
    sim.pos.material.uniforms.uDelta!.value = dt;
    sim.gpu.compute();

    const mat = materiauRef.current;
    if (!mat) return;
    const mu = mat.uniforms;
    mu.uPos!.value = sim.gpu.getCurrentRenderTarget(sim.pos).texture;
    mu.uCouleurA!.value = sim.cibles[a]!.couleur;
    mu.uCouleurB!.value = sim.cibles[b]!.couleur;
    mu.uMorph!.value = m;
    mu.uVortex!.value = vortex;
    mu.uTemps!.value = sim.temps;
    mu.uDensite!.value = e.densite;
    mu.uTaille!.value = Math.max(17, Math.min(30, size.height / 30)) * state.viewport.dpr;

    // Profondeur : la scène s'incline doucement vers le curseur.
    if (groupe.current) {
      const tremble = e.phase === "bocal" ? e.fissure * e.fissure * 0.035 : 0;
      groupe.current.position.set((Math.random() - 0.5) * tremble, decalage + (Math.random() - 0.5) * tremble, 0);
      groupe.current.rotation.y += (s.nx * 0.22 * s.force - groupe.current.rotation.y) * Math.min(1, dt * 3);
      groupe.current.rotation.x += (-s.ny * 0.14 * s.force - groupe.current.rotation.x) * Math.min(1, dt * 3);
    }
  });

  return (
    <group ref={groupe}>
      <points geometry={geometrie} frustumCulled={false}>
        <shaderMaterial
          ref={materiauRef}
          vertexShader={POINT_VERT}
          fragmentShader={POINT_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          premultipliedAlpha
        />
      </points>
    </group>
  );
}

export default function ParticulesScene({
  images,
  progression,
  lite,
  actif,
  onPret,
}: {
  images: string[];
  progression: Progression;
  lite: boolean;
  actif: boolean;
  onPret: () => void;
}) {
  // Moins de particules, mais plus visibles chacune : l'image reste lisible, l'écran respire.
  const n = lite ? 46 : 64;
  return (
    <Canvas
      dpr={[1, lite ? 1.25 : 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance", premultipliedAlpha: true }}
      camera={{ position: [0, 0, 5], fov: 40, near: 0.1, far: 50 }}
      frameloop={actif ? "always" : "never"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onPret();
      }}
      style={{ pointerEvents: "none" }}
    >
      <Particules images={images} progression={progression} n={n} />
      {lite ? null : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.22} luminanceSmoothing={0.5} mipmapBlur radius={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
