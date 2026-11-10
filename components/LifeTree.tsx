type Point = { x: number; y: number };

type Twig = Point & { angle: number; from: Point };
type Limb = {
  from: Point;
  to: Point;
  width: number;
  bend: number;
  twigs: Twig[];
};

function leafPath(x: number, y: number, angle: number) {
  const length = 38;
  const half = 14;
  const tip = { x: x + Math.cos(angle) * length, y: y + Math.sin(angle) * length };
  const left = { x: x + Math.cos(angle + 1.05) * half, y: y + Math.sin(angle + 1.05) * half };
  const right = { x: x + Math.cos(angle - 1.05) * half, y: y + Math.sin(angle - 1.05) * half };
  const stem = { x: x - Math.cos(angle) * 4, y: y - Math.sin(angle) * 4 };
  const cl = {
    x: (tip.x + left.x) / 2 + Math.cos(angle + 1.6) * 6,
    y: (tip.y + left.y) / 2 + Math.sin(angle + 1.6) * 6,
  };
  const cr = {
    x: (tip.x + right.x) / 2 + Math.cos(angle - 1.6) * 6,
    y: (tip.y + right.y) / 2 + Math.sin(angle - 1.6) * 6,
  };
  return `M ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Q ${cl.x.toFixed(1)} ${cl.y.toFixed(1)} ${left.x.toFixed(1)} ${left.y.toFixed(1)} Q ${stem.x.toFixed(1)} ${stem.y.toFixed(1)} ${right.x.toFixed(1)} ${right.y.toFixed(1)} Q ${cr.x.toFixed(1)} ${cr.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Z`;
}

function vein(x: number, y: number, angle: number) {
  const tip = { x: x + Math.cos(angle) * 30, y: y + Math.sin(angle) * 30 };
  return `M ${x.toFixed(1)} ${y.toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
}

function tapered(from: Point, to: Point, widthStart: number, widthEnd: number, bend: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const mx = (from.x + to.x) / 2 + nx * bend;
  const my = (from.y + to.y) / 2 + ny * bend;
  const a = { x: from.x + nx * widthStart, y: from.y + ny * widthStart };
  const b = { x: to.x + nx * widthEnd, y: to.y + ny * widthEnd };
  const c = { x: to.x - nx * widthEnd, y: to.y - ny * widthEnd };
  const d = { x: from.x - nx * widthStart, y: from.y - ny * widthStart };
  const mid = (widthStart + widthEnd) / 2;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${(mx + nx * mid).toFixed(1)} ${(my + ny * mid).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)} L ${c.x.toFixed(1)} ${c.y.toFixed(1)} Q ${(mx - nx * mid).toFixed(1)} ${(my - ny * mid).toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;
}

const SOURCES: Array<Omit<Limb, "twigs">> = [
  { from: { x: 386, y: 560 }, to: { x: 150, y: 470 }, width: 16, bend: 36 },
  { from: { x: 378, y: 520 }, to: { x: 188, y: 318 }, width: 15, bend: -30 },
  { from: { x: 392, y: 486 }, to: { x: 286, y: 188 }, width: 14, bend: 22 },
  { from: { x: 404, y: 458 }, to: { x: 400, y: 118 }, width: 13, bend: -16 },
  { from: { x: 418, y: 462 }, to: { x: 528, y: 140 }, width: 13, bend: 18 },
  { from: { x: 428, y: 498 }, to: { x: 640, y: 236 }, width: 15, bend: -28 },
  { from: { x: 422, y: 540 }, to: { x: 682, y: 390 }, width: 16, bend: 32 },
  { from: { x: 410, y: 578 }, to: { x: 668, y: 530 }, width: 14, bend: -20 },
];

const LIMBS: Limb[] = SOURCES.map((limb) => {
  const angle = Math.atan2(limb.to.y - limb.from.y, limb.to.x - limb.from.x);
  const twigs = Array.from({ length: 4 }, (_, twig) => {
    const spread = (-1.5 + twig) * 0.32;
    const twigAngle = angle + spread - 0.08;
    const length = 78 + twig * 14;
    return {
      x: limb.to.x + Math.cos(twigAngle) * length,
      y: limb.to.y + Math.sin(twigAngle) * length,
      angle: twigAngle,
      from: limb.to,
    };
  });
  return { ...limb, twigs };
});

export function LifeTree() {
  return (
    <svg className="life-tree" viewBox="40 40 740 900" role="img" aria-label="Arbre">
      <defs>
        <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--bark-dark)" />
          <stop offset="0.42" stopColor="var(--bark-mid)" />
          <stop offset="0.72" stopColor="var(--bark-light)" />
          <stop offset="1" stopColor="var(--bark-dark)" />
        </linearGradient>
        <linearGradient id="limb-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--limb-light)" />
          <stop offset="1" stopColor="var(--limb-dark)" />
        </linearGradient>
        <linearGradient id="leaf-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--leaf-light)" />
          <stop offset="1" stopColor="var(--leaf-dark)" />
        </linearGradient>
      </defs>
      <ellipse className="tree-shadow" cx="408" cy="900" rx="170" ry="16" />
      <path className="tree-root" d="M360 868 C300 888 240 908 188 924" />
      <path className="tree-root" d="M450 872 C520 892 590 908 660 922" />
      <path className="tree-root minor" d="M390 886 C360 910 330 928 292 940" />
      <path
        className="tree-trunk"
        fill="url(#bark)"
        d="M338 910 C328 800 346 680 362 590 C370 540 378 500 396 452 C412 500 422 548 434 600 C454 690 478 800 470 910 C452 936 356 936 338 910 Z"
      />
      <path className="tree-bark" d="M392 880 C386 740 388 620 398 500" />
      <path className="tree-ridge" d="M360 860 C356 740 366 640 374 560" />
      <path className="tree-ridge" d="M430 850 C438 730 434 640 426 560" />
      {LIMBS.map((limb, index) => (
        <g key={index}>
          <path className="tree-limb" fill="url(#limb-shade)" d={tapered(limb.from, limb.to, limb.width, 4.2, limb.bend)} />
          {limb.twigs.map((twig, twigIndex) => {
            const tone = (index + twigIndex) % 3;
            const leafClass = tone === 0 ? "tree-leaf" : tone === 1 ? "tree-leaf alt" : "tree-leaf deep";
            return (
              <g key={twigIndex}>
                <path className="tree-twig" fill="url(#limb-shade)" d={tapered(twig.from, twig, 4.4, 1.6, twigIndex % 2 === 0 ? 14 : -16)} />
                <path className={leafClass} d={leafPath(twig.x, twig.y, twig.angle)} />
                <path className="tree-vein" d={vein(twig.x, twig.y, twig.angle)} />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
