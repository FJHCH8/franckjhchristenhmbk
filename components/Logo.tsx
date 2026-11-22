import type { CSSProperties } from "react";

/** Les ronds de la constellation : position, rayon. */
const RONDS: [number, number, number][] = [
  [152, 24, 10],
  [28, 78, 16],
  [118, 86, 13],
  [70, 136, 17],
  [128, 168, 11],
  [172, 172, 12],
];

/** Les traits, dans l'ordre où ils se dessinent. */
const TRAITS = ["M152 24 L118 86", "M118 86 L70 136", "M70 136 L28 78", "M118 86 L128 168", "M70 136 L128 168", "M128 168 L172 172"];

/**
 * Le logo de Franck : sa constellation de gouttes, devenue des ronds reliés par des traits épais.
 * Avec `anime`, les traits se tracent puis les ronds apparaissent un à un.
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
      <g className="logo-traits" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {TRAITS.map((d, i) => (
          <path key={d} d={d} pathLength={1} style={{ ["--i" as string]: i } as CSSProperties} />
        ))}
      </g>
      <g className="logo-ronds" fill="currentColor">
        {RONDS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} style={{ ["--i" as string]: i, transformOrigin: `${x}px ${y}px` } as CSSProperties} />
        ))}
      </g>
    </svg>
  );
}
