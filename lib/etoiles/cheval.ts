/** Silhouette minimale, en pourcentages. */
const TRACE: Array<[number, number]> = [
  [22, 46],
  [34, 30],
  [46, 40],
  [58, 38],
  [70, 28],
  [82, 34],
  [88, 44],
  [78, 48],
  [66, 52],
  [70, 70],
  [66, 86],
  [58, 64],
  [46, 60],
  [38, 74],
  [34, 90],
  [30, 62],
  [16, 54],
];

const PAR_CHEVAL = 12;

function longueur() {
  let total = 0;
  const parts: number[] = [];
  for (let i = 1; i < TRACE.length; i++) {
    const d = Math.hypot(TRACE[i]![0] - TRACE[i - 1]![0], TRACE[i]![1] - TRACE[i - 1]![1]);
    parts.push(d);
    total += d;
  }
  return { total, parts };
}

export function chevauxPour(count: number) {
  return Math.max(1, Math.ceil(count / PAR_CHEVAL));
}

export function poseCheval(index: number, total: number) {
  const horse = Math.floor(index / PAR_CHEVAL);
  const local = index % PAR_CHEVAL;
  const inHorse = Math.min(PAR_CHEVAL, total - horse * PAR_CHEVAL);
  const { total: len, parts } = longueur();
  const t = inHorse <= 1 ? 0.45 : local / (inHorse - 1);
  let dist = t * len;
  let x = TRACE[0]![0];
  let y = TRACE[0]![1];
  for (let i = 1; i < TRACE.length; i++) {
    const part = parts[i - 1]!;
    if (dist <= part || i === TRACE.length - 1) {
      const k = part ? Math.min(1, dist / part) : 0;
      x = TRACE[i - 1]![0] + (TRACE[i]![0] - TRACE[i - 1]![0]) * k;
      y = TRACE[i - 1]![1] + (TRACE[i]![1] - TRACE[i - 1]![1]) * k;
      break;
    }
    dist -= part;
  }
  return { x, y, horse };
}

export const TRACE_CHEVAL = TRACE;
