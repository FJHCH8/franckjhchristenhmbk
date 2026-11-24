/**
 * Opakaalt : les cerveaux des jeux (morpion, puissance 4, échecs, qui-suis-je, bataille navale)
 * et ceux du blond, calibrés par le niveau Soumis / Versa / Top.
 * L'indice, lui, joue au mieux pour toi.
 */
import { paramsDiff, type Difficulte } from "./opakaaltDiff";

/* ---------------- Morpion ---------------- */

export type Case = "" | "X" | "O";
const LIGNES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
export function gagnantMorpion(g: Case[]): { qui: Case; ligne: number[] } | null {
  for (const l of LIGNES) {
    const [a, b, c] = l as [number, number, number];
    if (g[a] && g[a] === g[b] && g[a] === g[c]) return { qui: g[a], ligne: l };
  }
  return null;
}
function minimaxMorpion(g: Case[], tour: "X" | "O", moi: "X" | "O", prof: number): number {
  const w = gagnantMorpion(g);
  if (w) return w.qui === moi ? 10 - prof : prof - 10;
  if (g.every(Boolean)) return 0;
  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (g[i]) continue;
    g[i] = tour;
    scores.push(minimaxMorpion(g, tour === "X" ? "O" : "X", moi, prof + 1));
    g[i] = "";
  }
  return tour === moi ? Math.max(...scores) : Math.min(...scores);
}
export function meilleurMorpion(g: Case[], moi: "X" | "O"): number {
  let best = -99;
  let coup = -1;
  for (let i = 0; i < 9; i++) {
    if (g[i]) continue;
    const h = [...g];
    h[i] = moi;
    const s = minimaxMorpion(h, moi === "X" ? "O" : "X", moi, 1) + (i === 4 ? 0.1 : 0);
    if (s > best) { best = s; coup = i; }
  }
  return coup;
}
/** Le blond joue « O ». */
export function blondMorpion(g: Case[], d: Difficulte, nuls = 0): number {
  const libres = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  const p = paramsDiff(d);
  const distraction = Math.min(0.92, p.morpion + nuls * p.morpionNuls);
  if (Math.random() < distraction) return libres[Math.floor(Math.random() * libres.length)]!;
  return meilleurMorpion(g, "O");
}

/* ---------------- Puissance 4 (7 colonnes × 6 rangées) ---------------- */

export const COLS = 7;
export const RANGS = 6;
export type Grille4 = Case[]; // index r*7+c, r = 0 en haut
export function chute(g: Grille4, c: number): number {
  for (let r = RANGS - 1; r >= 0; r--) if (!g[r * COLS + c]) return r;
  return -1;
}
export function gagnant4(g: Grille4): { qui: Case; cases: number[] } | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
  for (let r = 0; r < RANGS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = g[r * COLS + c];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        const cases = [r * COLS + c];
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= RANGS || cc < 0 || cc >= COLS || g[rr * COLS + cc] !== v) break;
          cases.push(rr * COLS + cc);
        }
        if (cases.length === 4) return { qui: v, cases };
      }
    }
  return null;
}
function fenetre(v: Case[], moi: Case): number {
  const lui = moi === "X" ? "O" : "X";
  const m = v.filter((x) => x === moi).length;
  const l = v.filter((x) => x === lui).length;
  const e = v.filter((x) => !x).length;
  if (m === 4) return 1000;
  if (m === 3 && e === 1) return 6;
  if (m === 2 && e === 2) return 2;
  if (l === 3 && e === 1) return -8;
  if (l === 2 && e === 2) return -1;
  return 0;
}
function eval4(g: Grille4, moi: Case): number {
  let s = 0;
  for (let r = 0; r < RANGS; r++) if (g[r * COLS + 3] === moi) s += 3;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
  for (let r = 0; r < RANGS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of dirs) {
        const rr = r + dr * 3;
        const cc = c + dc * 3;
        if (rr < 0 || rr >= RANGS || cc < 0 || cc >= COLS) continue;
        s += fenetre([0, 1, 2, 3].map((k) => g[(r + dr * k) * COLS + c + dc * k]!), moi);
      }
  return s;
}
const ORDRE = [3, 2, 4, 1, 5, 0, 6];
function nega4(g: Grille4, prof: number, a: number, b: number, tour: "X" | "O"): number {
  const w = gagnant4(g);
  const autre = tour === "X" ? "O" : "X";
  if (w) return w.qui === tour ? 100000 + prof : -100000 - prof;
  if (g.every(Boolean)) return 0;
  if (prof === 0) return eval4(g, tour) - eval4(g, autre) * 0.5;
  let best = -Infinity;
  for (const c of ORDRE) {
    const r = chute(g, c);
    if (r < 0) continue;
    g[r * COLS + c] = tour;
    const s = -nega4(g, prof - 1, -b, -a, autre);
    g[r * COLS + c] = "";
    if (s > best) best = s;
    if (best > a) a = best;
    if (a >= b) break;
  }
  return best;
}
export function meilleur4(g: Grille4, moi: "X" | "O", prof = 5): number {
  let best = -Infinity;
  let coup = -1;
  for (const c of ORDRE) {
    const r = chute(g, c);
    if (r < 0) continue;
    const h = [...g];
    h[r * COLS + c] = moi;
    const s = -nega4(h, prof - 1, -Infinity, Infinity, moi === "X" ? "O" : "X");
    if (s > best) { best = s; coup = c; }
  }
  return coup;
}
export function blond4(g: Grille4, d: Difficulte): number {
  const libres = [0, 1, 2, 3, 4, 5, 6].filter((c) => chute(g, c) >= 0);
  const p = paramsDiff(d);
  if (Math.random() < p.p4) return libres[Math.floor(Math.random() * libres.length)]!;
  return meilleur4(g, "O", p.p4prof);
}

/* ---------------- Échecs ---------------- */

/** Pièces : majuscules = blancs (toi), minuscules = noirs (le blond). Index r*8+c, r = 0 : 8e rangée. */
export type Echiquier = {
  b: string[];
  trait: "w" | "b";
  roque: string; // "KQkq"
  ep: number;
  demi: number;
  vus: Record<string, number>;
};
export type Coup = { de: number; a: number; promo?: string; roque?: boolean; ep?: boolean; prise?: string };

export function depart(): Echiquier {
  const r8 = "rnbqkbnr".split("");
  const b = [...r8, ...Array(8).fill("p"), ...Array(32).fill(""), ...Array(8).fill("P"), ...r8.map((x) => x.toUpperCase())];
  const e: Echiquier = { b, trait: "w", roque: "KQkq", ep: -1, demi: 0, vus: {} };
  e.vus[cle(e)] = 1;
  return e;
}
const blanc = (p: string) => p !== "" && p === p.toUpperCase();
const camp = (p: string): "w" | "b" | null => (p ? (blanc(p) ? "w" : "b") : null);
const R = (i: number) => i >> 3;
const C = (i: number) => i & 7;
const dans = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const CAV = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const ROI = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const DROIT = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function attaque(b: string[], i: number, par: "w" | "b"): boolean {
  const r = R(i);
  const c = C(i);
  const P = par === "w" ? "P" : "p";
  const dr = par === "w" ? 1 : -1; // un pion blanc attaque vers le haut : il est en dessous
  for (const dc of [-1, 1]) if (dans(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === P) return true;
  const N = par === "w" ? "N" : "n";
  for (const [a, d] of CAV) if (dans(r + a!, c + d!) && b[(r + a!) * 8 + c + d!] === N) return true;
  const K = par === "w" ? "K" : "k";
  for (const [a, d] of ROI) if (dans(r + a!, c + d!) && b[(r + a!) * 8 + c + d!] === K) return true;
  const lignes = (dirs: number[][], pieces: string) => {
    for (const [a, d] of dirs) {
      let rr = r + a!;
      let cc = c + d!;
      while (dans(rr, cc)) {
        const p = b[rr * 8 + cc]!;
        if (p) {
          if (camp(p) === par && pieces.includes(p.toLowerCase())) return true;
          break;
        }
        rr += a!;
        cc += d!;
      }
    }
    return false;
  };
  return lignes(DIAG, "bq") || lignes(DROIT, "rq");
}
function roiDe(b: string[], s: "w" | "b") {
  return b.indexOf(s === "w" ? "K" : "k");
}
export function enEchec(e: Echiquier, s: "w" | "b" = e.trait) {
  return attaque(e.b, roiDe(e.b, s), s === "w" ? "b" : "w");
}

function pseudo(e: Echiquier): Coup[] {
  const l: Coup[] = [];
  const s = e.trait;
  const adv = s === "w" ? "b" : "w";
  for (let i = 0; i < 64; i++) {
    const p = e.b[i]!;
    if (camp(p) !== s) continue;
    const r = R(i);
    const c = C(i);
    const t = p.toLowerCase();
    const ajoute = (a: number, x: Partial<Coup> = {}) => l.push({ de: i, a, prise: e.b[a] || undefined, ...x });
    if (t === "p") {
      const d = s === "w" ? -1 : 1;
      const debut = s === "w" ? 6 : 1;
      const fin = s === "w" ? 0 : 7;
      if (dans(r + d, c) && !e.b[(r + d) * 8 + c]) {
        ajoute((r + d) * 8 + c, r + d === fin ? { promo: s === "w" ? "Q" : "q" } : {});
        if (r === debut && !e.b[(r + 2 * d) * 8 + c]) ajoute((r + 2 * d) * 8 + c);
      }
      for (const dc of [-1, 1]) {
        if (!dans(r + d, c + dc)) continue;
        const a = (r + d) * 8 + c + dc;
        if (camp(e.b[a]!) === adv) ajoute(a, r + d === fin ? { promo: s === "w" ? "Q" : "q" } : {});
        else if (a === e.ep) ajoute(a, { ep: true, prise: s === "w" ? "p" : "P" });
      }
    } else if (t === "n" || t === "k") {
      for (const [a, d] of t === "n" ? CAV : ROI) {
        if (!dans(r + a!, c + d!)) continue;
        const j = (r + a!) * 8 + c + d!;
        if (camp(e.b[j]!) !== s) ajoute(j);
      }
      if (t === "k") {
        const rang = s === "w" ? 7 : 0;
        if (i === rang * 8 + 4 && !attaque(e.b, i, adv)) {
          const K = s === "w" ? "K" : "k";
          const Q = s === "w" ? "Q" : "q";
          if (e.roque.includes(K) && !e.b[rang * 8 + 5] && !e.b[rang * 8 + 6] && !attaque(e.b, rang * 8 + 5, adv) && !attaque(e.b, rang * 8 + 6, adv))
            ajoute(rang * 8 + 6, { roque: true });
          if (e.roque.includes(Q) && !e.b[rang * 8 + 3] && !e.b[rang * 8 + 2] && !e.b[rang * 8 + 1] && !attaque(e.b, rang * 8 + 3, adv) && !attaque(e.b, rang * 8 + 2, adv))
            ajoute(rang * 8 + 2, { roque: true });
        }
      }
    } else {
      const dirs = t === "b" ? DIAG : t === "r" ? DROIT : [...DIAG, ...DROIT];
      for (const [a, d] of dirs) {
        let rr = r + a!;
        let cc = c + d!;
        while (dans(rr, cc)) {
          const j = rr * 8 + cc;
          const q = e.b[j]!;
          if (camp(q) === s) break;
          ajoute(j);
          if (q) break;
          rr += a!;
          cc += d!;
        }
      }
    }
  }
  return l;
}

function cle(e: Echiquier) {
  return e.b.map((p) => p || ".").join("") + e.trait + e.roque + e.ep;
}

export function jouer(e: Echiquier, m: Coup, compter = true): Echiquier {
  const b = [...e.b];
  const p = b[m.de]!;
  b[m.a] = m.promo ?? p;
  b[m.de] = "";
  if (m.ep) b[m.a + (e.trait === "w" ? 8 : -8)] = "";
  if (m.roque) {
    const rang = R(m.a);
    if (C(m.a) === 6) { b[rang * 8 + 5] = b[rang * 8 + 7]!; b[rang * 8 + 7] = ""; }
    else { b[rang * 8 + 3] = b[rang * 8]!; b[rang * 8] = ""; }
  }
  let roque = e.roque;
  const enleve = (x: string) => (roque = roque.replace(x, ""));
  if (p === "K") { enleve("K"); enleve("Q"); }
  if (p === "k") { enleve("k"); enleve("q"); }
  for (const [sq, x] of [[63, "K"], [56, "Q"], [7, "k"], [0, "q"]] as const) if (m.de === sq || m.a === sq) enleve(x);
  const ep = p.toLowerCase() === "p" && Math.abs(m.a - m.de) === 16 ? (m.a + m.de) / 2 : -1;
  const n: Echiquier = { b, trait: e.trait === "w" ? "b" : "w", roque, ep, demi: p.toLowerCase() === "p" || m.prise ? 0 : e.demi + 1, vus: e.vus };
  if (compter) {
    const k = cle(n);
    n.vus = { ...e.vus, [k]: (e.vus[k] ?? 0) + 1 };
  }
  return n;
}

export function coupsLegaux(e: Echiquier): Coup[] {
  return pseudo(e).filter((m) => !enEchec(jouer(e, m, false), e.trait));
}

export type Fin = null | { type: "mat"; gagnant: "w" | "b" } | { type: "pat" | "repetition" | "cinquante" | "materiel" };
export function finPartie(e: Echiquier): Fin {
  const l = coupsLegaux(e);
  if (!l.length) return enEchec(e) ? { type: "mat", gagnant: e.trait === "w" ? "b" : "w" } : { type: "pat" };
  if (e.demi >= 100) return { type: "cinquante" };
  if ((e.vus[cle(e)] ?? 0) >= 3) return { type: "repetition" };
  const reste = e.b.filter((p) => p && p.toLowerCase() !== "k").map((p) => p.toLowerCase());
  if (!reste.length || (reste.length === 1 && (reste[0] === "n" || reste[0] === "b"))) return { type: "materiel" };
  return null;
}

export const VALEUR: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
export function materiel(b: string[], s: "w" | "b") {
  let v = 0;
  for (const p of b) if (p) v += (camp(p) === s ? 1 : -1) * VALEUR[p.toLowerCase()]!;
  return v;
}
function evaluer(e: Echiquier, s: "w" | "b"): number {
  let v = 0;
  const adv = s === "w" ? "b" : "w";
  for (let i = 0; i < 64; i++) {
    const p = e.b[i]!;
    if (!p) continue;
    const t = p.toLowerCase();
    let x = VALEUR[t]!;
    const r = R(i);
    const c = C(i);
    const centre = 3.5 - Math.max(Math.abs(3.5 - r), Math.abs(3.5 - c));
    if (t === "n" || t === "b") x += centre * 6;
    if (t === "p") x += (blanc(p) ? 6 - r : r - 1) * 6 + (c >= 2 && c <= 5 ? 4 : 0);
    if (t === "q") x += centre * 2;
    v += camp(p) === s ? x : -x;
  }
  // En fin de partie gagnée : pousser le roi adverse au bord, rapprocher le sien
  const m = materiel(e.b, s);
  if (m > 300) {
    const k = roiDe(e.b, adv);
    const mk = roiDe(e.b, s);
    const bord = Math.max(Math.abs(3.5 - R(k)), Math.abs(3.5 - C(k)));
    const dist = Math.max(Math.abs(R(k) - R(mk)), Math.abs(C(k) - C(mk)));
    v += bord * 12 - dist * 6;
  }
  return v;
}
function trier(l: Coup[]) {
  return l.sort((x, y) => (y.prise ? VALEUR[y.prise.toLowerCase()]! : 0) + (y.promo ? 800 : 0) - ((x.prise ? VALEUR[x.prise.toLowerCase()]! : 0) + (x.promo ? 800 : 0)));
}
function nega(e: Echiquier, prof: number, a: number, b: number, ply: number): number {
  if (prof === 0) {
    if (enEchec(e) && !coupsLegaux(e).length) return -100000 + ply;
    return evaluer(e, e.trait);
  }
  const l = coupsLegaux(e);
  if (!l.length) return enEchec(e) ? -100000 + ply : 0;
  let best = -Infinity;
  for (const m of trier(l)) {
    const s = -nega(jouer(e, m, false), prof - 1, -b, -a, ply + 1);
    if (s > best) best = s;
    if (best > a) a = best;
    if (a >= b) break;
  }
  return best;
}
function chercher(e: Echiquier, prof: number): { m: Coup; s: number }[] {
  const res: { m: Coup; s: number }[] = [];
  for (const m of trier(coupsLegaux(e))) {
    const n = jouer(e, m);
    let s = -nega(n, prof - 1, -Infinity, Infinity, 1);
    // éviter de tourner en rond
    if ((n.vus[cle(n)] ?? 0) >= 2) s -= 60;
    res.push({ m, s });
  }
  return res.sort((x, y) => y.s - x.s);
}
/** L'indice pour toi : on cherche un peu plus loin. */
export function indiceEchecs(e: Echiquier): Coup | null {
  return chercher(e, 3)[0]?.m ?? null;
}
/** Le blond (noirs), calibré par le niveau. */
export function blondEchecs(e: Echiquier, d: Difficulte): Coup | null {
  const l = coupsLegaux(e);
  if (!l.length) return null;
  const p = paramsDiff(d);
  if (Math.random() < p.echecs) return l[Math.floor(Math.random() * l.length)]!;
  const res = chercher(e, p.echecsProf);
  if (!res.length) return l[0]!;
  const marge = d === "top" ? 8 : d === "versa" ? 15 : 40;
  const best = res[0]!.s;
  const proches = res.filter((r) => r.s >= best - marge);
  return proches[Math.floor(Math.random() * proches.length)]!.m;
}

/* ---------------- Qui suis-je ---------------- */

export type TraitsQui = {
  cheveux: "rose" | "blond" | "brun" | "roux";
  long: boolean;
  lunettes: boolean;
  chapeau: boolean;
  barbe: boolean;
  yeux: "bleu" | "vert" | "marron";
  sourire: boolean;
};

export type QuestionQui = { id: string; texte: string; test: (t: TraitsQui) => boolean };

export const QUESTIONS_QUI: QuestionQui[] = [
  { id: "barbe", texte: "A-t-il une barbe ?", test: (t) => t.barbe },
  { id: "lunettes", texte: "Porte-t-il des lunettes ?", test: (t) => t.lunettes },
  { id: "chapeau", texte: "Porte-t-il un chapeau ?", test: (t) => t.chapeau },
  { id: "long", texte: "A-t-il les cheveux longs ?", test: (t) => t.long },
  { id: "rose", texte: "A-t-il les cheveux roses ?", test: (t) => t.cheveux === "rose" },
  { id: "blond", texte: "A-t-il les cheveux blonds ?", test: (t) => t.cheveux === "blond" },
  { id: "brun", texte: "A-t-il les cheveux bruns ?", test: (t) => t.cheveux === "brun" },
  { id: "roux", texte: "A-t-il les cheveux roux ?", test: (t) => t.cheveux === "roux" },
  { id: "bleu", texte: "A-t-il les yeux bleus ?", test: (t) => t.yeux === "bleu" },
  { id: "vert", texte: "A-t-il les yeux verts ?", test: (t) => t.yeux === "vert" },
  { id: "marron", texte: "A-t-il les yeux marron ?", test: (t) => t.yeux === "marron" },
  { id: "sourire", texte: "Sourit-il ?", test: (t) => t.sourire },
];

export const VISAGES: TraitsQui[] = [
  { cheveux: "blond", long: false, lunettes: false, chapeau: false, barbe: true, yeux: "bleu", sourire: true },
  { cheveux: "blond", long: true, lunettes: true, chapeau: false, barbe: false, yeux: "vert", sourire: false },
  { cheveux: "rose", long: true, lunettes: false, chapeau: false, barbe: false, yeux: "vert", sourire: true },
  { cheveux: "rose", long: false, lunettes: true, chapeau: true, barbe: true, yeux: "marron", sourire: false },
  { cheveux: "brun", long: false, lunettes: false, chapeau: true, barbe: true, yeux: "marron", sourire: true },
  { cheveux: "brun", long: true, lunettes: true, chapeau: false, barbe: false, yeux: "bleu", sourire: false },
  { cheveux: "roux", long: false, lunettes: true, chapeau: false, barbe: false, yeux: "vert", sourire: true },
  { cheveux: "roux", long: true, lunettes: false, chapeau: true, barbe: true, yeux: "bleu", sourire: false },
  { cheveux: "blond", long: false, lunettes: true, chapeau: true, barbe: false, yeux: "marron", sourire: true },
  { cheveux: "rose", long: true, lunettes: false, chapeau: true, barbe: false, yeux: "bleu", sourire: false },
  { cheveux: "brun", long: false, lunettes: false, chapeau: false, barbe: false, yeux: "vert", sourire: true },
  { cheveux: "roux", long: false, lunettes: false, chapeau: false, barbe: true, yeux: "marron", sourire: false },
];

export function meilleurQuestionQui(restants: number[], posees: Set<string>): QuestionQui | null {
  const pool = restants.map((i) => VISAGES[i]!);
  let best: QuestionQui | null = null;
  let score = 99;
  for (const q of QUESTIONS_QUI) {
    if (posees.has(q.id)) continue;
    const oui = pool.filter((t) => q.test(t)).length;
    if (oui === 0 || oui === pool.length) continue;
    const s = Math.abs(oui - (pool.length - oui));
    if (s < score) { score = s; best = q; }
  }
  return best;
}

export function questionBlondQui(restants: number[], posees: Set<string>, d: Difficulte): QuestionQui | null {
  const bonnes = QUESTIONS_QUI.filter((q) => {
    if (posees.has(q.id)) return false;
    const pool = restants.map((i) => VISAGES[i]!);
    const oui = pool.filter((t) => q.test(t)).length;
    return oui > 0 && oui < pool.length;
  });
  if (!bonnes.length) return null;
  if (Math.random() < paramsDiff(d).quiErreur) return bonnes[Math.floor(Math.random() * bonnes.length)]!;
  return meilleurQuestionQui(restants, posees) ?? bonnes[0]!;
}

/* ---------------- Bataille navale (6×6) ---------------- */

export const NAV_N = 6;
export const NAV_TAILLES = [3, 2, 2] as const;

export type CaseNav = "vide" | "eau" | "touche" | "coule";
export type Flotte = { bateaux: number[][]; cellules: Set<number> };

export function placerFlotte(rand: () => number = Math.random): Flotte {
  const cellules = new Set<number>();
  const bateaux: number[][] = [];
  for (const len of NAV_TAILLES) {
    let ok = false;
    for (let t = 0; t < 80 && !ok; t++) {
      const horiz = rand() < 0.5;
      const maxR = horiz ? NAV_N : NAV_N - len + 1;
      const maxC = horiz ? NAV_N - len + 1 : NAV_N;
      const r = Math.floor(rand() * maxR);
      const c = Math.floor(rand() * maxC);
      const pts = Array.from({ length: len }, (_, i) => (horiz ? r * NAV_N + c + i : (r + i) * NAV_N + c));
      if (pts.some((p) => cellules.has(p))) continue;
      pts.forEach((p) => cellules.add(p));
      bateaux.push(pts);
      ok = true;
    }
  }
  return { bateaux, cellules };
}

export function etatTir(flotte: Flotte, tirs: Set<number>, i: number): CaseNav {
  if (!flotte.cellules.has(i)) return "eau";
  const bateau = flotte.bateaux.find((b) => b.includes(i));
  if (bateau && bateau.every((p) => p === i || tirs.has(p))) return "coule";
  return "touche";
}

export function flotteCoulee(flotte: Flotte, tirs: Set<number>) {
  return [...flotte.cellules].every((c) => tirs.has(c));
}

export function blondNavale(tirs: Set<number>, flotte: Flotte, d: Difficulte): number {
  const libres = Array.from({ length: NAV_N * NAV_N }, (_, i) => i).filter((i) => !tirs.has(i));
  const mode = paramsDiff(d).navale;
  if (mode === "random" || !libres.length) return libres[Math.floor(Math.random() * libres.length)] ?? 0;
  const touches = [...tirs].filter((i) => flotte.cellules.has(i) && etatTir(flotte, tirs, i) !== "coule");
  // ne pas retirer un bateau déjà coulé des cibles : etatTir a besoin des tirs déjà faits ; on filtre les cellules de bateaux non coulés
  const nonCoules = flotte.bateaux.filter((b) => !b.every((p) => tirs.has(p))).flat();
  const hits = [...tirs].filter((i) => nonCoules.includes(i));
  const voisins = (i: number) => {
    const r = Math.floor(i / NAV_N);
    const c = i % NAV_N;
    return [c > 0 ? i - 1 : -1, c < NAV_N - 1 ? i + 1 : -1, r > 0 ? i - NAV_N : -1, r < NAV_N - 1 ? i + NAV_N : -1].filter((x) => x >= 0 && !tirs.has(x));
  };
  if (hits.length) {
    // aligner si deux touches consécutives
    if (hits.length >= 2) {
      const tries: number[] = [];
      for (const a of hits) for (const b of hits) {
        if (a >= b) continue;
        if (Math.floor(a / NAV_N) === Math.floor(b / NAV_N) && Math.abs(a - b) < NAV_N) {
          const dlt = a > b ? 1 : -1;
          const ext = [Math.min(a, b) - 1, Math.max(a, b) + 1];
          for (const x of ext) if (x >= 0 && x < NAV_N * NAV_N && Math.floor(x / NAV_N) === Math.floor(a / NAV_N) && !tirs.has(x)) tries.push(x);
        }
        if (a % NAV_N === b % NAV_N) {
          const ext = [Math.min(a, b) - NAV_N, Math.max(a, b) + NAV_N];
          for (const x of ext) if (x >= 0 && x < NAV_N * NAV_N && x % NAV_N === a % NAV_N && !tirs.has(x)) tries.push(x);
        }
      }
      if (tries.length) return tries[Math.floor(Math.random() * tries.length)]!;
    }
    const adj = hits.flatMap(voisins);
    if (adj.length) return adj[Math.floor(Math.random() * adj.length)]!;
  }
  if (mode === "smart") {
    const pares = libres.filter((i) => (Math.floor(i / NAV_N) + (i % NAV_N)) % 2 === 0);
    const pool = pares.length ? pares : libres;
    return pool[Math.floor(Math.random() * pool.length)]!;
  }
  return libres[Math.floor(Math.random() * libres.length)]!;
}
