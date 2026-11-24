/**
 * Les trois niveaux du blond : Soumis (facile), Versa (moyen), Top (difficile).
 * Le dernier choix est retenu pour la prochaine partie.
 */
import { creerStore } from "./session";

export type Difficulte = "soumis" | "versa" | "top";

export const NIVEAUX: { id: Difficulte; nom: string; sous: string }[] = [
  { id: "soumis", nom: "Soumis", sous: "Facile" },
  { id: "versa", nom: "Versa", sous: "Moyen" },
  { id: "top", nom: "Top", sous: "Difficile" },
];

export const memoireDiff = creerStore<{ d: Difficulte }>("opakaalt-diff", { d: "versa" });

export type ParamsDiff = {
  morpion: number;
  morpionNuls: number;
  p4: number;
  p4prof: number;
  echecs: number;
  echecsProf: number;
  quiErreur: number;
  navale: "random" | "hunt" | "smart";
  babyLag: number;
  babyPrecision: number;
};

const PARAMS: Record<Difficulte, ParamsDiff> = {
  soumis: { morpion: 0.72, morpionNuls: 0.08, p4: 0.48, p4prof: 2, echecs: 0.45, echecsProf: 1, quiErreur: 0.5, navale: "random", babyLag: 0.4, babyPrecision: 0.45 },
  versa: { morpion: 0.28, morpionNuls: 0.12, p4: 0.22, p4prof: 4, echecs: 0.18, echecsProf: 2, quiErreur: 0.18, navale: "hunt", babyLag: 0.16, babyPrecision: 0.75 },
  top: { morpion: 0.04, morpionNuls: 0.02, p4: 0.05, p4prof: 6, echecs: 0.04, echecsProf: 3, quiErreur: 0.03, navale: "smart", babyLag: 0.05, babyPrecision: 0.95 },
};

export function paramsDiff(d: Difficulte): ParamsDiff {
  return PARAMS[d];
}
