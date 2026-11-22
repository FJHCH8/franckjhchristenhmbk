/**
 * Fabrique les vidéos de la ficelle des chapitres (public/ficelle/*.mp4).
 *
 *   boucle-N.mp4        la ficelle du chapitre N qui ondule, en boucle parfaite (4 s)
 *   vers-N.mp4          la ficelle se délace du chapitre N-1 et se renoue en N
 *   retour-N.mp4        la même transition à l'envers (de N vers N-1)
 *   boucle-N.jpg        la première image, affichée avant la lecture
 *
 * Prérequis : le site tourne en local (npm run build && npx next start -p 3100),
 * Playwright et ffmpeg (avec libx264) sont installés.
 * Lancer :  node outils/videos-ficelle.js
 */
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SITE = process.env.SITE ?? "http://localhost:3100";
const IMAGES = ["/media/franck.jpg", "/fond/judo-640-a.webp", "/fond/avion-640-a.webp", "/fond/rose-640-a.webp"];
const TAILLE = 900;
const IPS = 24;
const PERIODE = 4; // secondes : la vague revient exactement à son départ
const SORTIE = path.join(__dirname, "..", "public", "ficelle");

/** Tout ce qui suit s'exécute dans le navigateur. */
function moteur(images, taille) {
  const N = 600;
  const W = (2 * Math.PI) / 4; // une période de 4 s

  function reechantillonner(trace) {
    const L = [0];
    for (let i = 1; i < trace.length; i += 1) L.push(L[i - 1] + Math.hypot(trace[i][0] - trace[i - 1][0], trace[i][1] - trace[i - 1][1]));
    const total = L[L.length - 1] || 1;
    const f = new Float32Array(N * 2);
    let j = 1;
    for (let k = 0; k < N; k += 1) {
      const c = (k / (N - 1)) * total;
      while (j < L.length - 1 && L[j] < c) j += 1;
      const a = trace[j - 1];
      const b = trace[j] ?? a;
      const t = Math.min(1, Math.max(0, (c - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1])));
      f[k * 2] = a[0] + (b[0] - a[0]) * t;
      f[k * 2 + 1] = a[1] + (b[1] - a[1]) * t;
    }
    return f;
  }

  function charger(src) {
    return new Promise((ok, ko) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = ko;
      img.src = src;
    });
  }

  // Graine fixe : les mêmes formes dans toutes les vidéos, pour qu'elles s'enchaînent.
  let graine = 7;
  const hasard = () => {
    graine = (graine * 16807) % 2147483647;
    return graine / 2147483647;
  };

  function contours(img) {
    const max = 140;
    const ratio = img.naturalWidth / img.naturalHeight;
    const w = Math.round(ratio >= 1 ? max : max * ratio);
    const h = Math.round(ratio >= 1 ? max / ratio : max);
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.filter = "blur(1.6px)";
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const L = new Float32Array(w * h);
    for (let i = 0; i < w * h; i += 1) L[i] = ((px[i * 4] * 0.2126 + px[i * 4 + 1] * 0.7152 + px[i * 4 + 2] * 0.0722) / 255) * (px[i * 4 + 3] / 255);
    const bords = [];
    let fort = 0;
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const at = (dx, dy) => L[(y + dy) * w + x + dx];
        const gx = at(1, -1) + 2 * at(1, 0) + at(1, 1) - at(-1, -1) - 2 * at(-1, 0) - at(-1, 1);
        const gy = at(-1, 1) + 2 * at(0, 1) + at(1, 1) - at(-1, -1) - 2 * at(0, -1) - at(1, -1);
        const g = Math.hypot(gx, gy);
        const ox = (x / w - 0.5) / 0.5;
        const oy = (y / h - 0.5) / 0.5;
        const cadre = Math.max(0, Math.min(1, (1.05 - Math.hypot(ox * 0.92, oy)) / 0.3));
        bords.push({ x, y, g: g * cadre });
        if (g > fort) fort = g;
      }
    }
    const forts = bords.filter((b) => b.g / (fort || 1) > 0.18);
    const pts = [];
    for (let k = 0; k < 900; k += 1) {
      const b = forts[Math.floor(hasard() * forts.length)];
      pts.push([((b.x + (hasard() - 0.5) * 1.6) / w - 0.5) * ratio, (b.y + (hasard() - 0.5) * 1.6) / h - 0.5]);
    }
    const libre = pts.map(() => true);
    let cur = pts.reduce((best, p, i) => (p[0] < pts[best][0] ? i : best), 0);
    const ligne = [];
    for (let n = 0; n < pts.length; n += 1) {
      ligne.push(pts[cur]);
      libre[cur] = false;
      let best = -1;
      let rec = Infinity;
      for (let i = 0; i < pts.length; i += 1) {
        if (!libre[i]) continue;
        const d = (pts[i][0] - pts[cur][0]) ** 2 + (pts[i][1] - pts[cur][1]) ** 2;
        if (d < rec) {
          rec = d;
          best = i;
        }
      }
      if (best < 0) break;
      cur = best;
    }
    for (let passe = 0; passe < 3; passe += 1) {
      const c = ligne.map((p) => [...p]);
      for (let i = 1; i < ligne.length - 1; i += 1) ligne[i] = [(c[i - 1][0] + 2 * c[i][0] + c[i + 1][0]) / 4, (c[i - 1][1] + 2 * c[i][1] + c[i + 1][1]) / 4];
    }
    return reechantillonner(ligne);
  }

  const lisse = (t) => t * t * (3 - 2 * t);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const canvas = document.createElement("canvas");
  canvas.width = taille;
  canvas.height = taille;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  const xs = new Float32Array(N);
  const ys = new Float32Array(N);

  window.__dessiner = (A, B, m, temps) => {
    const ech = taille * 0.86;
    for (let k = 0; k < N; k += 1) {
      const t = k / (N - 1);
      const mi = lisse(clamp(m * 1.7 - t * 0.7));
      const lache = Math.sin(mi * Math.PI);
      let x = A[k * 2] + (B[k * 2] - A[k * 2]) * mi;
      let y = A[k * 2 + 1] + (B[k * 2 + 1] - A[k * 2 + 1]) * mi;
      x += Math.sin(t * 22 + temps * W) * 0.09 * lache + x * lache * 0.25;
      y += Math.cos(t * 17 - temps * W) * 0.07 * lache;
      // La vague : elle court le long du fil, et revient à l'identique toutes les 4 s.
      x += Math.sin(t * 70 - temps * W * 2 + y * 3) * 0.006;
      y += Math.cos(t * 55 - temps * W + x * 3) * 0.006;
      xs[k] = taille / 2 + x * ech;
      ys[k] = taille / 2 + y * ech;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, taille, taille);
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < N - 1; k += 1) ctx.quadraticCurveTo(xs[k], ys[k], (xs[k] + xs[k + 1]) / 2, (ys[k] + ys[k + 1]) / 2);
    ctx.lineTo(xs[N - 1], ys[N - 1]);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#8fb4ff";
    ctx.lineWidth = taille / 110;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#f2f6ff";
    ctx.lineWidth = taille / 360;
    ctx.stroke();
    return canvas.toDataURL("image/png");
  };

  return Promise.all(images.map(charger)).then((imgs) => {
    window.__formes = imgs.map(contours);
    return imgs.length;
  });
}

function encoder(dossier, fichier, inverse = false) {
  const args = ["-v", "error", "-y", "-framerate", String(IPS), "-i", path.join(dossier, "f%04d.png")];
  if (inverse) args.push("-vf", "reverse");
  args.push("-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", fichier);
  execFileSync("ffmpeg", args);
}

async function rendre(page, nom, a, b, duree, mouvement) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "ficelle-"));
  const total = Math.round(duree * IPS);
  for (let f = 0; f < total; f += 1) {
    const t = f / IPS;
    const m = mouvement(f / (total - 1));
    const png = await page.evaluate(([a, b, m, t]) => window.__dessiner(window.__formes[a], window.__formes[b], m, t), [a, b, m, t]);
    fs.writeFileSync(path.join(dossier, `f${String(f).padStart(4, "0")}.png`), Buffer.from(png.split(",")[1], "base64"));
  }
  return dossier;
}

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  await page.goto(`${SITE}/robots.txt`);
  await page.evaluate(`(${moteur.toString()})(${JSON.stringify(IMAGES)}, ${TAILLE})`);

  for (let i = 0; i < IMAGES.length; i += 1) {
    const boucle = await rendre(page, `boucle-${i}`, i, i, PERIODE, () => 0);
    encoder(boucle, path.join(SORTIE, `boucle-${i}.mp4`));
    fs.copyFileSync(path.join(boucle, "f0000.png"), path.join(boucle, "poster.png"));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(boucle, "poster.png"), "-q:v", "4", path.join(SORTIE, `boucle-${i}.jpg`)]);
    if (i > 0) {
      // Transition : une période entière, pour retomber exactement sur la vague de la boucle suivante.
      const vers = await rendre(page, `vers-${i}`, i - 1, i, PERIODE, (p) => p);
      encoder(vers, path.join(SORTIE, `vers-${i}.mp4`));
      encoder(vers, path.join(SORTIE, `retour-${i}.mp4`), true);
    }
    console.log("chapitre", i + 1, "prêt");
  }
  await navigateur.close();
})();
