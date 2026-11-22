"use client";

import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { clic, sang, tic } from "@/lib/sons";

const FICHIER: Record<PieceSymbol, string> = { k: "roi", q: "reine", r: "tour", b: "fou", n: "cavalier", p: "pion" };
const NOM: Record<PieceSymbol, string> = { k: "roi", q: "reine", r: "tour", b: "fou", n: "cavalier", p: "pion" };
const COLONNES = "abcdefgh";
const NIVEAUX = [
  { nom: "Facile", profondeur: 1 },
  { nom: "Normal", profondeur: 2 },
  { nom: "Difficile", profondeur: 3 },
];

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

/** Après un retour en arrière : chaque pièce de l'échiquier reprend l'identité la plus proche, pour glisser vers sa case. */
function synchroniser(jeu: Chess, anciens: Piece[]): Piece[] {
  const libres = anciens.filter((p) => !p.mort);
  const resultat: Piece[] = [];
  const pris = new Set<string>();
  const surPlateau: { type: PieceSymbol; color: Color; square: Square }[] = [];
  jeu.board().forEach((r) => r.forEach((p) => p && surPlateau.push(p)));
  for (const p of surPlateau) {
    const meme = libres.find((a) => !pris.has(a.id) && a.sq === p.square && a.color === p.color && a.type === p.type);
    if (meme) {
      pris.add(meme.id);
      resultat.push({ ...meme });
    }
  }
  for (const p of surPlateau) {
    if (resultat.some((r) => r.sq === p.square)) continue;
    const { x, y } = xy(p.square);
    const proche = libres
      .filter((a) => !pris.has(a.id) && a.color === p.color && (a.type === p.type || a.type === "q"))
      .sort((a, b) => Math.hypot(xy(a.sq).x - x, xy(a.sq).y - y) - Math.hypot(xy(b.sq).x - x, xy(b.sq).y - y))[0];
    if (proche) pris.add(proche.id);
    resultat.push({ id: proche?.id ?? `${p.color}${p.type}${p.square}-${Math.random().toString(36).slice(2, 7)}`, type: p.type, color: p.color, sq: p.square });
  }
  return resultat;
}

function caseSous(plateau: HTMLElement, x: number, y: number): Square | null {
  const box = plateau.getBoundingClientRect();
  const c = Math.floor(((x - box.left) / box.width) * 8);
  const r = Math.floor(((y - box.top) / box.height) * 8);
  if (c < 0 || c > 7 || r < 0 || r > 7) return null;
  return `${COLONNES[c]}${8 - r}` as Square;
}

/** Partie contre le bot, en plein écran. Les pièces se glissent au doigt ; celle qui tombe saigne. */
export default function Echecs({ travailleur, onFermer }: { travailleur: Worker; onFermer: () => void }) {
  const jeuRef = useRef(new Chess());
  const plateauRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<Piece[]>(() => depart(new Chess()));
  const piecesRef = useRef(pieces);
  const [choisie, setChoisie] = useState<Square | null>(null);
  const [cibles, setCibles] = useState<Move[]>([]);
  const [dernier, setDernier] = useState<{ from: Square; to: Square } | null>(null);
  const [etat, setEtat] = useState<Etat>("joue");
  const [echec, setEchec] = useState<Square | null>(null);
  const [vole, setVole] = useState<string | null>(null);
  const [pose, setPose] = useState<string | null>(null);
  const [historique, setHistorique] = useState<Move[]>([]);
  const [niveau, setNiveau] = useState(1);
  const [secousse, setSecousse] = useState(0);
  const minuteurs = useRef<number[]>([]);
  const demande = useRef(0);
  const geste = useRef<{ sq: Square; id: string; x: number; y: number; bouge: boolean; el: HTMLElement | null } | null>(null);

  const plus = useCallback((fn: () => void, ms: number) => {
    minuteurs.current.push(window.setTimeout(fn, ms));
  }, []);

  const poser = useCallback((liste: Piece[]) => {
    piecesRef.current = liste;
    setPieces(liste);
  }, []);

  useEffect(() => {
    const liste = minuteurs.current;
    const onTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", onTouche);
    return () => {
      window.removeEventListener("keydown", onTouche);
      liste.forEach((id) => window.clearTimeout(id));
    };
  }, [onFermer]);

  const roiEnEchec = (jeu: Chess): Square | null => {
    if (!jeu.inCheck()) return null;
    for (const rangee of jeu.board()) for (const p of rangee) if (p && p.type === "k" && p.color === jeu.turn()) return p.square;
    return null;
  };

  const finDePartie = useCallback((): Etat | null => {
    const jeu = jeuRef.current;
    if (jeu.isCheckmate()) return jeu.turn() === "b" ? "mat-gagne" : "mat-perdu";
    if (jeu.isDraw() || jeu.isStalemate()) return "nulle";
    return null;
  }, []);

  const appliquer = useCallback(
    (coup: Move, glisse: boolean) => {
      const jeu = jeuRef.current;
      const apres = piecesRef.current.map((p) => ({ ...p }));
      if (coup.captured) {
        const lieu = (coup.flags.includes("e") ? `${coup.to[0]}${coup.from[1]}` : coup.to) as Square;
        const victime = apres.find((p) => p.sq === lieu && !p.mort && p.color !== coup.color);
        if (victime) {
          victime.mort = true;
          const id = victime.id;
          plus(() => poser(piecesRef.current.filter((p) => p.id !== id)), 1900);
        }
      }
      const piece = apres.find((p) => p.sq === coup.from && !p.mort);
      if (piece) {
        piece.sq = coup.to;
        if (coup.promotion) piece.type = coup.promotion;
        if (glisse) {
          // Déposée au doigt : elle est déjà sur sa case, pas de second trajet.
          setPose(piece.id);
          plus(() => setPose(null), 60);
        } else {
          setVole(piece.id);
          plus(() => setVole(null), 640);
        }
      }
      if (coup.flags.includes("k") || coup.flags.includes("q")) {
        const rang = coup.from[1];
        const [de, vers] = coup.flags.includes("k") ? [`h${rang}`, `f${rang}`] : [`a${rang}`, `d${rang}`];
        const tour = apres.find((p) => p.sq === de && !p.mort);
        if (tour) tour.sq = vers as Square;
      }
      poser(apres);
      setDernier({ from: coup.from, to: coup.to });
      setHistorique(jeu.history({ verbose: true }));
      const roi = roiEnEchec(jeu);
      setEchec(roi);
      if (roi) setSecousse((n) => n + 1);
      if (coup.captured) sang();
      else clic();
    },
    [plus, poser],
  );

  // Réponse du bot, depuis son processus à part.
  useEffect(() => {
    const onMessage = (event: MessageEvent<{ id: number; coup?: { from: Square; to: Square; promotion?: PieceSymbol } | null }>) => {
      if (event.data.id !== demande.current || !event.data.coup) return;
      const jeu = jeuRef.current;
      try {
        const joue = jeu.move(event.data.coup);
        appliquer(joue, false);
        plus(() => setEtat(finDePartie() ?? "joue"), 650);
      } catch {
        setEtat("joue");
      }
    };
    travailleur.addEventListener("message", onMessage);
    return () => travailleur.removeEventListener("message", onMessage);
  }, [travailleur, appliquer, finDePartie, plus]);

  const tourDuBot = useCallback(() => {
    setEtat("bot");
    const id = ++demande.current;
    const fen = jeuRef.current.fen();
    // Un court temps de réflexion visible, même quand le bot est rapide.
    plus(() => travailleur.postMessage({ id, fen, profondeur: NIVEAUX[niveau]!.profondeur }), 450);
  }, [niveau, plus, travailleur]);

  const jouer = (coup: Move, glisse: boolean) => {
    const joue = jeuRef.current.move({ from: coup.from, to: coup.to, promotion: coup.promotion ? "q" : undefined });
    setChoisie(null);
    setCibles([]);
    appliquer(joue, glisse);
    const fin = finDePartie();
    if (fin) plus(() => setEtat(fin), 650);
    else tourDuBot();
  };

  const choisir = (sq: Square) => {
    const p = jeuRef.current.get(sq);
    if (p && p.color === "w") {
      tic();
      setChoisie(sq);
      setCibles(jeuRef.current.moves({ square: sq, verbose: true }));
      return true;
    }
    setChoisie(null);
    setCibles([]);
    return false;
  };

  const toucher = (sq: Square) => {
    if (etat !== "joue") return;
    const cible = choisie ? cibles.find((coup) => coup.to === sq) : null;
    if (cible) jouer(cible, false);
    else choisir(sq);
  };

  // Glisser-déposer, à la souris comme au doigt.
  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (etat !== "joue" || !plateauRef.current) return;
    const sq = caseSous(plateauRef.current, event.clientX, event.clientY);
    if (!sq) return;
    const p = jeuRef.current.get(sq);
    if (!p || p.color !== "w") {
      toucher(sq);
      return;
    }
    const cible = choisie ? cibles.find((coup) => coup.to === sq) : null;
    if (cible) {
      jouer(cible, false);
      return;
    }
    choisir(sq);
    const piece = piecesRef.current.find((x) => x.sq === sq && !x.mort);
    const el = piece ? plateauRef.current.querySelector<HTMLElement>(`[data-id="${piece.id}"]`) : null;
    geste.current = { sq, id: piece?.id ?? "", x: event.clientX, y: event.clientY, bouge: false, el };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    if (!g || !g.el) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.bouge && Math.hypot(dx, dy) < 6) return;
    g.bouge = true;
    g.el.classList.add("is-tenue");
    g.el.style.translate = `${dx}px ${dy}px`;
  };

  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    geste.current = null;
    if (!g || !plateauRef.current) return;
    if (g.el) {
      g.el.classList.remove("is-tenue");
      g.el.style.translate = "";
    }
    if (!g.bouge) return;
    const sq = caseSous(plateauRef.current, event.clientX, event.clientY);
    const cible = sq ? cibles.find((coup) => coup.to === sq) : null;
    if (cible) jouer(cible, true);
  };

  const annuler = () => {
    if (etat !== "joue" || historique.length < 2) return;
    const jeu = jeuRef.current;
    jeu.undo();
    jeu.undo();
    poser(synchroniser(jeu, piecesRef.current));
    const h = jeu.history({ verbose: true });
    setHistorique(h);
    const precedent = h[h.length - 1];
    setDernier(precedent ? { from: precedent.from, to: precedent.to } : null);
    setEchec(roiEnEchec(jeu));
    setChoisie(null);
    setCibles([]);
    clic();
  };

  const rejouer = () => {
    minuteurs.current.forEach((id) => window.clearTimeout(id));
    minuteurs.current = [];
    demande.current += 1;
    jeuRef.current = new Chess();
    poser(depart(jeuRef.current));
    setChoisie(null);
    setCibles([]);
    setDernier(null);
    setEchec(null);
    setHistorique([]);
    setEtat("joue");
    clic();
  };

  const prisesBlanc = historique.filter((c) => c.color === "w" && c.captured).map((c) => c.captured!);
  const prisesNoir = historique.filter((c) => c.color === "b" && c.captured).map((c) => c.captured!);
  const valeur: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const ecart = prisesBlanc.reduce((s, t) => s + valeur[t], 0) - prisesNoir.reduce((s, t) => s + valeur[t], 0);
  const coups: [Move, Move | undefined][] = [];
  for (let i = 0; i < historique.length; i += 2) coups.push([historique[i]!, historique[i + 1]]);

  const fini = etat === "mat-gagne" || etat === "mat-perdu" || etat === "nulle";
  const message =
    etat === "bot"
      ? "Le bot réfléchit"
      : etat === "mat-gagne"
        ? "Échec et mat. Tu as gagné."
        : etat === "mat-perdu"
          ? "Échec et mat. Le bot l’emporte."
          : etat === "nulle"
            ? "Partie nulle."
            : echec
              ? "Échec ! Protège ton roi."
              : "À toi : tu as les blancs.";

  const occupants = new Map(pieces.filter((p) => !p.mort).map((p) => [p.sq, p]));
  const cases: Square[] = [];
  for (let r = 8; r >= 1; r -= 1) for (const c of COLONNES) cases.push(`${c}${r}` as Square);

  return (
    <div className="jeu" role="dialog" aria-modal="true" aria-label="Partie d’échecs contre le bot">
      <header className="jeu-tete">
        <p className="jeu-titre">Échecs</p>
        <button type="button" className="jeu-fermer" onClick={onFermer} aria-label="Fermer la partie">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="jeu-corps">
        <div className="jeu-plateau-cadre">
          <div className="jeu-joueur is-bot">
            <span className={etat === "bot" ? "jeu-avatar is-pense" : "jeu-avatar"} aria-hidden="true" />
            <span>Bot · {NIVEAUX[niveau]!.nom}</span>
            <span className="jeu-prises">
              {prisesNoir.map((t, i) => (
                <i key={i} className="jeu-mini is-blanche" style={{ ["--src" as string]: `url(/echecs/${FICHIER[t]}.png)` } as CSSProperties} />
              ))}
              {ecart < 0 ? <b>+{-ecart}</b> : null}
            </span>
          </div>

          <div
            key={secousse}
            className={secousse ? "jeu-plateau is-secoue" : "jeu-plateau"}
            ref={plateauRef}
            data-etat={etat}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {cases.map((sq) => {
              const { x, y } = xy(sq);
              const p = occupants.get(sq);
              const cible = cibles.find((coup) => coup.to === sq);
              const classes = [
                "jeu-case",
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
                  style={{ ["--d" as string]: `${(x + y) * 26}ms` } as CSSProperties}
                  aria-label={`${sq}${p ? `, ${NOM[p.type]} ${p.color === "w" ? "blanc" : "noir"}` : ""}`}
                  onClick={(event) => {
                    // Le clavier seulement : le doigt et la souris passent par le glisser-déposer.
                    if (event.detail === 0) toucher(sq);
                  }}
                >
                  {x === 0 ? <span className="jeu-rang">{sq[1]}</span> : null}
                  {y === 7 ? <span className="jeu-colonne">{sq[0]}</span> : null}
                </button>
              );
            })}
            <div className="jeu-pieces" aria-hidden="true">
              {pieces.map((p, index) => {
                const { x, y } = xy(p.sq);
                return (
                  <span
                    key={p.id}
                    data-id={p.id}
                    className={[
                      "jeu-piece",
                      p.color === "w" ? "is-blanche" : "is-noire",
                      p.mort ? "is-saigne" : "",
                      vole === p.id ? "is-vole" : "",
                      pose === p.id ? "is-pose" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      {
                        ["--x" as string]: x,
                        ["--y" as string]: y,
                        ["--src" as string]: `url(/echecs/${FICHIER[p.type]}.png)`,
                        ["--d" as string]: `${index * 24}ms`,
                      } as CSSProperties
                    }
                  >
                    <span className="jeu-forme" />
                    <span className="jeu-sang" />
                    <i className="jeu-goutte" />
                    <i className="jeu-goutte" />
                    <i className="jeu-goutte" />
                  </span>
                );
              })}
            </div>
            {fini ? (
              <div className="jeu-fin">
                <p className="jeu-fin-titre">{etat === "nulle" ? "Nulle" : etat === "mat-gagne" ? "Victoire" : "Mat"}</p>
                <p className="jeu-fin-texte">{message}</p>
                <button type="button" className="jeu-bouton is-plein" onClick={rejouer}>
                  Rejouer
                </button>
              </div>
            ) : null}
          </div>

          <div className="jeu-joueur">
            <span className="jeu-avatar is-toi" aria-hidden="true" />
            <span>Toi</span>
            <span className="jeu-prises">
              {prisesBlanc.map((t, i) => (
                <i key={i} className="jeu-mini is-noire" style={{ ["--src" as string]: `url(/echecs/${FICHIER[t]}.png)` } as CSSProperties} />
              ))}
              {ecart > 0 ? <b>+{ecart}</b> : null}
            </span>
          </div>
        </div>

        <aside className="jeu-panneau">
          <p className={etat === "bot" ? "jeu-message is-attente" : echec ? "jeu-message is-echec" : "jeu-message"} aria-live="polite">
            {message}
            {etat === "bot" ? (
              <span className="jeu-points" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : null}
          </p>

          <div className="jeu-niveaux" role="radiogroup" aria-label="Niveau du bot">
            {NIVEAUX.map((n, i) => (
              <button
                key={n.nom}
                type="button"
                role="radio"
                aria-checked={niveau === i}
                className={niveau === i ? "is-actif" : ""}
                onClick={() => {
                  setNiveau(i);
                  tic();
                }}
              >
                {n.nom}
              </button>
            ))}
          </div>

          <ol className="jeu-coups" aria-label="Coups joués">
            {coups.length ? (
              coups.map(([b, n], i) => (
                <li key={i}>
                  <span>{i + 1}.</span>
                  <span>{b.san}</span>
                  <span>{n?.san ?? ""}</span>
                </li>
              ))
            ) : (
              <li className="is-vide">Les coups s’écriront ici.</li>
            )}
          </ol>

          <div className="jeu-actions">
            <button type="button" className="jeu-bouton" onClick={annuler} disabled={etat !== "joue" || historique.length < 2}>
              Annuler le coup
            </button>
            <button type="button" className="jeu-bouton" onClick={rejouer}>
              Nouvelle partie
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
