"use client";

import { useEffect, useRef } from "react";

/** Lettres en matrice 5 × 7 (une ligne par rangée, de haut en bas). */
const GLYPHES: Record<string, string[]> = {
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
};

const LIGNES = ["FRANCK J.H", "CHRISTEN"];

/** Le logo de Franck : ses points, dans l'ordre de la ligne. */
const LOGO: [number, number][] = [
  [148.7, 17.6],
  [112.1, 80.8],
  [128.0, 89.6],
  [116.8, 91.6],
  [27.2, 75.0],
  [29.2, 90.4],
  [70.6, 136.2],
  [123.8, 171.7],
  [168.1, 176.5],
];

type Lettre = { car: string; col: number; rang: number; depart: number; duree: number };

/**
 * En bas des paramètres, comme une enseigne en points lumineux : le logo de Franck dessiné en points gris,
 * et les lettres de son nom qui tombent une à une, au hasard, puis s'allument en arrivant à leur place.
 */
export function MatriceNom() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let largeur = 0;
    let hauteur = 0;
    let pas = 6;
    let cols = 0;
    let rangs = 0;
    let fond: Uint8Array = new Uint8Array(0);
    let lettres: Lettre[] = [];
    let cycle = 0;
    let frame = 0;
    let visible = true;

    const preparer = () => {
      largeur = canvas.clientWidth;
      hauteur = Math.round(largeur * 0.4);
      canvas.style.height = `${hauteur}px`;
      canvas.width = Math.round(largeur * dpr);
      canvas.height = Math.round(hauteur * dpr);
      pas = Math.max(4, Math.round(largeur / 70));
      cols = Math.floor(largeur / pas);
      rangs = Math.floor(hauteur / pas);

      // Le logo, tracé en petit puis lu point par point.
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rangs;
      const o = off.getContext("2d")!;
      const echelle = Math.min(cols, rangs) / 200;
      const dx = (cols - 200 * echelle) / 2;
      const dy = (rangs - 200 * echelle) / 2;
      o.strokeStyle = "#fff";
      o.fillStyle = "#fff";
      o.lineWidth = Math.max(1, 3.2 * echelle);
      o.lineJoin = "round";
      o.beginPath();
      LOGO.forEach(([x, y], i) => (i ? o.lineTo(dx + x * echelle, dy + y * echelle) : o.moveTo(dx + x * echelle, dy + y * echelle)));
      o.stroke();
      for (const [x, y] of LOGO) {
        o.beginPath();
        o.arc(dx + x * echelle, dy + y * echelle, Math.max(1.4, 7 * echelle), 0, Math.PI * 2);
        o.fill();
      }
      const data = o.getImageData(0, 0, cols, rangs).data;
      fond = new Uint8Array(cols * rangs);
      for (let i = 0; i < cols * rangs; i++) fond[i] = data[i * 4 + 3]!;

      // Les places des lettres : deux lignes centrées.
      const gl = 6; // largeur d'une lettre + espace, en points
      lettres = [];
      const hautTexte = LIGNES.length * 7 + (LIGNES.length - 1) * 3;
      const r0 = Math.round((rangs - hautTexte) / 2);
      LIGNES.forEach((ligne, li) => {
        const c0 = Math.round((cols - ligne.length * gl + 1) / 2);
        [...ligne].forEach((car, k) => {
          if (car === " ") return;
          lettres.push({ car, col: c0 + k * gl, rang: r0 + li * 10, depart: 0, duree: 0 });
        });
      });
      melanger();
    };

    // Chaque lettre part à un moment au hasard ; le tout dure environ 4 s, puis reste allumé, puis recommence.
    const melanger = () => {
      const ordre = lettres.map((_, i) => i).sort(() => Math.random() - 0.5);
      ordre.forEach((i, k) => {
        lettres[i]!.depart = k * 0.28 + Math.random() * 0.2;
        lettres[i]!.duree = 0.7 + Math.random() * 0.4;
      });
    };

    const point = (c: number, r: number, couleur: string, taille = 0.62) => {
      ctx.fillStyle = couleur;
      ctx.beginPath();
      ctx.arc((c + 0.5) * pas, (r + 0.5) * pas, (pas * taille) / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const DUREE = 8.5;
    let debut = performance.now();

    const dessiner = (now: number) => {
      const t = calme ? DUREE * 0.8 : ((now - debut) / 1000) % DUREE;
      const tour = Math.floor((now - debut) / 1000 / DUREE);
      if (tour !== cycle) {
        cycle = tour;
        melanger();
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);
      // La grille et le logo, en gris.
      for (let r = 0; r < rangs; r++) {
        for (let c = 0; c < cols; c++) {
          const a = fond[r * cols + c]!;
          if (a > 60) point(c, r, "#4a4a4a", 0.7);
          else if ((r + c) % 2 === 0) point(c, r, "#141414", 0.45);
        }
      }
      // Les lettres : grises pendant la chute, blanches une fois posées.
      const extinction = t > DUREE - 0.8 ? 1 - (t - (DUREE - 0.8)) / 0.8 : 1;
      for (const l of lettres) {
        const p = (t - l.depart) / l.duree;
        if (p <= 0) continue;
        const e = Math.min(1, p);
        const chute = 1 - (1 - e) ** 3; // arrive vite puis ralentit
        const rebond = e >= 1 ? 0 : 0;
        const r = Math.round(-9 + (l.rang + 9) * chute) + rebond;
        const pose = p >= 1;
        const age = pose ? Math.min(1, (t - l.depart - l.duree) / 0.35) : 0;
        const g = GLYPHES[l.car]!;
        for (let y = 0; y < 7; y++) {
          for (let x = 0; x < 5; x++) {
            if (g[y]![x] !== "1") continue;
            const rr = r + y;
            if (rr < 0) continue;
            if (pose) {
              const v = Math.round((180 + 75 * age) * extinction + 74 * (1 - extinction));
              point(l.col + x, rr, `rgb(${v},${v},${v})`, 0.78);
            } else point(l.col + x, rr, "#8a8a8a", 0.7);
          }
        }
      }
      if (!calme && visible) frame = window.requestAnimationFrame(dessiner);
    };

    preparer();
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible && !calme) {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(dessiner);
      }
    });
    io.observe(canvas);
    const surTaille = () => {
      preparer();
      debut = performance.now();
    };
    window.addEventListener("resize", surTaille);
    frame = window.requestAnimationFrame(dessiner);
    return () => {
      window.cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("resize", surTaille);
    };
  }, []);

  return <canvas ref={ref} className="matrice-nom" aria-label="Franck J.H Christen" role="img" />;
}
