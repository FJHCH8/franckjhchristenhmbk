"use client";

/**
 * Le logo d'AakanOS : les quatre étoiles à quatre branches de Franck, en SVG.
 * `icone` recadre la constellation ; sinon c'est la composition entière (fond noir).
 */
const ETOILES: [number, number][] = [
  [28.57, 34.9],
  [41.17, 52.17],
  [56.67, 61.7],
  [68.7, 61.87],
];
const R = 3.97;
const INTER = R * (26 / 60);

function chemin(cx: number, cy: number) {
  return Array.from({ length: 8 }, (_, i) => {
    const a = ((-90 + i * 45) * Math.PI) / 180;
    const r = i % 2 === 0 ? R : INTER;
    return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(3)} ${(cy + r * Math.sin(a)).toFixed(3)}`;
  }).join(" ") + "z";
}

export function LogoAakanos({
  taille = 96,
  icone = false,
  anime = false,
  className,
}: {
  taille?: number;
  icone?: boolean;
  anime?: boolean;
  className?: string;
}) {
  const vue = icone ? "22.6 22.35 52.07 52.07" : "0 0 100 100";
  return (
    <svg
      className={className}
      viewBox={vue}
      width={taille}
      height={taille}
      fill="#fff"
      aria-hidden="true"
    >
      {anime ? null : icone ? <rect x="22.6" y="22.35" width="52.07" height="52.07" fill="#000" /> : <rect width="100" height="100" fill="#000" />}
      {ETOILES.map(([x, y], i) => (
        <path key={i} className={anime ? `ak-etoile ak-etoile-${i}` : undefined} d={chemin(x, y)} />
      ))}
    </svg>
  );
}
