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
const OISEAU_HAUT = ["o.......o", "oo.....oo", ".oo.o.oo.", "..ooooo..", "....o...."];
const OISEAU_BAS = ["....o....", "..ooooo..", ".oo.o.oo.", "oo.....oo", "o.......o"];
const PALETTE_OISEAU: Palette = { o: "#535353" };
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

type Obstacle = { type: "mine" | "oiseau"; x: number; y: number; phase: number; pris?: boolean };
type Particule = { x: number; y: number; vx: number; vy: number; vie: number; couleur: string; t: number };

const CLE_RECORD = "aakanos-dauphin-record";

export function JeuDauphin() {
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = toile.current!;
    const ctx = c.getContext("2d")!;
    const S = 3;
    const H = 230;
    const EAU = 165;
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
    const spOiseau = [sprite(OISEAU_HAUT, PALETTE_OISEAU, S), sprite(OISEAU_BAS, PALETTE_OISEAU, S)];
    const spNuage = sprite(NUAGE, PALETTE_NUAGE, S);
    const DW = spDauphin.width;
    const DH = spDauphin.height;
    const SOL = EAU - DH + 12; // le dauphin nage à moitié dans l'eau

    let record = 0;
    try {
      record = Number(localStorage.getItem(CLE_RECORD)) || 0;
    } catch {}

    const j = {
      etat: "pret" as "pret" | "jeu" | "explose" | "envol" | "fini",
      y: SOL,
      vy: 0,
      vitesse: 4,
      score: 0,
      obs: [] as Obstacle[],
      parts: [] as Particule[],
      prochain: 60,
      t: 0,
      tEtat: 0,
      nuages: [
        { x: 60, y: 30 },
        { x: 240, y: 55 },
      ],
      bonus: 0,
    };

    const eclabousse = (x: number, n: number, couleurs = ["#4aa3df", "#9fd3f0"]) => {
      for (let i = 0; i < n; i++)
        j.parts.push({ x, y: EAU, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4 - 1, vie: 30 + Math.random() * 20, couleur: couleurs[i % couleurs.length]!, t: 0 });
    };
    const explose = (x: number, y: number) => {
      const couleurs = ["#f6c343", "#e2582b", "#ff8a3d", "#535353", "#ffffff"];
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1 + Math.random() * 5;
        j.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, vie: 30 + Math.random() * 40, couleur: couleurs[i % couleurs.length]!, t: 0 });
      }
    };
    const depart = () => {
      j.etat = "jeu";
      j.y = SOL;
      j.vy = 0;
      j.vitesse = 4;
      j.score = 0;
      j.obs = [];
      j.parts = [];
      j.prochain = 50;
      j.tEtat = 0;
    };
    const saute = () => {
      if (j.etat === "pret" || j.etat === "fini") {
        if (j.etat === "fini" && j.tEtat < 30) return;
        depart();
        return;
      }
      if (j.etat === "jeu" && j.y >= SOL - 1) {
        j.vy = -9.2;
        eclabousse(50 + DW / 2, 10);
      }
    };

    const touche = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        saute();
      }
    };
    const tape = (e: PointerEvent) => {
      e.preventDefault();
      saute();
    };
    window.addEventListener("keydown", touche);
    c.addEventListener("pointerdown", tape);

    const chevauche = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    let raf = 0;
    let avant = performance.now();
    const boucle = (maintenant: number) => {
      const dt = Math.min(2.5, (maintenant - avant) / 16.67);
      avant = maintenant;
      j.t += dt;
      j.tEtat += dt;
      const X = 50;

      // --- logique
      if (j.etat === "jeu" || j.etat === "envol") {
        j.vitesse = Math.min(11, 4 + j.score / 900);
        j.score += j.vitesse * dt * 0.25;
        for (const o of j.obs) o.x -= (o.type === "oiseau" ? j.vitesse * 1.15 : j.vitesse) * dt;
        j.obs = j.obs.filter((o) => o.x > -60 && !(o.pris && j.etat === "jeu"));
        j.prochain -= dt;
        if (j.prochain <= 0 && j.etat === "jeu") {
          const oiseau = Math.random() < 0.3 && j.score > 60;
          j.obs.push(oiseau ? { type: "oiseau", x: W + 20, y: 40 + Math.random() * 50, phase: 0 } : { type: "mine", x: W + 20, y: EAU - spMine.height + 10, phase: Math.random() * 6 });
          j.prochain = (Math.random() * 60 + 55) * (4 / j.vitesse) + 25;
        }
      }
      if (j.etat === "jeu") {
        j.vy += 0.5 * dt;
        j.y += j.vy * dt;
        if (j.y >= SOL) {
          if (j.vy > 3) eclabousse(X + DW / 2, 14);
          j.y = SOL;
          j.vy = 0;
        }
        for (const o of j.obs) {
          if (o.type === "mine") {
            if (chevauche(X + 8, j.y + 8, DW - 16, DH - 16, o.x + 6, o.y + 6, spMine.width - 12, spMine.height - 12)) {
              explose(X + DW / 2, j.y + DH / 2);
              j.etat = "explose";
              j.tEtat = 0;
              const s = Math.floor(j.score);
              if (s > record) {
                record = s;
                try {
                  localStorage.setItem(CLE_RECORD, String(record));
                } catch {}
              }
            }
          } else if (!o.pris && chevauche(X + 4, j.y, DW - 8, DH, o.x, o.y, spOiseau[0]!.width, spOiseau[0]!.height + 10)) {
            o.pris = true;
            j.etat = "envol";
            j.tEtat = 0;
            j.bonus = 60;
            j.score += 500;
          }
        }
      } else if (j.etat === "envol") {
        const oiseau = j.obs.find((o) => o.pris);
        if (j.tEtat < 70) {
          j.y -= 2.4 * dt;
          if (oiseau) {
            oiseau.x = X + DW / 2 - spOiseau[0]!.width / 2;
            oiseau.y = j.y - spOiseau[0]!.height - 4;
          }
        } else {
          if (oiseau) {
            oiseau.pris = false;
            oiseau.x += 0; // il repart
            oiseau.y -= 3 * dt;
          }
          j.vy += 0.5 * dt;
          j.y += j.vy * dt;
          if (j.y >= SOL) {
            eclabousse(X + DW / 2, 24);
            j.y = SOL;
            j.vy = 0;
            j.etat = "jeu";
            j.obs = j.obs.filter((o) => o.type !== "oiseau" || o.x > X + 40);
          }
        }
      } else if (j.etat === "explose" && j.tEtat > 70) {
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
      if (j.bonus > 0) j.bonus -= dt;

      // --- dessin
      ctx.fillStyle = "#f7f7f3";
      ctx.fillRect(0, 0, W, H);
      for (const n of j.nuages) ctx.drawImage(spNuage, Math.round(n.x), n.y);
      // eau
      ctx.fillStyle = "#d9eef8";
      ctx.fillRect(0, EAU + 4, W, H - EAU);
      ctx.fillStyle = "#4aa3df";
      const dec = Math.floor((j.t * (j.etat === "jeu" ? j.vitesse : 1)) % 18);
      for (let x = -dec; x < W; x += 18) {
        ctx.fillRect(x, EAU, 9, 3);
        ctx.fillRect(x + 9, EAU + 3, 9, 3);
      }
      ctx.fillStyle = "#b5dcf0";
      for (let x = (-dec * 2) % 40; x < W; x += 40) ctx.fillRect(x + 12, EAU + 22, 6, 3);
      // obstacles
      for (const o of j.obs) {
        if (o.type === "mine") ctx.drawImage(spMine, Math.round(o.x), Math.round(o.y + Math.sin(j.t / 9 + o.phase) * 2));
        else ctx.drawImage(spOiseau[Math.floor(j.t / 8) % 2]!, Math.round(o.x), Math.round(o.y));
      }
      // dauphin
      if (j.etat !== "explose" && j.etat !== "fini") {
        const bob = j.etat === "jeu" && j.y >= SOL - 1 ? Math.round(Math.sin(j.t / 6) * 1.5) : 0;
        ctx.save();
        ctx.translate(X + DW / 2, j.y + DH / 2 + bob);
        ctx.rotate(j.etat === "envol" ? -0.25 : Math.max(-0.45, Math.min(0.45, j.vy * 0.05)));
        ctx.drawImage(spDauphin, -DW / 2, -DH / 2);
        ctx.restore();
      }
      // particules (éclaboussures, explosion)
      for (const p of j.parts) {
        ctx.fillStyle = p.couleur;
        const t = p.t < p.vie * 0.7 ? S : 2;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), t, t);
      }
      if (j.etat === "explose" && j.tEtat < 14) {
        // éclair blanc puis boule de feu en anneaux
        const r = 6 + j.tEtat * 3;
        ctx.fillStyle = j.tEtat < 3 ? "#ffffff" : j.tEtat < 8 ? "#f6c343" : "#e2582b";
        for (let a = 0; a < Math.PI * 2; a += 0.35) ctx.fillRect(Math.round(X + DW / 2 + Math.cos(a) * r), Math.round(j.y + DH / 2 + Math.sin(a) * r), S * 2, S * 2);
      }
      // textes
      ctx.fillStyle = "#535353";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HI ${String(record).padStart(5, "0")}  ${String(Math.floor(j.score)).padStart(5, "0")}`, W - 10, 18);
      if (j.bonus > 0) {
        ctx.fillStyle = "#4aa3df";
        ctx.textAlign = "left";
        ctx.fillText("+500  ENVOL !", 12, 18);
      }
      ctx.textAlign = "center";
      if (j.etat === "pret") {
        ctx.fillStyle = "#535353";
        ctx.fillText("TOUCHE POUR NAGER", W / 2, 70);
      }
      if (j.etat === "fini") {
        ctx.fillStyle = "#535353";
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.fillText("G A M E   O V E R", W / 2, 72);
        ctx.font = "bold 12px 'Courier New', monospace";
        if (Math.floor(j.tEtat / 20) % 2 === 0) ctx.fillText("TOUCHE POUR REJOUER", W / 2, 96);
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", redim);
      window.removeEventListener("keydown", touche);
      c.removeEventListener("pointerdown", tape);
    };
  }, []);

  return (
    <div className="jeu-dauphin">
      <canvas ref={toile} aria-label="Jeu du dauphin : touche l'écran ou espace pour sauter" />
    </div>
  );
}
