"use client";

/**
 * Qui suis-je, Bataille navale et Baby-foot : joués à chaque partie, avant les échecs.
 */
import { useEffect, useRef, useState, type PointerEvent as PE, type ReactNode } from "react";
import {
  NAV_N,
  QUESTIONS_QUI,
  VISAGES,
  blondNavale,
  etatTir,
  flotteCoulee,
  placerFlotte,
  questionBlondQui,
  type CaseNav,
  type Flotte,
  type TraitsQui,
} from "./opakaaltJeux";
import { memoireDiff } from "./opakaaltDiff";
import { Pixels, type Px } from "./opakaaltPixels";
import { bruitage } from "./opakaaltSon";
import { type JeuParole, type MomentParole } from "./opakaaltRepliques";

export type PropsMini = {
  reagir: (r: "gagne" | "perd" | "bien" | "nul") => void;
  parler: (qui: "blond" | "femboy", jeu: JeuParole, moment: MomentParole) => void;
  fin: (g: "toi" | "blond", toi: number, blond: number) => void;
  entete: (manche: string, score: string, reflechit: boolean) => ReactNode;
};

const CHEV: Record<TraitsQui["cheveux"], string> = { rose: "#ff7eb0", blond: "#ffd84a", brun: "#5a3a22", roux: "#d4652c" };
const YEUX: Record<TraitsQui["yeux"], string> = { bleu: "#4aa3ff", vert: "#3cb371", marron: "#7a4a1e" };

function PortraitQui({ t, taille = 3, off = false }: { t: TraitsQui; taille?: number; off?: boolean }) {
  const c = CHEV[t.cheveux];
  const y = YEUX[t.yeux];
  const peau = "#f5c39e";
  const r: Px[] = [
    [t.long ? 1 : 2, 0, t.long ? 10 : 8, t.long ? 3 : 2, c],
    [2, 2, 8, 7, peau],
    [3, 4, 2, 2, y],
    [7, 4, 2, 2, y],
    [4, 8, 4, 1, t.sourire ? "#b03a48" : "#7a5a50"],
  ];
  if (t.barbe) r.push([3, 9, 6, 2, c]);
  if (t.lunettes) r.push([2, 4, 8, 1, "#222"], [2, 3, 1, 3, "#222"], [9, 3, 1, 3, "#222"]);
  if (t.chapeau) r.push([1, 0, 10, 2, "#333"], [0, 2, 12, 1, "#333"]);
  return (
    <span className={`op-qui-face${off ? " off" : ""}`}>
      <Pixels rects={r} w={12} h={12} taille={taille} />
    </span>
  );
}

export function QuiSuisJe({ reagir, parler, fin, entete }: PropsMini) {
  const d = memoireDiff.useValeur().d;
  const [secretToi] = useState(() => Math.floor(Math.random() * VISAGES.length));
  const [secretBlond] = useState(() => Math.floor(Math.random() * VISAGES.length));
  const [restantsToi, setRestantsToi] = useState(() => VISAGES.map((_, i) => i));
  const [restantsBlond, setRestantsBlond] = useState(() => VISAGES.map((_, i) => i));
  const [posees, setPosees] = useState<Set<string>>(new Set());
  const [tour, setTour] = useState<"toi" | "blond">("toi");
  const [info, setInfo] = useState<ReactNode>(null);
  const [choix, setChoix] = useState<number | null>(null);
  const [fini, setFini] = useState<"toi" | "blond" | null>(null);

  const gagner = (g: "toi" | "blond") => {
    setFini(g);
    if (g === "toi") { bruitage("manche-gagnee"); reagir("gagne"); parler("blond", "quisuisje", "perd"); }
    else { bruitage("manche-perdue"); reagir("perd"); parler("blond", "quisuisje", "gagne"); }
    window.setTimeout(() => fin(g, g === "toi" ? 1 : 0, g === "blond" ? 1 : 0), 900);
  };

  const poser = (id: string) => {
    if (tour !== "toi" || fini) return;
    const q = QUESTIONS_QUI.find((x) => x.id === id);
    if (!q || posees.has(id)) return;
    bruitage("carte");
    const oui = q.test(VISAGES[secretBlond]!);
    setInfo(<><span>{q.texte}</span>{" — "}<span>{oui ? "Oui" : "Non"}</span></>);
    setRestantsToi((l) => l.filter((i) => q.test(VISAGES[i]!) === oui));
    setPosees((s) => new Set(s).add(id));
    parler("femboy", "quisuisje", "coup");
    setTour("blond");
  };

  const deviner = (i: number) => {
    if (tour !== "toi" || fini) return;
    if (i === secretBlond) { gagner("toi"); return; }
    bruitage("buzzer");
    setInfo("Non, ce n’est pas lui.");
    setChoix(null);
    parler("blond", "quisuisje", "faux");
    reagir("nul");
    setTour("blond");
  };

  useEffect(() => {
    if (tour !== "blond" || fini) return;
    const id = window.setTimeout(() => {
      const q = questionBlondQui(restantsBlond, posees, d);
      if (restantsBlond.length <= 2 || !q) {
        const guess = restantsBlond.includes(secretToi) && (d !== "soumis" || restantsBlond.length === 1)
          ? secretToi
          : restantsBlond[0]!;
        if (guess === secretToi) gagner("blond");
        else {
          bruitage("buzzer");
          setInfo("Le blond s’est trompé !");
          parler("femboy", "quisuisje", "faux");
          setRestantsBlond((l) => l.filter((x) => x !== guess));
          setTour("toi");
        }
        return;
      }
      bruitage("carte");
      const oui = q.test(VISAGES[secretToi]!);
      setInfo(<><span>Blond</span>{` : `}<span>{q.texte}</span>{" — "}<span>{oui ? "Oui" : "Non"}</span></>);
      setRestantsBlond((l) => l.filter((i) => q.test(VISAGES[i]!) === oui));
      setPosees((s) => new Set(s).add(q.id));
      parler("blond", "quisuisje", "coup");
      setTour("toi");
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, fini]);

  return (
    <div className="op-qui">
      {entete("QUI SUIS-JE", fini ? (fini === "toi" ? "1 – 0" : "0 – 1") : "—", tour === "blond" && !fini)}
      <div className="op-qui-toi">
        <span>Ton visage</span>
        <PortraitQui t={VISAGES[secretToi]!} taille={4} />
      </div>
      <div className="op-qui-grille">
        {VISAGES.map((t, i) => (
          <button key={i} type="button" className={`op-qui-case${restantsToi.includes(i) ? "" : " out"}${choix === i ? " sel" : ""}`} onClick={() => restantsToi.includes(i) && setChoix(i)} disabled={!!fini || !restantsToi.includes(i)}>
            <PortraitQui t={t} off={!restantsToi.includes(i)} />
          </button>
        ))}
      </div>
      <p className="op-qui-info">{info}</p>
      {choix !== null && !fini ? (
        <button type="button" className="op-bouton op-petit" onClick={() => deviner(choix)}>Je devine celui-là</button>
      ) : null}
      <div className="op-qui-qs">
        {QUESTIONS_QUI.filter((q) => !posees.has(q.id)).slice(0, 8).map((q) => (
          <button key={q.id} type="button" className="op-bouton op-petit" disabled={tour !== "toi" || !!fini} onClick={() => poser(q.id)}>{q.texte}</button>
        ))}
      </div>
    </div>
  );
}

export function BatailleNavale({ reagir, parler, fin, entete }: PropsMini) {
  const d = memoireDiff.useValeur().d;
  const [flotteToi] = useState(() => placerFlotte());
  const [flotteBlond] = useState(() => placerFlotte());
  const [tirsToi, setTirsToi] = useState<Set<number>>(new Set());
  const [tirsBlond, setTirsBlond] = useState<Set<number>>(new Set());
  const [tour, setTour] = useState<"toi" | "blond">("toi");
  const [fini, setFini] = useState<"toi" | "blond" | null>(null);
  const [msg, setMsg] = useState("");

  const grille = (flotte: Flotte, tirs: Set<number>, visible: boolean, onClick?: (i: number) => void) => (
    <div className="op-nav-grille">
      {Array.from({ length: NAV_N * NAV_N }, (_, i) => {
        let et: CaseNav | "bateau" | "vide" = "vide";
        if (tirs.has(i)) et = etatTir(flotte, tirs, i);
        else if (visible && flotte.cellules.has(i)) et = "bateau";
        return (
          <button key={i} type="button" className={`op-nav-case op-nav-${et}`} disabled={!onClick || tirs.has(i) || !!fini} onClick={() => onClick?.(i)} />
        );
      })}
    </div>
  );

  const tirer = (i: number) => {
    if (tour !== "toi" || fini || tirsToi.has(i)) return;
    bruitage("tir");
    const n = new Set(tirsToi); n.add(i);
    const et = etatTir(flotteBlond, n, i);
    setTirsToi(n);
    if (et === "eau") { bruitage("plouf"); setMsg("À l’eau !"); parler("blond", "navale", "manque"); }
    else if (et === "coule") { bruitage("coule"); setMsg("Coulé !"); reagir("bien"); parler("femboy", "navale", "prise"); }
    else { bruitage("bombe"); setMsg("Touché !"); reagir("bien"); parler("femboy", "navale", "prise"); }
    if (flotteCoulee(flotteBlond, n)) {
      setFini("toi"); bruitage("manche-gagnee"); reagir("gagne");
      window.setTimeout(() => fin("toi", 1, 0), 900);
      return;
    }
    setTour("blond");
  };

  useEffect(() => {
    if (tour !== "blond" || fini) return;
    const id = window.setTimeout(() => {
      const i = blondNavale(tirsBlond, flotteToi, d);
      bruitage("tir");
      const n = new Set(tirsBlond); n.add(i);
      const et = etatTir(flotteToi, n, i);
      setTirsBlond(n);
      if (et === "eau") { bruitage("plouf"); setMsg("Le blond rate."); parler("femboy", "navale", "manque"); }
      else if (et === "coule") { bruitage("coule"); setMsg("Le blond a coulé un bateau !"); reagir("nul"); parler("blond", "navale", "prise"); }
      else { bruitage("bombe"); setMsg("Le blond t’a touché."); parler("blond", "navale", "prise"); }
      if (flotteCoulee(flotteToi, n)) {
        setFini("blond"); bruitage("manche-perdue"); reagir("perd");
        window.setTimeout(() => fin("blond", 0, 1), 900);
        return;
      }
      setTour("toi");
    }, 800);
    return () => window.clearTimeout(id);
  }, [tour, fini, tirsBlond, d, parler, reagir, fin, flotteToi]);

  return (
    <div className="op-nav">
      {entete("BATAILLE NAVALE", fini ? (fini === "toi" ? "1 – 0" : "0 – 1") : "—", tour === "blond" && !fini)}
      <p className="op-qui-info">{msg || "Tire sur la flotte du blond."}</p>
      <div className="op-nav-deux">
        <div>
          <b>Blond</b>
          {grille(flotteBlond, tirsToi, false, tour === "toi" && !fini ? tirer : undefined)}
        </div>
        <div>
          <b>Toi</b>
          {grille(flotteToi, tirsBlond, true)}
        </div>
      </div>
    </div>
  );
}

export function BabyFoot({ reagir, parler, fin, entete }: PropsMini) {
  const d = memoireDiff.useValeur().d;
  const canvas = useRef<HTMLCanvasElement>(null);
  const score = useRef({ toi: 0, blond: 0 });
  const [aff, setAff] = useState({ toi: 0, blond: 0 });
  const fini = useRef(false);
  const yToi = useRef(0.5);
  const kick = useRef(0);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 280, H = 160;
    c.width = W; c.height = H;
    let ball = { x: W/2, y: H/2, vx: 1.6, vy: 0.6 };
    const lag = d === "top" ? 0.05 : d === "versa" ? 0.16 : 0.4;
    const prec = d === "top" ? 0.95 : d === "versa" ? 0.75 : 0.45;
    let yBlond = 0.5;
    let last = performance.now();
    const reset = (sens: 1 | -1) => { ball = { x: W/2, y: H/2, vx: 1.8*sens, vy: (Math.random()*2-1)*1.2 }; };
    const figures = (side: "toi" | "blond", y: number) => {
      const xs = side === "toi" ? [40, 110] : [170, 240];
      const ns = side === "toi" ? [2, 3] : [3, 2];
      const out: { x: number; y: number; side: "toi" | "blond" }[] = [];
      xs.forEach((x, k) => {
        const n = ns[k]!;
        for (let i = 0; i < n; i++) {
          const yy = 18 + ((H-36) * (i+0.5)/n) + (y-0.5)*36;
          out.push({ x, y: Math.max(14, Math.min(H-14, yy)), side });
        }
      });
      return out;
    };
    let raf = 0;
    const boucle = (t: number) => {
      const dt = Math.min(32, t-last)/16; last = t;
      if (!fini.current) {
        yBlond += ((ball.y/H) - yBlond) * (1-lag) * 0.25 * dt;
        if (Math.random() > prec) yBlond += (Math.random()-0.5)*0.04;
        ball.x += ball.vx*dt*2.2; ball.y += ball.vy*dt*2.2;
        if (ball.y < 8 || ball.y > H-8) { ball.vy *= -1; ball.y = Math.max(8, Math.min(H-8, ball.y)); }
        const figs = [...figures("toi", yToi.current), ...figures("blond", yBlond)];
        for (const f of figs) {
          const dx = ball.x-f.x, dy = ball.y-f.y;
          if (dx*dx+dy*dy < 12*12) {
            const n = Math.hypot(dx,dy)||1;
            const puissance = f.side==="toi" && kick.current>0 ? 3.2 : 2.2;
            ball.vx = (dx/n)*puissance; ball.vy = (dy/n)*puissance;
            if (f.side==="toi" && kick.current>0) { bruitage("pion"); kick.current = 0; }
          }
        }
        if (ball.x < 6 && ball.y>H*0.35 && ball.y<H*0.65) {
          bruitage("but"); bruitage("foule"); score.current.blond++; setAff({ ...score.current });
          parler("blond", "babyfoot", "but"); reagir("nul");
          if (score.current.blond >= 3) { fini.current = true; reagir("perd"); bruitage("manche-perdue"); window.setTimeout(() => fin("blond", score.current.toi, score.current.blond), 800); }
          else reset(1);
        } else if (ball.x > W-6 && ball.y>H*0.35 && ball.y<H*0.65) {
          bruitage("but"); bruitage("foule"); score.current.toi++; setAff({ ...score.current });
          parler("femboy", "babyfoot", "but"); reagir("bien");
          if (score.current.toi >= 3) { fini.current = true; reagir("gagne"); bruitage("manche-gagnee"); window.setTimeout(() => fin("toi", score.current.toi, score.current.blond), 800); }
          else reset(-1);
        } else if (ball.x < 4 || ball.x > W-4) { ball.vx *= -1; }
        if (kick.current>0) kick.current -= dt;
      }
      ctx.fillStyle = "#1f7a3a"; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = "#fff"; ctx.strokeRect(4,4,W-8,H-8);
      ctx.fillStyle = "#0a0"; ctx.fillRect(0, H*0.35, 8, H*0.3); ctx.fillRect(W-8, H*0.35, 8, H*0.3);
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.moveTo(W/2,4); ctx.lineTo(W/2,H-4); ctx.stroke();
      for (const f of [...figures("toi", yToi.current), ...figures("blond", yBlond)]) {
        ctx.fillStyle = f.side==="toi" ? "#ff6fae" : "#ffd84a";
        ctx.fillRect(f.x-4, f.y-8, 8, 16);
      }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, 5, 0, Math.PI*2); ctx.fill();
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [d, fin, parler, reagir]);

  const pointer = (e: PE<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    yToi.current = Math.max(0, Math.min(1, (e.clientY - r.top)/r.height));
  };

  return (
    <div className="op-baby">
      {entete("BABY-FOOT", `${aff.toi} – ${aff.blond}`, false)}
      <canvas
        ref={canvas}
        className="op-baby-canvas"
        onPointerMove={pointer}
        onPointerDown={(e) => { pointer(e); kick.current = 8; bruitage("pion"); }}
      />
      <p className="op-qui-info">Glisse pour bouger tes barreaux, appuie pour frapper. Premier à 3.</p>
    </div>
  );
}
