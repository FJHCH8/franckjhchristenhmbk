/**
 * Une photo rendue par un shader : elle apparaît de droite à gauche derrière un bord liquide,
 * ondule et se dédouble légèrement en couleurs avec la vitesse du défilement,
 * et se ride sous le curseur.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform float uReveal;
uniform float uVel;
uniform float uTime;
uniform float uZoom;
uniform vec3 uMouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return uv * s + (1.0 - s) * uFocus;
}

void main() {
  vec2 uv = vUv;
  // Bord d'apparition, de droite à gauche, ondulé comme un liquide.
  float wobble = (noise(vec2(vUv.y * 3.2, uTime * 0.35)) - 0.5) * 0.18 + (noise(vec2(vUv.y * 9.0, uTime * 0.6)) - 0.5) * 0.05;
  float edge = 1.08 - uReveal * 1.2 + wobble * (1.0 - uReveal);
  float mask = smoothstep(edge, edge + 0.06, vUv.x);
  float near = 1.0 - smoothstep(0.0, 0.22, abs(vUv.x - edge));
  uv.x += near * 0.07 * (1.0 - uReveal);

  // Ondulation liée à la vitesse du défilement.
  uv.x += sin(vUv.y * 9.0 + uTime * 1.6) * uVel * 0.012;
  uv.y += sin(vUv.x * 7.0 + uTime * 1.2) * uVel * 0.006;

  // Ride sous le curseur.
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 toMouse = (vUv - uMouse.xy) * aspect;
  float d = length(toMouse);
  uv += normalize(toMouse + 1e-5) / aspect * sin(d * 34.0 - uTime * 5.0) * 0.0035 * uMouse.z * smoothstep(0.32, 0.0, d);

  uv = (uv - 0.5) / uZoom + 0.5;
  vec2 c = cover(uv);
  float shift = abs(uVel) * 0.006 + near * 0.012 * (1.0 - uReveal);
  float r = texture2D(uTex, c + vec2(shift, 0.0)).r;
  float g = texture2D(uTex, c).g;
  float b = texture2D(uTex, c - vec2(shift, 0.0)).b;
  vec3 col = vec3(r, g, b);
  // Le noir devient transparent, en fondu : les étoiles passent au travers.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float key = smoothstep(0.025, 0.2, lum);
  // Lueur fine le long du bord liquide.
  col += vec3(1.0) * near * (1.0 - uReveal) * 0.18;
  float alpha = mask * max(key, near * (1.0 - uReveal) * 0.5);
  gl_FragColor = vec4(min(col, vec3(1.0)) * alpha, alpha);
}
`;

export type ImageGl = {
  resize: (cssW: number, cssH: number, dpr: number) => void;
  render: (state: { reveal: number; velocity: number; time: number; zoom: number; mouseX: number; mouseY: number; hover: number }) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createImageGl(canvas: HTMLCanvasElement, image: HTMLImageElement, focus: [number, number]): ImageGl | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  } catch {
    return null;
  }

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const loc = {
    tex: u("uTex"),
    res: u("uRes"),
    img: u("uImg"),
    focus: u("uFocus"),
    reveal: u("uReveal"),
    vel: u("uVel"),
    time: u("uTime"),
    zoom: u("uZoom"),
    mouse: u("uMouse"),
  };
  gl.uniform1i(loc.tex, 0);
  gl.uniform2f(loc.img, image.naturalWidth || 1, image.naturalHeight || 1);
  // Le point d'intérêt est donné depuis le haut ; la texture est retournée.
  gl.uniform2f(loc.focus, focus[0], 1 - focus[1]);

  let width = 1;
  let height = 1;

  return {
    resize(cssW, cssH, dpr) {
      width = Math.max(1, Math.round(cssW * dpr));
      height = Math.max(1, Math.round(cssH * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(loc.res, width, height);
    },
    render(state) {
      gl.uniform1f(loc.reveal, state.reveal);
      gl.uniform1f(loc.vel, state.velocity);
      gl.uniform1f(loc.time, state.time);
      gl.uniform1f(loc.zoom, state.zoom);
      gl.uniform3f(loc.mouse, state.mouseX, state.mouseY, state.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(prog);
      gl.deleteBuffer(quad);
      gl.deleteTexture(texture);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
