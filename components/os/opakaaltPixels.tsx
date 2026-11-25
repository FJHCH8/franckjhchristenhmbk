"use client";

/**
 * Opakaalt : le pixel art du jeu, dessiné ici pixel par pixel (aucune image importée) :
 * le blond, le femboy, la ville, le casino, l'hôtel, la Terre, les pièces d'échecs, le chat néon.
 * Tout reste habillé et sage : c'est un jeu de drague, pas autre chose.
 */
import { memo, type CSSProperties } from "react";

export type Px = [number, number, number, number, string];

const K = "#1b1b2a";
/** Dessine une liste de rectangles en pixels nets, avec un contour automatique (style console). */
export const Pixels = memo(function Pixels({ rects, w, h, taille = 4, contour = K, className, style }: { rects: Px[]; w: number; h: number; taille?: number; contour?: string | null; className?: string; style?: CSSProperties }) {
  const W = w + 2;
  const H = h + 2;
  const g: (string | null)[] = Array(W * H).fill(null);
  for (const [x, y, rw, rh, col] of rects) for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const X = x + i + 1;
    const Y = y + j + 1;
    if (X >= 0 && X < W && Y >= 0 && Y < H) g[Y * W + X] = col === "" ? null : col;
  }
  if (contour) {
    const o = [...g];
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      if (g[Y * W + X]) continue;
      if ((X > 0 && g[Y * W + X - 1]) || (X < W - 1 && g[Y * W + X + 1]) || (Y > 0 && g[(Y - 1) * W + X]) || (Y < H - 1 && g[(Y + 1) * W + X])) o[Y * W + X] = contour;
    }
    g.splice(0, g.length, ...o);
  }
  const runs: [number, number, number, string][] = [];
  for (let Y = 0; Y < H; Y++) {
    let X = 0;
    while (X < W) {
      const col = g[Y * W + X];
      if (!col) {
        X++;
        continue;
      }
      let n = 1;
      while (X + n < W && g[Y * W + X + n] === col) n++;
      runs.push([X, Y, n, col]);
      X += n;
    }
  }
  return (
    <svg className={className} style={style} viewBox={`0 0 ${W} ${H}`} width={W * taille} height={H * taille} shapeRendering="crispEdges" aria-hidden="true">
      {runs.map(([x, y, n, col], k) => (
        <rect key={k} x={x} y={y} width={n} height={1} fill={col} />
      ))}
    </svg>
  );
});

/* ---------------- Les personnages ---------------- */

const PEAU = "#f5c39e";
const PEAU_O = "#d9966f";
const ROUGE_JOUE = "#ff5f8a";
const BOUCHE = "#b03a48";

export type Pose = { pas?: 0 | 1; rougit?: number; colere?: boolean; coup?: boolean; sourire?: boolean; yeuxFermes?: boolean };

export function rectsBlond({ pas = 0, rougit = 0, colere = false, coup = false, sourire = false, yeuxFermes = false }: Pose): Px[] {
  const peau = rougit >= 3 ? "#ffb0a0" : PEAU;
  const Y = "#ffd84a";
  const Yo = "#e0a91f";
  const T = "#f4f4f4";
  const To = "#c9c9d6";
  const J = "#3657a8";
  const E = "#2a2a2a";
  const r: Px[] = [
    // cheveux en brosse, blond doré
    [5, 0, 8, 1, Y], [4, 1, 10, 2, Y], [6, 0, 1, 1, Yo], [9, 0, 1, 1, Yo], [4, 2, 10, 1, Yo], [4, 3, 1, 2, Yo],
    // tête carrée, grosse mâchoire
    [5, 3, 8, 6, peau], [4, 5, 1, 2, PEAU_O], [5, 8, 8, 1, PEAU_O], [6, 9, 6, 0, PEAU_O],
    // cou de taureau
    [7, 9, 5, 1, PEAU_O],
    // épaules, deltoïdes, bras énormes
    [3, 10, 12, 1, PEAU], [1, 11, 3, 6, PEAU], [14, 11, 3, 6, PEAU], [1, 13, 1, 3, PEAU_O], [16, 13, 1, 3, PEAU_O], [1, 17, 3, 2, PEAU_O], [14, 17, 3, 2, PEAU_O],
    // débardeur blanc moulant
    [4, 10, 10, 9, T], [7, 10, 4, 1, PEAU], [5, 13, 3, 1, To], [10, 13, 3, 1, To], [8, 15, 2, 1, To], [8, 17, 2, 1, To], [4, 11, 1, 8, To],
    // ceinture
    [4, 19, 10, 1, "#5a3a22"], [8, 19, 2, 1, "#e0c060"],
  ];
  // yeux, sourcils, bouche
  if (yeuxFermes) r.push([10, 6, 1, 1, K], [12, 6, 1, 1, K]);
  else r.push([10, 5, 1, 2, K], [12, 5, 1, 2, K]);
  if (colere) r.push([9, 4, 2, 1, K], [12, 4, 1, 1, K], [10, 7, 3, 1, K], [10, 8, 3, 0, K]);
  else r.push([10, 4, 1, 1, Yo], [12, 4, 1, 1, Yo], sourire ? [10, 7, 3, 1, BOUCHE] : [10, 7, 2, 1, BOUCHE]);
  if (rougit >= 1) r.push([9, 6, 1, 1, ROUGE_JOUE], [11, 6, 1, 1, ROUGE_JOUE]);
  if (rougit >= 2) r.push([8, 6, 1, 1, ROUGE_JOUE], [11, 7, 0, 0, ROUGE_JOUE], [13 - 1, 7, 0, 0, ROUGE_JOUE]);
  // jambes
  if (coup) {
    r.push([4, 20, 4, 4, J], [3, 24, 5, 2, E], [10, 19, 8, 3, J], [18, 17, 2, 6, E]);
  } else if (pas === 1) {
    r.push([3, 20, 4, 4, J], [8, 20, 2, 1, J], [11, 20, 4, 4, J], [2, 24, 5, 2, E], [11, 24, 6, 2, E]);
  } else {
    r.push([4, 20, 4, 4, J], [8, 20, 2, 1, J], [10, 20, 4, 4, J], [4, 24, 5, 2, E], [10, 24, 6, 2, E]);
  }
  r.push([5, 20, 1, 4, "#25407e"], [11, 20, 1, 4, "#25407e"]);
  return r;
}

export function rectsFemboy({ pas = 0, rougit = 0, sourire = false, yeuxFermes = false }: Pose): Px[] {
  const peau = rougit >= 3 ? "#ffb7a8" : PEAU;
  const P = "#ff9ccf";
  const Po = "#e06aa8";
  const H = "#b8a4ff";
  const Ho = "#8e78e6";
  const S = "#2d2d4a";
  const W = "#ffffff";
  const C = "#ff7fb8";
  const r: Px[] = [
    // longs cheveux roses
    [5, 1, 8, 1, P], [4, 2, 10, 2, P], [3, 3, 3, 10, P], [3, 10, 3, 3, Po], [12, 3, 2, 5, P], [7, 1, 2, 1, Po],
    // visage fin, frange
    [6, 4, 6, 5, peau], [6, 4, 6, 1, P], [7, 5, 1, 1, P], [5, 6, 1, 2, PEAU_O],
    [8, 9, 3, 1, PEAU_O],
    // sweat oversize lilas
    [4, 10, 10, 8, H], [5, 10, 8, 1, Ho], [3, 11, 2, 7, H], [13, 11, 2, 7, H], [3, 17, 2, 1, Ho], [13, 17, 2, 1, Ho], [3, 18, 2, 1, PEAU], [13, 18, 2, 1, PEAU],
    [8, 11, 1, 2, W], [10, 11, 1, 2, W], [8, 14, 3, 1, C], [9, 15, 1, 1, C], [4, 16, 1, 2, Ho],
    // jupe plissée, longue
    [5, 18, 8, 3, S], [6, 19, 1, 2, "#44446a"], [9, 19, 1, 2, "#44446a"], [11, 19, 1, 2, "#44446a"],
  ];
  // barbe rose, un ton plus foncé que les cheveux : favoris, joues basses et menton
  r.push([6, 7, 1, 3, Po], [11, 8, 1, 2, Po], [7, 8, 2, 2, Po], [9, 9, 2, 1, Po], [10, 8, 1, 1, Po], [8, 10, 3, 1, Po], [7, 9, 1, 1, "#c95694"], [10, 10, 1, 1, "#c95694"]);
  if (yeuxFermes) r.push([9, 6, 1, 1, K], [11, 6, 1, 1, K]);
  else r.push([9, 5, 1, 2, K], [11, 5, 1, 2, K], [9, 6, 1, 1, "#3aa0ff"], [11, 6, 1, 1, "#3aa0ff"], [8, 5, 1, 1, K]);
  r.push(sourire ? [9, 8, 3, 1, BOUCHE] : [10, 8, 1, 1, BOUCHE]);
  if (rougit >= 1) r.push([8, 7, 1, 1, ROUGE_JOUE], [11, 7, 1, 1, ROUGE_JOUE]);
  if (rougit >= 2) r.push([7, 7, 1, 1, ROUGE_JOUE], [10, 7, 1, 1, ROUGE_JOUE]);
  // jambes : chaussettes hautes blanches, baskets roses
  const jambe = (x: number, dx: number) => {
    r.push([x, 21, 2, 1, PEAU], [x, 22, 2, 2, W], [x - 1 + dx, 24, 3, 2, "#ff6fae"]);
  };
  if (pas === 1) { jambe(5, -1); jambe(11, 1); }
  else { jambe(6, 0); jambe(10, 1); }
  return r;
}

export function Blond(p: Pose & { taille?: number; className?: string; style?: CSSProperties }) {
  return <Pixels rects={rectsBlond(p)} w={20} h={26} taille={p.taille ?? 4} className={p.className} style={p.style} />;
}
export function Femboy(p: Pose & { taille?: number; className?: string; style?: CSSProperties }) {
  return <Pixels rects={rectsFemboy(p)} w={18} h={26} taille={p.taille ?? 4} className={p.className} style={p.style} />;
}

/* ---------------- Petits objets ---------------- */

export function CoeurPx({ taille = 3, couleur = "#ff4f8b", className, style }: { taille?: number; couleur?: string; className?: string; style?: CSSProperties }) {
  return (
    <Pixels
      rects={[[1, 0, 2, 1, couleur], [5, 0, 2, 1, couleur], [0, 1, 8, 2, couleur], [1, 3, 6, 1, couleur], [2, 4, 4, 1, couleur], [3, 5, 2, 1, couleur], [1, 1, 1, 1, "#ffd0e0"]]}
      w={8}
      h={6}
      taille={taille}
      className={className}
      style={style}
    />
  );
}

/** Le logo de James-games : chat les poings sur les hanches, pas content, brassard rouge au « # ». */
export function ChatNeon({ taille = 6 }: { taille?: number }) {
  const w = 25;
  const h = 30;
  const W = w + 2;
  const H = h + 2;
  type Role = "poil" | "mine" | "oeilG" | "oeilD" | "nez" | "bande" | "diese";
  const places: { x: number; y: number; rw: number; rh: number; role: Role }[] = [
    // oreilles, tête, cou, torse
    { x: 9, y: 0, rw: 1, rh: 2, role: "poil" }, { x: 15, y: 0, rw: 1, rh: 2, role: "poil" },
    { x: 9, y: 2, rw: 7, rh: 6, role: "poil" }, { x: 8, y: 3, rw: 9, rh: 4, role: "poil" },
    { x: 10, y: 8, rw: 5, rh: 2, role: "poil" },
    { x: 9, y: 9, rw: 7, rh: 10, role: "poil" }, { x: 8, y: 12, rw: 9, rh: 7, role: "poil" },
    // sourcils + bouche (pas content)
    { x: 9, y: 3, rw: 2, rh: 1, role: "mine" }, { x: 15, y: 3, rw: 2, rh: 1, role: "mine" },
    { x: 11, y: 7, rw: 1, rh: 1, role: "mine" }, { x: 12, y: 8, rw: 2, rh: 1, role: "mine" }, { x: 14, y: 7, rw: 1, rh: 1, role: "mine" },
    // yeux (le droit devient bleu après l’éclair)
    { x: 10, y: 5, rw: 1, rh: 1, role: "oeilG" }, { x: 14, y: 5, rw: 1, rh: 1, role: "oeilD" },
    { x: 12, y: 6, rw: 1, rh: 1, role: "nez" },
    // bras gauche : coude en dehors, poing sur la hanche
    { x: 7, y: 10, rw: 3, rh: 2, role: "poil" }, { x: 5, y: 11, rw: 3, rh: 2, role: "poil" },
    { x: 3, y: 12, rw: 3, rh: 3, role: "poil" }, { x: 2, y: 13, rw: 2, rh: 3, role: "poil" },
    { x: 4, y: 15, rw: 3, rh: 2, role: "poil" }, { x: 6, y: 17, rw: 4, rh: 3, role: "poil" },
    // bras droit : épaule, brassard, coude en bas, poing sur la hanche
    { x: 15, y: 10, rw: 2, rh: 3, role: "poil" },
    { x: 16, y: 9, rw: 7, rh: 7, role: "bande" },
    { x: 22, y: 16, rw: 2, rh: 3, role: "poil" }, { x: 21, y: 16, rw: 1, rh: 1, role: "poil" },
    { x: 18, y: 18, rw: 4, rh: 1, role: "poil" }, { x: 15, y: 17, rw: 5, rh: 3, role: "poil" },
    // jambes : debout, les poings restent sur les hanches
    { x: 8, y: 19, rw: 3, rh: 8, role: "poil" }, { x: 7, y: 27, rw: 5, rh: 2, role: "poil" },
    { x: 14, y: 19, rw: 3, rh: 8, role: "poil" }, { x: 13, y: 27, rw: 5, rh: 2, role: "poil" },
  ];
  // « # » blanc, 5×7, directement sur le rouge (pas de pastille)
  const diese = [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."];
  diese.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === "#") places.push({ x: 17 + dx, y: 9 + dy, rw: 1, rh: 1, role: "diese" }); }));

  const role: (Role | "contour" | null)[] = Array(W * H).fill(null);
  for (const p of places) for (let j = 0; j < p.rh; j++) for (let i = 0; i < p.rw; i++) {
    const X = p.x + i + 1, Y = p.y + j + 1;
    if (X >= 0 && X < W && Y >= 0 && Y < H) role[Y * W + X] = p.role;
  }
  const plein = (X: number, Y: number) => Y >= 0 && Y < H && X >= 0 && X < W && role[Y * W + X] !== null && role[Y * W + X] !== "contour";
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    if (role[Y * W + X]) continue;
    if (plein(X - 1, Y) || plein(X + 1, Y) || plein(X, Y - 1) || plein(X, Y + 1)) role[Y * W + X] = "contour";
  }
  const CLASSE: Record<string, string> = {
    poil: "op-chat-poil", mine: "op-chat-mine", oeilG: "op-chat-oeil-g", oeilD: "op-chat-oeil-d",
    nez: "op-chat-nez", bande: "op-chat-bande", diese: "op-chat-diese", contour: "op-chat-contour",
  };
  const runs: { x: number; y: number; n: number; c: string }[] = [];
  for (let Y = 0; Y < H; Y++) {
    let X = 0;
    while (X < W) {
      const r = role[Y * W + X];
      if (!r) { X++; continue; }
      let n = 1;
      while (X + n < W && role[Y * W + X + n] === r) n++;
      runs.push({ x: X, y: Y, n, c: CLASSE[r]! });
      X += n;
    }
  }
  return (
    <span className="op-chat-logo">
      <i className="op-chat-halo" aria-hidden="true" />
      <svg className="op-chat-neon" viewBox={`0 0 ${W} ${H}`} width={W * taille} height={H * taille} shapeRendering="crispEdges" aria-hidden="true">
        {runs.map((r, k) => <rect key={k} className={r.c} x={r.x} y={r.y} width={r.n} height={1} />)}
      </svg>
    </span>
  );
}

/** Les pièces d'échecs, en pixels (10 × 10). */
const FORMES: Record<string, string[]> = {
  p: ["..........", "....##....", "...####...", "...####...", "....##....", "...####...", "....##....", "...####...", "..######..", ".########."],
  r: ["..........", ".##.##.##.", ".########.", "..######..", "...####...", "...####...", "...####...", "..######..", ".########.", ".########."],
  n: ["..........", "....###...", "...#####..", "..###.###.", "..######..", "....####..", "...####...", "...####...", "..######..", ".########."],
  b: ["....##....", "...#..#...", "...##.#...", "..######..", "...####...", "....##....", "...####...", "...####...", "..######..", ".########."],
  q: [".#..#..#..", ".#.###.#..", ".#######..", "..#####...", "...###....", "...###....", "...###....", "..#####...", ".#######..", ".########."],
  k: ["....##....", "...####...", "....##....", "..######..", ".########.", "..######..", "...####...", "...####...", "..######..", ".########."],
};
export function PieceEchecs({ p, taille = 4 }: { p: string; taille?: number }) {
  const t = p.toLowerCase();
  const blanc = p !== t;
  const col = blanc ? "#fff3d6" : "#3b2a5c";
  const r: Px[] = [];
  FORMES[t]!.forEach((ligne, y) => [...ligne].forEach((ch, x) => ch === "#" && r.push([x, y, 1, 1, col])));
  return <Pixels rects={r} w={10} h={10} taille={taille} contour={blanc ? "#5a3e1a" : "#e9d7ff"} />;
}

/* ---------------- Décors ---------------- */

function alea(graine: number) {
  let s = graine;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

type Immeuble = { x: number; w: number; h: number; fen: [number, number][]; col: string; antenne: boolean };
function immeubles(graine: number, n: number, hmin: number, hmax: number, cols: string[]): Immeuble[] {
  const r = alea(graine);
  const l: Immeuble[] = [];
  let x = -4;
  for (let i = 0; i < n && x < 184; i++) {
    const w = 14 + Math.floor(r() * 16);
    const h = hmin + Math.floor(r() * (hmax - hmin));
    const fen: [number, number][] = [];
    for (let fy = 6; fy < h - 6; fy += 5) for (let fx = 3; fx < w - 3; fx += 4) if (r() < 0.55) fen.push([fx, fy]);
    l.push({ x, w, h, fen, col: cols[i % cols.length]!, antenne: r() < 0.35 });
    x += w + 1 + Math.floor(r() * 3);
  }
  return l;
}
const LOIN = immeubles(7, 14, 70, 150, ["#5b6d9a", "#52628c", "#64729e"]);
const PRES = immeubles(31, 12, 40, 110, ["#2f3a5e", "#38446c", "#2a3354", "#3c3460"]);

/** La ville aux gratte-ciel. anime : le jour passe, la nuit tombe, en boucle. */
export function Ville({ anime = false, nuit = false, couche = "tout" }: { anime?: boolean; nuit?: boolean; couche?: "tout" | "fond" | "avant" }) {
  const SOL = 250;
  const cls = anime ? " op-cycle" : nuit ? " op-fige-nuit" : " op-fige-jour";
  const fond = couche !== "avant";
  const avant = couche !== "fond";
  return (
    <svg className={`${couche === "avant" ? "op-ville-avant" : "op-ville"}${couche === "avant" ? "" : cls}`} viewBox="0 0 180 320" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden="true">
      {couche === "avant" ? <rect width="180" height="320" fill="none" /> : null}
      {fond ? <>
      <rect className="op-ciel-jour" width="180" height="320" fill="#7ec8ff" />
      <rect className="op-ciel-jour" y="150" width="180" height="100" fill="#b4e1ff" />
      <rect className="op-ciel-soir" width="180" height="320" fill="#ff8a5c" />
      <rect className="op-ciel-soir" y="120" width="180" height="130" fill="#ffc06a" />
      <rect className="op-ciel-nuit" width="180" height="320" fill="#0d1030" />
      <rect className="op-ciel-nuit" y="160" width="180" height="90" fill="#1d1f4d" />
      <g className="op-etoiles">
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={(i * 47) % 180} y={(i * 29) % 150} width="1" height="1" fill="#fff" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}
      </g>
      <g className="op-soleil">
        <rect x="-6" y="-6" width="12" height="12" fill="#fff27a" />
        <rect x="-8" y="-4" width="16" height="8" fill="#fff27a" />
        <rect x="-4" y="-8" width="8" height="16" fill="#fff27a" />
      </g>
      <g className="op-lune">
        <rect x="-5" y="-5" width="10" height="10" fill="#f2f0d8" />
        <rect x="-1" y="-5" width="6" height="6" fill="#0d1030" />
      </g>
      <g className="op-nuage">
        <rect x="20" y="40" width="26" height="6" fill="#fff" />
        <rect x="26" y="36" width="12" height="4" fill="#fff" />
        <rect x="110" y="70" width="30" height="6" fill="#fff" />
        <rect x="118" y="65" width="12" height="5" fill="#fff" />
      </g>
      {[LOIN, PRES].map((rang, k) => (
        <g key={k} className={k ? "op-pres" : "op-loin"}>
          {rang.map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${SOL - b.h})`}>
              <rect width={b.w} height={b.h} fill={b.col} />
              <rect width="2" height={b.h} fill="#00000022" />
              {b.antenne ? <rect x={Math.floor(b.w / 2)} y="-8" width="1" height="8" fill={b.col} /> : null}
              {b.antenne ? <rect className="op-balise" x={Math.floor(b.w / 2)} y="-9" width="1" height="1" fill="#ff3b3b" /> : null}
              {b.fen.map(([x, y], j) => (
                <g key={j}>
                  <rect x={x} y={y} width="2" height="3" fill={k ? "#1b2140" : "#3d4a72"} />
                  <rect className="op-fen" x={x} y={y} width="2" height="3" fill="#ffe27a" style={{ animationDelay: `${(j * 13 + i * 7) % 9 * 0.15}s` }} />
                </g>
              ))}
            </g>
          ))}
        </g>
      ))}
      <rect className="op-voile-nuit" width="180" height={SOL} fill="#06081f" />
      </> : null}
      {fond ? <>
      {/* trottoir (bande grise au-dessus de la chaussée) */}
      <rect y={SOL} width="180" height="14" fill="#9a9aa8" />
      <rect y={SOL} width="180" height="1" fill="#c8c8d2" />
      </> : null}
      {avant ? <>
      <rect y={SOL + 14} width="180" height="56" fill="#3a3a44" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={i * 16} y={SOL + 32} width="8" height="2" fill="#e8e8e8" />
      ))}
      <g className="op-voiture a">
        <rect x="0" y={SOL + 20} width="22" height="6" fill="#e84a5f" />
        <rect x="5" y={SOL + 16} width="11" height="4" fill="#e84a5f" />
        <rect x="7" y={SOL + 13} width="7" height="3" fill="#a7e0ff" />
        <rect x="3" y={SOL + 21} width="4" height="3" fill="#111" />
        <rect x="15" y={SOL + 21} width="4" height="3" fill="#111" />
        <rect className="op-phare" x="21" y={SOL + 17} width="1" height="2" fill="#fff79a" />
      </g>
      <g className="op-voiture b">
        <rect x="0" y={SOL + 34} width="26" height="7" fill="#ffd23f" />
        <rect x="6" y={SOL + 30} width="12" height="4" fill="#ffd23f" />
        <rect x="8" y={SOL + 31} width="8" height="3" fill="#a7e0ff" />
        <rect x="3" y={SOL + 40} width="5" height="3" fill="#111" />
        <rect x="18" y={SOL + 40} width="5" height="3" fill="#111" />
        <rect x="9" y={SOL + 28} width="6" height="2" fill="#222" />
      </g>
      <g className="op-voiture c">
        <rect x="0" y={SOL + 50} width="34" height="10" fill="#4fb0ff" />
        <rect x="2" y={SOL + 51} width="30" height="3" fill="#bfe6ff" />
        <rect x="4" y={SOL + 59} width="5" height="3" fill="#111" />
        <rect x="25" y={SOL + 59} width="5" height="3" fill="#111" />
      </g>
      </> : null}
    </svg>
  );
}

/** Le casino : murs rouges, machines à sous qui clignotent, lustre. */
export function Casino({ enseigne = true }: { enseigne?: boolean }) {
  return (
    <svg className="op-casino" viewBox="0 0 180 320" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="180" height="320" fill="#4a0d1f" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 18 + 8} y="0" width="2" height="210" fill="#6b1a30" />
      ))}
      <rect y="200" width="180" height="120" fill="#2a0612" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={i * 10} y="208" width="5" height="5" fill="#3d0b1c" />
      ))}
      {/* lustre */}
      <rect x="89" y="0" width="2" height="28" fill="#d9b44a" />
      <rect x="70" y="28" width="40" height="4" fill="#d9b44a" />
      {[72, 82, 92, 102].map((x) => (
        <rect key={x} className="op-ampoule" x={x} y="32" width="4" height="6" fill="#fff6c2" />
      ))}
      {/* machines à sous */}
      {[8, 140].map((x, k) => (
        <g key={x} transform={`translate(${x} 120)`}>
          <rect width="32" height="80" fill="#c9302c" />
          <rect x="2" y="2" width="28" height="10" fill="#ffd23f" />
          <rect x="4" y="18" width="24" height="16" fill="#111" />
          {[6, 14, 22].map((sx, j) => (
            <rect key={sx} className={`op-rouleau r${(j + k) % 3}`} x={sx} y="21" width="5" height="10" fill="#fff" />
          ))}
          {Array.from({ length: 5 }, (_, j) => (
            <rect key={j} className="op-led" x={3 + j * 6} y="5" width="3" height="3" fill="#ff3b3b" style={{ animationDelay: `${j * 0.15}s` }} />
          ))}
          <rect x="33" y="20" width="2" height="18" fill="#bbb" />
          <rect x="32" y="16" width="5" height="5" fill="#ff3b3b" />
          <rect x="4" y="44" width="24" height="30" fill="#8a1f1c" />
        </g>
      ))}
      {/* enseigne CASINO */}
      <g transform="translate(52 60)" opacity={enseigne ? 1 : 0}>
        <rect width="76" height="22" fill="#170510" />
        <rect className="op-neon-cadre" x="1" y="1" width="74" height="20" fill="none" stroke="#ffd23f" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** La rue de nuit, avec l'hôtel au néon. */
export function RueHotel() {
  return (
    <svg className="op-hotel" viewBox="0 0 180 320" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="180" height="320" fill="#0d1030" />
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={i} className="op-scintille" x={(i * 53) % 180} y={(i * 31) % 120} width="1" height="1" fill="#fff" style={{ animationDelay: `${(i % 5) * 0.5}s` }} />
      ))}
      <rect x="120" y="16" width="10" height="10" fill="#f2f0d8" />
      <rect x="124" y="16" width="6" height="6" fill="#0d1030" />
      {/* l'hôtel */}
      <rect x="96" y="70" width="84" height="180" fill="#3a2a4a" />
      {Array.from({ length: 8 }, (_, j) =>
        Array.from({ length: 5 }, (_, i) => (
          <rect key={`${i}-${j}`} x={102 + i * 15} y={80 + j * 17} width="8" height="9" fill={(i + j) % 3 ? "#ffe27a" : "#241a30"} />
        )),
      )}
      <rect x="122" y="214" width="30" height="36" fill="#1b1020" />
      <rect className="op-porte" x="124" y="216" width="26" height="34" fill="#ffcf6a" />
      <rect x="116" y="208" width="42" height="4" fill="#7a1f3a" />
      {/* immeubles de gauche */}
      <rect x="0" y="120" width="40" height="130" fill="#23284a" />
      <rect x="42" y="150" width="34" height="100" fill="#2b2f58" />
      {Array.from({ length: 6 }, (_, j) => (
        <rect key={j} x={6 + (j % 3) * 11} y={130 + Math.floor(j / 3) * 14} width="4" height="5" fill="#ffe27a" />
      ))}
      {/* lampadaire */}
      <rect x="80" y="170" width="2" height="80" fill="#555" />
      <rect x="76" y="166" width="10" height="4" fill="#777" />
      <rect className="op-lampe" x="77" y="170" width="8" height="3" fill="#fff2a8" />
      <rect y="250" width="180" height="10" fill="#6a6a78" />
      <rect y="260" width="180" height="60" fill="#22222a" />
    </svg>
  );
}

/** La Terre, vue de l'espace (le femboy vole au-dessus). */
export function Terre() {
  const r = alea(5);
  const pts: [number, number][] = [];
  for (let i = 0; i < 70; i++) pts.push([Math.floor(r() * 180), Math.floor(r() * 320)]);
  return (
    <svg className="op-espace" viewBox="0 0 180 320" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="180" height="320" fill="#05030f" />
      {pts.map(([x, y], i) => (
        <rect key={i} className="op-scintille" x={x} y={y} width="1" height="1" fill={i % 9 ? "#fff" : "#9ad0ff"} style={{ animationDelay: `${(i % 6) * 0.3}s` }} />
      ))}
      <defs>
        <clipPath id="op-globe">
          <circle cx="90" cy="300" r="110" />
        </clipPath>
      </defs>
      <circle cx="90" cy="300" r="114" fill="#6fc3ff" opacity=".35" />
      <g clipPath="url(#op-globe)">
        <rect x="-30" y="180" width="240" height="240" fill="#1f5fd1" />
        <g className="op-continents">
          {[0, 240].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              <rect x="10" y="200" width="40" height="18" fill="#3fbf5a" />
              <rect x="20" y="218" width="30" height="24" fill="#3fbf5a" />
              <rect x="34" y="242" width="12" height="20" fill="#3fbf5a" />
              <rect x="90" y="196" width="50" height="14" fill="#3fbf5a" />
              <rect x="100" y="210" width="70" height="26" fill="#3fbf5a" />
              <rect x="150" y="236" width="20" height="12" fill="#c9a35a" />
              <rect x="120" y="236" width="20" height="30" fill="#3fbf5a" />
              <rect x="190" y="210" width="34" height="30" fill="#3fbf5a" />
              <rect x="60" y="250" width="16" height="8" fill="#ffffff" opacity=".8" />
            </g>
          ))}
        </g>
        <rect x="-30" y="188" width="240" height="6" fill="#ffffff" opacity=".85" />
      </g>
    </svg>
  );
}
