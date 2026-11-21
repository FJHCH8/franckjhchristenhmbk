/** HEALPix nested lookup for the galactic-frame Gaia DR3 RGB HiPS. */

const BASE = "https://skies.esac.esa.int/Gaia/dr3/RGB";

const GAL = [
  -0.0548755604162154, -0.873437090234885, -0.4838350155487132,
  0.4941094278755837, -0.4448296299600112, 0.7469822444972189,
  -0.8676661490190047, -0.1980763734312015, 0.4559837761750669,
];

export type Vec3 = [number, number, number];

export function eqDirection(x: number, y: number, z: number) {
  const X = x;
  const Y = z;
  const Z = y;
  const gx = GAL[0] * X + GAL[1] * Y + GAL[2] * Z;
  const gy = GAL[3] * X + GAL[4] * Y + GAL[5] * Z;
  const gz = GAL[6] * X + GAL[7] * Y + GAL[8] * Z;
  const l = Math.atan2(gy, gx);
  const b = Math.asin(Math.max(-1, Math.min(1, gz)));
  return { theta: Math.PI / 2 - b, phi: (l + Math.PI * 2) % (Math.PI * 2) };
}

export function ang2pix(order: number, theta: number, phi: number) {
  const nside = 1 << order;
  const z = Math.cos(theta);
  const za = Math.abs(z);
  const tt = ((phi % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * (2 / Math.PI);
  let face = 0;
  let ix = 0;
  let iy = 0;
  if (za <= 2 / 3) {
    const temp1 = nside * (0.5 + tt);
    const temp2 = nside * z * 0.75;
    const jp = Math.floor(temp1 - temp2);
    const jm = Math.floor(temp1 + temp2);
    const ifp = Math.floor(jp / nside);
    const ifm = Math.floor(jm / nside);
    if (ifp === ifm) face = ifp === 4 ? 4 : ifp + 4;
    else if (ifp < ifm) face = ifp;
    else face = ifm + 8;
    ix = ((jm % nside) + nside) % nside;
    iy = nside - ((((jp % nside) + nside) % nside) + 1);
  } else {
    let ntt = Math.floor(tt);
    if (ntt >= 4) ntt = 3;
    const tp = tt - ntt;
    const tmp = nside * Math.sqrt(Math.max(0, 3 * (1 - za)));
    let jp = Math.floor(tp * tmp);
    let jm = Math.floor((1 - tp) * tmp);
    jp = Math.min(nside - 1, Math.max(0, jp));
    jm = Math.min(nside - 1, Math.max(0, jm));
    if (z >= 0) {
      face = ntt;
      ix = nside - jm - 1;
      iy = nside - jp - 1;
    } else {
      face = ntt + 8;
      ix = jp;
      iy = jm;
    }
  }
  let ipf = 0;
  for (let i = 0; i < order; i++) {
    ipf |= ((ix >> i) & 1) << (2 * i);
    ipf |= ((iy >> i) & 1) << (2 * i + 1);
  }
  return face * nside * nside + ipf;
}

export function tileUv(order: number, theta: number, phi: number) {
  const nside = 1 << order;
  const z = Math.cos(theta);
  const za = Math.abs(z);
  const tt = ((phi % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * (2 / Math.PI);
  let u = 0;
  let v = 0;
  if (za <= 2 / 3) {
    const temp1 = nside * (0.5 + tt);
    const temp2 = nside * z * 0.75;
    const jp = temp1 - temp2;
    const jm = temp1 + temp2;
    u = jm - Math.floor(jm);
    v = jp - Math.floor(jp);
  } else {
    let ntt = Math.floor(tt);
    if (ntt >= 4) ntt = 3;
    const tp = tt - ntt;
    const tmp = nside * Math.sqrt(Math.max(0, 3 * (1 - za)));
    const jp = tp * tmp;
    const jm = (1 - tp) * tmp;
    u = jp - Math.floor(jp);
    v = jm - Math.floor(jm);
    if (z >= 0) {
      u = 1 - u;
      v = 1 - v;
    }
  }
  return [Math.min(0.999, Math.max(0.001, u)), Math.min(0.999, Math.max(0.001, v))] as const;
}

const JRLL = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
const JPLL = [1, 3, 5, 7, 0, 2, 4, 6, 1, 3, 5, 7];

/** Face coordinates x,y in [0,1] to the equatorial camera vector. */
export function faceToEq(face: number, x: number, y: number): Vec3 {
  const jr = JRLL[face]! - x - y;
  let nr = 1;
  let z = 0;
  if (jr < 1) {
    nr = jr;
    z = 1 - (nr * nr) / 3;
  } else if (jr > 3) {
    nr = 4 - jr;
    z = (nr * nr) / 3 - 1;
  } else {
    nr = 1;
    z = ((2 - jr) * 2) / 3;
  }
  let tmp = JPLL[face]! * nr + x - y;
  if (tmp < 0) tmp += 8;
  if (tmp >= 8) tmp -= 8;
  const phi = nr < 1e-12 ? 0 : ((Math.PI / 4) * tmp) / nr;
  const sth = Math.sqrt(Math.max(0, 1 - z * z));
  const gx = sth * Math.cos(phi);
  const gy = sth * Math.sin(phi);
  const gz = z;
  const X = GAL[0] * gx + GAL[3] * gy + GAL[6] * gz;
  const Y = GAL[1] * gx + GAL[4] * gy + GAL[7] * gz;
  const Z = GAL[2] * gx + GAL[5] * gy + GAL[8] * gz;
  return [X, Z, Y];
}

export function nestCell(order: number, ipix: number) {
  const nside = 1 << order;
  const face = ipix >> (2 * order);
  const ipf = ipix & (nside * nside - 1);
  let ix = 0;
  let iy = 0;
  for (let i = 0; i < order; i++) {
    ix |= ((ipf >> (2 * i)) & 1) << i;
    iy |= ((ipf >> (2 * i + 1)) & 1) << i;
  }
  return { face, ix, iy, nside };
}

export function tileUrl(order: number, ipix: number) {
  const dir = Math.floor(ipix / 10000) * 10000;
  return `${BASE}/Norder${order}/Dir${dir}/Npix${ipix}.png`;
}

type Slot = WebGLTexture | "bad" | "loading";

export function createHips(gl: WebGLRenderingContext, lite: boolean) {
  const prog = gl.createProgram()!;
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(vs, `
    attribute vec3 aPos;
    attribute vec2 aUv;
    uniform vec3 uF; uniform vec3 uR; uniform vec3 uU;
    uniform float uFov; uniform vec2 uRes;
    varying vec2 vUv; varying float vKeep;
    void main() {
      float z = dot(aPos, uF);
      float x = dot(aPos, uR);
      float y = dot(aPos, uU);
      float f = (uRes.y * 0.5) / tan(uFov * 0.00872665);
      vec2 p = vec2(x / max(z, 0.02), y / max(z, 0.02)) * f;
      gl_Position = vec4(p.x / (uRes.x * 0.5), p.y / (uRes.y * 0.5), z <= 0.02 ? 2.0 : 0.5, 1.0);
      vUv = aUv;
      vKeep = z > 0.02 ? 1.0 : 0.0;
    }
  `);
  gl.shaderSource(fs, `
    precision mediump float;
    varying vec2 vUv; varying float vKeep;
    uniform sampler2D uTex;
    uniform float uAlpha;
    void main() {
      if (vKeep < 0.5) discard;
      vec3 c = texture2D(uTex, vUv).rgb;
      float y = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float chroma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
      float neutral = 1.0 - smoothstep(0.015, 0.075, chroma);
      float star = smoothstep(0.55, 0.82, y);
      float floorY = 0.012 + 0.155 * neutral * (1.0 - star);
      vec3 x = max(c - floorY, 0.0);
      x = min(pow(max(x, vec3(0.0)), vec3(1.08)), vec3(1.0));
      float y3 = dot(x, vec3(0.2126, 0.7152, 0.0722));
      float keep = 0.62 + 0.28 * (1.0 - smoothstep(0.06, 0.22, chroma));
      x = mix(vec3(y3), x, keep);
      float ink = smoothstep(0.045, 0.20, y3);
      float warm = clamp(x.r - x.b, 0.0, 0.12);
      x.r += ink * warm * 0.08;
      x.g += ink * warm * 0.03;
      float cool = clamp(x.b - x.r, 0.0, 0.05);
      x.b += ink * cool * 0.22;
      float rose = max(0.0, min(x.r, x.b) - x.g);
      float excess = max(0.0, rose - 0.07);
      x.g += excess * 0.55;
      x.r -= excess * 0.22;
      x.b -= excess * 0.22;
      gl_FragColor = vec4(clamp(x, 0.0, 1.0), uAlpha);
    }
  `);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(prog));
  }
  const buf = gl.createBuffer()!;
  const cache = new Map<string, Slot>();
  const born = new Map<string, number>();
  const meshes = new Map<string, Float32Array>();
  const order: string[] = [];
  let inflight = 0;
  const maxOrder = lite ? 5 : 7;

  function key(level: number, ipix: number) {
    return `${level}:${ipix}`;
  }

  function request(level: number, ipix: number, urgent = false) {
    const id = key(level, ipix);
    if (cache.has(id) || inflight > (urgent ? 16 : 6)) return;
    cache.set(id, "loading");
    inflight += 1;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      inflight -= 1;
      const texture = gl.createTexture();
      if (!texture) {
        cache.set(id, "bad");
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      cache.set(id, texture);
      if (level > 0) born.set(id, performance.now());
      if (level > 0) order.push(id);
      while (order.length > (lite ? 80 : 140)) {
        const old = order.shift();
        if (!old) break;
        const slot = cache.get(old);
        if (slot && slot !== "bad" && slot !== "loading") gl.deleteTexture(slot);
        cache.delete(old);
      }
    };
    image.onerror = () => {
      inflight -= 1;
      cache.set(id, "bad");
    };
    image.src = tileUrl(level, ipix);
  }

  for (let i = 0; i < 12; i++) request(0, i, true);

  function levelFor(fov: number) {
    return Math.max(1, Math.min(maxOrder, Math.round(Math.log2(520 / Math.max(4, fov)))));
  }

  function meshFor(level: number, ipix: number) {
    const id = key(level, ipix);
    const cached = meshes.get(id);
    if (cached) return cached;
    const { face, ix, iy, nside } = nestCell(level, ipix);
    const div = level === 0 ? 8 : 3;
    const data: number[] = [];
    const at = (i: number, j: number) => {
      const sx = i / div;
      const sy = j / div;
      const p = faceToEq(face, (ix + sx) / nside, (iy + sy) / nside);
      return [p[0], p[1], p[2], sy, 1 - sx];
    };
    for (let j = 0; j < div; j++) {
      for (let i = 0; i < div; i++) {
        const a = at(i, j);
        const b = at(i + 1, j);
        const c = at(i, j + 1);
        const d = at(i + 1, j + 1);
        data.push(...a, ...c, ...b, ...b, ...c, ...d);
      }
    }
    const array = new Float32Array(data);
    meshes.set(id, array);
    return array;
  }

  function draw(forward: number[], right: number[], up: number[], fov: number, width: number, height: number) {
    const level = levelFor(fov);
    let base = true;
    for (let i = 0; i < 12; i++) {
      const slot = cache.get(key(0, i));
      if (!slot || slot === "loading") base = false;
    }
    if (!base) return { ready: false, level };
    const want = new Set<string>();
    const n = 14;
    const tan = Math.tan(((fov * 1.15) * Math.PI) / 360);
    const aspect = width / Math.max(1, height);
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        const vx = (i / n - 0.5) * 2 * tan * aspect;
        const vy = (0.5 - j / n) * 2 * tan;
        const x = forward[0]! + right[0]! * vx + up[0]! * vy;
        const y = forward[1]! + right[1]! * vx + up[1]! * vy;
        const z = forward[2]! + right[2]! * vx + up[2]! * vy;
        const len = Math.hypot(x, y, z) || 1;
        const { theta, phi } = eqDirection(x / len, y / len, z / len);
        for (let order = 1; order <= level; order++) {
          const ipix = ang2pix(order, theta, phi);
          want.add(key(order, ipix));
          request(order, ipix, order <= 2);
        }
      }
    }
    gl.useProgram(prog);
    gl.uniform3f(gl.getUniformLocation(prog, "uF"), forward[0]!, forward[1]!, forward[2]!);
    gl.uniform3f(gl.getUniformLocation(prog, "uR"), right[0]!, right[1]!, right[2]!);
    gl.uniform3f(gl.getUniformLocation(prog, "uU"), up[0]!, up[1]!, up[2]!);
    gl.uniform1f(gl.getUniformLocation(prog, "uFov"), fov);
    gl.uniform2f(gl.getUniformLocation(prog, "uRes"), gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1i(gl.getUniformLocation(prog, "uTex"), 0);
    const pos = gl.getAttribLocation(prog, "aPos");
    const uv = gl.getAttribLocation(prog, "aUv");
    const now = performance.now();
    const paint = (order: number, ipix: number, alpha: number) => {
      const slot = cache.get(key(order, ipix));
      if (!slot || slot === "bad" || slot === "loading") return;
      const data = meshFor(order, ipix);
      gl.uniform1f(gl.getUniformLocation(prog, "uAlpha"), alpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, slot);
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
      gl.drawArrays(gl.TRIANGLES, 0, data.length / 5);
    };
    for (let ipix = 0; ipix < 12; ipix++) paint(0, ipix, 1);
    let ready = true;
    const ids = [...want].sort((a, b) => Number(a.split(":")[0]) - Number(b.split(":")[0]));
    for (const id of ids) {
      const [orderText, ipixText] = id.split(":");
      const order = Number(orderText);
      const ipix = Number(ipixText);
      const slot = cache.get(id);
      if (order === level && (!slot || slot === "loading")) ready = false;
      if (!slot || slot === "bad" || slot === "loading") continue;
      const start = born.get(id) ?? now;
      paint(order, ipix, Math.max(0, Math.min(1, (now - start) / 420)));
    }
    return { ready, level };
  }

  function dispose() {
    for (const slot of cache.values()) {
      if (slot !== "bad" && slot !== "loading") gl.deleteTexture(slot);
    }
    cache.clear();
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
  }

  return { draw, dispose };
}
