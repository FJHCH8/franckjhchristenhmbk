import type { CSSProperties } from "react";

/**
 * Les ronds de la constellation, aux places des gouttes du dessin de Franck,
 * dans l'ordre de la ligne : du haut, par l'amas, jusqu'en bas à droite.
 * Troisième valeur : la part de la ligne déjà tracée quand on atteint ce rond.
 */
export const RONDS: [number, number, number][] = [
  [148.7, 17.6, 0.0],
  [112.1, 80.8, 0.192],
  [128.0, 89.6, 0.24],
  [116.8, 91.6, 0.27],
  [27.2, 75.0, 0.51],
  [29.2, 90.4, 0.551],
  [70.6, 136.2, 0.714],
  [123.8, 171.7, 0.883],
  [168.1, 176.5, 1.0],
];

/** La ligne unique qui relie tous les ronds, du haut vers le bas. */
export const LIGNE = "M148.7 17.6 L112.1 80.8 L128.0 89.6 L116.8 91.6 L27.2 75.0 L29.2 90.4 L70.6 136.2 L123.8 171.7 L168.1 176.5";

/**
 * Le logo de Franck : des ronds de même taille reliés par une seule ligne fine.
 * Avec `anime`, la ligne se trace du haut vers le bas et chaque rond apparaît quand elle l'atteint.
 */
export function Logo({ className, anime = false, titre }: { className?: string; anime?: boolean; titre?: string }) {
  return (
    <svg
      className={[className, "logo", anime ? "logo-anime" : ""].filter(Boolean).join(" ")}
      viewBox="0 0 200 200"
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <path className="logo-ligne" d={LIGNE} pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <g className="logo-ronds" fill="currentColor">
        {RONDS.map(([x, y, t], i) => (
          <circle key={i} cx={x} cy={y} r={4} style={{ ["--t" as string]: t, transformOrigin: `${x}px ${y}px` } as CSSProperties} />
        ))}
      </g>
    </svg>
  );
}
