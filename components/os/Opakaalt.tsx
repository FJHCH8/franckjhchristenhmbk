"use client";

/**
 * Opakaalt : un jeu 8 bits de James-games (pixel art et chiptune faits maison).
 * Menu sur la ville (le jour tombe, la nuit vient), la rencontre dans la rue, le casino,
 * six jeux contre le blond, toujours dans cet ordre : morpion, puissance 4, qui suis-je, bataille navale, baby-foot, puis les échecs.
 * Règle : victoire par majorité (4 jeux sur 6). Dès que le blond rend la majorité inaccessible (3 victoires à lui), éjection immédiate. Une égalité se départage au pierre-feuille-ciseaux.
 * Dialogues : ceux de Franck, mot pour mot. Rien d'explicite à l'écran.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTraduire } from "@/components/Locale";
import { useRetour } from "./OdysseeOS";
import { creerStore } from "./session";
import { ambianceVille, arreterMusiqueFin, bruitage, musique, musiqueFin, silence, type Bruitage, type NomPiste } from "./opakaaltSon";
import { Blond, Casino, ChatNeon, CoeurPx, Femboy, PieceEchecs, Pixels, RueHotel, Terre, Ville, type Px } from "./opakaaltPixels";
import { BabyFoot, BatailleNavale, QuiSuisJe } from "./OpakaaltMinis";
import { memoireDiff, NIVEAUX, type Difficulte } from "./opakaaltDiff";
import { uneReplique, type JeuParole, type MomentParole } from "./opakaaltRepliques";
import {
  blond4,
  blondEchecs,
  blondMorpion,
  chute,
  COLS,
  coupsLegaux,
  depart,
  enEchec,
  finPartie,
  gagnant4,
  gagnantMorpion,
  indiceEchecs,
  jouer,
  materiel,
  meilleur4,
  meilleurMorpion,
  RANGS,
  type Case,
  type Coup,
  type Echiquier,
} from "./opakaaltJeux";

/* ---------------- Icône du tiroir ---------------- */

export function IconeOpakaalt({ taille = 56 }: { taille?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="os-icone" src="/aakanos/opakaalt-icone.svg" width={taille} height={taille} alt="" draggable={false} />
  );
}

/* ---------------- Mémoire du jeu ---------------- */

const memoire = creerStore<{ parties: number; victoires: number; defaites: number }>("opakaalt", { parties: 0, victoires: 0, defaites: 0 });

type Qui = "blond" | "femboy";
type Gagnant = "toi" | "blond" | "nul";

/* ---------------- Textes (le français de Franck, mot pour mot) ---------------- */

export const T_MERDE = "merde tu es en train de gagner mmmmmh….";
export const T_NUL = "ahahah comment tu es trop une merde! Apart te faire enculer tu sais rien faire de plus?!";
export /** Le monde en 3D (Three.js), chargé seulement quand on ouvre le jeu. */
const Monde3D = dynamic(() => import("./Opakaalt3D"), { ssr: false, loading: () => <div className="o3-attente">Chargement de la ville…</div> });

const T_DEGAGE = "Tu es vraiment qu’un gros tat de merde, dégage j’ai des trous du culs bien plus intéressant que le tien à déboucher!";

/* ---------------- La boîte de dialogue (texte qui s'écrit) ---------------- */

function Dialogue({ qui, texte, suite, instant = false }: { qui: Qui; texte: string; suite: () => void; instant?: boolean }) {
  const tr = useTraduire();
  const plein = tr(texte);
  const [n, setN] = useState(instant ? 10_000 : 0);
  useEffect(() => {
    if (instant) return;
    const id = window.setInterval(() => {
      setN((x) => {
        if (x >= plein.length) {
          window.clearInterval(id);
          return x;
        }
        if (x % 2 === 0) bruitage(qui === "blond" ? "blip-blond" : "blip-femboy");
        return x + 1;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, [plein, qui, instant]);
  const fini = n >= plein.length;
  return (
    <button type="button" className={`op-dialogue op-${qui}`} onClick={() => (fini ? (bruitage("menu"), suite()) : setN(plein.length))}>
      <span className="op-nom" translate="no">{qui === "blond" ? "BLOND" : "FEMBOY"}</span>
      <span className="op-texte" translate="no">
        {plein.slice(0, n)}
        <span className="op-fantome">{plein.slice(n)}</span>
      </span>
      {fini ? <i className="op-suite">▼</i> : null}
    </button>
  );
}

/* ---------------- Cinématiques ---------------- */

type Vue = {
  fx: number; bx: number; fdir: 1 | -1; bdir: 1 | -1; t: number; marche: boolean; boum: boolean;
  colere: boolean; bRougit: number; fRougit: number; bSourire: boolean; fSourire: boolean; fOpacite: number; bOpacite: number;
  debout: boolean; coup: boolean; vol: boolean; coeurs: boolean; secousse: boolean; zoom: number; aTerre: boolean;
};
const VUE0: Vue = { fx: -15, bx: 115, fdir: 1, bdir: -1, t: 0, marche: false, boum: false, colere: false, bRougit: 0, fRougit: 0, bSourire: false, fSourire: false, fOpacite: 1, bOpacite: 1, debout: false, coup: false, vol: false, coeurs: false, secousse: false, zoom: 1, aTerre: false };
type Etape = { qui?: Qui; texte?: string; ms?: number; vue?: Partial<Vue>; son?: Bruitage; musique?: NomPiste; instant?: boolean };

function useMarche(actif: boolean) {
  const [pas, setPas] = useState<0 | 1>(0);
  useEffect(() => {
    if (!actif) return;
    const id = window.setInterval(() => {
      setPas((p) => (p ? 0 : 1));
      bruitage("pas");
    }, 200);
    return () => window.clearInterval(id);
  }, [actif]);
  return actif ? pas : 0;
}

function Cinematique({ decor, etapes, fin, children }: { decor: "rue" | "casino" | "hotel"; etapes: Etape[]; fin: () => void; children?: ReactNode }) {
  const [i, setI] = useState(0);
  const vue = useMemo(() => etapes.slice(0, i + 1).reduce<Vue>((v, e) => ({ ...v, ...e.vue }), VUE0), [etapes, i]);
  const e = etapes[i];
  const suite = useCallback(() => setI((x) => x + 1), []);
  useEffect(() => {
    if (!e) {
      fin();
      return;
    }
    if (e.son) bruitage(e.son);
    if (e.musique) musique(e.musique);
    if (!e.texte) {
      const id = window.setTimeout(suite, e.ms ?? 600);
      return () => window.clearTimeout(id);
    }
    if (e.ms) {
      const id = window.setTimeout(suite, e.ms);
      return () => window.clearTimeout(id);
    }
  }, [e, fin, suite]);
  const pas = useMarche(vue.marche);
  const assis = decor === "casino" && !vue.debout;
  const style = (x: number, dir: 1 | -1, op: number, tombe = false): CSSProperties => ({
    left: `${x}%`,
    transform: tombe ? `translateX(-50%) scaleX(${dir}) rotate(-72deg)` : `translateX(-50%) scaleX(${dir})`,
    transformOrigin: tombe ? "50% 92%" : "50% 100%",
    bottom: tombe ? "16%" : undefined,
    transition: `left ${vue.t}ms linear, opacity .5s, bottom .45s ease, transform ${Math.max(280, vue.t)}ms ease`,
    opacity: op,
  });
  const persos = (
    <>
      <div className={`op-perso op-perso-f${assis ? " assis" : ""}${vue.vol ? " op-vole" : ""}${vue.aTerre ? " op-a-terre" : ""}`} style={style(vue.fx, vue.fdir, vue.fOpacite, vue.aTerre)}>
        <Femboy pas={pas} rougit={vue.fRougit} sourire={vue.fSourire} />
        {vue.fRougit >= 2 ? <Coeurs /> : null}
      </div>
      <div className={`op-perso op-perso-b${assis ? " assis" : ""}${vue.debout && decor === "casino" ? " debout" : ""}`} style={style(vue.bx, vue.bdir, vue.bOpacite)}>
        <Blond pas={pas} rougit={vue.bRougit} colere={vue.colere} sourire={vue.bSourire} coup={vue.coup} />
        {vue.bRougit >= 2 ? <Coeurs /> : null}
      </div>
    </>
  );
  const monde3d = decor === "rue" || decor === "casino" ? <Monde3D mode={decor} vue={vue} parle={e?.texte ? (e.qui ?? null) : null} /> : null;
  const monde = monde3d ?? (decor === "rue" ? (
    <div className="op-camera" style={{ transform: `translateX(-50%) scale(${vue.zoom})`, transition: `transform ${Math.max(400, vue.t)}ms ease-in-out` }}>
      <Ville couche="fond" anime={false} />
      {persos}
      <Ville couche="avant" />
      {vue.boum ? <div className="op-boum">BAM!</div> : null}
    </div>
  ) : (
    <>
      {decor === "casino" ? <Casino /> : <RueHotel />}
      {persos}
      {decor === "casino" ? <Tapis /> : null}
      {vue.boum ? <div className="op-boum">BAM!</div> : null}
    </>
  ));
  return (
    <div className={`op-scene op-scene-${decor}${vue.secousse ? " op-secousse" : ""}`}>
      {monde}
      {monde3d && vue.boum ? <div className="op-boum">BAM!</div> : null}
      {decor === "casino" && !monde3d ? <div className="op-enseigne" translate="no">CASINO</div> : null}
      {decor === "hotel" ? <div className="op-enseigne op-enseigne-hotel">HÔTEL</div> : null}
      {children}
      <div className="op-bas">
        {e?.texte && e.qui ? <Dialogue key={i} qui={e.qui} texte={e.texte} suite={suite} instant={e.instant} /> : null}
      </div>
    </div>
  );
}

function Coeurs() {
  return (
    <span className="op-coeurs" aria-hidden="true">
      <CoeurPx taille={2} style={{ animationDelay: "0s" }} />
      <CoeurPx taille={3} style={{ animationDelay: ".5s" }} />
      <CoeurPx taille={2} style={{ animationDelay: "1s" }} />
    </span>
  );
}

function Tapis() {
  return (
    <div className="op-tapis" aria-hidden="true">
      <i className="op-jetons a" />
      <i className="op-jetons b" />
      <i className="op-carte" />
    </div>
  );
}

const INTRO: Etape[] = [
  { musique: "intro", vue: { fx: 10, bx: 90, t: 0, zoom: 1, marche: true }, ms: 400 },
  { vue: { fx: 28, bx: 72, t: 1800, zoom: 1.12, marche: true }, ms: 1800 },
  { vue: { fx: 45, bx: 55, t: 1400, zoom: 1.85, marche: true }, ms: 1400 },
  { vue: { marche: false, boum: true, secousse: true, colere: true, fx: 47, bx: 53, zoom: 1.85, t: 120 }, son: "boum", ms: 400 },
  { vue: { boum: false, secousse: false, aTerre: true, fx: 47, bx: 53, zoom: 1.7, t: 480 }, ms: 800 },
  { vue: { aTerre: true, fx: 47, bx: 53, zoom: 1.7, t: 200 }, ms: 500 },
  { vue: { aTerre: false, fx: 47, bx: 53, zoom: 1.7, t: 580 }, ms: 720 },
  { vue: { boum: false, secousse: false }, qui: "blond", texte: "ragarde ou tu marches pd!" },
  { qui: "femboy", texte: "je m’excuse je n’ai pas vue ou j’allais je suis tellement désolé." },
  // le blond se calme et le regarde
  { vue: { colere: false, bRougit: 1 }, son: "rougit", ms: 1400 },
  { qui: "femboy", texte: "vous allez où comme ça?", vue: { fSourire: true } },
  { qui: "blond", texte: "je vais au casino pour défier des gens, tu veux être mon défi?", vue: { bSourire: true } },
  { qui: "femboy", texte: "je veux être ton défi….", vue: { fRougit: 1 } },
];
const CASINO: Etape[] = [
  { musique: "casino", vue: { fx: 26, bx: 74, fdir: 1, bdir: -1, t: 0 }, son: "chaise", ms: 900 },
  { qui: "blond", texte: "si tu me bat je suis à toi pour toute la nuit." },
  { vue: { bRougit: 2, fRougit: 2 }, son: "rougit", ms: 1600 },
  { qui: "femboy", texte: "pour la vie plutôt?" },
  { qui: "blond", texte: "Oui", vue: { bSourire: true } },
];
const VICTOIRE: Etape[] = [
  { vue: { fx: -10, bx: -22, fdir: 1, bdir: 1, t: 0, bRougit: 2, fRougit: 1 }, ms: 300 },
  { vue: { fx: 40, bx: 28, t: 3000, marche: true }, ms: 3000 },
  { vue: { marche: false, bdir: 1, fdir: -1 }, qui: "femboy", texte: "Tu ma insulté de pd tout à l’heure mais finalement tu n’es pas si homophobe mon prince" },
  { qui: "blond", texte: "face à toi je peux plus résister j’ai le barreau tout dur mmmmmmmmmmh", vue: { bRougit: 3, fRougit: 2 } },
  { vue: { fdir: 1, fx: 76, bx: 72, t: 2200, marche: true }, ms: 2200 },
  { vue: { marche: false, fOpacite: 0, bOpacite: 0 }, son: "porte", ms: 1000 },
];
const DEFAITE: Etape[] = [
  { musique: "defaite", vue: { fx: 36, bx: 62, fdir: 1, bdir: -1, t: 0, colere: true, debout: true }, qui: "blond", texte: T_DEGAGE, instant: true, ms: 1400 },
  { vue: { coup: true, secousse: true, boum: true }, son: "coup-de-pied", ms: 280 },
  { vue: { vol: true, secousse: false, boum: false }, son: "envol", ms: 1300 },
];

/* ---------------- Fermeture en cœur ---------------- */

function CoeurFerme({ apres, fin }: { apres: Bruitage; fin: () => void }) {
  useEffect(() => {
    bruitage("coeur");
    const a = window.setTimeout(() => {
      musique(null);
      bruitage(apres);
    }, 1700);
    const b = window.setTimeout(fin, apres === "soupir" ? 5600 : 3400);
    return () => (window.clearTimeout(a), window.clearTimeout(b));
  }, [apres, fin]);
  return (
    <svg className="op-iris" viewBox="0 0 180 320" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <mask id="op-masque-coeur">
          <rect width="180" height="320" fill="#fff" />
          <g transform="translate(90 150)">
            <g className="op-iris-g">
              <path d="M-3 -3H-1V-2H1V-3H3V-2H4V0H3V1H2V2H1V3H-1V2H-2V1H-3V0H-4V-2H-3Z" fill="#000" />
            </g>
          </g>
        </mask>
      </defs>
      <rect width="180" height="320" fill="#000" mask="url(#op-masque-coeur)" />
    </svg>
  );
}

/* ---------------- Le blond qui réagit (bulles) ---------------- */

type Bulle = { texte: string; fort: number; cle: number; qui?: Qui } | null;

function Adversaire({ rougit, bulle, reflechit }: { rougit: number; bulle: Bulle; reflechit: boolean }) {
  const tr = useTraduire();
  const femboy = bulle?.qui === "femboy";
  return (
    <div className={`op-adversaire${femboy ? " op-adv-f" : ""}`}>
      {femboy ? (
        <div className="op-portrait op-portrait-f">
          <Femboy rougit={1} sourire taille={3} />
        </div>
      ) : (
        <div className={`op-portrait${rougit >= 3 ? " op-tremble" : ""}`}>
          <Blond rougit={rougit} sourire={rougit >= 1} taille={3} />
          {rougit >= 2 ? <Coeurs /> : null}
        </div>
      )}
      {bulle ? (
        <div key={bulle.cle} className={`op-bulle op-fort${bulle.fort}${femboy ? " op-bulle-f" : ""}`} translate="no">
          {tr(bulle.texte)}
        </div>
      ) : reflechit ? (
        <div className="op-bulle op-pense">
          <span className="op-points">…</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Morpion ---------------- */

const X_PX: Px[] = Array.from({ length: 7 }, (_, k): Px[] => [[k, k, 2, 1, "#ff6fae"], [6 - k, k, 2, 1, "#ff6fae"]]).flat();
const O_PX: Px[] = [[2, 0, 4, 1, "#ffd84a"], [1, 1, 1, 1, "#ffd84a"], [6, 1, 1, 1, "#ffd84a"], [0, 2, 1, 4, "#ffd84a"], [7, 2, 1, 4, "#ffd84a"], [1, 6, 1, 1, "#ffd84a"], [6, 6, 1, 1, "#ffd84a"], [2, 7, 4, 1, "#ffd84a"]];

type PropsJeu = { reagir: (r: "gagne" | "perd" | "bien" | "nul") => void; fin: (g: Gagnant, mancheToi: number, mancheBlond: number) => void; eclair?: boolean; entete: (manche: string, score: string, reflechit: boolean) => ReactNode; parler?: (qui: Qui, jeu: JeuParole, moment: MomentParole) => void };

function Morpion({ reagir, fin, eclair, entete, parler }: PropsJeu) {
  const d = memoireDiff.useValeur().d;
  const [g, setG] = useState<Case[]>(Array(9).fill(""));
  const [manche, setManche] = useState(1);
  const [score, setScore] = useState({ toi: 0, blond: 0 });
  const [resultat, setResultat] = useState<Gagnant | null>(null);
  const [indice, setIndice] = useState(-1);
  const [nuls, setNuls] = useState(0);
  const blondCommence = !eclair && manche % 2 === 0;
  const nbX = g.filter((x) => x === "X").length;
  const nbO = g.filter((x) => x === "O").length;
  const tour: "X" | "O" = blondCommence ? (nbO > nbX ? "X" : "O") : nbX > nbO ? "O" : "X";
  const w = gagnantMorpion(g);
  const plein = g.every(Boolean);

  const conclure = useCallback(
    (h: Case[]) => {
      const v = gagnantMorpion(h);
      if (!v && !h.every(Boolean)) return false;
      const r: Gagnant = v ? (v.qui === "X" ? "toi" : "blond") : "nul";
      setResultat(r);
      if (r === "toi") { bruitage("manche-gagnee"); reagir("gagne"); }
      else if (r === "blond") { bruitage("manche-perdue"); reagir("perd"); }
      else { bruitage("nul"); setNuls((n) => n + 1); }
      setScore((s) => ({ toi: s.toi + (r === "toi" ? 1 : 0), blond: s.blond + (r === "blond" ? 1 : 0) }));
      return true;
    },
    [reagir],
  );

  useEffect(() => {
    if (resultat || w || plein || tour !== "O") return;
    const id = window.setTimeout(() => {
      const h = [...g];
      h[blondMorpion(h, d, nuls)] = "O";
      bruitage("rond");
      setG(h);
      parler?.("blond", "morpion", "coup");
      conclure(h);
    }, 650);
    return () => window.clearTimeout(id);
  }, [g, tour, resultat, w, plein, conclure, nuls, d, parler]);

  const jouerCase = (i: number) => {
    if (resultat || tour !== "X" || g[i]) return bruitage("erreur");
    const h = [...g];
    h[i] = "X";
    bruitage("croix");
    setIndice(-1);
    setG(h);
    parler?.("femboy", "morpion", "coup");
    conclure(h);
  };
  const suivante = () => {
    bruitage("valider");
    const fini = eclair ? resultat !== "nul" : manche >= 3;
    if (fini) return fin(score.toi > score.blond ? "toi" : score.blond > score.toi ? "blond" : "nul", score.toi, score.blond);
    setManche((m) => m + 1);
    setG(Array(9).fill(""));
    setResultat(null);
  };
  return (
    <>
      {entete(eclair ? "MORPION ÉCLAIR" : `MANCHE ${manche}/3`, `${score.toi} – ${score.blond}`, tour === "O" && !resultat)}
      <div className="op-morpion" data-tour={resultat ? "fin" : tour}>
        {g.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`op-m-case${w?.ligne.includes(i) ? " op-gagnante" : ""}${indice === i ? " op-indice" : ""}`}
            data-case={i}
            data-v={v}
            onClick={() => jouerCase(i)}
            aria-label={`Case ${i + 1}`}
          >
            {v === "X" ? <Pixels rects={X_PX} w={8} h={7} taille={7} contour="#5a1838" /> : null}
            {v === "O" ? <Pixels rects={O_PX} w={8} h={8} taille={7} contour="#6a4a00" /> : null}
          </button>
        ))}
      </div>
      <Commandes
        resultat={resultat}
        suivante={suivante}
        dernier={eclair ? resultat !== "nul" : manche >= 3}
        indice={() => {
          if (resultat || tour !== "X") return;
          bruitage("indice");
          setIndice(meilleurMorpion(g, "X"));
        }}
      />
    </>
  );
}

function Commandes({ resultat, suivante, indice, dernier }: { resultat: Gagnant | null; suivante: () => void; indice: () => void; dernier: boolean }) {
  return (
    <div className="op-commandes">
      {resultat ? (
        <div className={`op-resultat op-r-${resultat}`}>
          <b>{resultat === "toi" ? "Tu gagnes la manche !" : resultat === "blond" ? "Le blond gagne la manche" : "Égalité !"}</b>
          <button type="button" className="op-bouton op-continuer" onClick={suivante}>
            {dernier ? "Voir le résultat" : "Manche suivante"}
          </button>
        </div>
      ) : (
        <button type="button" className="op-bouton op-petit op-bouton-indice" onClick={indice}>
          💡 Indice
        </button>
      )}
    </div>
  );
}

/* ---------------- Puissance 4 ---------------- */

function Puissance4({ reagir, fin, entete, parler }: PropsJeu) {
  const [g, setG] = useState<Case[]>(Array(COLS * RANGS).fill(""));
  const [manche, setManche] = useState(1);
  const [score, setScore] = useState({ toi: 0, blond: 0 });
  const [resultat, setResultat] = useState<Gagnant | null>(null);
  const [indice, setIndice] = useState(-1);
  const [dernier, setDernier] = useState(-1);
  const blondCommence = manche % 2 === 0;
  const nbX = g.filter((x) => x === "X").length;
  const nbO = g.filter((x) => x === "O").length;
  const tour: "X" | "O" = blondCommence ? (nbO > nbX ? "X" : "O") : nbX > nbO ? "O" : "X";
  const w = gagnant4(g);

  const conclure = useCallback(
    (h: Case[]) => {
      const v = gagnant4(h);
      if (!v && !h.every(Boolean)) return;
      const r: Gagnant = v ? (v.qui === "X" ? "toi" : "blond") : "nul";
      setResultat(r);
      if (r === "toi") { bruitage("manche-gagnee"); reagir("gagne"); }
      else if (r === "blond") { bruitage("manche-perdue"); reagir("perd"); }
      else bruitage("nul");
      setScore((s) => ({ toi: s.toi + (r === "toi" ? 1 : 0), blond: s.blond + (r === "blond" ? 1 : 0) }));
    },
    [reagir],
  );
  const poser = useCallback(
    (h: Case[], c: number, v: "X" | "O") => {
      const r = chute(h, c);
      if (r < 0) return false;
      const n = [...h];
      n[r * COLS + c] = v;
      bruitage("jeton");
      setDernier(r * COLS + c);
      setG(n);
      conclure(n);
      return true;
    },
    [conclure],
  );
  useEffect(() => {
    if (resultat || w || g.every(Boolean) || tour !== "O") return;
    const id = window.setTimeout(() => { poser(g, blond4(g, memoireDiff.lire().d), "O"); parler?.("blond", "puissance4", "coup"); }, 700);
    return () => window.clearTimeout(id);
  }, [g, tour, resultat, w, poser, parler]);
  const jouerCol = (c: number) => {
    if (resultat || tour !== "X" || !poser(g, c, "X")) return bruitage("erreur");
    setIndice(-1);
  };
  const suivante = () => {
    bruitage("valider");
    if (manche >= 3) return fin(score.toi > score.blond ? "toi" : score.blond > score.toi ? "blond" : "nul", score.toi, score.blond);
    setManche((m) => m + 1);
    setG(Array(COLS * RANGS).fill(""));
    setResultat(null);
    setDernier(-1);
  };
  return (
    <>
      {entete(`MANCHE ${manche}/3`, `${score.toi} – ${score.blond}`, tour === "O" && !resultat)}
      <div className="op-p4" data-tour={resultat ? "fin" : tour}>
        {Array.from({ length: COLS }, (_, c) => (
          <button key={c} type="button" className={`op-p4-col${indice === c ? " op-indice" : ""}`} data-col={c} onClick={() => jouerCol(c)} aria-label={`Colonne ${c + 1}`}>
            {Array.from({ length: RANGS }, (_, r) => {
              const i = r * COLS + c;
              const v = g[i];
              return (
                <span
                  key={r}
                  className={`op-p4-trou${v ? ` op-p4-${v}` : ""}${i === dernier ? " op-chute" : ""}${w?.cases.includes(i) ? " op-gagnante" : ""}`}
                  style={{ "--r": r + 1 } as CSSProperties}
                />
              );
            })}
          </button>
        ))}
      </div>
      <Commandes
        resultat={resultat}
        suivante={suivante}
        dernier={manche >= 3}
        indice={() => {
          if (resultat || tour !== "X") return;
          bruitage("indice");
          setIndice(meilleur4(g, "X", 5));
        }}
      />
    </>
  );
}

/* ---------------- Échecs ---------------- */

const MAX_COUPS = 60;

function Echecs({ reagir, fin, entete, parler }: PropsJeu) {
  const [e, setE] = useState<Echiquier>(depart);
  const [sel, setSel] = useState(-1);
  const [dernier, setDernier] = useState<Coup | null>(null);
  const [indice, setIndice] = useState<Coup | null>(null);
  const [coups, setCoups] = useState(0);
  const [resultat, setResultat] = useState<{ g: Gagnant; pourquoi: string } | null>(null);
  const meilleureAvance = useRef(0);
  const legaux = useMemo(() => (e.trait === "w" && !resultat ? coupsLegaux(e) : []), [e, resultat]);
  const cibles = sel >= 0 ? legaux.filter((m) => m.de === sel) : [];
  const echec = enEchec(e);

  const apres = useCallback(
    (n: Echiquier, m: Coup, nCoups: number) => {
      if (m.prise) bruitage("prise");
      else bruitage("pion");
      if (enEchec(n)) window.setTimeout(() => bruitage("echec"), 150);
      setDernier(m);
      setE(n);
      const f = finPartie(n);
      const plafond = nCoups >= MAX_COUPS && n.trait === "w";
      if (f || plafond) {
        let g: Gagnant;
        let pourquoi: string;
        if (f?.type === "mat") { g = f.gagnant === "w" ? "toi" : "blond"; pourquoi = "Échec et mat !"; }
        else {
          const m2 = materiel(n.b, "w");
          g = m2 > 0 ? "toi" : m2 < 0 ? "blond" : "nul";
          pourquoi = plafond ? "60 coups joués : le plus de matériel gagne." : "Partie nulle : le plus de matériel gagne.";
        }
        setResultat({ g, pourquoi });
        if (g === "toi") { bruitage("jeu-gagne"); reagir("gagne"); }
        else if (g === "blond") { bruitage("jeu-perdu"); reagir("perd"); }
        else bruitage("nul");
        return;
      }
      // le blond est impressionné quand tu prends de l'avance
      const avance = materiel(n.b, "w");
      if (avance >= 300 && avance >= meilleureAvance.current + 200) {
        meilleureAvance.current = avance;
        reagir("bien");
      }
    },
    [reagir],
  );
  useEffect(() => {
    if (resultat || e.trait !== "b") return;
    const id = window.setTimeout(() => {
      const m = blondEchecs(e, memoireDiff.lire().d);
      if (m) {
        parler?.(m.prise ? "blond" : "blond", "echecs", m.prise ? "prise" : "coup");
        apres(jouer(e, m), m, coups);
      }
    }, 550);
    return () => window.clearTimeout(id);
  }, [e, resultat, apres, coups, parler]);

  const toucher = (i: number) => {
    if (resultat || e.trait !== "w") return;
    const p = e.b[i]!;
    if (sel >= 0) {
      const m = cibles.find((x) => x.a === i);
      if (m) {
        const n = jouer(e, m);
        setSel(-1);
        setIndice(null);
        setCoups((c) => c + 1);
        parler?.(m.prise ? "femboy" : "femboy", "echecs", m.prise ? "prise" : "coup");
        apres(n, m, coups + 1);
        return;
      }
    }
    if (p && p === p.toUpperCase()) {
      bruitage("menu");
      setSel(i);
    } else {
      setSel(-1);
      if (sel >= 0) bruitage("erreur");
    }
  };
  const prisesToi = useMemo(() => manquantes(e.b, "b"), [e]);
  const prisesBlond = useMemo(() => manquantes(e.b, "w"), [e]);
  return (
    <>
      {entete(`COUP ${Math.min(coups + 1, MAX_COUPS)}/${MAX_COUPS}`, materiel(e.b, "w") > 0 ? `+${Math.round(materiel(e.b, "w") / 100)}` : `${Math.round(materiel(e.b, "w") / 100)}`, e.trait === "b" && !resultat)}
      <div className="op-prises" translate="no">{prisesBlond.map((p, k) => <PieceEchecs key={k} p={p} taille={1.6} />)}</div>
      <div className="op-echiquier" data-trait={resultat ? "fin" : e.trait}>
        {e.b.map((p, i) => {
          const clair = ((i >> 3) + (i & 7)) % 2 === 0;
          const cible = cibles.some((m) => m.a === i);
          const cls = [
            "op-e-case",
            clair ? "op-clair" : "op-sombre",
            sel === i ? "op-sel" : "",
            cible ? (p ? "op-cible-prise" : "op-cible") : "",
            dernier && (dernier.de === i || dernier.a === i) ? "op-dernier" : "",
            indice && (indice.de === i || indice.a === i) ? "op-indice" : "",
            echec && p === (e.trait === "w" ? "K" : "k") ? "op-roi-echec" : "",
          ].join(" ");
          return (
            <button key={i} type="button" className={cls} data-sq={i} data-p={p || undefined} data-cible={cible ? "1" : undefined} onClick={() => toucher(i)} aria-label={`Case ${"abcdefgh"[i & 7]}${8 - (i >> 3)}`}>
              {p ? <PieceEchecs p={p} taille={3.2} /> : null}
            </button>
          );
        })}
      </div>
      <div className="op-prises" translate="no">{prisesToi.map((p, k) => <PieceEchecs key={k} p={p} taille={1.6} />)}</div>
      <div className="op-commandes">
        {resultat ? (
          <div className={`op-resultat op-r-${resultat.g}`}>
            <b>{resultat.pourquoi}</b>
            <span>{resultat.g === "toi" ? "Tu gagnes les échecs !" : resultat.g === "blond" ? "Le blond gagne les échecs" : "Égalité parfaite !"}</span>
            <button type="button" className="op-bouton op-continuer" onClick={() => (bruitage("valider"), fin(resultat.g, resultat.g === "toi" ? 1 : 0, resultat.g === "blond" ? 1 : 0))}>
              Voir le résultat
            </button>
          </div>
        ) : (
          <>
            {echec && e.trait === "w" ? <b className="op-alerte">Échec !</b> : null}
            <button
              type="button"
              className="op-bouton op-petit op-bouton-indice"
              onClick={() => {
                if (e.trait !== "w") return;
                bruitage("indice");
                const m = indiceEchecs(e);
                setIndice(m);
                if (m) setSel(m.de);
              }}
            >
              💡 Indice
            </button>
          </>
        )}
      </div>
    </>
  );
}
function manquantes(b: string[], camp: "w" | "b") {
  const tous = camp === "w" ? "PPPPPPPPNNBBRRQ" : "ppppppppnnbbrrq";
  const reste = [...b.filter(Boolean)];
  const out: string[] = [];
  for (const p of tous) {
    const k = reste.indexOf(p);
    if (k >= 0) reste.splice(k, 1);
    else out.push(p);
  }
  return out;
}

/* ---------------- La table du casino : les trois jeux ---------------- */

const JEUX = ["Morpion", "Puissance 4", "Qui suis-je", "Bataille navale", "Baby-foot", "Échecs"] as const;
const PISTE_JEU: NomPiste[] = ["morpion", "puissance4", "quisuisje", "navale", "babyfoot", "echecs"];
const PAROLE_JEU: JeuParole[] = ["morpion", "puissance4", "quisuisje", "navale", "babyfoot", "echecs"];


const GESTES = ["pierre", "feuille", "ciseaux"] as const;
type Geste = (typeof GESTES)[number];
const GESTE_BAT: Record<Geste, Geste> = { pierre: "ciseaux", feuille: "pierre", ciseaux: "feuille" };
const GESTE_NOM: Record<Geste, string> = { pierre: "Pierre", feuille: "Feuille", ciseaux: "Ciseaux" };

function Chifoumi({ jeu, onFin }: { jeu: string; onFin: (g: "toi" | "blond") => void }) {
  const tr = useTraduire();
  const [toi, setToi] = useState<Geste | null>(null);
  const [blond, setBlond] = useState<Geste | null>(null);
  const [egalite, setEgalite] = useState(false);
  const choisi = (g: Geste) => {
    if (toi) return;
    bruitage("valider");
    const b = GESTES[Math.floor(Math.random() * GESTES.length)]!;
    setToi(g);
    setBlond(b);
    const resultat: "toi" | "blond" | "nul" = g === b ? "nul" : GESTE_BAT[g] === b ? "toi" : "blond";
    window.setTimeout(() => {
      if (resultat === "nul") {
        bruitage("nul");
        setEgalite(true);
        setToi(null);
        setBlond(null);
      } else {
        onFin(resultat);
      }
    }, 900);
  };
  return (
    <div className="op-chifoumi">
      <b className="op-bilan-titre">{tr("Égalité :")} {jeu}</b>
      <p className="op-chifoumi-regle">{tr("Pierre, feuille, ciseaux pour départager.")}</p>
      <div className="op-chifoumi-mains">
        <div>
          <small>{tr("Toi")}</small>
          <span className="op-chifoumi-geste">{toi ? tr(GESTE_NOM[toi]) : "…"}</span>
        </div>
        <div>
          <small>{tr("Blond")}</small>
          <span className="op-chifoumi-geste">{blond ? tr(GESTE_NOM[blond]) : "…"}</span>
        </div>
      </div>
      {egalite && !toi ? <p className="op-chifoumi-nul">{tr("Égalité : on recommence.")}</p> : null}
      <div className="op-chifoumi-choix">
        {GESTES.map((g) => (
          <button key={g} type="button" className="op-bouton op-petit" disabled={!!toi} onClick={() => choisi(g)}>
            {tr(GESTE_NOM[g])}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tournoi({ termine }: { termine: (victoire: boolean) => void }) {
  const [jeu, setJeu] = useState(0);
  const [res, setRes] = useState<{ g: Gagnant; toi: number; blond: number }[]>([]);
  const [vue, setVue] = useState<"jeu" | "bilan" | "chifoumi">("jeu");
  const [rougit, setRougit] = useState(0);
  const [bulle, setBulle] = useState<Bulle>(null);
  const [partie, setPartie] = useState(0);
  useEffect(() => {
    const h = (ev: Event) => {
      const d = (ev as CustomEvent<{ vue?: string; i?: number }>).detail;
      if (typeof d?.i !== "number") return;
      // ancien hook « départage » : 0, 1, 2 = qui / navale / baby-foot (désormais 2, 3, 4)
      const i = d.vue === "departage" ? 2 + (d.i % 3) : Math.max(0, Math.min(JEUX.length - 1, d.i));
      setJeu(i);
      setVue("jeu");
    };
    window.addEventListener("aakanos-opakaalt-tournoi", h);
    return () => window.removeEventListener("aakanos-opakaalt-tournoi", h);
  }, []);

  const gagnes = res.filter((r) => r.g === "toi").length;
  const perdus = res.filter((r) => r.g === "blond").length;
  const avanceRef = useRef(0);
  const paroleRef = useRef<JeuParole>("morpion");
  useEffect(() => {
    avanceRef.current = gagnes - perdus;
  }, [gagnes, perdus]);

  useEffect(() => {
    const nom = vue === "bilan" ? "casino" : PISTE_JEU[jeu]!;
    paroleRef.current = PAROLE_JEU[jeu]!;
    musique(nom);
  }, [jeu, vue]);
  useEffect(() => {
    if (!bulle) return;
    const id = window.setTimeout(() => setBulle(null), 4200);
    return () => window.clearTimeout(id);
  }, [bulle]);

  const parler = useCallback((qui: Qui, jeuP: JeuParole, moment: MomentParole) => {
    const texte = uneReplique(qui, jeuP, moment);
    if (!texte) return;
    setBulle({ texte, fort: qui === "blond" && (moment === "perd" || moment === "gagne") ? 2 : qui === "femboy" ? 1 : 0, qui, cle: Date.now() });
  }, []);

  const reagir = useCallback((r: "gagne" | "perd" | "bien" | "nul") => {
    const jeuP = paroleRef.current;
    if (r === "gagne" || r === "bien") {
      setRougit((x) => Math.min(3, x + (r === "gagne" ? 2 : 1)));
      const n = r === "gagne" ? 3 : 1;
      if (avanceRef.current >= 0) {
        setBulle({ texte: uneReplique("blond", jeuP, r === "gagne" ? "perd" : "bien"), fort: n, qui: "blond", cle: Date.now() });
      } else {
        setBulle({ texte: uneReplique("femboy", jeuP, r === "gagne" ? "gagne" : "bien"), fort: 1, qui: "femboy", cle: Date.now() });
      }
    } else if (r === "perd") {
      setRougit((x) => Math.max(0, x - 1));
      setBulle({ texte: uneReplique("blond", jeuP, "gagne"), fort: 0, qui: "blond", cle: Date.now() });
    } else {
      setBulle({ texte: uneReplique("blond", jeuP, "mal"), fort: 0, qui: "blond", cle: Date.now() });
    }
  }, []);

  const finJeu = useCallback((g: Gagnant, toi: number, blond: number) => {
    if (g === "nul") {
      bruitage("nul");
      setVue("chifoumi");
      return;
    }
    const apresGagnes = res.filter((r) => r.g === "toi").length + (g === "toi" ? 1 : 0);
    const apresPerdus = res.filter((r) => r.g === "blond").length + (g === "blond" ? 1 : 0);
    setRes((l) => [...l, { g, toi, blond }]);
    if (g === "blond") bruitage("jeu-perdu");
    else bruitage("jeu-gagne");
    if (apresPerdus >= 3) {
      termine(false);
      return;
    }
    setVue("bilan");
  }, [termine, res]);

  let verdict: "toi" | "blond" | null = null;
  if (perdus >= 3) verdict = "blond";
  else if (gagnes >= 4) verdict = "toi";


  const entete = (manche: string, score: string, reflechit: boolean) => (
    <>
      <div className="op-score">
        {JEUX.map((n, k) => (
          <span key={n} className={`op-pastille${k === jeu && vue !== "bilan" ? " op-encours" : ""}${res[k] ? ` op-p-${res[k]!.g}` : ""}`}>{n}</span>
        ))}
      </div>
      <div className="op-titre-jeu">
        <b>{JEUX[jeu]}</b>
        <span>{manche}</span>
        <span className="op-score-manche">
          <span>Toi</span> <span translate="no">{score}</span> <span>Blond</span>
        </span>
      </div>
      <Adversaire rougit={rougit} bulle={bulle} reflechit={reflechit && !bulle} />
    </>
  );

  const plateau = () => {
    const props = { reagir, fin: finJeu, parler, entete };
    switch (jeu) {
      case 0:
        return <Morpion {...props} />;
      case 1:
        return <Puissance4 {...props} />;
      case 2:
        return <QuiSuisJe {...props} />;
      case 3:
        return <BatailleNavale {...props} />;
      case 4:
        return <BabyFoot {...props} />;
      default:
        return <Echecs {...props} />;
    }
  };

  return (
    <div className="op-tournoi">
      <Casino enseigne={false} />
      <div className="op-tournoi-corps">
        {vue === "jeu" ? (
          <div key={`${jeu}-${partie}`} className="op-jeu" data-jeu={JEUX[jeu]}>
            {plateau()}
          </div>
        ) : vue === "chifoumi" ? (
          <div className="op-bilan">
            <Adversaire rougit={rougit} bulle={bulle} reflechit={false} />
            <Chifoumi jeu={JEUX[jeu]!} onFin={(g) => finJeu(g, g === "toi" ? 1 : 0, g === "blond" ? 1 : 0)} />
          </div>
        ) : (
          <div className="op-bilan">
            <Adversaire rougit={rougit} bulle={bulle} reflechit={false} />
            <b className="op-bilan-titre">Tableau des scores</b>
            <div className="op-tableau">
              <div className="op-t-ligne op-t-tete">
                <span>Jeu</span>
                <b>Toi</b>
                <b>Blond</b>
              </div>
              {JEUX.map((n, k) => (
                <div key={n} className={`op-t-ligne${res[k] ? ` op-t-${res[k]!.g}` : ""}`}>
                  <span>{n}</span>
                  <b>{res[k] ? res[k]!.toi : "–"}</b>
                  <b>{res[k] ? res[k]!.blond : "–"}</b>
                </div>
              ))}
            </div>
            <p className="op-dernier-jeu">
              <span>{res.at(-1)?.g === "toi" ? "Tu gagnes :" : res.at(-1)?.g === "blond" ? "Le blond gagne :" : "Égalité :"}</span> <b>{JEUX[res.length - 1]}</b>
            </p>
            {verdict === "toi" ? (
              <button type="button" className="op-bouton op-continuer" onClick={() => (bruitage("valider"), termine(true))}>
                Voir la fin
              </button>
            ) : (
              <button type="button" className="op-bouton op-continuer" onClick={() => (bruitage("valider"), setJeu(res.length), setPartie((p) => p + 1), setVue("jeu"))}>
                <span>Jeu suivant :</span> <span>{JEUX[res.length]}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Menu et générique ---------------- */

function ChoixDifficulte({ onChoix }: { onChoix: (d: Difficulte) => void }) {
  const actuel = memoireDiff.useValeur().d;
  return (
    <div className="op-scene op-menu op-menu-3d">
      <Monde3D mode="menu" />
      <div className="op-menu-haut">
        <h1 className="op-titre op-titre-petit" translate="no">OPAKAALT</h1>
        <small className="op-sous-titre">Difficulté</small>
      </div>
      <div className="op-menu-bas op-choix-diff">
        {NIVEAUX.map((n) => (
          <button key={n.id} type="button" className={`op-bouton op-diff${actuel === n.id ? " op-diff-actuel" : ""}`} onClick={() => (bruitage("valider"), memoireDiff.ecrire({ d: n.id }), onChoix(n.id))}>
            <b translate="no">{n.nom}</b>
            <small>{n.sous}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Menu({ jouer: lancer }: { jouer: () => void }) {
  const s = memoire.useValeur();
  const [choix, setChoix] = useState(false);
  useEffect(() => {
    musique("menu");
    ambianceVille(true);
    return () => ambianceVille(false);
  }, []);
  if (choix) return <ChoixDifficulte onChoix={() => lancer()} />;
  return (
    <div className="op-scene op-menu op-menu-3d">
      <Monde3D mode="menu" />
      <div className="op-menu-haut">
        <h1 className="op-titre" translate="no">
          OPAKAALT
        </h1>
        <small className="op-sous-titre">Un amour en 8 bits</small>
      </div>
      <div className="op-menu-bas">
        <button type="button" className="op-bouton op-nouvelle" onClick={() => (bruitage("valider"), setChoix(true))}>
          Nouvelle partie
        </button>
        <p className="op-regle">Gagne contre le blond par majorité sur les six jeux : morpion, puissance 4, qui suis-je, bataille navale, baby-foot, puis les échecs. Une égalité se départage au pierre-feuille-ciseaux. Dès que tu ne peux plus gagner, c’est fini.</p>
        {s.parties ? (
          <p className="op-stats">
            <span>{`Parties : ${s.parties}`}</span> · <span>{`Victoires : ${s.victoires}`}</span> · <span>{`Défaites : ${s.defaites}`}</span>
          </p>
        ) : null}
        <p className="op-copyright" translate="no">© 1933 JAMES-GAMES</p>
      </div>
    </div>
  );
}

const CREDITS = [
  "Scénario : Addal Breypaasa",
  "Musiques : Appov Hushpayabu",
  "Jeux de : Morpions, Puissance 4, Bataille navale, Baby-foot, Quisuisje, Échecs",
  "Nos joueurs : Femboy et le Blond.",
  "Remerciement : Partenariat avec Pulpüs market et Nounou browser.",
  "À bientôt.",
];

/** Après la rencontre : tu rejoins le casino à pied, en 3D, pendant que la nuit tombe. */
function Balade({ fin }: { fin: () => void }) {
  const [arrive, setArrive] = useState(false);
  useEffect(() => {
    ambianceVille(true);
    return () => ambianceVille(false);
  }, []);
  useEffect(() => {
    if (!arrive) return;
    bruitage("porte");
    const id = window.setTimeout(fin, 900);
    return () => window.clearTimeout(id);
  }, [arrive, fin]);
  return (
    <div className={`op-scene op-balade${arrive ? " op-arrive" : ""}`}>
      <Monde3D mode="balade" onArrivee={() => setArrive(true)} />
    </div>
  );
}

function Credits({ fin, gagne = false }: { fin: () => void; gagne?: boolean }) {
  const [scriptPret, setScriptPret] = useState(false);
  const [bouton, setBouton] = useState(!gagne);
  useEffect(() => {
    if (gagne) {
      musiqueFin();
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduit) {
        setScriptPret(true);
        const id = window.setTimeout(() => setBouton(true), 400);
        return () => window.clearTimeout(id);
      }
      return;
    }
    musique("credits");
    const m = window.setTimeout(() => bruitage("miaou"), 1400);
    const id = window.setTimeout(fin, 26000);
    return () => (window.clearTimeout(m), window.clearTimeout(id));
  }, [fin, gagne]);
  return (
    <div className={`op-scene op-credits${gagne ? " op-credits-victoire" : ""}${scriptPret ? " op-script-ecrit" : ""}`}>
      <div className="op-etincelles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ left: `${6 + (i * 19 + 7) % 88}%`, top: `${4 + (i * 29) % 86}%`, animationDelay: `${(i * 0.41) % 5}s` }} />
        ))}
      </div>
      <div className="op-defile">
        <div
          className="op-defile-int"
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            if (gagne) setScriptPret(true);
          }}
        >
          <b className="op-titre op-titre-petit op-titre-credits" translate="no">OPAKAALT</b>
          <p className="op-james">jeu fait par James-games</p>
          <ChatNeon taille={7} />
          <p className="op-neon" translate="no">JAMES-GAMES</p>
          <p className="op-annee" translate="no">© 1933</p>
          {CREDITS.map((c) => (
            <p key={c}>{c}</p>
          ))}
          <p className="op-neon" translate="no">© 1933 JAMES-GAMES</p>
          {gagne ? (
            <div className="op-credits-script-cadre">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="op-credits-script"
                src="/aakanos/opakaalt-script.svg"
                alt=""
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onAnimationEnd={(e) => {
                  e.stopPropagation();
                  setBouton(true);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className={`op-bouton op-petit op-retour-menu${bouton ? " op-retour-visible" : ""}`}
        tabIndex={bouton ? 0 : -1}
        aria-hidden={!bouton}
        disabled={!bouton}
        onClick={() => bouton && (bruitage("valider"), fin())}
      >
        Retour au menu
      </button>
    </div>
  );
}

function Chargement({ fin }: { fin: () => void }) {
  useEffect(() => {
    musique(null);
    bruitage("chargement");
    const id = window.setTimeout(fin, 2400);
    return () => window.clearTimeout(id);
  }, [fin]);
  return (
    <div className="op-scene op-noir">
      <p className="op-chargement">Chargement…</p>
      <div className="op-barre-charge">
        <i />
      </div>
    </div>
  );
}

function Espace({ fin }: { fin: () => void }) {
  useEffect(() => {
    bruitage("envol");
    const id = window.setTimeout(fin, 3600);
    return () => window.clearTimeout(id);
  }, [fin]);
  return (
    <div className="op-scene op-scene-espace">
      <Terre />
      <div className="op-volant">
        <Femboy taille={2} />
      </div>
    </div>
  );
}

/* ---------------- L'appli ---------------- */

type Phase = "menu" | "intro" | "balade" | "chargement" | "casino" | "tournoi" | "victoire" | "coeur-gagne" | "defaite" | "espace" | "coeur-perdu" | "credits";

export function AppOpakaalt() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [tour, setTour] = useState(0);
  const [gagne, setGagne] = useState(false);
  useRetour(phase !== "menu", () => setPhase("menu"));
  useEffect(() => {
    const h = (ev: Event) => {
      const d = (ev as CustomEvent).detail;
      if (typeof d === "string") setPhase(d as Phase);
      else if (d && typeof d === "object" && typeof d.phase === "string") {
        if (typeof d.gagne === "boolean") setGagne(d.gagne);
        setPhase(d.phase as Phase);
      }
    };
    window.addEventListener("aakanos-opakaalt-phase", h);
    return () => window.removeEventListener("aakanos-opakaalt-phase", h);
  }, []);

  useEffect(() => () => silence(), []);
  const aller = useCallback((p: Phase) => () => setPhase(p), []);
  const fins = useMemo(
    () => ({
      intro: aller("balade"),
      balade: aller("chargement"),
      chargement: aller("casino"),
      casino: aller("tournoi"),
      victoire: aller("coeur-gagne"),
      defaite: aller("espace"),
      espace: aller("coeur-perdu"),
      coeur: aller("credits"),
      credits: () => {
        setPhase("menu");
        setTour((t) => t + 1);
      },
    }),
    [aller],
  );
  const termine = useCallback((v: boolean) => {
    memoire.ecrire((m) => ({ parties: m.parties + 1, victoires: m.victoires + (v ? 1 : 0), defaites: m.defaites + (v ? 0 : 1) }));
    setGagne(v);
    if (v) musiqueFin();
    setPhase(v ? "victoire" : "defaite");
  }, []);
  useEffect(() => {
    if (phase === "menu") arreterMusiqueFin();
  }, [phase]);
  const passer = phase === "intro" || phase === "casino" || phase === "balade" ? fins[phase] : null;
  return (
    <div className="op" data-son="aucun" data-phase={phase}>
      {phase === "menu" ? <Menu key={tour} jouer={() => setPhase("intro")} /> : null}
      {phase === "intro" ? <Cinematique decor="rue" etapes={INTRO} fin={fins.intro} /> : null}
      {phase === "balade" ? <Balade fin={fins.balade} /> : null}
      {phase === "chargement" ? <Chargement fin={fins.chargement} /> : null}
      {phase === "casino" ? <Cinematique decor="casino" etapes={CASINO} fin={fins.casino} /> : null}
      {phase === "tournoi" ? <Tournoi termine={termine} /> : null}
      {phase === "victoire" || phase === "coeur-gagne" ? (
        <Cinematique decor="hotel" etapes={VICTOIRE} fin={fins.victoire}>
          {phase === "coeur-gagne" ? <CoeurFerme apres="soupir" fin={fins.coeur} /> : null}
        </Cinematique>
      ) : null}
      {phase === "defaite" ? <Cinematique decor="casino" etapes={DEFAITE} fin={fins.defaite} /> : null}
      {phase === "espace" || phase === "coeur-perdu" ? (
        <>
          <Espace fin={fins.espace} />
          {phase === "coeur-perdu" ? <CoeurFerme apres="aie" fin={fins.coeur} /> : null}
        </>
      ) : null}
      {phase === "credits" ? <Credits fin={fins.credits} gagne={gagne} /> : null}
      {passer ? (
        <button type="button" className="op-passer" onClick={() => (bruitage("menu"), passer())}>
          Passer ▸▸
        </button>
      ) : null}
    </div>
  );
}
