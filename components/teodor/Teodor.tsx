"use client";

/**
 * Teodor, la mascotte du site : un triangle bleu posé sur les 9 étoiles du logo de Franck.
 * Six étoiles font son corps, deux ses yeux, une sa bouche. Les étoiles sont invisibles,
 * mais elles bougent : Teodor respire, cligne des yeux, suit ton doigt du regard.
 *
 * Ouverture : le logo se dessine sous l'anneau PS2, puis chaque morceau de sa ligne se
 * détache et rentre dans ses étoiles ; une nouvelle ligne repart du sommet, des deux côtés,
 * et vient avaler les étoiles du tour ; le bleu coule depuis le visage. Teodor se réveille.
 *
 * Son corps est souple : chaque coin est tenu par un ressort, il ondule et rebondit.
 * Une caresse (glisser le doigt ou la souris sur lui) le rend heureux : il ferme les yeux,
 * rosit et se blottit contre le doigt. Une tape le fait sursauter puis pleurer 5 secondes ;
 * les larmes glissent sur son corps. Une caresse le console.
 *
 * Il écoute aussi l'événement « teodor-espoir » (detail : { x, y } à l'écran, ou null) :
 * sur la page 404, il regarde le bouton qui ramène à l'accueil et reprend un peu espoir.
 */
import { useEffect, useRef } from "react";
import { AnneauPS2 } from "@/components/AnneauPS2";
import { RONDS } from "@/components/Logo";

export type Humeur = "joie" | "peur";

type V = [number, number];
const ETOILES: V[] = RONDS.map(([x, y]) => [x, y]);
const OEIL_G = ETOILES[1]!;
const OEIL_D = ETOILES[2]!;
const BOUCHE = ETOILES[3]!;
const CORPS = [0, 4, 5, 6, 7, 8]; // le tour : sommet, gauche, gauche-bas, bas, bas, bas-droite
const FACE: V = [(OEIL_G[0] + OEIL_D[0]) / 2, (OEIL_G[1] + OEIL_D[1]) / 2];
const ANGLE = Math.atan2(OEIL_D[1] - OEIL_G[1], OEIL_D[0] - OEIL_G[0]);
const ECART = Math.hypot(OEIL_D[0] - OEIL_G[0], OEIL_D[1] - OEIL_G[1]);
const CENTRE: V = [100, 98];
const SOL = 184; // la ligne du sol, pour l'ombre et l'ancrage de la respiration
const VISAGE = 1.3; // le visage, un peu plus grand que les étoiles pour bien lire ses émotions

const BLEU = [53, 80, 255];
const BLANC = [255, 255, 255];
const NUIT = [10, 10, 10];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const sortie = (x: number) => 1 - (1 - x) ** 3;
const ressort = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2);
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(",")})`;
const vers = (cur: number, cible: number, dt: number, vitesse: number) => cur + (cible - cur) * (1 - Math.exp(-dt * vitesse));
/** Passe un point du repère du visage (penché comme les yeux) au repère du monde. */
const depuisVisage = (o: V, x: number, y: number): V => {
  const c = Math.cos(ANGLE);
  const s = Math.sin(ANGLE);
  return [o[0] + (x * c - y * s) * VISAGE, o[1] + (x * s + y * c) * VISAGE];
};

/** Le contour aux coins arrondis, échantillonné en points (tracé partiel, remplissage, toucher). */
function contour(pts: V[], r: number): V[] {
  const out: V[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const a = pts[(i - 1 + n) % n]!;
    const b = pts[(i + 1) % n]!;
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const rr = Math.min(r, da / 2.3, db / 2.3);
    const s: V = [p[0] + ((a[0] - p[0]) * rr) / da, p[1] + ((a[1] - p[1]) * rr) / da];
    const e: V = [p[0] + ((b[0] - p[0]) * rr) / db, p[1] + ((b[1] - p[1]) * rr) / db];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const m = 1 - t;
      out.push([m * m * s[0] + 2 * m * t * p[0] + t * t * e[0], m * m * s[1] + 2 * m * t * p[1] + t * t * e[1]]);
    }
  }
  return out;
}

function dedans(poly: V[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

type Goutte = { x: number; y: number; vx: number; vy: number; vie: number };
type Coeur = { x: number; y: number; vie: number; d: number };
type Etincelle = { x: number; y: number; vx: number; vy: number; vie: number };
type Ressort = { x: number; y: number; vx: number; vy: number };

export function Teodor({ humeur, onPret, className }: { humeur: Humeur; onPret?: () => void; className?: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const anneau = useRef<HTMLDivElement>(null);
  const pret = useRef(onPret);
  useEffect(() => {
    pret.current = onPret;
  }, [onPret]);

  useEffect(() => {
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;
    const mesure = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientWidth * dpr);
    };
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(c);

    // ---- le temps de l'ouverture ----
    const debut = performance.now();
    let charge = document.readyState === "complete";
    const surCharge = () => (charge = true);
    window.addEventListener("load", surCharge, { once: true });
    let tDefait = calme ? -10 : -1;
    let annonce = false;
    const etincelles: Etincelle[] = [];
    let etincellesFaites = false;

    // ---- l'état de Teodor ----
    const e = { sourire: 0, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0, calin: 0, sanglot: 0, aie: 0, espoir: 0, ouvert: 1 };
    let clignement = 2.5;
    let pleureJusque = 0;
    let aieJusque = 0;
    let caresseA = -10;
    let heureuxJusque = 0;
    let calinX = 100;
    let calinY = 100;
    let prochaineLarme = 0;
    let prochainCoeur = 0;
    let prochainNon = 5;
    const larmes: Goutte[] = [];
    const coeurs: Coeur[] = [];
    let corpsActuel: V[] = [];
    let echelle = 0.66;
    // le corps souple : un ressort par coin, et un pour le visage
    let ressorts: Ressort[] | null = null;
    const visageR: Ressort = { x: FACE[0], y: FACE[1], vx: 0, vy: 0 };
    // où regarde-t-il ? (un point du monde, ou rien)
    let cibleRegard: V | null = null;
    let regardX = 0;
    let regardY = 0;
    let espoirVers: V | null = null;

    // ---- le toucher ----
    let appui: { x: number; y: number; t: number; dist: number; px: number; py: number } | null = null;
    let survol = 0;
    const versMonde = (cx: number, cy: number): V => {
      const r = c.getBoundingClientRect();
      const s = (r.width / 200) * echelle;
      return [CENTRE[0] + (cx - r.left - r.width / 2) / s, CENTRE[1] + (cy - r.top - r.height / 2) / s];
    };
    const surLui = (p: V) => {
      if (corpsActuel.length === 0) return false;
      if (dedans(corpsActuel, p[0], p[1])) return true;
      return corpsActuel.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) < 9); // un doigt est large
    };
    const caresse = (p: V, now: number) => {
      caresseA = now;
      calinX = p[0];
      calinY = p[1];
      if (now < pleureJusque) pleureJusque = now; // une caresse console
    };
    const tape = (p: V, now: number) => {
      pleureJusque = now + 5000;
      aieJusque = now + 420;
      heureuxJusque = 0;
      caresseA = -10;
      // le coup : il se tasse, puis rebondit en tremblotant
      ressorts?.forEach((r) => {
        const dx = r.x - p[0];
        const dy = r.y - p[1];
        const d = Math.hypot(dx, dy) || 1;
        const w = Math.exp(-(d * d) / (2 * 50 * 50));
        r.vx += (CENTRE[0] - r.x) * 2.2 + (dx / d) * 60 * w;
        r.vy += (CENTRE[1] - r.y) * 2.2 + 70 + (dy / d) * 60 * w;
      });
      visageR.vy += 90;
      try {
        navigator.vibrate?.(30);
      } catch {}
    };
    const bas = (ev: PointerEvent) => {
      const p = versMonde(ev.clientX, ev.clientY);
      if (!surLui(p)) return;
      c.setPointerCapture(ev.pointerId);
      appui = { x: p[0], y: p[1], t: performance.now(), dist: 0, px: p[0], py: p[1] };
    };
    const bouge = (ev: PointerEvent) => {
      const p = versMonde(ev.clientX, ev.clientY);
      const now = performance.now();
      c.style.cursor = surLui(p) ? "grab" : "";
      if (appui) {
        appui.dist += Math.hypot(p[0] - appui.px, p[1] - appui.py);
        appui.px = p[0];
        appui.py = p[1];
        if (appui.dist > 24 && now - appui.t > 140) caresse(p, now);
        return;
      }
      // à la souris, sans cliquer : passer doucement sur lui est aussi une caresse
      if (ev.pointerType === "mouse" && surLui(p)) {
        survol += Math.min(12, Math.hypot(ev.movementX, ev.movementY)); // un grand saut de souris n'est pas une caresse
        if (survol > 160) caresse(p, now);
      } else survol = 0;
    };
    const haut = () => {
      const now = performance.now();
      if (appui && appui.dist <= 24 && now - appui.t < 650 && now - caresseA > 400) tape([appui.x, appui.y], now);
      appui = null;
    };
    const annule = () => (appui = null);
    const quitte = () => (survol = 0);
    // il suit du regard le doigt ou la souris, partout sur la page
    let dernierGeste = 0;
    const regarde = (ev: PointerEvent) => {
      cibleRegard = versMonde(ev.clientX, ev.clientY);
      dernierGeste = performance.now();
    };
    const espoir = (ev: Event) => {
      const d = (ev as CustomEvent<{ x: number; y: number } | null>).detail;
      espoirVers = d ? versMonde(d.x, d.y) : null;
    };
    c.addEventListener("pointerdown", bas);
    c.addEventListener("pointermove", bouge);
    c.addEventListener("pointerup", haut);
    c.addEventListener("pointercancel", annule);
    c.addEventListener("pointerleave", quitte);
    window.addEventListener("pointermove", regarde, { passive: true });
    window.addEventListener("pointerdown", regarde, { passive: true });
    window.addEventListener("teodor-espoir", espoir);

    let avant = debut;
    let frame = 0;
    const dessine = (now: number) => {
      frame = requestAnimationFrame(dessine);
      const dt = Math.min(0.04, (now - avant) / 1000);
      avant = now;
      const t = (now - debut) / 1000;
      if (tDefait < 0 && t > 2.4 && (charge || t > 6)) tDefait = t;
      const tv = tDefait < 0 ? -1 : t - tDefait; // temps depuis le début de la transformation
      const pDefait = tv < 0 ? 0 : clamp(tv / 0.7);
      const pRelie = clamp((tv - 0.6) / 1.15);
      const pCouleur = clamp((tv - 1.65) / 0.85);
      const vivant = tv >= 2.5;
      const vie = vivant ? tv - 2.5 : -1; // temps depuis qu'il est « né »
      if (vie >= 0.9 && !annonce) {
        annonce = true;
        pret.current?.();
      }
      if (anneau.current) anneau.current.style.opacity = String(tv < 0 ? 1 : clamp(1 - tv / 0.45));

      const W = c.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, W);
      // il grandit en se formant, avec un léger rebond
      echelle = 0.66 + 0.34 * ressort(clamp((tv - 0.6) / 1.5));
      const s = (W / 200) * echelle;
      ctx.setTransform(s, 0, 0, s, W / 2 - CENTRE[0] * s, W / 2 - CENTRE[1] * s);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const lueur = (px: number) => px * dpr * (W / dpr / 340) * echelle; // flou en px de la toile

      // ===== 1. le logo se dessine, comme d'habitude, puis sa ligne se détache =====
      if (pDefait < 1) {
        const trace = calme ? 1 : ease(clamp((t - 0.2) / 1.6));
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.8;
        const longs = ETOILES.slice(1).map((p, i) => Math.hypot(p[0] - ETOILES[i]![0], p[1] - ETOILES[i]![1]));
        const total = longs.reduce((a, b) => a + b, 0);
        let parcouru = 0;
        longs.forEach((L, i) => {
          const a = ETOILES[i]!;
          const b = ETOILES[i + 1]!;
          const vu = clamp((trace * total - parcouru) / L);
          parcouru += L;
          if (vu <= 0) return;
          // chaque morceau casse en son milieu et ses deux moitiés rentrent dans leurs étoiles
          const k = sortie(clamp(pDefait * 1.5 - i * 0.06));
          const moitie = 0.5 * (1 - k);
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(a[0] + (b[0] - a[0]) * Math.min(vu, moitie), a[1] + (b[1] - a[1]) * Math.min(vu, moitie));
          if (vu > 1 - moitie) {
            ctx.moveTo(b[0], b[1]);
            ctx.lineTo(b[0] + (a[0] - b[0]) * moitie, b[1] + (a[1] - b[1]) * moitie);
          }
          ctx.stroke();
        });
      }
      // les étincelles de la cassure
      if (pDefait > 0 && !etincellesFaites) {
        etincellesFaites = true;
        ETOILES.slice(1).forEach((b, i) => {
          const a = ETOILES[i]!;
          for (let k = 0; k < 3; k++) {
            const an = Math.random() * Math.PI * 2;
            const v = 10 + Math.random() * 18;
            etincelles.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vie: -i * 0.05 });
          }
        });
      }
      for (let i = etincelles.length - 1; i >= 0; i--) {
        const p = etincelles[i]!;
        p.vie += dt;
        if (p.vie < 0) continue;
        if (p.vie > 0.7) {
          etincelles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - p.vie / 0.7)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== l'humeur et les réactions =====
      const enPleurs = now < pleureJusque;
      const finPleurs = enPleurs && pleureJusque - now < 1200; // il renifle, ça se calme
      const aie = now < aieJusque;
      const caressé = now - caresseA < 650;
      if (caressé) heureuxJusque = now + 1400;
      const content = now < heureuxJusque;
      const fete = humeur === "joie" && vie >= 0.9 && vie < 2.5;
      const reveil = vivant && vie < 0.9;
      const cible = { sourire: 0, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0, calin: 0, sanglot: 0, aie: 0, espoir: 0 };
      if (humeur === "joie") Object.assign(cible, { sourire: 0.8, bouche: 0.12, rose: 0.3 });
      else {
        // perdu et apeuré : il tremble, cherche partout du regard, la bouche tordue
        const cherche = Math.sin(t * 0.9) > 0.5 ? Math.sign(Math.sin(t * 3.1)) : Math.sin(t * 0.7) * 0.4;
        Object.assign(cible, { sourire: -0.7, triste: 0.75, grand: 0.55, frisson: 0.5, regard: cherche });
        if (espoirVers) Object.assign(cible, { sourire: 0.15, triste: 0.35, grand: 0.75, frisson: 0.12, regard: 0, espoir: 1 });
      }
      if (fete) Object.assign(cible, { sourire: 1, bouche: 0.8, heureux: vie < 1.9 ? 1 : 0, rose: 0.7 });
      if (content) Object.assign(cible, { sourire: 1, bouche: 0.1, heureux: 1, triste: 0, grand: 0, rose: 1, frisson: 0, regard: 0, calin: caressé ? 1 : 0, espoir: 0 });
      if (enPleurs) Object.assign(cible, { sourire: -1, bouche: finPleurs ? 0.15 : 0.6, heureux: 0, triste: 1, grand: 0, rose: 0.4, frisson: 0.15, regard: 0, calin: 0, sanglot: finPleurs ? 0.3 : 1, espoir: 0 });
      if (aie) Object.assign(cible, { aie: 1, sourire: -0.6, bouche: 0.3 });
      if (!vivant || reveil) Object.assign(cible, { sourire: reveil ? 0.35 : 0.2, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0 });
      (Object.keys(cible) as (keyof typeof cible)[]).forEach((k) => (e[k] = vers(e[k], cible[k], dt, k === "regard" ? 8 : k === "calin" ? 5 : k === "aie" ? 16 : 6)));
      // clignements (et le réveil : les yeux s'ouvrent, clignent deux fois)
      clignement -= dt;
      if (clignement < 0) clignement = 2.2 + Math.random() * 3.2;
      e.ouvert = clignement < 0.16 && e.heureux < 0.5 ? Math.abs(clignement / 0.08 - 1) : 1;
      if (reveil) e.ouvert = vie < 0.25 ? 0.05 : vie < 0.45 ? clamp((vie - 0.25) / 0.2) : vie < 0.6 ? Math.abs((vie - 0.525) / 0.075) : 1;
      // sur la 404, de temps en temps, un « non » de la tête : il ne sait pas où il est
      let non = 0;
      if (humeur === "peur" && vivant && !enPleurs && !content && !espoirVers) {
        if (vie > prochainNon + 1.3) prochainNon = vie + 4 + Math.random() * 3;
        if (vie > prochainNon) non = Math.sin(((vie - prochainNon) / 1.3) * Math.PI * 4) * Math.sin(((vie - prochainNon) / 1.3) * Math.PI);
      }
      // le regard : vers le bouton d'espoir, sinon vers le doigt s'il a bougé récemment
      let lx = 0;
      let ly = 0;
      const vise = espoirVers ?? (now - dernierGeste < 2500 ? cibleRegard : null);
      if (vise && vivant && e.heureux < 0.5) {
        const dx = vise[0] - visageR.x;
        const dy = vise[1] - visageR.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(1, d / 70);
        // dans le repère du visage
        lx = ((dx * Math.cos(-ANGLE) - dy * Math.sin(-ANGLE)) / d) * 1.6 * f;
        ly = ((dx * Math.sin(-ANGLE) + dy * Math.cos(-ANGLE)) / d) * 1.3 * f;
      }
      regardX = vers(regardX, lx + e.regard * 1.3 + non * 1.6, dt, 9);
      regardY = vers(regardY, ly, dt, 9);

      // le petit saut de joie (deux fois)
      const saut = fete ? -6 * Math.abs(Math.sin((vie - 0.9) * Math.PI * 2.5)) * clamp(1 - (vie - 0.9) / 1.6) : 0;

      // ===== les étoiles du tour et la respiration =====
      const souffle = calme ? 0 : Math.sin((t * 2 * Math.PI) / 3.6);
      const tremble = (k: number) => Math.sin(t * 37 + k * 1.7) * 0.55 + Math.sin(t * 23 + k * 2.9) * 0.45;
      const cibleCorps = (p: V, k: number): V => {
        // il respire depuis le sol : en inspirant il s'étire vers le haut, en expirant il s'élargit
        const inspire = 0.028 * souffle;
        let x = CENTRE[0] + (p[0] - CENTRE[0]) * (1 - inspire * 0.45) + 0.6 * Math.sin(t * 1.7 + k * 1.3);
        let y = SOL + (p[1] - SOL) * (1 + inspire);
        x += e.frisson * 0.9 * tremble(k);
        y += e.frisson * 0.6 * tremble(k + 4) + e.sanglot * 1.8 * Math.abs(Math.sin(t * 8.5)) + saut;
        if (k === 0) x += non * 5; // la pointe suit la tête qui dit non
        // le câlin : il se penche et ses coins viennent entourer le doigt
        if (e.calin > 0.001) {
          const dx = calinX - x;
          const dy = calinY - y;
          const w = Math.exp(-(dx * dx + dy * dy) / (2 * 55 * 55));
          x += dx * (0.24 * w + 0.05) * e.calin + Math.sin(t * 18) * 0.3 * e.calin;
          y += dy * (0.24 * w + 0.05) * e.calin;
        }
        return [x, y];
      };
      const cibles = CORPS.map((i) => cibleCorps(ETOILES[i]!, i));
      if (!ressorts) ressorts = cibles.map(([x, y]) => ({ x, y, vx: 0, vy: 0 }));
      // les ressorts : raides au début (la forme doit rester exacte), souples une fois vivant
      const raideur = vivant ? 230 : 900;
      const amorti = vivant ? 13 : 60;
      for (let pas = 0; pas < 2; pas++) {
        const h = dt / 2;
        ressorts.forEach((r, i) => {
          const [tx, ty] = cibles[i]!;
          r.vx += ((tx - r.x) * raideur - r.vx * amorti) * h;
          r.vy += ((ty - r.y) * raideur - r.vy * amorti) * h;
          r.x += r.vx * h;
          r.y += r.vy * h;
        });
        const [vx0, vy0] = cibleCorps(FACE, 1.5);
        const fx0 = vx0 + non * 3.2;
        visageR.vx += ((fx0 - visageR.x) * raideur * 0.8 - visageR.vx * amorti) * h;
        visageR.vy += ((vy0 - visageR.y) * raideur * 0.8 - visageR.vy * amorti) * h;
        visageR.x += visageR.vx * h;
        visageR.y += visageR.vy * h;
      }
      const pts: V[] = ressorts.map((r) => [r.x, r.y]);
      const tour = contour(pts, 12);
      corpsActuel = tour;
      const couleurCorps = mix(BLANC, BLEU, pCouleur);
      const couleurVisage = mix(BLANC, NUIT, pCouleur);
      const chemin = () => {
        ctx.beginPath();
        tour.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
      };

      // l'ombre au sol : elle respire, et rétrécit quand il saute
      if (pCouleur > 0) {
        const haut = clamp(-saut / 6);
        ctx.fillStyle = `rgba(53,80,255,${0.16 * pCouleur * (1 - 0.5 * haut)})`;
        ctx.beginPath();
        ctx.ellipse(112, SOL + 6, 58 * (1 - 0.18 * haut) * (1 - 0.02 * souffle), 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== 3. une nouvelle ligne part du sommet et entoure les étoiles du tour =====
      if (pRelie > 0) {
        if (pCouleur > 0) {
          // 4. le bleu coule depuis le visage, avec un bord liquide
          ctx.save();
          const R = 6 + 150 * ease(pCouleur);
          ctx.beginPath();
          for (let k = 0; k <= 48; k++) {
            const a = (k / 48) * Math.PI * 2;
            const rr = R + (pCouleur < 1 ? 3.5 * Math.sin(a * 5 + t * 9) + 2 * Math.sin(a * 3 - t * 6) : 0);
            const x = FACE[0] + Math.cos(a) * rr;
            const y = FACE[1] + Math.sin(a) * rr;
            if (k) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.clip();
          ctx.shadowColor = `rgba(43,70,255,${0.85 * pCouleur})`;
          ctx.shadowBlur = lueur(16);
          ctx.fillStyle = couleurCorps;
          chemin();
          ctx.fill();
          ctx.restore();
          // l'onde de lumière qui accompagne la couleur
          if (pCouleur < 1) {
            ctx.strokeStyle = `rgba(150,170,255,${0.55 * (1 - pCouleur)})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(FACE[0], FACE[1], 10 + 170 * sortie(pCouleur), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = couleurCorps;
        ctx.lineWidth = 3.6;
        if (pRelie >= 1) {
          chemin();
          ctx.stroke();
        } else {
          // des deux côtés à la fois, avec une tête lumineuse au bout de chaque trait
          const N = tour.length;
          const m = Math.round((N * ease(pRelie)) / 2);
          const at = (i: number) => tour[(i + 4 + N) % N]!; // l'indice 4 : le milieu du coin du sommet
          ctx.beginPath();
          ctx.moveTo(at(-m)[0], at(-m)[1]);
          for (let i = -m + 1; i <= m; i++) ctx.lineTo(at(i)[0], at(i)[1]);
          ctx.stroke();
          ctx.save();
          ctx.shadowColor = "#fff";
          ctx.shadowBlur = lueur(10);
          ctx.fillStyle = "#fff";
          [at(-m), at(m)].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 2.6, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }
      }

      // les ronds du logo : ils apparaissent, avalent leur ligne, puis fondent dans Teodor
      ETOILES.forEach((p, i) => {
        const apparu = calme ? 1 : ressort(clamp((t - 0.2 - RONDS[i]![2] * 1.6) / 0.45));
        const visage = i >= 1 && i <= 3;
        const k = CORPS.indexOf(i);
        const atteint = k <= 0 ? 0 : Math.min(k, 6 - k) / 3; // le trait les atteint dans cet ordre
        const fond = visage ? clamp((pRelie - 0.5) / 0.25) : clamp((ease(pRelie) - atteint * 0.92) / 0.06 + (k === 0 ? 0.5 : 0));
        const gonfle = 1 + 0.35 * Math.sin(clamp(pDefait * 1.2) * Math.PI); // ils gonflent en avalant leur ligne
        const eclat = !visage && fond > 0 && fond < 1 ? 1 + 0.8 * Math.sin(fond * Math.PI) : 1; // un éclat quand le trait les touche
        const r = 4 * apparu * gonfle * eclat * (1 - fond * fond);
        if (r <= 0.05) return;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fill();
      });

      // ===== le visage =====
      if (pRelie > 0.4) {
        const apparition = clamp((pRelie - 0.4) / 0.35);
        const fx = visageR.x;
        const fy = visageR.y;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(ANGLE);
        ctx.scale(VISAGE * (0.55 + 0.45 * ressort(apparition)), VISAGE * (0.55 + 0.45 * ressort(apparition)));
        ctx.globalAlpha = apparition;
        const yeux: [number, number][] = [
          [-ECART / 2, 1],
          [ECART / 2, -1],
        ];
        yeux.forEach(([ox, cote]) => {
          const rx = 3.5 * (1 + 0.14 * e.grand);
          const ry = 4.3 * (1 + 0.18 * e.grand) * (1 - e.heureux) * (1 - e.aie) * e.ouvert;
          ctx.save();
          ctx.translate(ox + regardX * 0.4, regardY * 0.3);
          if (ry > 0.15) {
            // paupière triste : le coin intérieur remonte, l'extérieur tombe
            ctx.beginPath();
            const lid = -ry - 1 + e.triste * 2.2;
            const pente = e.triste * 1.3;
            ctx.moveTo(-9, 9);
            ctx.lineTo(9, 9);
            ctx.lineTo(9, lid - pente * cote);
            ctx.lineTo(-9, lid + pente * cote);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = couleurVisage;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // la pupille brillante bouge avec le regard
            ctx.fillStyle = couleurCorps;
            ctx.beginPath();
            ctx.arc(-1.1 + regardX * 0.9, -1.6 * (ry / 4.3) + regardY * 0.8, 1 + 0.4 * e.grand + 0.3 * e.espoir, 0, Math.PI * 2);
            ctx.fill();
            if (e.espoir > 0.3) {
              ctx.beginPath();
              ctx.arc(1.2 + regardX * 0.9, 1.2 + regardY * 0.8, 0.5 * e.espoir, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
          ctx.strokeStyle = couleurVisage;
          ctx.lineWidth = 2;
          if (e.heureux > 0.05) {
            // yeux fermés de bonheur : ^ ^
            ctx.globalAlpha = apparition * e.heureux;
            ctx.beginPath();
            ctx.moveTo(ox - 3.4, 1.4);
            ctx.quadraticCurveTo(ox, -3.6, ox + 3.4, 1.4);
            ctx.stroke();
            ctx.globalAlpha = apparition;
          }
          if (e.aie > 0.05) {
            // le sursaut : > <
            ctx.globalAlpha = apparition * e.aie;
            ctx.beginPath();
            ctx.moveTo(ox - 2.8 * cote, -3);
            ctx.lineTo(ox + 2.4 * cote, 0);
            ctx.lineTo(ox - 2.8 * cote, 3);
            ctx.stroke();
            ctx.globalAlpha = apparition;
          }
        });
        // joues roses
        if (e.rose > 0.02) {
          ctx.fillStyle = `rgba(255,122,184,${0.55 * e.rose * pCouleur})`;
          [-1, 1].forEach((k) => {
            ctx.beginPath();
            ctx.ellipse(k * (ECART / 2 + 2.6), 5.6, 2.6, 1.4, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        // la bouche (sur l'étoile de la bouche)
        const mo: V = [((BOUCHE[0] - FACE[0]) * Math.cos(-ANGLE) - (BOUCHE[1] - FACE[1]) * Math.sin(-ANGLE)) / 1, 0];
        const mx = mo[0] * 0.3 + regardX * 0.25;
        const mw = 7.4 * (1 - 0.15 * e.triste) * (1 + 0.15 * e.heureux) * (1 - 0.25 * e.aie);
        const my = 8.4 + regardY * 0.2;
        const courbe = e.sourire * 4.2;
        const tremblote = (enPleurs || humeur === "peur" ? 0.5 : 0) * Math.sin(t * 31);
        const ouv = e.bouche * 5.5;
        ctx.strokeStyle = couleurVisage;
        ctx.fillStyle = couleurVisage;
        ctx.lineWidth = 3.1;
        ctx.beginPath();
        ctx.moveTo(mx - mw / 2, my - courbe * 0.25);
        ctx.quadraticCurveTo(mx, my + courbe + tremblote, mx + mw / 2, my - courbe * 0.25);
        if (ouv > 0.4) {
          // bouche ouverte : un creux sous la lèvre (en riant) ou au-dessus (en pleurant)
          ctx.quadraticCurveTo(mx, my + courbe + tremblote + (e.sourire >= 0 ? ouv : -ouv), mx - mw / 2, my - courbe * 0.25);
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();

        // ===== les larmes : elles glissent sur son corps, et seulement sur lui =====
        if (enPleurs && now > prochaineLarme) {
          prochaineLarme = now + (finPleurs ? 420 : 170) + Math.random() * 140;
          const cote = Math.random() < 0.5 ? -1 : 1;
          const [x, y] = depuisVisage([fx, fy], cote * (ECART / 2 + 2.2), 3.2);
          larmes.push({ x, y, vx: cote * (1 + Math.random() * 2.5), vy: 4 + Math.random() * 4, vie: 0 });
        }
        ctx.save();
        chemin();
        ctx.clip();
        for (let i = larmes.length - 1; i >= 0; i--) {
          const l = larmes[i]!;
          l.vie += dt;
          l.vy = Math.min(l.vy + 40 * dt, 30);
          l.vx *= 1 - dt * 1.5;
          l.x += l.vx * dt;
          l.y += l.vy * dt;
          if (l.vie > 3.2 || !dedans(tour, l.x, l.y - 2)) {
            larmes.splice(i, 1);
            continue;
          }
          const a = clamp(3.2 - l.vie) * 0.9;
          ctx.strokeStyle = `rgba(170,220,255,${0.22 * a})`;
          ctx.lineWidth = 1.9;
          ctx.beginPath();
          ctx.moveTo(l.x - l.vx * 0.35, l.y - Math.min(12, l.vie * 9));
          ctx.lineTo(l.x, l.y);
          ctx.stroke();
          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(Math.atan2(l.vy, l.vx) - Math.PI / 2);
          ctx.scale(1.6, 1.6);
          ctx.fillStyle = `rgba(170,220,255,${a})`;
          ctx.beginPath();
          ctx.moveTo(0, -3.2);
          ctx.quadraticCurveTo(1.7, -0.2, 1.4, 0.6);
          ctx.arc(0, 0.6, 1.4, 0, Math.PI);
          ctx.quadraticCurveTo(-1.7, -0.2, 0, -3.2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // ===== les petits cœurs quand on le caresse =====
      if (caressé && now > prochainCoeur && pCouleur >= 1) {
        prochainCoeur = now + 520;
        const [x, y] = depuisVisage([visageR.x, visageR.y], (Math.random() - 0.5) * 20, -14);
        coeurs.push({ x, y, vie: 0, d: Math.random() * 6.28 });
      }
      for (let i = coeurs.length - 1; i >= 0; i--) {
        const h = coeurs[i]!;
        h.vie += dt;
        if (h.vie > 1.6) {
          coeurs.splice(i, 1);
          continue;
        }
        const k = h.vie / 1.6;
        const x = h.x + Math.sin(h.d + h.vie * 4) * 3;
        const y = h.y - 26 * sortie(k);
        const r = 2.4 * ressort(clamp(h.vie / 0.35));
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(r, r);
        ctx.fillStyle = `rgba(255,122,184,${1 - k * k})`;
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.bezierCurveTo(-2, -0.2, -1.2, -1.8, 0, -0.8);
        ctx.bezierCurveTo(1.2, -1.8, 2, -0.2, 0, 1);
        ctx.fill();
        ctx.restore();
      }
    };
    frame = requestAnimationFrame(dessine);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("load", surCharge);
      window.removeEventListener("pointermove", regarde);
      window.removeEventListener("pointerdown", regarde);
      window.removeEventListener("teodor-espoir", espoir);
      c.removeEventListener("pointerdown", bas);
      c.removeEventListener("pointermove", bouge);
      c.removeEventListener("pointerup", haut);
      c.removeEventListener("pointercancel", annule);
      c.removeEventListener("pointerleave", quitte);
    };
  }, [humeur]);

  return (
    <div className={["teodor", className].filter(Boolean).join(" ")}>
      <canvas ref={toile} className="teodor-toile" role="img" aria-label="Teodor" />
      <div ref={anneau} className="teodor-anneau" aria-hidden="true">
        <AnneauPS2 taille={88} />
      </div>
    </div>
  );
}
