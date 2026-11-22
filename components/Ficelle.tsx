"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Une seule ficelle lumineuse, dessinée en 2D (aucune 3D, aucune carte graphique exigée) :
 * elle trace le bocal, puis les contours des images des chapitres. D'une image à l'autre,
 * elle se délace en vagues depuis son début, puis se renoue en la forme suivante.
 * Environ 600 points par image : même un vieux téléphone la dessine sans peine.
 */

export type EtatParticules = {
  /** Avancée dans les chapitres : 0 = premier, 3 = dernier. */
  g: number;
  /** Le bocal tient encore, ou il a éclaté. */
  phase: "bocal" | "libre";
  /** 0 à 1 : fissure du bocal pendant qu'on appuie. */
  fissure: number;
  /** Instant de l'éclat (performance.now), 0 tant qu'il n'a pas eu lieu. */
  eclat: number;
  /** 0 à 1 : présence de la ficelle ; baisse en fondu hors de la partie fluide. */
  densite: number;
  /** Décalage vertical de la scène, en pixels, pour qu'elle suive la page. */
  decalage: number;
};

export type Progression = MutableRefObject<EtatParticules>;

const N = 600;
type Forme = Float32Array; // N points (x, y), unités : hauteur de la forme = 1, centre en 0

/** Répartit N points à intervalles réguliers le long d'un tracé. */
function reechantillonner(tracé: [number, number][]): Forme {
  const longueurs = [0];
  for (let i = 1; i < tracé.length; i += 1) {
    longueurs.push(longueurs[i - 1]! + Math.hypot(tracé[i]![0] - tracé[i - 1]![0], tracé[i]![1] - tracé[i - 1]![1]));
  }
  const total = longueurs[longueurs.length - 1]! || 1;
  const forme = new Float32Array(N * 2);
  let j = 1;
  for (let k = 0; k < N; k += 1) {
    const cible = (k / (N - 1)) * total;
    while (j < longueurs.length - 1 && longueurs[j]! < cible) j += 1;
    const a = tracé[j - 1]!;
    const b = tracé[j] ?? a;
    const f = (cible - longueurs[j - 1]!) / Math.max(1e-6, longueurs[j]! - longueurs[j - 1]!);
    forme[k * 2] = a[0] + (b[0] - a[0]) * Math.min(1, Math.max(0, f));
    forme[k * 2 + 1] = a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, f));
  }
  return forme;
}

/** Le bocal : sa silhouette d'un seul trait, puis une spirale dedans. */
function bocal(): Forme {
  const lisse = (t: number) => t * t * (3 - 2 * t);
  const rayon = (y: number) => (y > -0.12 ? 0.27 : y > -0.3 ? 0.27 + (0.15 - 0.27) * lisse((-0.12 - y) / 0.18) : 0.15);
  const t: [number, number][] = [[0.19, -0.43], [-0.19, -0.43]];
  for (let y = -0.4; y <= 0.42; y += 0.01) t.push([-rayon(y), y]);
  for (let a = 0; a <= 1; a += 0.04) t.push([-Math.cos(a * Math.PI) * 0.27, 0.42 + Math.sin(a * Math.PI) * 0.08]);
  for (let y = 0.42; y >= -0.4; y -= 0.01) t.push([rayon(y), y]);
  for (let s = 0; s <= 1; s += 0.004) {
    const a = s * Math.PI * 9;
    const r = 0.19 - s * 0.17;
    t.push([Math.cos(a) * r, 0.14 + Math.sin(a) * r * 1.15]);
  }
  return reechantillonner(t.map(([x, y]) => [x * 0.9, y * 0.9]));
}

function cercle(): Forme {
  const t: [number, number][] = [];
  for (let a = 0; a <= 1; a += 0.002) t.push([Math.cos(a * Math.PI * 6) * (0.15 + a * 0.25), Math.sin(a * Math.PI * 6) * (0.15 + a * 0.25)]);
  return reechantillonner(t);
}

function charger(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Les contours marqués d'une image, reliés en une seule ligne continue. */
function contours(img: HTMLImageElement): Forme {
  const max = 140;
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = Math.round(ratio >= 1 ? max : max * ratio);
  const h = Math.round(ratio >= 1 ? max / ratio : max);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.filter = "blur(1.6px)";
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) L[i] = ((px[i * 4]! * 0.2126 + px[i * 4 + 1]! * 0.7152 + px[i * 4 + 2]! * 0.0722) / 255) * (px[i * 4 + 3]! / 255);
  const bords: { x: number; y: number; g: number }[] = [];
  let fort = 0;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const at = (dx: number, dy: number) => L[(y + dy) * w + x + dx]!;
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
  // On tire environ 900 points sur les contours les plus marqués.
  const forts = bords.filter((b) => b.g / (fort || 1) > 0.18);
  const points: [number, number][] = [];
  for (let k = 0; k < 900 && forts.length; k += 1) {
    const b = forts[Math.floor(Math.random() * forts.length)]!;
    points.push([((b.x + (Math.random() - 0.5) * 1.6) / w - 0.5) * ratio, (b.y + (Math.random() - 0.5) * 1.6) / h - 0.5]);
  }
  if (points.length < 2) return cercle();
  // Une seule ligne : toujours vers le point le plus proche pas encore visité.
  const libre = points.map(() => true);
  let courant = points.reduce((best, p, i) => (p[0] < points[best]![0] ? i : best), 0);
  const ligne: [number, number][] = [];
  for (let n = 0; n < points.length; n += 1) {
    ligne.push(points[courant]!);
    libre[courant] = false;
    let meilleur = -1;
    let record = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      if (!libre[i]) continue;
      const d = (points[i]![0] - points[courant]![0]) ** 2 + (points[i]![1] - points[courant]![1]) ** 2;
      if (d < record) {
        record = d;
        meilleur = i;
      }
    }
    if (meilleur < 0) break;
    courant = meilleur;
  }
  // Lissage : la ligne coule.
  for (let passe = 0; passe < 3; passe += 1) {
    const copie = ligne.map((p) => [...p] as [number, number]);
    for (let i = 1; i < ligne.length - 1; i += 1) {
      ligne[i] = [(copie[i - 1]![0] + 2 * copie[i]![0] + copie[i + 1]![0]) / 4, (copie[i - 1]![1] + 2 * copie[i]![1] + copie[i + 1]![1]) / 4];
    }
  }
  return reechantillonner(ligne);
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lisse = (t: number) => t * t * (3 - 2 * t);

export default function Ficelle({
  images,
  progression,
  actif,
  lite,
  onPret,
}: {
  images: string[];
  progression: Progression;
  actif: boolean;
  lite: boolean;
  onPret: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const formes = useRef<{ bocal: Forme; images: (Forme | null)[]; secours: Forme } | null>(null);
  const souris = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    formes.current = { bocal: bocal(), images: images.map(() => null), secours: cercle() };
    let annule = false;
    images.forEach((src, i) => {
      void charger(src)
        .then((img) => {
          if (!annule && formes.current) formes.current.images[i] = contours(img);
        })
        .catch(() => undefined);
    });
    onPret();
    return () => {
      annule = true;
    };
  }, [images, onPret]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      souris.current.x = event.clientX;
      souris.current.y = event.clientY;
    };
    const onLeave = () => {
      souris.current.x = -9999;
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

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !actif) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2);
    const xs = new Float32Array(N);
    const ys = new Float32Array(N);
    let frame = 0;
    let temps = 0;
    let dernier = performance.now();
    let W = 0;
    let H = 0;

    const taille = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    taille();
    window.addEventListener("resize", taille);

    const dessiner = (now: number) => {
      frame = window.requestAnimationFrame(dessiner);
      const dt = Math.min(0.05, (now - dernier) / 1000);
      dernier = now;
      temps += dt;
      const f = formes.current;
      if (!f) return;
      const e = progression.current;
      const forme = (i: number) => f.images[i] ?? f.secours;

      // De quelle forme à quelle forme, et où en est le délacement.
      let A = f.bocal;
      let B = f.bocal;
      let m = 0;
      let eclat = 0;
      if (e.phase === "libre") {
        const depuis = e.eclat ? (now - e.eclat) / 1000 : 99;
        if (depuis < 2.4) {
          A = f.bocal;
          B = forme(0);
          m = clamp((depuis - 0.2) / 2);
          eclat = Math.max(0, 1 - depuis / 0.8);
        } else {
          const dernierChap = f.images.length - 1;
          const g = Math.max(0, Math.min(dernierChap, e.g));
          const i = Math.min(dernierChap, Math.floor(g));
          A = forme(i);
          B = i >= dernierChap ? A : forme(i + 1);
          m = i >= dernierChap ? 0 : clamp((g - i - 0.12) / 0.8);
        }
      }

      // Grande : la forme occupe presque toute la hauteur de l'écran.
      const echelle = Math.min(H * 0.86, W * 0.94);
      const cx = W / 2;
      const cy = H / 2 + e.decalage;
      const tremble = e.phase === "bocal" ? e.fissure * e.fissure * 0.012 : 0;
      const sx = souris.current.x;
      const sy = souris.current.y;

      for (let k = 0; k < N; k += 1) {
        const t = k / (N - 1);
        // La ficelle se délace depuis son début : chaque point part un peu après le précédent.
        const mi = lisse(clamp(m * 1.7 - t * 0.7));
        const lache = Math.sin(mi * Math.PI);
        let x = A[k * 2]! + (B[k * 2]! - A[k * 2]!) * mi;
        let y = A[k * 2 + 1]! + (B[k * 2 + 1]! - A[k * 2 + 1]!) * mi;
        // Détendue, elle flotte en grandes vagues.
        x += Math.sin(t * 22 + temps * 1.6) * 0.09 * lache + x * lache * 0.25;
        y += Math.cos(t * 17 - temps * 1.3) * 0.07 * lache;
        // Toujours, une petite vague comme à la surface de l'eau.
        x += Math.sin(t * 70 - temps * 1.8 + y * 3) * 0.004;
        y += Math.cos(t * 55 - temps * 1.4 + x * 3) * 0.004;
        // L'éclat du bocal : tout s'écarte d'un coup.
        x *= 1 + eclat * 0.9;
        y *= 1 + eclat * 0.9;
        if (tremble) {
          x += (Math.random() - 0.5) * tremble;
          y += (Math.random() - 0.5) * tremble;
        }
        let px = cx + x * echelle;
        let py = cy + y * echelle;
        // Le doigt ou la souris écarte la ficelle.
        const dx = px - sx;
        const dy = py - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          const d = Math.sqrt(d2) || 1;
          const pousse = (1 - d / 120) ** 2 * 38;
          px += (dx / d) * pousse;
          py += (dy / d) * pousse;
        }
        xs[k] = px;
        ys[k] = py;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (e.densite <= 0.002) return;
      ctx.beginPath();
      ctx.moveTo(xs[0]!, ys[0]!);
      for (let k = 1; k < N - 1; k += 1) {
        ctx.quadraticCurveTo(xs[k]!, ys[k]!, (xs[k]! + xs[k + 1]!) / 2, (ys[k]! + ys[k + 1]!) / 2);
      }
      ctx.lineTo(xs[N - 1]!, ys[N - 1]!);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Un halo large et pâle, puis le fil net : une lueur sans filtre coûteux.
      if (!lite) {
        ctx.globalAlpha = 0.16 * e.densite;
        ctx.strokeStyle = "#8fb4ff";
        ctx.lineWidth = 7;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.95 * e.densite;
      ctx.strokeStyle = "#f2f6ff";
      ctx.lineWidth = Math.max(1.6, echelle / 420);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    frame = window.requestAnimationFrame(dessiner);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", taille);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [actif, lite, progression]);

  return <canvas ref={ref} />;
}
