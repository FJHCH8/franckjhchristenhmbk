"use client";

import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";
import { meilleurCoup } from "@/lib/bot";
import { clic, sang, tic } from "@/lib/sons";

const FICHIER: Record<PieceSymbol, string> = { k: "roi", q: "reine", r: "tour", b: "fou", n: "cavalier", p: "pion" };
const NOM: Record<PieceSymbol, string> = { k: "roi", q: "reine", r: "tour", b: "fou", n: "cavalier", p: "pion" };
const COLONNES = "abcdefgh";

type Piece = { id: string; type: PieceSymbol; color: Color; sq: Square; mort?: boolean };
type Etat = "joue" | "bot" | "mat-gagne" | "mat-perdu" | "nulle";

function xy(sq: Square) {
  return { x: COLONNES.indexOf(sq[0]!), y: 8 - Number(sq[1]) };
}

function depart(jeu: Chess): Piece[] {
  const pieces: Piece[] = [];
  jeu.board().forEach((rangee) =>
    rangee.forEach((p) => {
      if (p) pieces.push({ id: `${p.color}${p.type}${p.square}`, type: p.type, color: p.color, sq: p.square });
    }),
  );
  return pieces;
}

/** Une partie contre le bot : les pièces glissent, et celle qui tombe saigne. */
export function Echecs() {
  const jeuRef = useRef(new Chess());
  const zoneRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<Piece[]>(() => depart(new Chess()));
  const [choisie, setChoisie] = useState<Square | null>(null);
  const [cibles, setCibles] = useState<Move[]>([]);
  const [dernier, setDernier] = useState<{ from: Square; to: Square } | null>(null);
  const [etat, setEtat] = useState<Etat>("joue");
  const [echec, setEchec] = useState<Square | null>(null);
  const [vole, setVole] = useState<string | null>(null);
  const [prises, setPrises] = useState<{ w: PieceSymbol[]; b: PieceSymbol[] }>({ w: [], b: [] });
  const [visible, setVisible] = useState(false);
  const minuteurs = useRef<number[]>([]);
  const piecesRef = useRef(pieces);

  const plus = useCallback((fn: () => void, ms: number) => {
    minuteurs.current.push(window.setTimeout(fn, ms));
  }, []);

  const poser = useCallback((liste: Piece[]) => {
    piecesRef.current = liste;
    setPieces(liste);
  }, []);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(zone);
    const liste = minuteurs.current;
    return () => {
      io.disconnect();
      liste.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const roiEnEchec = (jeu: Chess): Square | null => {
    if (!jeu.inCheck()) return null;
    for (const rangee of jeu.board()) for (const p of rangee) if (p && p.type === "k" && p.color === jeu.turn()) return p.square;
    return null;
  };

  const appliquer = useCallback((coup: Move) => {
    const jeu = jeuRef.current;
    const apres = piecesRef.current.map((p) => ({ ...p }));
    {
      if (coup.captured) {
        const lieu = (coup.flags.includes("e") ? `${coup.to[0]}${coup.from[1]}` : coup.to) as Square;
        const victime = apres.find((p) => p.sq === lieu && !p.mort && p.color !== coup.color);
        if (victime) {
          victime.mort = true;
          const id = victime.id;
          plus(() => {
            poser(piecesRef.current.filter((p) => p.id !== id));
            setPrises((tas) => ({ ...tas, [coup.color]: [...tas[coup.color], coup.captured!] }));
          }, 1900);
        }
      }
      const pion = apres.find((p) => p.sq === coup.from && !p.mort);
      if (pion) {
        pion.sq = coup.to;
        if (coup.promotion) pion.type = coup.promotion;
        setVole(pion.id);
        plus(() => setVole(null), 620);
      }
      if (coup.flags.includes("k") || coup.flags.includes("q")) {
        const rang = coup.from[1];
        const [de, vers] = coup.flags.includes("k") ? [`h${rang}`, `f${rang}`] : [`a${rang}`, `d${rang}`];
        const tour = apres.find((p) => p.sq === de && !p.mort);
        if (tour) tour.sq = vers as Square;
      }
    }
    poser(apres);
    setDernier({ from: coup.from, to: coup.to });
    setEchec(roiEnEchec(jeu));
    if (coup.captured) sang();
    else clic();
  }, [plus, poser]);

  const finDePartie = useCallback((): Etat | null => {
    const jeu = jeuRef.current;
    if (jeu.isCheckmate()) return jeu.turn() === "b" ? "mat-gagne" : "mat-perdu";
    if (jeu.isDraw() || jeu.isStalemate()) return "nulle";
    return null;
  }, []);

  const tourDuBot = useCallback(() => {
    setEtat("bot");
    plus(() => {
      const jeu = jeuRef.current;
      const coup = meilleurCoup(jeu, 2);
      if (!coup) return;
      const joue = jeu.move(coup);
      appliquer(joue);
      plus(() => setEtat(finDePartie() ?? "joue"), 650);
    }, 700);
  }, [appliquer, finDePartie, plus]);

  const toucher = (sq: Square) => {
    if (etat !== "joue") return;
    const jeu = jeuRef.current;
    const cible = cibles.find((coup) => coup.to === sq);
    if (choisie && cible) {
      const joue = jeu.move({ from: cible.from, to: cible.to, promotion: cible.promotion ? "q" : undefined });
      setChoisie(null);
      setCibles([]);
      appliquer(joue);
      const fin = finDePartie();
      if (fin) plus(() => setEtat(fin), 650);
      else tourDuBot();
      return;
    }
    const p = jeu.get(sq);
    if (p && p.color === "w") {
      tic();
      setChoisie(sq);
      setCibles(jeu.moves({ square: sq, verbose: true }));
      return;
    }
    setChoisie(null);
    setCibles([]);
  };

  const rejouer = () => {
    minuteurs.current.forEach((id) => window.clearTimeout(id));
    minuteurs.current = [];
    jeuRef.current = new Chess();
    poser(depart(jeuRef.current));
    setChoisie(null);
    setCibles([]);
    setDernier(null);
    setEchec(null);
    setPrises({ w: [], b: [] });
    setEtat("joue");
    clic();
  };

  const message =
    etat === "bot"
      ? "Le bot réfléchit…"
      : etat === "mat-gagne"
        ? "Échec et mat. Tu as gagné."
        : etat === "mat-perdu"
          ? "Échec et mat. Le bot l’emporte."
          : etat === "nulle"
            ? "Partie nulle."
            : echec
              ? "Échec ! Protège ton roi."
              : "À toi de jouer : tu as les blancs.";

  const occupants = new Map(pieces.filter((p) => !p.mort).map((p) => [p.sq, p]));
  const cases: Square[] = [];
  for (let r = 8; r >= 1; r -= 1) for (const c of COLONNES) cases.push(`${c}${r}` as Square);
  const fini = etat === "mat-gagne" || etat === "mat-perdu" || etat === "nulle";

  return (
    <section className="echecs shell" aria-labelledby="titre-echecs">
      <p className="kicker">
        <Split text="Échecs" mode="chars" />
      </p>
      <h2 className="echecs-titre" id="titre-echecs">
        <Split text="Une partie ?" mode="chars" className="kt-x" />
      </h2>
      <div className="echecs-tableau">
        <div className={visible ? "echiquier is-in" : "echiquier"} ref={zoneRef} data-etat={etat}>
          {cases.map((sq) => {
            const { x, y } = xy(sq);
            const p = occupants.get(sq);
            const cible = cibles.find((coup) => coup.to === sq);
            const classes = [
              "case",
              (x + y) % 2 ? "is-sombre" : "is-claire",
              choisie === sq ? "is-choisie" : "",
              cible ? (cible.captured ? "is-prise" : "is-cible") : "",
              dernier && (dernier.from === sq || dernier.to === sq) ? "is-dernier" : "",
              echec === sq ? "is-echec" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={sq}
                type="button"
                className={classes}
                style={{ ["--d" as string]: `${(x + y) * 32}ms` } as CSSProperties}
                aria-label={`${sq}${p ? `, ${NOM[p.type]} ${p.color === "w" ? "blanc" : "noir"}` : ""}`}
                onClick={() => toucher(sq)}
              >
                {x === 0 ? <span className="case-rang">{sq[1]}</span> : null}
                {y === 7 ? <span className="case-colonne">{sq[0]}</span> : null}
              </button>
            );
          })}
          <div className="pieces" aria-hidden="true">
            {pieces.map((p, index) => {
              const { x, y } = xy(p.sq);
              return (
                <span
                  key={p.id}
                  className={["piece", p.color === "w" ? "is-blanche" : "is-noire", p.mort ? "is-saigne" : "", vole === p.id ? "is-vole" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      ["--x" as string]: x,
                      ["--y" as string]: y,
                      ["--src" as string]: `url(/echecs/${FICHIER[p.type]}.png)`,
                      ["--d" as string]: `${index * 28}ms`,
                    } as CSSProperties
                  }
                >
                  <span className="piece-forme" />
                  <span className="piece-sang" />
                  <i className="goutte" />
                  <i className="goutte" />
                  <i className="goutte" />
                </span>
              );
            })}
          </div>
          {fini ? (
            <div className="echecs-fin">
              <p className="echecs-fin-titre">
                <Split text={etat === "nulle" ? "Nulle" : etat === "mat-gagne" ? "Victoire" : "Mat"} mode="chars" className="kt-x" />
              </p>
              <button type="button" className="echecs-bouton" onClick={rejouer} data-magnet="">
                Rejouer
              </button>
            </div>
          ) : null}
        </div>
        <aside className="echecs-cote">
          <p className={etat === "bot" ? "echecs-message is-attente" : "echecs-message"} aria-live="polite">
            {message}
          </p>
          <div className="echecs-tas" aria-label="Pièces prises">
            <p>Tes prises</p>
            <span>
              {prises.w.map((type, index) => (
                <i key={index} className="tas-piece is-noire" style={{ ["--src" as string]: `url(/echecs/${FICHIER[type]}.png)` } as CSSProperties} />
              ))}
            </span>
            <p>Prises du bot</p>
            <span>
              {prises.b.map((type, index) => (
                <i key={index} className="tas-piece is-blanche" style={{ ["--src" as string]: `url(/echecs/${FICHIER[type]}.png)` } as CSSProperties} />
              ))}
            </span>
          </div>
          <button type="button" className="echecs-bouton is-discret" onClick={rejouer}>
            Nouvelle partie
          </button>
        </aside>
      </div>
    </section>
  );
}
