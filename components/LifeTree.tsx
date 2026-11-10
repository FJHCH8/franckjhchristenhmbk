type Point = { x: number; y: number };

type Twig = Point & { angle: number; from: Point };
type Limb = {
  from: Point;
  to: Point;
  angle: number;
  width: number;
  bend: number;
  twigs: Twig[];
};

function leafPath(x: number, y: number, angle: number) {
  const tip = 26;
  const half = 11;
  const px = x + Math.cos(angle) * tip;
  const py = y + Math.sin(angle) * tip;
  const lx = x + Math.cos(angle + 2.2) * half;
  const ly = y + Math.sin(angle + 2.2) * half;
  const rx = x + Math.cos(angle - 2.2) * half;
  const ry = y + Math.sin(angle - 2.2) * half;
  return `M ${px.toFixed(1)} ${py.toFixed(1)} L ${lx.toFixed(1)} ${ly.toFixed(1)} L ${rx.toFixed(1)} ${ry.toFixed(1)} Z`;
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

const LIMBS: Limb[] = [
  { from: { x: 392, y: 548 }, to: { x: 168, y: 430 }, angle: -2.55, width: 11, bend: 28, twigs: [] },
  { from: { x: 386, y: 512 }, to: { x: 210, y: 300 }, angle: -2.15, width: 10, bend: -22, twigs: [] },
  { from: { x: 398, y: 478 }, to: { x: 300, y: 196 }, angle: -1.85, width: 9, bend: 18, twigs: [] },
  { from: { x: 408, y: 452 }, to: { x: 392, y: 132 }, angle: -1.62, width: 8.5, bend: -14, twigs: [] },
  { from: { x: 418, y: 456 }, to: { x: 520, y: 150 }, angle: -1.25, width: 8.5, bend: 16, twigs: [] },
  { from: { x: 424, y: 490 }, to: { x: 610, y: 230 }, angle: -0.95, width: 9.5, bend: -20, twigs: [] },
  { from: { x: 416, y: 528 }, to: { x: 650, y: 360 }, angle: -0.55, width: 10, bend: 24, twigs: [] },
  { from: { x: 408, y: 562 }, to: { x: 630, y: 490 }, angle: -0.28, width: 9, bend: -18, twigs: [] },
].map((limb, index) => {
  const angle = Math.atan2(limb.to.y - limb.from.y, limb.to.x - limb.from.x);
  const twigs = Array.from({ length: 4 }, (_, twig) => {
    const spread = (-1.5 + twig) * 0.34;
    const twigAngle = angle + spread - 0.15;
    const length = 74 + twig * 12;
    return {
      x: limb.to.x + Math.cos(twigAngle) * length,
      y: limb.to.y + Math.sin(twigAngle) * length,
      angle: twigAngle,
      from: limb.to,
    };
  });
  return { ...limb, angle, twigs, bend: limb.bend * (index % 2 === 0 ? 1 : 1) };
});

export function LifeTree() {
  return (
    <svg className="life-tree" viewBox="0 0 800 980" role="img" aria-label="Arbre">
      <ellipse className="tree-shadow" cx="408" cy="918" rx="150" ry="18" />
      <path
        className="tree-trunk"
        d="M352 928 C346 820 358 700 372 600 C378 548 386 520 400 470 C414 520 424 560 434 610 C450 710 462 820 456 928 C438 948 370 948 352 928 Z"
      />
      <path className="tree-root" d="M360 900 C300 910 250 928 210 948" />
      <path className="tree-root" d="M448 904 C510 916 560 930 610 946" />
      <path className="tree-bark" d="M398 900 C394 760 396 640 404 500" />
      {LIMBS.map((limb, index) => (
        <g key={index}>
          <path className="tree-limb" d={tapered(limb.from, limb.to, limb.width, 3.2, limb.bend)} />
          {limb.twigs.map((twig, twigIndex) => {
            const tone = (index + twigIndex) % 3;
            const leafClass = tone === 0 ? "tree-leaf" : tone === 1 ? "tree-leaf alt" : "tree-leaf deep";
            return (
              <g key={twigIndex}>
                <path className="tree-twig" d={tapered(twig.from, twig, 3.1, 1.15, twigIndex % 2 === 0 ? 10 : -12)} />
                <path className={leafClass} d={leafPath(twig.x, twig.y, twig.angle)} />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
