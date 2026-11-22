/// <reference lib="webworker" />
import { Chess } from "chess.js";
import { meilleurCoup } from "./bot";

/** Le bot réfléchit ici, à part : la page reste fluide pendant qu'il cherche son coup. */
self.onmessage = (event: MessageEvent<{ id: number; fen?: string; profondeur?: number; ping?: boolean }>) => {
  const { id, fen, profondeur, ping } = event.data;
  if (ping || !fen) {
    self.postMessage({ id, pret: true });
    return;
  }
  const jeu = new Chess(fen);
  const coup = meilleurCoup(jeu, profondeur ?? 2);
  self.postMessage({ id, coup: coup ? { from: coup.from, to: coup.to, promotion: coup.promotion } : null });
};
