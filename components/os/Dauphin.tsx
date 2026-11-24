"use client";

/**
 * Le dauphin de Franck (d'après sa peluche) : dessin, version pixel, et le jeu rétro
 * de Nounou Browser quand Internet ne répond pas — sauter les mines, attraper les oiseaux.
 */
import { useEffect, useRef } from "react";

type Palette = Record<string, string>;

export const DAUPHIN = [
  "..oo...............................",
  ".ofo.........ooo...................",
  ".offo.......offfo..................",
  "..offo...ooooffffoooooo............",
  "...offooooXXXXXXXXXXXXXooo.........",
  "....offXXXXXXXXXXXXXXXXXXXoo.......",
  "....oXXXXXXXXXXXXXXXXXXXXXXXo......",
  "...oXXXXXXXXXXXXXXXXXXXXXeeXXo.....",
  "..ofoXXXXXXXXXXXXXXXXXXXXewXXXoooo.",
  ".offobbbbbbbbbbbbbbbbbbXXXXXXffffo",
  "offo..obbbbbbbbbbbbbbbbbbbbbooooo.",
  "oo.....oobbbbbbfffffbbbbbboo......",
  ".........ooooooffffffoooo.........",
  "...............offffo.............",
  "................oooo..............",
];
export const PALETTE_DAUPHIN: Palette = { o: "#6b7476", X: "#ddd8c8", b: "#ece9dd", f: "#a9b8bd", e: "#111111", w: "#ffffff" };

const MINE = [
  ".....o.....",
  "..o..o..o..",
  "...oXXXo...",
  "..oXXwXXo..",
  ".oXXwXXXXo.",
  "ooXXXXXXXoo",
  ".oXXXXXXXo.",
  "..oXXXXXo..",
  "...oXXXo...",
  "..o..o..o..",
  ".....o.....",
];
const PALETTE_MINE: Palette = { o: "#2b2b2b", X: "#4a4a4a", w: "#9a9a9a" };
// L'oiseau-ptérodactyle (il vient de la droite, bec à gauche)
const OISEAU_HAUT = [
  "........oo............",
  "........ooo...........",
  "........oooo..........",
  "........ooooo.........",
  "..oo....oooooo........",
  ".oooo...ooooooo.......",
  "oowooooooooooooooooo..",
  "....oooooooooooooooooo",
  ".........oooooo.......",
  "..........ooo.........",
];
const OISEAU_BAS = [
  "......................",
  "......................",
  "......................",
  "..oo..................",
  ".oooo.................",
  "oowooooooooooooooooo..",
  "....oooooooooooooooooo",
  "........ooooooo.......",
  "........oooooo........",
  "........ooooo.........",
];
const PALETTE_OISEAU: Palette = { o: "#535353", w: "#f7f7f3" };
const NUAGE = ["....oooo......", "..oooooooo....", ".oooooooooooo.", "oooooooooooooo"];
const PALETTE_NUAGE: Palette = { o: "#dedede" };

/** Le dauphin en pixels (SVG), avec sa larme s'il est triste. */
export function DauphinPixel({ taille = 6, triste = false, largeur }: { taille?: number; triste?: boolean; largeur?: number }) {
  const s = taille;
  const w = DAUPHIN[0]!.length * s;
  const h = (DAUPHIN.length + (triste ? 3 : 0)) * s;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={largeur ?? w} height={largeur ? (largeur * h) / w : h} shapeRendering="crispEdges" aria-hidden="true">
      {DAUPHIN.flatMap((l, j) =>
        [...l].map((ch, i) => (PALETTE_DAUPHIN[ch] ? <rect key={`${i}-${j}`} x={i * s} y={j * s} width={s} height={s} fill={PALETTE_DAUPHIN[ch]} /> : null)),
      )}
      {triste ? (
        <g className="larme" fill="#4aa3df">
          <rect x={25 * s} y={9 * s} width={s} height={s * 2} />
          <rect x={25 * s} y={12 * s} width={s} height={s} />
        </g>
      ) : null}
    </svg>
  );
}

/** Le dauphin dessiné (icône, mascotte). */
export function DauphinDessin({ largeur = 200, triste = false }: { largeur?: number; triste?: boolean }) {
  const g = `dd-${largeur}-${triste ? "t" : "c"}`;
  return (
    <svg viewBox="0 0 200 110" width={largeur} aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfd3cd" />
          <stop offset=".55" stopColor="#e2ddcd" />
          <stop offset="1" stopColor="#eeebe0" />
        </linearGradient>
      </defs>
      <path d="M46 62Q32 50 24 30Q20 22 10 20Q22 16 31 25Q28 12 35 5Q42 22 46 40Q50 52 54 60z" fill="#c4cccb" stroke="#6b7476" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M44 58Q62 32 106 28Q142 24 162 32Q178 38 180 50Q186 52 193 56Q199 60 193 65Q183 70 170 69Q152 86 110 88Q68 88 48 70z"
        fill={`url(#${g})`}
        stroke="#6b7476"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M180 50Q186 52 193 56Q199 60 193 65Q183 70 170 69Q176 60 180 50z" fill="#a9b8bd" />
      <path d="M102 30Q102 15 114 15Q125 17 125 28z" fill="#a9b8bd" stroke="#6b7476" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M124 70Q137 76 136 98Q121 103 112 92Q111 79 124 70z" fill="#a9b8bd" stroke="#6b7476" strokeWidth="2.5" strokeLinejoin="round" />
      {triste ? (
        <>
          <path d="M156 49q8-6 16 0" stroke="#111" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M164 62q-3.5 9 0 12q3.5-3 0-12z" fill="#4aa3df" />
        </>
      ) : (
        <>
          <circle cx="164" cy="50" r="8.5" fill="#111" />
          <circle cx="167" cy="47" r="2.8" fill="#fff" />
        </>
      )}
      <path d="M176 64Q183 66 190 63" stroke="#6b7476" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Le jeu ---------------- */

function sprite(lignes: string[], pal: Palette, s: number) {
  const c = document.createElement("canvas");
  c.width = lignes[0]!.length * s;
  c.height = lignes.length * s;
  const x = c.getContext("2d")!;
  lignes.forEach((l, j) =>
    [...l].forEach((ch, i) => {
      const coul = pal[ch];
      if (coul) {
        x.fillStyle = coul;
        x.fillRect(i * s, j * s, s, s);
      }
    }),
  );
  return c;
}

type Obstacle = { type: "mine" | "oiseau"; x: number; y: number; phase: number; haut?: boolean };
type Particule = { x: number; y: number; vx: number; vy: number; vie: number; couleur: string; t: number };
type Etat = "pret" | "jeu" | "explose" | "emporte" | "fini";

const CLE_RECORD = "aakanos-dauphin-record";

/**
 * Le jeu : le dauphin nage à la surface.
 * - Mines (amarrées au fond par une chaîne) : il faut SAUTER (toucher l'écran, espace, flèche haut).
 * - Oiseaux-ptérodactyles au ras de l'eau : il faut PLONGER (glisser vers le bas, flèche bas).
 * Une mine : il explose. Un oiseau : il l'emporte dans le ciel… et le mange.
 */
export function JeuDauphin() {
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = toile.current!;
    const ctx = c.getContext("2d")!;
    const S = 3;
    const H = 240;
    const EAU = 150;
    let W = 360;
    const redim = () => {
      W = c.parentElement!.clientWidth;
      const r = window.devicePixelRatio || 1;
      c.width = W * r;
      c.height = H * r;
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      ctx.setTransform(r, 0, 0, r, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    redim();
    window.addEventListener("resize", redim);

    const spDauphin = sprite(DAUPHIN, PALETTE_DAUPHIN, S - 1);
    const spMine = sprite(MINE, PALETTE_MINE, S);
    const spOiseau = [sprite(OISEAU_HAUT, PALETTE_OISEAU, S - 1), sprite(OISEAU_BAS, PALETTE_OISEAU, S - 1)];
    const spNuage = sprite(NUAGE, PALETTE_NUAGE, S);
    const DW = spDauphin.width;
    const DH = spDauphin.height;
    const OW = spOiseau[0]!.width;
    const OH = spOiseau[0]!.height;
    const SURFACE = EAU - DH + 12; // le dauphin nage à moitié dans l'eau
    const FOND = EAU + 26; // plongé sous l'eau
    const X = 46;

    let record = 0;
    try {
      record = Number(localStorage.getItem(CLE_RECORD)) || 0;
    } catch {}

    const j = {
      etat: "pret" as Etat,
      y: SURFACE,
      vy: 0,
      plonge: false,
      vitesse: 4,
      score: 0,
      obs: [] as Obstacle[],
      parts: [] as Particule[],
      prochain: 60,
      t: 0,
      tEtat: 0,
      nuages: [
        { x: 60, y: 22 },
        { x: 240, y: 46 },
      ],
      mangeur: null as Obstacle | null,
      texte: "",
    };

    const eclabousse = (x: number, n: number, y = EAU) => {
      for (let i = 0; i < n; i++)
        j.parts.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4 - 1, vie: 30 + Math.random() * 20, couleur: i % 2 ? "#4aa3df" : "#9fd3f0", t: 0 });
    };
    const eclats = (x: number, y: number, couleurs: string[], n: number, force = 5) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1 + Math.random() * force;
        j.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, vie: 30 + Math.random() * 40, couleur: couleurs[i % couleurs.length]!, t: 0 });
      }
    };
    const finPartie = () => {
      const s = Math.floor(j.score);
      if (s > record) {
        record = s;
        try {
          localStorage.setItem(CLE_RECORD, String(record));
        } catch {}
      }
    };
    const depart = () => {
      Object.assign(j, { etat: "jeu", y: SURFACE, vy: 0, plonge: false, vitesse: 4, score: 0, obs: [], parts: [], prochain: 50, tEtat: 0, mangeur: null, texte: "" });
    };
    const saute = () => {
      if (j.etat === "pret" || (j.etat === "fini" && j.tEtat > 30)) return depart();
      if (j.etat === "jeu" && !j.plonge && j.y >= SURFACE - 1) {
        j.vy = -9.2;
        eclabousse(X + DW / 2, 10);
      }
    };
    const plonge = (oui: boolean) => {
      if (j.etat !== "jeu") return;
      if (oui && !j.plonge && j.y >= SURFACE - 1) eclabousse(X + DW / 2, 12);
      if (oui && j.y < SURFACE - 1) j.vy = Math.max(j.vy, 6); // plongeon en plein saut
      j.plonge = oui;
    };

    const bas = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        saute();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        plonge(true);
      }
    };
    const haut = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") plonge(false);
    };
    let depY: number | null = null;
    let aPlonge = false;
    const pDown = (e: PointerEvent) => {
      e.preventDefault();
      depY = e.clientY;
      aPlonge = false;
      c.setPointerCapture(e.pointerId);
    };
    const pMove = (e: PointerEvent) => {
      if (depY !== null && !aPlonge && e.clientY - depY > 24) {
        aPlonge = true;
        plonge(true);
      }
    };
    const pUp = () => {
      if (depY === null) return;
      if (aPlonge) plonge(false);
      else saute();
      depY = null;
    };
    window.addEventListener("keydown", bas);
    window.addEventListener("keyup", haut);
    c.addEventListener("pointerdown", pDown);
    c.addEventListener("pointermove", pMove);
    c.addEventListener("pointerup", pUp);
    c.addEventListener("pointercancel", pUp);

    const chevauche = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    let raf = 0;
    let avant = performance.now();
    const boucle = (maintenant: number) => {
      const dt = Math.min(2.5, (maintenant - avant) / 16.67);
      avant = maintenant;
      j.t += dt;
      j.tEtat += dt;

      // ---- logique
      if (j.etat === "jeu") {
        j.vitesse = Math.min(11, 4 + j.score / 900);
        j.score += j.vitesse * dt * 0.25;
        for (const o of j.obs) o.x -= (o.type === "oiseau" ? j.vitesse * 1.2 : j.vitesse) * dt;
        j.obs = j.obs.filter((o) => o.x > -80);
        j.prochain -= dt;
        if (j.prochain <= 0) {
          const oiseau = j.score > 80 && Math.random() < 0.38;
          if (oiseau) {
            const enHaut = Math.random() < 0.25;
            j.obs.push({ type: "oiseau", x: W + 20, y: enHaut ? SURFACE - 78 : SURFACE + 2, phase: 0, haut: enHaut });
          } else j.obs.push({ type: "mine", x: W + 20, y: EAU - spMine.height + 10, phase: Math.random() * 6 });
          j.prochain = (Math.random() * 55 + 60) * (4 / j.vitesse) + 22;
        }
        // mouvement du dauphin
        if (j.plonge && j.y >= SURFACE - 1) {
          j.y += (FOND - j.y) * Math.min(1, 0.35 * dt);
          j.vy = 0;
        } else {
          j.vy += 0.5 * dt;
          j.y += j.vy * dt;
          if (j.y >= SURFACE && !j.plonge) {
            if (j.vy > 3) eclabousse(X + DW / 2, 14);
            j.y = j.y > SURFACE + 2 ? j.y - (j.y - SURFACE) * Math.min(1, 0.3 * dt) : SURFACE;
            if (Math.abs(j.y - SURFACE) < 1) j.y = SURFACE;
            j.vy = 0;
          }
        }
        if (!j.plonge && j.y > SURFACE + 1 && j.y < SURFACE + 3) eclabousse(X + DW / 2, 6);
        // collisions
        for (const o of j.obs) {
          if (o.type === "mine") {
            const my = o.y + Math.sin(j.t / 9 + o.phase) * 2;
            const touche =
              chevauche(X + 10, j.y + 8, DW - 20, DH - 16, o.x + 6, my + 6, spMine.width - 12, spMine.height - 12) ||
              chevauche(X + 10, j.y + 8, DW - 20, DH - 16, o.x + spMine.width / 2 - 3, my + spMine.height, 6, H); // la chaîne
            if (touche) {
              eclats(X + DW / 2, j.y + DH / 2, ["#f6c343", "#e2582b", "#ff8a3d", "#535353", "#ffffff"], 80);
              j.etat = "explose";
              j.tEtat = 0;
              j.texte = "BOUM !";
              finPartie();
            }
          } else if (chevauche(X + 6, j.y + 4, DW - 12, DH - 10, o.x + 4, o.y + 4, OW - 8, OH - 6) && j.y < EAU - 4) {
            j.etat = "emporte";
            j.tEtat = 0;
            j.mangeur = o;
            finPartie();
          }
        }
      } else if (j.etat === "emporte") {
        // l'oiseau l'emporte dans le ciel… puis le mange
        const o = j.mangeur!;
        if (j.tEtat < 60) {
          j.y -= 2.6 * dt;
          o.x += (X + DW / 2 - OW / 2 - o.x) * 0.2;
          o.y = j.y - OH + 6;
        } else if (j.texte === "") {
          eclats(X + DW / 2, j.y + DH / 2, ["#ddd8c8", "#a9b8bd", "#6b7476", "#ece9dd", "#e2582b"], 60, 3);
          j.texte = "CROC !";
          j.tEtat = 60;
        } else {
          o.x -= 3 * dt;
          o.y -= 1.5 * dt;
          if (j.tEtat > 140) {
            j.etat = "fini";
            j.tEtat = 0;
          }
        }
      } else if (j.etat === "explose" && j.tEtat > 75) {
        j.etat = "fini";
        j.tEtat = 0;
      }
      for (const p of j.parts) {
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.18 * dt;
      }
      j.parts = j.parts.filter((p) => p.t < p.vie);
      for (const n of j.nuages) {
        n.x -= 0.4 * dt;
        if (n.x < -60) n.x = W + 20;
      }

      // ---- dessin
      ctx.fillStyle = "#f7f7f3";
      ctx.fillRect(0, 0, W, H);
      for (const n of j.nuages) ctx.drawImage(spNuage, Math.round(n.x), n.y);
      // fond marin
      ctx.fillStyle = "#d9eef8";
      ctx.fillRect(0, EAU + 4, W, H - EAU);
      ctx.fillStyle = "#c2e2f3";
      ctx.fillRect(0, H - 14, W, 14);
      const dec = Math.floor((j.t * (j.etat === "jeu" ? j.vitesse : 1)) % 18);
      ctx.fillStyle = "#b5dcf0";
      for (let x = (-dec * 2) % 40; x < W; x += 40) ctx.fillRect(x + 12, EAU + 30, 6, 3);
      // mines et leurs chaînes
      for (const o of j.obs) {
        if (o.type !== "mine") continue;
        const my = Math.round(o.y + Math.sin(j.t / 9 + o.phase) * 2);
        ctx.fillStyle = "#7a7a7a";
        for (let y = my + spMine.height; y < H - 14; y += 6) ctx.fillRect(Math.round(o.x + spMine.width / 2 - 1), y, 3, 4);
        ctx.drawImage(spMine, Math.round(o.x), my);
      }
      // dauphin
      if (j.etat !== "fini" && !(j.etat === "explose") && !(j.etat === "emporte" && j.texte)) {
        const bob = j.etat === "jeu" && Math.abs(j.y - SURFACE) < 1 ? Math.round(Math.sin(j.t / 6) * 1.5) : 0;
        ctx.save();
        ctx.translate(X + DW / 2, j.y + DH / 2 + bob);
        const angle = j.etat === "emporte" ? -0.35 + Math.sin(j.t / 3) * 0.15 : j.plonge && j.y > SURFACE + 2 ? 0.08 : Math.max(-0.45, Math.min(0.45, j.vy * 0.05));
        ctx.rotate(angle);
        ctx.drawImage(spDauphin, -DW / 2, -DH / 2);
        ctx.restore();
      }
      // surface de l'eau (par-dessus le dauphin plongé)
      ctx.fillStyle = "rgba(74, 163, 223, .28)";
      ctx.fillRect(0, EAU + 4, W, H - EAU - 4);
      ctx.fillStyle = "#4aa3df";
      for (let x = -dec; x < W; x += 18) {
        ctx.fillRect(x, EAU, 9, 3);
        ctx.fillRect(x + 9, EAU + 3, 9, 3);
      }
      // oiseaux
      for (const o of j.obs) {
        if (o.type === "oiseau") ctx.drawImage(spOiseau[Math.floor(j.t / 7) % 2]!, Math.round(o.x), Math.round(o.y));
      }
      // particules
      for (const p of j.parts) {
        ctx.fillStyle = p.couleur;
        const t = p.t < p.vie * 0.7 ? S : 2;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), t, t);
      }
      if (j.etat === "explose" && j.tEtat < 16) {
        const r = 6 + j.tEtat * 3;
        ctx.fillStyle = j.tEtat < 3 ? "#ffffff" : j.tEtat < 8 ? "#f6c343" : "#e2582b";
        for (let a = 0; a < Math.PI * 2; a += 0.35) ctx.fillRect(Math.round(X + DW / 2 + Math.cos(a) * r), Math.round(j.y + DH / 2 + Math.sin(a) * r), S * 2, S * 2);
      }
      // textes
      ctx.fillStyle = "#535353";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HI ${String(record).padStart(5, "0")}  ${String(Math.floor(j.score)).padStart(5, "0")}`, W - 10, 18);
      ctx.textAlign = "center";
      if (j.texte && j.etat !== "fini") {
        ctx.fillStyle = j.texte === "BOUM !" ? "#e2582b" : "#535353";
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillText(j.texte, W / 2, 60);
      }
      if (j.etat === "pret") {
        ctx.fillStyle = "#535353";
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.fillText("GYPSY · TOUCHE : SAUTER LES MINES", W / 2, 56);
        ctx.fillText("GLISSE VERS LE BAS : PLONGER", W / 2, 74);
      }
      if (j.etat === "fini") {
        ctx.fillStyle = "#535353";
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.fillText("G A M E   O V E R", W / 2, 62);
        ctx.font = "bold 12px 'Courier New', monospace";
        if (Math.floor(j.tEtat / 20) % 2 === 0) ctx.fillText("TOUCHE POUR REJOUER", W / 2, 86);
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", redim);
      window.removeEventListener("keydown", bas);
      window.removeEventListener("keyup", haut);
      c.removeEventListener("pointerdown", pDown);
      c.removeEventListener("pointermove", pMove);
      c.removeEventListener("pointerup", pUp);
      c.removeEventListener("pointercancel", pUp);
    };
  }, []);

  return (
    <div className="jeu-dauphin">
      <canvas ref={toile} aria-label="Jeu de Gypsy le dauphin : toucher pour sauter les mines, glisser vers le bas pour plonger sous les oiseaux" />
    </div>
  );
}
