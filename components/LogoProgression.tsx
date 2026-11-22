/** Les points du logo, du dernier (en bas à droite) au premier (en haut) : la progression part de la fin. */
const POINTS: [number, number][] = [
  [168.1, 176.5],
  [123.8, 171.7],
  [70.6, 136.2],
  [29.2, 90.4],
  [27.2, 75.0],
  [116.8, 91.6],
  [128.0, 89.6],
  [112.1, 80.8],
  [148.7, 17.6],
];

const LONGUEURS = POINTS.reduce<number[]>((acc, p, i) => {
  if (i === 0) return [0];
  const q = POINTS[i - 1]!;
  return [...acc, acc[i - 1]! + Math.hypot(p[0] - q[0], p[1] - q[1])];
}, []);
const TOTAL = LONGUEURS[LONGUEURS.length - 1]!;

/** Bleu d'un point selon son âge : 0 = atteint il y a longtemps (foncé), 1 = tout juste atteint (clair). */
function bleu(age: number) {
  const t = Math.min(1, Math.max(0, age));
  const l = 30 + t * 42;
  const s = 88 - t * 8;
  return `hsl(203 ${s}% ${l}%)`;
}

const TRACE = "M" + POINTS.map(([x, y]) => `${x} ${y}`).join(" L");

/**
 * Le logo de Franck comme barre de progression. La ligne part du dernier point et remonte ;
 * à 100 %, tous les points sont reliés. Les points atteints sont blancs, entourés d'un léger fondu
 * bleu ; les fils prennent la même couleur, du bleu foncé (atteint il y a longtemps) au bleu clair
 * (atteint récemment).
 */
export function LogoProgression({
  progress,
  className,
  id,
}: {
  progress: number;
  className?: string;
  /** Identifiant unique, pour les dégradés SVG. */
  id: string;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const fait = p * TOTAL;
  const atteint = (i: number) => LONGUEURS[i]! <= fait + 0.01;
  const age = (i: number) => (fait <= 0 ? 1 : LONGUEURS[i]! / fait);

  return (
    <svg className={["logo-progression", className].filter(Boolean).join(" ")} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        {POINTS.slice(1).map(([x, y], k) => {
          const [x0, y0] = POINTS[k]!;
          return (
            <linearGradient key={k} id={`${id}-f${k}`} gradientUnits="userSpaceOnUse" x1={x0} y1={y0} x2={x} y2={y}>
              <stop offset="0" stopColor={bleu(age(k))} />
              <stop offset="1" stopColor={bleu(Math.min(age(k + 1), 1))} />
            </linearGradient>
          );
        })}
        {POINTS.map((_, i) => (
          <radialGradient key={i} id={`${id}-h${i}`}>
            <stop offset="0.28" stopColor="#fff" />
            <stop offset="0.45" stopColor={bleu(age(i))} stopOpacity="0.85" />
            <stop offset="1" stopColor={bleu(age(i))} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Le chemin qui reste à parcourir. */}
      <path d={TRACE} fill="none" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Les fils déjà tracés, chacun dans son bleu. */}
      {POINTS.slice(1).map(([x, y], k) => {
        const [x0, y0] = POINTS[k]!;
        const debut = LONGUEURS[k]!;
        const long = LONGUEURS[k + 1]! - debut;
        const part = Math.min(1, Math.max(0, (fait - debut) / long));
        if (part <= 0) return null;
        return (
          <line
            key={k}
            x1={x0}
            y1={y0}
            x2={x0 + (x - x0) * part}
            y2={y0 + (y - y0) * part}
            stroke={`url(#${id}-f${k})`}
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}

      {/* Les points : blancs avec un léger fondu bleu s'ils sont atteints, gris sinon. */}
      {POINTS.map(([x, y], i) =>
        atteint(i) ? (
          <g key={i}>
            <circle cx={x} cy={y} r="11" fill={`url(#${id}-h${i})`} />
            <circle cx={x} cy={y} r="3.6" fill="#fff" />
          </g>
        ) : (
          <circle key={i} cx={x} cy={y} r="3.6" fill="#3a3a3a" />
        ),
      )}
    </svg>
  );
}
