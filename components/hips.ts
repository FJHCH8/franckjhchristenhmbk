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
      gl_FragColor = vec4(clamp(x, 0.0, 1.0), 1.0);
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
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      cache.set(id, texture);
      order.push(id);
      while (order.length > (lite ? 36 : 72)) {
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

  function levelFor(fov: number) {
    return Math.max(1, Math.min(maxOrder, Math.round(Math.log2(520 / Math.max(4, fov)))));
  }

  function draw(forward: number[], right: number[], up: number[], fov: number, width: number, height: number) {
    const level = levelFor(fov);
    const n = lite ? 16 : 24;
    const tan = Math.tan(((fov * 1.12) * Math.PI) / 360);
    const aspect = width / Math.max(1, height);
    const stride = n + 1;
    type Sample = { xyz: Vec3; theta: number; phi: number; fine: number };
    const grid: Sample[] = [];
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        const nx = (i / n - 0.5) * 2;
        const ny = (0.5 - j / n) * 2;
        const vx = nx * tan * aspect;
        const vy = ny * tan;
        const x = forward[0]! + right[0]! * vx + up[0]! * vy;
        const y = forward[1]! + right[1]! * vx + up[1]! * vy;
        const z = forward[2]! + right[2]! * vx + up[2]! * vy;
        const len = Math.hypot(x, y, z) || 1;
        const xyz: Vec3 = [x / len, y / len, z / len];
        const { theta, phi } = eqDirection(xyz[0], xyz[1], xyz[2]);
        const fine = ang2pix(level, theta, phi);
        grid.push({ xyz, theta, phi, fine });
      }
    }
    for (const sample of grid) {
      request(1, ang2pix(1, sample.theta, sample.phi), true);
      const mid = Math.max(1, Math.min(3, level));
      request(mid, ang2pix(mid, sample.theta, sample.phi), true);
    }
    for (const sample of grid) request(level, sample.fine);
    const groups = new Map<string, number[]>();
    const add = (id: string, points: Sample[], uvs: Array<readonly [number, number]>) => {
      const slot = cache.get(id);
      if (!slot || slot === "bad" || slot === "loading") return;
      const list = groups.get(id) ?? [];
      points.forEach((point, index) => {
        const uv = uvs[index]!;
        list.push(point.xyz[0], point.xyz[1], point.xyz[2], uv[0], uv[1]);
      });
      groups.set(id, list);
    };
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const cell = [grid[j * stride + i]!, grid[j * stride + i + 1]!, grid[(j + 1) * stride + i]!, grid[(j + 1) * stride + i + 1]!];
        const tris: Array<[number, number, number]> = [[0, 1, 2], [1, 3, 2]];
        for (const [ia, ib, ic] of tris) {
          const a = cell[ia]!;
          const b = cell[ib]!;
          const c = cell[ic]!;
          for (let order = level; order >= 1; order--) {
            const pa = ang2pix(order, a.theta, a.phi);
            const pb = ang2pix(order, b.theta, b.phi);
            const pc = ang2pix(order, c.theta, c.phi);
            if (pa !== pb || pb !== pc) continue;
            request(order, pa, order <= 3);
            const id = key(order, pa);
            const slot = cache.get(id);
            if (!slot || slot === "bad" || slot === "loading") continue;
            const [ua, va] = tileUv(order, a.theta, a.phi);
            const [ub, vb] = tileUv(order, b.theta, b.phi);
            const [uc, vc] = tileUv(order, c.theta, c.phi);
            add(id, [a, b, c], [[ua, va], [ub, vb], [uc, vc]]);
            break;
          }
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
    let ready = true;
    const seen = new Set<number>();
    for (const sample of grid) {
      if (seen.has(sample.fine)) continue;
      seen.add(sample.fine);
      const slot = cache.get(key(level, sample.fine));
      if (!slot || slot === "loading") ready = false;
    }
    for (const [id, data] of groups) {
      const slot = cache.get(id);
      if (!slot || slot === "bad" || slot === "loading") continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, slot);
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
      gl.drawArrays(gl.TRIANGLES, 0, data.length / 5);
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
