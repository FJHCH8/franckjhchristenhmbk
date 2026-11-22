"use client";

import { useEffect, useRef } from "react";

const ORBES = 7;

/**
 * Le chargement de la PlayStation 2 : sept ronds blancs qui tournent sur un cercle.
 * Ils partent serrés en un amas, s'étirent en arc, s'écartent jusqu'à former l'anneau,
 * puis se resserrent ; le cercle bascule lentement en 3D. Des ronds blancs nets,
 * sans halo lumineux. Dessiné en 2D.
 */
export function AnneauPS2({ taille = 120, className }: { taille?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(taille * dpr);
    canvas.width = px;
    canvas.height = px;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const debut = performance.now();
    let frame = 0;

    const dessiner = (now: number) => {
      const t = calme ? 4 : (now - debut) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, px, px);

      const R = px * 0.3;
      // Écart entre orbes : de l'amas serré à l'anneau complet, puis retour.
      const ouverture = 0.5 - 0.5 * Math.cos(t * 0.9);
      const ecart = 0.3 + ouverture * ((2 * Math.PI) / ORBES - 0.3);
      const phase = t * 2.4;
      // Le cercle bascule en 3D autour de deux axes.
      const ax = 0.9 + Math.sin(t * 0.55) * 0.75;
      const ay = Math.sin(t * 0.37) * 0.9;
      const az = t * 0.25;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const cz = Math.cos(az);
      const sz = Math.sin(az);

      const points: [number, number, number][] = [];
      for (let i = 0; i < ORBES; i += 1) {
        const a = phase + i * ecart;
        let x = Math.cos(a) * R;
        let y = Math.sin(a) * R;
        let z = 0;
        // Rotations X, Y puis Z.
        [y, z] = [y * cx - z * sx, y * sx + z * cx];
        [x, z] = [x * cy + z * sy, -x * sy + z * cy];
        [x, y] = [x * cz - y * sz, x * sz + y * cz];
        points.push([x, y, z]);
      }
      points.sort((p, q) => p[2] - q[2]);
      ctx.fillStyle = "#fff";
      for (const [x, y, z] of points) {
        const persp = 1 / (1 - z / (px * 1.4));
        const rayon = px * 0.028 * persp;
        ctx.beginPath();
        ctx.arc(px / 2 + x * persp, px / 2 + y * persp, rayon, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!calme) frame = window.requestAnimationFrame(dessiner);
    };

    frame = window.requestAnimationFrame(dessiner);
    return () => window.cancelAnimationFrame(frame);
  }, [taille]);

  return <canvas ref={ref} className={className ? `anneau-ps2 ${className}` : "anneau-ps2"} style={{ width: taille, height: taille }} aria-hidden="true" />;
}
