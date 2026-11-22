/**
 * Ciel profond en WebGL : une galaxie qui se transforme sans fin, des nuages de poussière
 * qui dérivent et ne reprennent jamais la même forme, des étoiles sur plusieurs plans.
 *
 * Deux passes : la galaxie est calculée en basse résolution (elle est floue par nature),
 * puis les étoiles sont dessinées par-dessus en pleine résolution, nettes.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/* Bruit simplex 3D (Ashima Arts, licence MIT) et quelques outils communs. */
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
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
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
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

vec2 rot(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}
`;

const FBM = (octaves: number) => `
float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < ${octaves}; i++) {
    sum += amp * snoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    amp *= 0.5;
  }
  return 0.5 + 0.5 * sum;
}

float ridged(vec3 p) {
  float sum = 0.0;
  float amp = 0.55;
  for (int i = 0; i < ${Math.max(3, octaves - 1)}; i++) {
    float n = 1.0 - abs(snoise(p));
    sum += amp * n * n;
    p = p * 2.11 + vec3(4.3, 1.9, 7.7);
    amp *= 0.5;
  }
  return sum;
}
`;

/* Passe 1 : la galaxie (lumière diffuse, poussière, nébuleuses), en basse résolution. */
const NEBULA = (octaves: number) => `${PRECISION}
varying vec2 vUv;
uniform vec2 uAspect;
uniform float uTime;
uniform float uRot;
uniform vec2 uDrift;
${NOISE}
${FBM(octaves)}

void main() {
  vec2 p = (vUv - 0.5) * uAspect * 2.0;
  // Toute la voûte tourne très lentement autour d'un pôle situé au-dessus de l'écran.
  vec2 pole = vec2(0.0, 2.4);
  p = rot(p - pole, uRot) + pole;
  p += uDrift * 0.35;

  float t = uTime;
  // Repère de la bande : x le long de la Voie lactée, y en travers.
  vec2 q = rot(p, -0.5);
  vec2 flow = vec2(t * 0.010, t * 0.0016);

  float wob = (fbm(vec3(q.x * 0.32 + flow.x * 0.4, 1.7, t * 0.006)) - 0.5) * 0.9;
  float y = q.y - wob;
  float width = 0.22 + 0.16 * fbm(vec3(q.x * 0.45 - flow.x * 0.3, 4.2, t * 0.005));
  float band = exp(-(y * y) / (width * width));
  float core = exp(-(y * y) / (width * width * 0.16));

  // Déformation du domaine : les nuages se tordent et se reforment en permanence.
  vec3 s = vec3(q * 1.25 + flow, t * 0.016);
  vec2 warp = vec2(fbm(s), fbm(s + vec3(5.2, 1.3, 2.1))) - 0.5;
  float clouds = fbm(vec3(q * 2.0 + warp * 0.9 + flow * 1.5, t * 0.021));
  float fine = fbm(vec3(q * 7.5 + warp * 1.2 + flow * 2.4, t * 0.034));
  float dust = fbm(vec3(q * vec2(1.8, 3.6) + warp * 0.8 + flow * 1.8, t * 0.026));
  float lanes = ridged(vec3(q * vec2(1.6, 5.0) + warp * 0.6 + flow * 1.7, t * 0.02));

  float light = band * (0.12 + 0.9 * clouds * clouds) * (0.6 + 0.6 * fine);
  light += core * (0.2 + 0.7 * clouds) * 0.6;

  // Les nuages de poussière absorbent la lumière, surtout au cœur de la galaxie.
  float absorb = smoothstep(0.5, 0.78, dust) * 0.75 + smoothstep(0.55, 0.95, lanes) * 0.35 * core;
  absorb = clamp(absorb, 0.0, 0.9);
  light *= 1.0 - absorb;

  vec3 warm = vec3(1.0, 0.82, 0.62);
  vec3 cool = vec3(0.58, 0.68, 1.0);
  vec3 col = mix(cool, warm, clamp(core * 1.25 + (clouds - 0.5) * 0.6, 0.0, 1.0)) * light;

  // Nébuleuses : rose de l'hydrogène, bleu-vert de l'oxygène, très discrètes.
  float h2 = smoothstep(0.62, 0.92, fbm(vec3(q * 1.6 + warp + flow * 0.9 + 11.0, t * 0.012)));
  float o3 = smoothstep(0.64, 0.95, fbm(vec3(q * 1.9 - warp + flow * 1.1 + 31.0, t * 0.014)));
  col += vec3(0.95, 0.28, 0.42) * h2 * band * 0.42 * (1.0 - absorb);
  col += vec3(0.25, 0.62, 0.72) * o3 * band * 0.22 * (1.0 - absorb);

  // Voile lointain hors de la bande, à peine perceptible.
  float haze = fbm(vec3(p * 0.8 + flow * 0.6 + 47.0, t * 0.009));
  col += vec3(0.36, 0.42, 0.62) * smoothstep(0.45, 0.85, haze) * 0.06;

  gl_FragColor = vec4(col * 0.5, band);
}
`;

/* Passe 2 : les étoiles, nettes, en pleine résolution, puis la composition finale. */
const STARS = `${PRECISION}
varying vec2 vUv;
uniform sampler2D uNebula;
uniform vec2 uAspect;
uniform float uPx;
uniform float uTime;
uniform float uRot;
uniform vec2 uDrift;
uniform vec3 uPointer;
uniform float uGain;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec4 hash42(vec2 p) {
  vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec2 rot(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec3 starColor(float k) {
  // Du rouge-orangé (étoiles froides) au bleu-blanc (étoiles chaudes).
  vec3 a = vec3(1.0, 0.72, 0.52);
  vec3 b = vec3(1.0, 0.96, 0.9);
  vec3 c = vec3(0.7, 0.8, 1.0);
  return k < 0.5 ? mix(a, b, k * 2.0) : mix(b, c, (k - 0.5) * 2.0);
}

vec3 layer(vec2 p, float scale, float density, float seed, float gain, float band) {
  vec2 g = p * scale + seed * 17.0;
  vec2 id = floor(g);
  vec2 f = fract(g);
  vec4 h = hash42(id + seed);
  float chance = density * (0.55 + 0.9 * band);
  if (h.x > chance) return vec3(0.0);
  vec2 pos = 0.2 + 0.6 * h.yz;
  float d = length(f - pos) / scale;
  float px = d / uPx;
  float bright = pow(hash12(id * 1.31 + seed), 7.0);
  float radius = 0.55 + 1.5 * bright;
  float twinkle = 0.72 + 0.28 * sin(uTime * (0.6 + 2.6 * h.w) + h.y * 40.0) * sin(uTime * 0.37 + h.z * 21.0);
  float core = exp(-(px * px) / (radius * radius));
  float edge = 1.0 - smoothstep(0.07, 0.19, length(f - pos));
  float halo = exp(-px / (1.6 + 5.0 * bright)) * bright * 0.22 * edge;
  float lum = (0.12 + 1.4 * bright) * (core + halo) * twinkle * gain;
  return starColor(h.w) * lum;
}

float meteor(vec2 p) {
  float period = 11.0;
  float slot = floor(uTime / period);
  float local = uTime - slot * period;
  vec4 h = hash42(vec2(slot, 7.13));
  if (h.x > 0.42 || local > 1.1) return 0.0;
  vec2 start = vec2((h.y - 0.5) * uAspect.x * 1.6, 0.35 + h.z * 0.6);
  vec2 dir = normalize(vec2(h.w > 0.5 ? 1.0 : -1.0, -0.55 - h.z * 0.4));
  float speed = 1.7;
  vec2 head = start + dir * local * speed;
  float len = 0.34;
  vec2 rel = p - head;
  float along = dot(rel, -dir);
  float across = length(rel + dir * along);
  if (along < 0.0 || along > len) return 0.0;
  float fade = sin(clamp(local / 1.1, 0.0, 1.0) * 3.14159);
  float width = uPx * (1.1 + 1.6 * (1.0 - along / len));
  return exp(-(across * across) / (width * width)) * (1.0 - along / len) * fade * 1.6;
}

void main() {
  vec2 p = (vUv - 0.5) * uAspect * 2.0;
  vec2 pole = vec2(0.0, 2.4);
  vec2 sky = rot(p - pole, uRot) + pole;

  // Légère lentille gravitationnelle autour du doigt ou de la souris.
  vec2 toPointer = sky - (rot(uPointer.xy - pole, uRot) + pole);
  float r2 = dot(toPointer, toPointer);
  sky -= toPointer * uPointer.z * 0.012 / (r2 + 0.012);

  vec4 neb = texture2D(uNebula, vUv);
  float band = neb.a;
  vec3 col = neb.rgb * 2.0 * uGain;

  // Trois plans d'étoiles : plus ils sont proches, plus ils dérivent vite.
  col += layer(sky + uDrift * 0.55, 3.2, 0.5, 1.0, 1.25, band);
  col += layer(sky + uDrift * 0.8, 7.5, 0.55, 2.0, 0.9, band);
  col += layer(sky + uDrift * 1.0, 16.0, 0.6, 3.0, 0.55, band);
  col += layer(sky + uDrift * 1.25, 34.0, 0.5, 4.0, 0.32, band * 1.6);
  col += vec3(0.9, 0.95, 1.0) * meteor(p);

  // Exposition douce, bords assombris, fond complètement noir.
  col = 1.0 - exp(-col * 1.15);
  float vig = smoothstep(1.9, 0.55, length(p * vec2(0.82, 1.0)));
  col *= mix(0.55, 1.0, vig);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export type Galaxie = {
  resize: (width: number, height: number, dpr: number) => void;
  render: (state: { time: number; rot: number; driftX: number; driftY: number; pointerX: number; pointerY: number; pointer: number }) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("galaxie:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function program(gl: WebGLRenderingContext, fragment: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("galaxie:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

export function createGalaxie(canvas: HTMLCanvasElement, lite: boolean): Galaxie | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: lite ? "low-power" : "high-performance",
  });
  if (!gl) return null;

  const nebulaProg = program(gl, NEBULA(lite ? 4 : 5));
  const starsProg = program(gl, STARS);
  if (!nebulaProg || !starsProg) return null;

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const loc = (prog: WebGLProgram, name: string) => gl.getUniformLocation(prog, name);
  const nu = {
    aspect: loc(nebulaProg, "uAspect"),
    time: loc(nebulaProg, "uTime"),
    rot: loc(nebulaProg, "uRot"),
    drift: loc(nebulaProg, "uDrift"),
  };
  const su = {
    nebula: loc(starsProg, "uNebula"),
    aspect: loc(starsProg, "uAspect"),
    px: loc(starsProg, "uPx"),
    time: loc(starsProg, "uTime"),
    rot: loc(starsProg, "uRot"),
    drift: loc(starsProg, "uDrift"),
    pointer: loc(starsProg, "uPointer"),
    gain: loc(starsProg, "uGain"),
  };

  let width = 1;
  let height = 1;
  let nebW = 1;
  let nebH = 1;
  let frame = 0;

  return {
    resize(cssW, cssH, dpr) {
      width = Math.max(1, Math.round(cssW * dpr));
      height = Math.max(1, Math.round(cssH * dpr));
      canvas.width = width;
      canvas.height = height;
      const scale = lite ? 0.2 : 0.3;
      nebW = Math.max(96, Math.min(640, Math.round(cssW * scale)));
      nebH = Math.max(96, Math.round((nebW * cssH) / Math.max(1, cssW)));
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, nebW, nebH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      frame = 0;
    },
    render(state) {
      const aspectX = width / height;
      // La galaxie évolue lentement : une image sur deux suffit, sauf la première.
      if (frame % 3 === 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, nebW, nebH);
        gl.useProgram(nebulaProg);
        gl.uniform2f(nu.aspect, aspectX, 1);
        gl.uniform1f(nu.time, state.time);
        gl.uniform1f(nu.rot, state.rot);
        gl.uniform2f(nu.drift, state.driftX, state.driftY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      frame += 1;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(starsProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(su.nebula, 0);
      gl.uniform2f(su.aspect, aspectX, 1);
      gl.uniform1f(su.px, 2 / height);
      gl.uniform1f(su.time, state.time);
      gl.uniform1f(su.rot, state.rot);
      gl.uniform2f(su.drift, state.driftX, state.driftY);
      gl.uniform3f(su.pointer, state.pointerX, state.pointerY, state.pointer);
      gl.uniform1f(su.gain, 0.42);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(nebulaProg);
      gl.deleteProgram(starsProg);
      gl.deleteBuffer(quad);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
