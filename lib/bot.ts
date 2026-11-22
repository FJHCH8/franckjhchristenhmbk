import type { Chess, Move, PieceSymbol } from "chess.js";

/**
 * Petit moteur d'échecs : recherche alpha-bêta à profondeur fixe, prolongée sur les
 * prises, avec une évaluation matérielle et positionnelle classique. Il joue
 * correctement sans être imbattable, et répond en une fraction de seconde.
 */

const VALEUR: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Tables positionnelles, vues du côté des blancs (rangée 8 en haut).
const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0,
    0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0,
    10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5,
    0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5,
    5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20,
    30, 10, 0, 0, 10, 30, 20,
  ],
};

const MAT = 100000;

/** Évaluation du point de vue du camp qui doit jouer. */
function evaluer(jeu: Chess) {
  let score = 0;
  const plateau = jeu.board();
  for (let r = 0; r < 8; r += 1) {
    const rangee = plateau[r]!;
    for (let f = 0; f < 8; f += 1) {
      const case_ = rangee[f];
      if (!case_) continue;
      const index = case_.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const v = VALEUR[case_.type] + PST[case_.type][index]!;
      score += case_.color === "w" ? v : -v;
    }
  }
  return jeu.turn() === "w" ? score : -score;
}

function ordonner(coups: Move[]) {
  return coups.sort((a, b) => {
    const va = (a.captured ? VALEUR[a.captured] * 10 - VALEUR[a.piece] : 0) + (a.promotion ? 800 : 0);
    const vb = (b.captured ? VALEUR[b.captured] * 10 - VALEUR[b.piece] : 0) + (b.promotion ? 800 : 0);
    return vb - va;
  });
}

function calme(jeu: Chess, alpha: number, beta: number, reste: number): number {
  const fixe = evaluer(jeu);
  if (fixe >= beta) return beta;
  if (fixe > alpha) alpha = fixe;
  if (reste <= 0) return alpha;
  const prises = ordonner(jeu.moves({ verbose: true }).filter((coup) => coup.captured || coup.promotion));
  for (const coup of prises) {
    jeu.move(coup);
    const score = -calme(jeu, -beta, -alpha, reste - 1);
    jeu.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function chercher(jeu: Chess, profondeur: number, alpha: number, beta: number, ply: number): number {
  if (jeu.isCheckmate()) return -MAT + ply;
  if (jeu.isDraw()) return 0;
  if (profondeur <= 0) return calme(jeu, alpha, beta, 3);
  const coups = ordonner(jeu.moves({ verbose: true }));
  for (const coup of coups) {
    jeu.move(coup);
    const score = -chercher(jeu, profondeur - 1, -beta, -alpha, ply + 1);
    jeu.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

/** Choisit un coup pour le camp qui doit jouer. Un soupçon de hasard évite de rejouer toujours la même partie. */
export function meilleurCoup(jeu: Chess, profondeur = 2): Move | null {
  const coups = ordonner(jeu.moves({ verbose: true }));
  if (!coups.length) return null;
  let meilleurs: Move[] = [];
  let record = -Infinity;
  for (const coup of coups) {
    jeu.move(coup);
    const score = -chercher(jeu, profondeur - 1, -Infinity, Infinity, 1) + Math.random() * 12;
    jeu.undo();
    if (score > record + 0.5) {
      record = score;
      meilleurs = [coup];
    } else if (Math.abs(score - record) <= 0.5) {
      meilleurs.push(coup);
    }
  }
  return meilleurs[Math.floor(Math.random() * meilleurs.length)] ?? coups[0]!;
}
