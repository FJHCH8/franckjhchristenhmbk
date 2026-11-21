export type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounced: boolean;
  spawnY: number;
  alive: boolean;
};

export type Splash = {
  x: number;
  y: number;
  life: number;
};

export type Obstacle = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const GRAVITY = 1680;

export function createDrop(x: number, y: number, spread: number): Drop {
  return {
    x: x + (Math.random() - 0.5) * spread,
    y: y + Math.random() * 6,
    vx: (Math.random() - 0.5) * 28,
    vy: 70 + Math.random() * 150,
    bounced: false,
    spawnY: y,
    alive: true,
  };
}

export function stepDrop(drop: Drop, dt: number, obstacles: Obstacle[], viewW: number, viewH: number, splashes: Splash[]) {
  const nextVy = drop.vy + GRAVITY * dt;
  const nextY = drop.y + nextVy * dt;
  const nextX = drop.x + drop.vx * dt;

  if (!drop.bounced) {
    let hit: Obstacle | null = null;
    for (const obstacle of obstacles) {
      if (nextX < obstacle.left || nextX > obstacle.right) continue;
      if (drop.y > obstacle.top + 0.5) continue;
      if (nextY < obstacle.top) continue;
      if (obstacle.top < drop.spawnY + 8) continue;
      if (!hit || obstacle.top < hit.top) hit = obstacle;
    }
    if (hit) {
      drop.x = Math.max(hit.left, Math.min(hit.right, nextX));
      drop.y = hit.top;
      drop.vy = -Math.min(Math.abs(nextVy) * 0.42, 360);
      drop.vx = drop.vx * 0.35 + (Math.random() - 0.5) * 40;
      drop.bounced = true;
      splashes.push({ x: drop.x, y: hit.top, life: 1 });
      return;
    }
  }

  drop.x = nextX;
  drop.y = nextY;
  drop.vy = nextVy;
  if (drop.y > viewH + 28 || drop.x < -40 || drop.x > viewW + 40) drop.alive = false;
}

export function collectObstacles(viewH: number): Obstacle[] {
  const nodes = document.querySelectorAll(
    ".glass, .nav, .toggle, .seal, main h1, main h2, main p, main blockquote, main figcaption, main a, main dt, main dd, .footer-inner",
  );
  const list: Obstacle[] = [];
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width < 12 || rect.height < 8) continue;
    if (rect.bottom < 0 || rect.top > viewH) continue;
    list.push({
      left: rect.left - 1,
      right: rect.right + 1,
      top: rect.top,
      bottom: rect.bottom,
    });
  }
  list.sort((a, b) => a.top - b.top);
  return list;
}
