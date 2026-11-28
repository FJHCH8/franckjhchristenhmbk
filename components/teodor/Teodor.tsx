"use client";

/**
 * Teodor, la mascotte du site : un triangle bleu posé sur les 9 étoiles du logo de Franck.
 * Six étoiles font son corps, deux ses yeux, une sa bouche. Les étoiles sont invisibles,
 * mais elles bougent : Teodor respire, cligne des yeux, et réagit.
 *
 * Ouverture : le logo se dessine sous l'anneau PS2, puis sa ligne se défait, se renoue
 * autour des étoiles et se remplit de bleu ; Teodor apparaît.
 * Ensuite : une caresse (glisser le doigt ou la souris sur lui) le rend heureux et il se
 * blottit contre le doigt ; une tape le fait pleurer pendant 5 secondes.
 */
import { useEffect, useRef } from "react";
import { AnneauPS2 } from "@/components/AnneauPS2";
import { RONDS } from "@/components/Logo";

export type Humeur = "joie" | "peur";

type V = [number, number];
const ETOILES: V[] = RONDS.map(([x, y]) => [x, y]);
const [, OEIL_G, OEIL_D] = ETOILES as [V, V, V];
const CORPS = [0, 4, 5, 6, 7, 8]; // le tour : haut, gauche, gauche-bas, bas, bas, bas-droite
const LIGNE_ORDRE = ETOILES; // la ligne du logo relie les étoiles dans l'ordre
const FACE: V = [(OEIL_G[0] + OEIL_D[0]) / 2, (OEIL_G[1] + OEIL_D[1]) / 2];
const ANGLE = Math.atan2(OEIL_D[1] - OEIL_G[1], OEIL_D[0] - OEIL_G[0]);
const ECART = Math.hypot(OEIL_D[0] - OEIL_G[0], OEIL_D[1] - OEIL_G[1]);
const CENTRE: V = [100, 98];
const VISAGE = 1.3; // le visage, un peu plus grand que les étoiles pour bien lire ses émotions

const BLEU = [53, 80, 255];
const BLANC = [255, 255, 255];
const NUIT = [10, 10, 10];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const sortie = (x: number) => 1 - (1 - x) ** 3;
const ressort = (x: number) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2; // dépasse un peu puis revient
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(",")})`;
const vers = (cur: number, cible: number, dt: number, vitesse: number) => cur + (cible - cur) * (1 - Math.exp(-dt * vitesse));

/** Le contour aux coins arrondis, échantillonné en points (sert au tracé partiel, au remplissage et au toucher). */
function contour(pts: V[], r: number): V[] {
  const out: V[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const a = pts[(i - 1 + n) % n]!;
    const b = pts[(i + 1) % n]!;
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
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

type Larme = { x: number; y: number; vx: number; vy: number; vie: number };

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
    let taille = 0;
    let dpr = 1;
    const mesure = () => {
      taille = c.clientWidth;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(taille * dpr);
      c.height = Math.round(taille * dpr);
    };
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(c);

    // ---- le temps de l'ouverture ----
    const debut = performance.now();
    let charge = document.readyState === "complete";
    const surCharge = () => (charge = true);
    window.addEventListener("load", surCharge, { once: true });
    let tDefait = calme ? -10 : -1; // moment où la ligne commence à se défaire
    let annonce = false;

    // ---- l'état de Teodor ----
    const e = { sourire: 0, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0, calin: 0, sanglot: 0, ouvert: 1 };
    let clignement = 2.5;
    let pleureJusque = 0;
    let caresseA = -10;
    let heureuxJusque = 0;
    let calinX = 100;
    let calinY = 100;
    let prochaineLarme = 0;
    const larmes: Larme[] = [];
    let corpsActuel: V[] = [];
    let echelle = 1;

    // ---- le toucher ----
    let appui: { x: number; y: number; t: number; dist: number; px: number; py: number } | null = null;
    let survol = 0;
    const versMonde = (ev: PointerEvent): V => {
      const r = c.getBoundingClientRect();
      const s = (r.width / 200) * echelle;
      return [CENTRE[0] + (ev.clientX - r.left - r.width / 2) / s, CENTRE[1] + (ev.clientY - r.top - r.height / 2) / s];
    };
    const surLui = (p: V) => corpsActuel.length > 0 && dedans(corpsActuel, p[0], p[1]);
    const caresse = (p: V, now: number) => {
      caresseA = now;
      calinX = p[0];
      calinY = p[1];
      if (now < pleureJusque) pleureJusque = now; // une caresse console
    };
    const bas = (ev: PointerEvent) => {
      const p = versMonde(ev);
      if (!surLui(p)) return;
      c.setPointerCapture(ev.pointerId);
      appui = { x: p[0], y: p[1], t: performance.now(), dist: 0, px: p[0], py: p[1] };
    };
    const bouge = (ev: PointerEvent) => {
      const p = versMonde(ev);
      const now = performance.now();
      c.style.cursor = surLui(p) ? "grab" : "";
      if (appui) {
        appui.dist += Math.hypot(p[0] - appui.px, p[1] - appui.py);
        appui.px = p[0];
        appui.py = p[1];
        if (appui.dist > 14) caresse(p, now);
        return;
      }
      // à la souris, sans cliquer : passer doucement sur lui est aussi une caresse
      if (ev.pointerType === "mouse" && surLui(p)) {
        survol += Math.hypot(ev.movementX, ev.movementY);
        if (survol > 160) caresse(p, now);
      } else survol = 0;
    };
    const haut = () => {
      const now = performance.now();
      if (appui && appui.dist < 10 && now - appui.t < 350) {
        pleureJusque = now + 5000; // une tape : il pleure 5 secondes
        heureuxJusque = 0;
        caresseA = -10;
      }
      appui = null;
    };
    c.addEventListener("pointerdown", bas);
    c.addEventListener("pointermove", bouge);
    c.addEventListener("pointerup", haut);
    c.addEventListener("pointercancel", () => (appui = null));
    c.addEventListener("pointerleave", () => (survol = 0));

    let avant = debut;
    let frame = 0;
    const dessine = (now: number) => {
      frame = requestAnimationFrame(dessine);
      const dt = Math.min(0.05, (now - avant) / 1000);
      avant = now;
      const t = (now - debut) / 1000;
      if (tDefait < 0 && t > 2.4 && (charge || t > 6)) tDefait = t;
      const tv = tDefait < 0 ? -1 : t - tDefait; // temps depuis le début de la transformation
      const pDefait = tv < 0 ? 0 : clamp(tv / 0.8);
      const pRelie = clamp((tv - 0.75) / 1.1);
      const pCouleur = clamp((tv - 1.8) / 0.8);
      const vivant = tv >= 2.6;
      if (vivant && !annonce) {
        annonce = true;
        pret.current?.();
      }
      if (anneau.current) anneau.current.style.opacity = String(tv < 0 ? 1 : clamp(1 - tv / 0.5));

      const W = c.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, W);
      echelle = 0.66 + 0.34 * ease(pRelie);
      const s = (W / 200) * echelle;
      ctx.setTransform(s, 0, 0, s, W / 2 - CENTRE[0] * s, W / 2 - CENTRE[1] * s);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // ===== 1. le logo se dessine, comme d'habitude =====
      if (pDefait < 1) {
        const trace = calme ? 1 : ease(clamp((t - 0.2) / 1.6));
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.8;
        // longueur cumulée de la ligne
        const longs = LIGNE_ORDRE.slice(1).map((p, i) => Math.hypot(p[0] - LIGNE_ORDRE[i]![0], p[1] - LIGNE_ORDRE[i]![1]));
        const total = longs.reduce((a, b) => a + b, 0);
        let parcouru = 0;
        longs.forEach((L, i) => {
          const a = LIGNE_ORDRE[i]!;
          const b = LIGNE_ORDRE[i + 1]!;
          // part de ce segment déjà tracée
          const vu = clamp((trace * total - parcouru) / L);
          parcouru += L;
          if (vu <= 0) return;
          // 2. la ligne se défait : chaque morceau se rétracte vers son milieu
          const k = sortie(clamp(pDefait * 1.4 - i * 0.05));
          const d0 = 0.5 * k;
          const d1 = Math.min(vu, 1 - 0.5 * k);
          if (d1 <= d0) return;
          const off = Math.sin(i * 2.1) * 3 * k;
          ctx.globalAlpha = 1 - k * 0.6;
          ctx.beginPath();
          ctx.moveTo(a[0] + (b[0] - a[0]) * d0 + off, a[1] + (b[1] - a[1]) * d0 - off);
          ctx.lineTo(a[0] + (b[0] - a[0]) * d1 + off, a[1] + (b[1] - a[1]) * d1 - off);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      // ===== les étoiles et le corps qui respire =====
      const souffle = calme ? 0 : Math.sin((t * 2 * Math.PI) / 3.6);
      const tremble = (k: number) => Math.sin(t * 37 + k * 1.7) * 0.55 + Math.sin(t * 23 + k * 2.9) * 0.45;
      const transforme = (p: V, k: number): V => {
        if (!vivant && pRelie < 1) return p;
        const a = 0.024 * souffle + 0.005 * Math.sin(t * 1.7 + k * 1.3);
        let x = CENTRE[0] + (p[0] - CENTRE[0]) * (1 + a);
        let y = CENTRE[1] + (p[1] - CENTRE[1]) * (1 + a) - 1.4 * souffle * (p[1] < 60 ? 1 : 0.35);
        x += e.frisson * 0.9 * tremble(k);
        y += e.frisson * 0.6 * tremble(k + 4) + e.sanglot * 1.6 * Math.abs(Math.sin(t * 8.5));
        // le câlin : il se penche et ses coins viennent entourer le doigt
        if (e.calin > 0.001) {
          const dx = calinX - x;
          const dy = calinY - y;
          const w = Math.exp(-(dx * dx + dy * dy) / (2 * 55 * 55));
          x += dx * (0.22 * w + 0.04) * e.calin + Math.sin(t * 18) * 0.25 * e.calin;
          y += dy * (0.22 * w + 0.04) * e.calin;
        }
        return [x, y];
      };

      // ===== 3. la ligne se renoue autour des étoiles du tour =====
      const pts = CORPS.map((i) => transforme(ETOILES[i]!, i));
      const tour = contour(pts, 12);
      corpsActuel = tour;
      const couleurCorps = mix(BLANC, BLEU, pCouleur);
      const couleurVisage = mix(BLANC, NUIT, pCouleur);

      if (pRelie > 0) {
        // remplissage (4.) : le bleu s'étend depuis le visage
        if (pCouleur > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(FACE[0], FACE[1], 6 + 150 * ease(pCouleur), 0, Math.PI * 2);
          ctx.clip();
          ctx.shadowColor = `rgba(43,70,255,${0.85 * pCouleur})`;
          ctx.shadowBlur = 14 * dpr * echelle * (W / dpr / 340);
          ctx.fillStyle = couleurCorps;
          ctx.beginPath();
          tour.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        // le trait du contour
        // le contour commence au milieu du coin du haut et se referme en bas, des deux côtés à la fois
        ctx.strokeStyle = couleurCorps;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        if (pRelie >= 1) {
          tour.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
        } else {
          const N = tour.length;
          const m = Math.round(N * ease(pRelie) / 2);
          const at = (i: number) => tour[(i + 4 + N) % N]!; // l'indice 4 : le milieu du coin du haut
          ctx.moveTo(at(-m)[0], at(-m)[1]);
          for (let i = -m + 1; i <= m; i++) ctx.lineTo(at(i)[0], at(i)[1]);
        }
        ctx.stroke();
      }

      // les ronds du logo : ils apparaissent, puis fondent dans Teodor
      ETOILES.forEach((p, i) => {
        const apparu = calme ? 1 : ressort(clamp((t - 0.2 - RONDS[i]![2] * 1.6) / 0.45));
        const visage = i >= 1 && i <= 3;
        const k = CORPS.indexOf(i);
        // le trait part du haut dans les deux sens : chaque étoile fond quand il l'atteint
        const atteint = k <= 0 ? 0 : Math.min(k, 6 - k) / 3;
        const fond = visage ? clamp((pRelie - 0.55) / 0.3) : clamp((ease(pRelie) - atteint * 0.92) / 0.08 + (k === 0 ? 0.5 : 0));
        const r = 4 * apparu * (1 - fond) * (1 + 0.25 * Math.sin(clamp(pDefait) * Math.PI));
        if (r <= 0.05) return;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fill();
      });

      // ===== l'humeur et les réactions =====
      const enPleurs = now < pleureJusque;
      const caressé = now - caresseA < 650;
      if (caressé) heureuxJusque = now + 1400;
      const content = now < heureuxJusque;
      const debutVie = vivant ? tv - 2.6 : -1;
      const fete = humeur === "joie" && debutVie >= 0 && debutVie < 1.6;
      const cible = { sourire: 0, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0, calin: 0, sanglot: 0 };
      if (humeur === "joie") Object.assign(cible, { sourire: 0.85, bouche: 0.15, rose: 0.25 });
      else {
        // perdu et apeuré : il tremble, regarde partout, la bouche tordue
        const coup = Math.sin(t * 0.9) > 0.55 ? Math.sign(Math.sin(t * 3.1)) : Math.sin(t * 0.7) * 0.4;
        Object.assign(cible, { sourire: -0.7, triste: 0.75, grand: 0.55, frisson: 0.55, regard: coup });
      }
      if (fete) Object.assign(cible, { sourire: 1, bouche: 0.75, heureux: debutVie < 1.1 ? 1 : 0, rose: 0.6 });
      if (content) Object.assign(cible, { sourire: 1, bouche: 0.1, heureux: 1, triste: 0, grand: 0, rose: 1, frisson: 0, regard: 0, calin: caressé ? 1 : 0 });
      if (enPleurs) Object.assign(cible, { sourire: -1, bouche: 0.55, heureux: 0, triste: 1, grand: 0, rose: 0.35, frisson: 0.2, regard: 0, calin: 0, sanglot: 1 });
      if (!vivant) Object.assign(cible, { sourire: 0.2, bouche: 0, heureux: 0, triste: 0, grand: 0, rose: 0, frisson: 0, regard: 0 });
      (Object.keys(cible) as (keyof typeof cible)[]).forEach((k) => (e[k] = vers(e[k], cible[k], dt, k === "regard" ? 7 : k === "calin" ? 5 : 6)));
      // clignements
      clignement -= dt;
      if (clignement < 0) clignement = 2.2 + Math.random() * 3.2;
      e.ouvert = clignement < 0.16 && e.heureux < 0.5 ? Math.abs(clignement / 0.08 - 1) : 1;

      // le petit saut de joie
      const saut = fete ? -5 * Math.abs(Math.sin(debutVie * Math.PI * 2.4)) * (1 - debutVie / 1.6) : 0;

      // ===== le visage =====
      if (pRelie > 0.45) {
        const apparition = clamp((pRelie - 0.45) / 0.4);
        const [fx, fy] = transforme(FACE, 1.5);
        ctx.save();
        ctx.translate(fx + e.regard * 2.4, fy + saut);
        ctx.rotate(ANGLE);
        ctx.scale(VISAGE, VISAGE);
        ctx.globalAlpha = apparition;
        const yeux: [number, number][] = [
          [-ECART / 2, 1],
          [ECART / 2, -1],
        ];
        yeux.forEach(([ox, cote]) => {
          const rx = 3.5 * (1 + 0.14 * e.grand);
          const ry = 4.3 * (1 + 0.18 * e.grand) * (1 - e.heureux) * e.ouvert;
          ctx.save();
          ctx.translate(ox, 0);
          if (ry > 0.15) {
            // paupière triste : le coin intérieur remonte, l'extérieur tombe
            ctx.beginPath();
            const pente = e.triste * 2.6;
            ctx.moveTo(-9, 9);
            ctx.lineTo(9, 9);
            ctx.lineTo(9, -ry - 1 + e.triste * 2.2 + pente * -cote * 0.5 * (cote > 0 ? 1 : 1));
            ctx.lineTo(-9, -ry - 1 + e.triste * 2.2 + pente * cote * 0.5);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = couleurVisage;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // reflet
            ctx.fillStyle = couleurCorps;
            ctx.beginPath();
            ctx.arc(-1.1 + e.regard * 0.4, -1.6 * (ry / 4.3), 1 + 0.35 * e.grand, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          if (e.heureux > 0.05) {
            // yeux fermés de bonheur : ^ ^
            ctx.strokeStyle = couleurVisage;
            ctx.lineWidth = 2;
            ctx.globalAlpha = apparition * e.heureux;
            ctx.beginPath();
            ctx.moveTo(ox - 3.4, 1.4);
            ctx.quadraticCurveTo(ox, -3.6, ox + 3.4, 1.4);
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
        // la bouche
        const mw = 7.4 * (1 - 0.15 * e.triste) * (1 + 0.15 * e.heureux);
        const my = 8.4;
        const courbe = e.sourire * 4.2;
        const tremblote = (enPleurs || humeur === "peur" ? 0.5 : 0) * Math.sin(t * 31);
        const ouv = e.bouche * 5.5;
        ctx.strokeStyle = couleurVisage;
        ctx.fillStyle = couleurVisage;
        ctx.lineWidth = 3.1;
        ctx.beginPath();
        ctx.moveTo(-mw / 2, my - courbe * 0.25);
        ctx.quadraticCurveTo(0, my + courbe + tremblote, mw / 2, my - courbe * 0.25);
        if (ouv > 0.4) {
          // bouche ouverte : un creux sous la lèvre (en riant) ou au-dessus (en pleurant)
          ctx.quadraticCurveTo(0, my + courbe + tremblote + (e.sourire >= 0 ? ouv : -ouv), -mw / 2, my - courbe * 0.25);
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();

        // ===== les larmes =====
        if (enPleurs && now > prochaineLarme) {
          prochaineLarme = now + 170 + Math.random() * 140;
          const cote = Math.random() < 0.5 ? -1 : 1;
          const lx = cote * (ECART / 2 + 2.2);
          const ly = 3.2;
          const cs = Math.cos(ANGLE);
          const sn = Math.sin(ANGLE);
          larmes.push({ x: fx + lx * cs - ly * sn, y: fy + lx * sn + ly * cs, vx: cote * (1 + Math.random() * 2.5), vy: 4 + Math.random() * 4, vie: 0 });
        }
        // elles glissent le long de sa peau, freinées, et s'arrêtent au bord de son corps
        ctx.save();
        ctx.beginPath();
        tour.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
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
          // une traînée mouillée derrière la goutte
          ctx.strokeStyle = `rgba(170,220,255,${0.22 * clamp(3.2 - l.vie)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(l.x - l.vx * 0.35, l.y - Math.min(10, l.vie * 9));
          ctx.lineTo(l.x, l.y);
          ctx.stroke();
          const a = clamp(3.2 - l.vie) * 0.9;
          const ang = Math.atan2(l.vy, l.vx) - Math.PI / 2;
          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(ang);
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
    };
    frame = requestAnimationFrame(dessine);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("load", surCharge);
      c.removeEventListener("pointerdown", bas);
      c.removeEventListener("pointermove", bouge);
      c.removeEventListener("pointerup", haut);
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
