"use client";

import { useEffect, useRef } from "react";

const ORBES = 7;

/**
 * Le chargement de la PlayStation 2 : sept orbes blancs lumineux qui tournent sur un cercle.
 * Ils partent serrés en un amas, s'étirent en arc, s'écartent jusqu'à former l'anneau,
 * puis se resserrent ; le cercle bascule lentement en 3D. Les lueurs s'additionnent
 * quand les orbes se croisent. Dessiné en 2D, avec un seul sprite lumineux réutilisé.
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

    // Le sprite : un orbe blanc au cœur net et au halo doux.
    const sprite = document.createElement("canvas");
    const s = 64;
    sprite.width = s;
    sprite.height = s;
    const sc = sprite.getContext("2d")!;
    const g = sc.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(235,240,255,0.35)");
    g.addColorStop(1, "rgba(220,230,255,0)");
    sc.fillStyle = g;
    sc.fillRect(0, 0, s, s);

    const debut = performance.now();
    let frame = 0;

    const dessiner = (now: number) => {
      const t = calme ? 4 : (now - debut) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, px, px);
      ctx.globalCompositeOperation = "lighter";

      const R = px * 0.3;
      // Écart entre orbes : de l'amas serré à l'anneau complet, puis retour.
      const ouverture = 0.5 - 0.5 * Math.cos(t * 0.9);
      const ecart = 0.08 + ouverture * ((2 * Math.PI) / ORBES - 0.08);
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
      for (const [x, y, z] of points) {
        const persp = 1 / (1 - z / (px * 1.4));
        const taillePx = px * 0.15 * persp;
        ctx.globalAlpha = Math.min(1, 0.7 + persp * 0.3);
        ctx.drawImage(sprite, px / 2 + x * persp - taillePx / 2, px / 2 + y * persp - taillePx / 2, taillePx, taillePx);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (!calme) frame = window.requestAnimationFrame(dessiner);
    };

    frame = window.requestAnimationFrame(dessiner);
    return () => window.cancelAnimationFrame(frame);
  }, [taille]);

  return <canvas ref={ref} className={className ? `anneau-ps2 ${className}` : "anneau-ps2"} style={{ width: taille, height: taille }} aria-hidden="true" />;
}
