"use client";

/**
 * Opakaalt en 3D, style années PS2 : low-poly, textures basse résolution, brume, soleil couchant.
 * Un seul monde (l'avenue, le carrefour, le casino au bout, la salle du casino) filmé de quatre façons :
 *  – « menu »   : la caméra survole l'avenue, le jour tombe puis la nuit vient ;
 *  – « rue »    : la cinématique de la rencontre, en vrais plans (large, épaule, gros plan) ;
 *  – « balade » : tu diriges le femboy jusqu'au casino (joystick, flèches ou ZQSD) ;
 *  – « casino » : la salle, les deux assis à la table, plans de cinéma.
 * Les personnages restent ceux du jeu (couleurs, coiffures, joues qui rougissent), refaits en volumes.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type ModeMonde = "menu" | "rue" | "balade" | "casino";
export type VueMonde = {
  fx: number; bx: number; marche: boolean; zoom: number; aTerre: boolean; colere: boolean; bRougit: number; fRougit: number;
  bSourire: boolean; fSourire: boolean; secousse: boolean; vol: boolean; fOpacite: number; bOpacite: number; debout: boolean; coup: boolean;
};

const PORTE = new THREE.Vector3(0, 0, -77);
const DEPART_BALADE = new THREE.Vector3(8.6, 0, -6);

/* ---------- textures « PS2 » fabriquées au vol ---------- */
let graine = 7;
const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
function texture(w: number, h: number, dessin: (g: CanvasRenderingContext2D, w: number, h: number) => void, filtre = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  dessin(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (filtre) t.magFilter = THREE.NearestFilter;
  return t;
}
function bruit(g: CanvasRenderingContext2D, w: number, h: number, n: number, a: string, b: string) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = alea() < 0.5 ? a : b;
    g.fillRect(alea() * w, alea() * h, 1, 1);
  }
}
function facade(base: string, allume: number) {
  return texture(64, 128, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    bruit(g, w, h, 400, "rgba(0,0,0,.1)", "rgba(255,255,255,.05)");
    for (let y = 6; y < h - 8; y += 14)
      for (let x = 5; x < w - 6; x += 14) {
        const on = alea() < allume;
        g.fillStyle = on ? (alea() < 0.5 ? "#ffd27a" : "#ffe9b0") : "#1d2236";
        g.fillRect(x, y, 8, 9);
        g.fillStyle = "rgba(255,255,255,.14)";
        g.fillRect(x, y, 8, 2);
      }
  });
}

/* ---------- personnages low-poly ---------- */
type Perso = { g: THREE.Group; jambes: THREE.Object3D[]; bras: THREE.Object3D[]; visage: (p: { rougit: number; colere: boolean; sourire: boolean; ferme?: boolean }) => void };
function perso(type: "femboy" | "blond"): Perso {
  const blond = type === "blond";
  const P = new THREE.Group();
  const L = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const peau = 0xf5c39e;
  const haut = blond ? 0xf4f4f4 : 0x9a7ad8;
  const bas = blond ? 0x3657a8 : 0x2a2a3a;
  const ch = blond ? 0xffd84a : 0xff8ac8;
  const canv = document.createElement("canvas");
  canv.width = canv.height = 32;
  const tv = new THREE.CanvasTexture(canv);
  tv.colorSpace = THREE.SRGBColorSpace;
  tv.magFilter = THREE.NearestFilter;
  const visage = ({ rougit, colere, sourire, ferme }: { rougit: number; colere: boolean; sourire: boolean; ferme?: boolean }) => {
    const g = canv.getContext("2d")!;
    g.fillStyle = rougit >= 3 ? "#ffb0a0" : "#f5c39e";
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = blond ? "#ffd84a" : "#ff8ac8";
    g.fillRect(0, 0, 32, blond ? 6 : 9);
    if (!blond) {
      g.fillRect(0, 0, 5, 26);
      g.fillRect(27, 0, 5, 26);
    }
    const oeil = blond ? "#2a2a2a" : "#3aa0ff";
    if (ferme) {
      g.fillStyle = "#2a2a2a";
      g.fillRect(9, 15, 5, 1);
      g.fillRect(19, 15, 5, 1);
    } else {
      g.fillStyle = "#fff";
      g.fillRect(9, 12, 5, 5);
      g.fillRect(19, 12, 5, 5);
      g.fillStyle = oeil;
      g.fillRect(11, 13, 3, 4);
      g.fillRect(19, 13, 3, 4);
    }
    g.fillStyle = colere ? "#2a2a2a" : blond ? "#e0a91f" : "#d070a8";
    if (colere) {
      g.fillRect(8, 9, 6, 2);
      g.fillRect(19, 9, 6, 2);
    } else {
      g.fillRect(9, 10, 5, 1);
      g.fillRect(19, 10, 5, 1);
    }
    if (rougit >= 1) {
      g.fillStyle = "rgba(255,95,138,.9)";
      g.fillRect(6, 19, 5, 3);
      g.fillRect(22, 19, 5, 3);
    }
    g.fillStyle = "#b03a48";
    if (sourire) {
      g.fillRect(12, 23, 9, 2);
      g.fillRect(11, 22, 1, 1);
      g.fillRect(21, 22, 1, 1);
    } else if (colere) g.fillRect(12, 24, 8, 2);
    else g.fillRect(13, 23, 6, 2);
    tv.needsUpdate = true;
  };
  visage({ rougit: 0, colere: false, sourire: false });
  const tronc = new THREE.Mesh(new THREE.BoxGeometry(blond ? 1.3 : 0.95, 1.2, 0.62), L(haut));
  tronc.position.y = 2.35;
  const bassin = new THREE.Mesh(new THREE.BoxGeometry(blond ? 1.1 : 1.0, 0.5, 0.56), L(bas));
  bassin.position.y = 1.55;
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.82, 0.72), [L(peau), L(peau), L(ch), L(peau), new THREE.MeshLambertMaterial({ map: tv }), L(ch)]);
  tete.position.y = 3.42;
  const coupe = new THREE.Mesh(new THREE.BoxGeometry(blond ? 0.84 : 0.9, blond ? 0.24 : 0.52, blond ? 0.78 : 0.84), L(ch));
  coupe.position.set(0, blond ? 3.92 : 3.72, blond ? 0 : -0.06);
  P.add(tronc, bassin, tete, coupe);
  if (!blond) {
    const meche = new THREE.Mesh(new THREE.BoxGeometry(0.94, 1.05, 0.26), L(ch));
    meche.position.set(0, 3.2, -0.36);
    const jupe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.74, 0.56, 8), L(0x2a2a3a));
    jupe.position.y = 1.42;
    const coeur = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.05), L(0xff5f8a));
    coeur.position.set(0, 2.45, 0.33);
    P.add(meche, jupe, coeur);
  } else {
    const ceinture = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.58), L(0x5a3a22));
    ceinture.position.y = 1.78;
    P.add(ceinture);
  }
  const jambes: THREE.Object3D[] = [];
  const bras: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const pb = new THREE.Group();
    pb.position.set(s * (blond ? 0.84 : 0.6), 2.9, 0);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(blond ? 0.26 : 0.15, blond ? 0.22 : 0.13, 1.15, 7), L(blond ? peau : haut));
    b.position.y = -0.55;
    const main = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), L(peau));
    main.position.y = -1.15;
    pb.add(b, main);
    pb.rotation.z = s * 0.1;
    P.add(pb);
    bras.push(pb);
    const pj = new THREE.Group();
    pj.position.set(s * 0.27, 1.3, 0);
    const j = new THREE.Mesh(new THREE.CylinderGeometry(blond ? 0.22 : 0.15, blond ? 0.19 : 0.13, 1.2, 7), L(blond ? bas : peau));
    j.position.y = -0.6;
    const chaussette = blond ? null : new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.4, 7), L(0xf4f4f4));
    if (chaussette) chaussette.position.y = -1.0;
    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.58), L(blond ? 0x2a2a2a : 0xff6fa8));
    pied.position.set(0, -1.22, 0.08);
    pj.add(j, pied);
    if (chaussette) pj.add(chaussette);
    P.add(pj);
    jambes.push(pj);
  }
  P.traverse((o) => {
    o.castShadow = true;
  });
  return { g: P, jambes, bras, visage };
}

/* ---------- le monde ---------- */
function construire(sc: THREE.Scene) {
  graine = 7;
  const voitures: THREE.Group[] = [];
  const route = texture(64, 64, (g, w, h) => {
    g.fillStyle = "#3a3a42";
    g.fillRect(0, 0, w, h);
    bruit(g, w, h, 500, "#33333a", "#45454e");
    g.fillStyle = "#d8d0a0";
    g.fillRect(30, 0, 4, 24);
  });
  const trottoir = texture(32, 32, (g, w, h) => {
    g.fillStyle = "#8a8478";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#6a645a";
    g.strokeRect(0, 0, 16, 16);
    g.strokeRect(16, 16, 16, 16);
    bruit(g, w, h, 140, "#7e786c", "#968f82");
  });
  trottoir.repeat.set(160, 160);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshLambertMaterial({ map: trottoir }));
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  sc.add(sol);
  route.repeat.set(2, 50);
  const avenue = new THREE.Mesh(new THREE.PlaneGeometry(12, 320), new THREE.MeshLambertMaterial({ map: route }));
  avenue.rotation.x = -Math.PI / 2;
  avenue.position.y = 0.02;
  avenue.receiveShadow = true;
  sc.add(avenue);
  const r2 = avenue.clone();
  r2.rotation.z = Math.PI / 2;
  r2.position.set(0, 0.025, -50);
  sc.add(r2);
  const fac = [["#5a4a6a", 0.25], ["#4a5a7a", 0.3], ["#6a5050", 0.2], ["#3e4a68", 0.35], ["#7a6a5a", 0.2]].map(([c, a]) => facade(c as string, a as number));
  const facNuit = [["#5a4a6a", 0.6], ["#4a5a7a", 0.65], ["#6a5050", 0.55], ["#3e4a68", 0.7], ["#7a6a5a", 0.55]].map(([c, a]) => facade(c as string, a as number));
  const matsFac: THREE.MeshLambertMaterial[] = [];
  for (const s of [-1, 1]) {
    let z = 24;
    while (z > -150) {
      const w = 8 + alea() * 6;
      const d = 8 + alea() * 6;
      const h = 10 + alea() * 34;
      if (Math.abs(z - d / 2 + 50) < 12 || (z < -68 && z > -92 && Math.abs(s) === 1 && w > 99)) {
        z -= 14;
        continue;
      }
      const i = Math.floor(alea() * fac.length);
      const t = fac[i]!.clone();
      t.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 12)));
      t.needsUpdate = true;
      const m = new THREE.MeshLambertMaterial({ map: t });
      m.userData = { jour: t, nuit: facNuit[i]!.clone() };
      (m.userData.nuit as THREE.Texture).repeat.copy(t.repeat);
      (m.userData.nuit as THREE.Texture).needsUpdate = true;
      matsFac.push(m);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(s * (11 + w / 2 + alea() * 2), h / 2, z - d / 2);
      b.castShadow = b.receiveShadow = true;
      sc.add(b);
      z -= d + 1 + alea() * 2;
    }
  }
  // lampadaires (leurs lumières s'allument la nuit)
  const lampes: THREE.PointLight[] = [];
  const tetesLampes: THREE.MeshBasicMaterial[] = [];
  for (let z = -4; z > -120; z -= 18)
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 6), new THREE.MeshLambertMaterial({ color: 0x22222a }));
      p.position.set(s * 7.2, 3, z);
      p.castShadow = true;
      const mt = new THREE.MeshBasicMaterial({ color: 0x777766 });
      tetesLampes.push(mt);
      const t = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.5), mt);
      t.position.set(s * 6.6, 6, z);
      sc.add(p, t);
      if (s === 1 && z % 36 === -4 % 36) {
        const pl = new THREE.PointLight(0xffc070, 0, 16);
        pl.position.set(s * 6.6, 5.6, z);
        lampes.push(pl);
        sc.add(pl);
      }
    }
  // le casino au bout de l'avenue
  const enseigne = texture(256, 64, (g, w, h) => {
    g.fillStyle = "#1a0716";
    g.fillRect(0, 0, w, h);
    g.font = "bold 44px Arial";
    g.fillStyle = "#ff3c9e";
    g.shadowColor = "#ff3c9e";
    g.shadowBlur = 14;
    g.fillText("CASINO", 36, 48);
  }, false);
  const casino = new THREE.Mesh(new THREE.BoxGeometry(22, 24, 14), new THREE.MeshLambertMaterial({ color: 0x2a1030 }));
  casino.position.set(0, 12, -86);
  casino.castShadow = true;
  const ens = new THREE.Mesh(new THREE.PlaneGeometry(15, 3.75), new THREE.MeshBasicMaterial({ map: enseigne }));
  ens.position.set(0, 14, -78.9);
  const porte = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
  porte.position.set(0, 3, -78.9);
  const neon = new THREE.PointLight(0xff3c9e, 30, 26);
  neon.position.set(0, 12, -74);
  sc.add(casino, ens, porte, neon);
  // voitures qui roulent
  const couleurs = [0xffc33a, 0xd83a3a, 0x3a6ad8, 0x2ab36a, 0xeeeeee];
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Group();
    const c = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 4.6), new THREE.MeshLambertMaterial({ color: couleurs[i] }));
    c.position.y = 0.75;
    const h = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2.4), new THREE.MeshLambertMaterial({ color: 0x223040 }));
    h.position.set(0, 1.55, -0.2);
    const phares = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff3c0 }));
    phares.position.set(0, 0.85, 2.31);
    v.add(c, h, phares);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 10), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      w.rotation.z = Math.PI / 2;
      w.position.set(a * 1.05, 0.45, b * 1.5);
      v.add(w);
    }
    v.traverse((o) => {
      o.castShadow = true;
    });
    const sens = i % 2 ? 1 : -1;
    v.position.set(sens * 3, 0, -140 + i * 40);
    v.rotation.y = sens > 0 ? 0 : Math.PI;
    v.userData = { sens, vitesse: 9 + i * 2 };
    voitures.push(v);
    sc.add(v);
  }
  // la salle du casino (cachée tant qu'on est dehors)
  const salle = new THREE.Group();
  salle.position.set(0, 0, -200);
  const parquet = texture(32, 32, (g) => {
    g.fillStyle = "#4a0e2a";
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = "#6a1a3a";
    for (let i = 0; i < 32; i += 8) for (let j = 0; j < 32; j += 8) if ((i + j) % 16 === 0) g.fillRect(i, j, 8, 8);
  });
  parquet.repeat.set(16, 16);
  const so = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: parquet }));
  so.rotation.x = -Math.PI / 2;
  so.position.y = 0.05;
  so.receiveShadow = true;
  const murs = new THREE.Mesh(new THREE.BoxGeometry(40, 18, 40), new THREE.MeshLambertMaterial({ color: 0x1c0820, side: THREE.BackSide }));
  murs.position.y = 9;
  const table = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 4.2), new THREE.MeshLambertMaterial({ color: 0x0f6b3a }));
  table.position.y = 2.6;
  table.castShadow = table.receiveShadow = true;
  const bord = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.25, 4.6), new THREE.MeshLambertMaterial({ color: 0x7a4a22 }));
  bord.position.y = 2.95;
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.4, 8), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
  pied.position.y = 1.2;
  salle.add(so, murs, table, bord, pied);
  for (const [x, c] of [[-12, 0xff3c9e], [12, 0x2ad1ff], [0, 0xffc33a]] as const) {
    const n = new THREE.PointLight(c, 50, 30);
    n.position.set(x, 8, -10);
    const t = new THREE.Mesh(new THREE.BoxGeometry(x ? 0.4 : 10, x ? 10 : 0.4, 0.4), new THREE.MeshBasicMaterial({ color: c }));
    t.position.set(x, x ? 7 : 12, -15);
    salle.add(n, t);
  }
  const spot = new THREE.SpotLight(0xffe0b0, 150, 30, 0.6, 0.5);
  spot.position.set(0, 13, 2);
  spot.target = table;
  spot.castShadow = true;
  salle.add(spot);
  for (const [x, z] of [[-9, -6], [9, -6], [-10, 6], [10, 6]]) {
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16), new THREE.MeshLambertMaterial({ color: 0x0f6b3a }));
    tb.position.set(x, 2.4, z);
    const pd = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.4, 8), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
    pd.position.set(x, 1.2, z);
    salle.add(tb, pd);
  }
  sc.add(salle);
  return { voitures, matsFac, lampes, tetesLampes, salle, porte: porte.material as THREE.MeshBasicMaterial };
}

/* ---------- le composant ---------- */
export default function Monde3D({ mode, vue, parle, onArrivee }: { mode: ModeMonde; vue?: Partial<VueMonde>; parle?: string | null; onArrivee?: () => void }) {
  const boite = useRef<HTMLDivElement>(null);
  const etat = useRef({ vue, parle, mode, onArrivee });
  useEffect(() => {
    etat.current = { vue, parle, mode, onArrivee };
  }, [vue, parle, mode, onArrivee]);
  const joy = useRef({ x: 0, y: 0, actif: false, ox: 0, oy: 0 });
  const [pos, setPos] = useState({ x: DEPART_BALADE.x, z: DEPART_BALADE.z, a: Math.PI });
  const [pouce, setPouce] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const W = () => el.clientWidth || 390;
    const H = () => el.clientHeight || 700;
    const r = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.setSize(W(), H());
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(r.domElement);
    const sc = new THREE.Scene();
    const ciel = document.createElement("canvas");
    ciel.width = 2;
    ciel.height = 256;
    const tc = new THREE.CanvasTexture(ciel);
    tc.colorSpace = THREE.SRGBColorSpace;
    sc.background = tc;
    sc.fog = new THREE.Fog(0xe08a6a, 30, 170);
    const hemi = new THREE.HemisphereLight(0xffd0b0, 0x403050, 0.9);
    const soleil = new THREE.DirectionalLight(0xffb070, 2.2);
    soleil.position.set(-40, 22, -60);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(1024, 1024);
    Object.assign(soleil.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, far: 220 });
    sc.add(hemi, soleil, soleil.target);
    const monde = construire(sc);
    const F = perso("femboy");
    const B = perso("blond");
    sc.add(F.g, B.g);
    const cam = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 400);
    const camPos = new THREE.Vector3(0, 8, 20);
    const camVise = new THREE.Vector3(0, 4, -20);
    const visePos = new THREE.Vector3();
    const viseCible = new THREE.Vector3();
    let nuitActuelle = -1;
    /** 0 = coucher de soleil, 1 = nuit */
    const reglerNuit = (n: number) => {
      if (Math.abs(n - nuitActuelle) < 0.02) return;
      nuitActuelle = n;
      const g = ciel.getContext("2d")!;
      const gr = g.createLinearGradient(0, 0, 0, 256);
      const m = (a: string, b: string) => {
        const ca = new THREE.Color(a);
        return "#" + ca.lerp(new THREE.Color(b), n).getHexString();
      };
      gr.addColorStop(0, m("#2a3a7a", "#05060f"));
      gr.addColorStop(0.45, m("#b0567a", "#141533"));
      gr.addColorStop(0.75, m("#ff9a5a", "#2a2050"));
      gr.addColorStop(1, m("#ffd08a", "#4a2a5a"));
      g.fillStyle = gr;
      g.fillRect(0, 0, 2, 256);
      tc.needsUpdate = true;
      (sc.fog as THREE.Fog).color.set(new THREE.Color(0xe08a6a).lerp(new THREE.Color(0x1a1838), n));
      hemi.intensity = 0.9 - 0.35 * n;
      soleil.intensity = 2.2 - 1.7 * n;
      soleil.color.set(new THREE.Color(0xffb070).lerp(new THREE.Color(0x8090ff), n));
      for (const l of monde.lampes) l.intensity = n > 0.45 ? 26 : 0;
      for (const t of monde.tetesLampes) t.color.set(n > 0.45 ? 0xfff0b0 : 0x777766);
      for (const m2 of monde.matsFac) {
        const t = (n > 0.5 ? m2.userData.nuit : m2.userData.jour) as THREE.Texture;
        if (m2.map !== t) {
          m2.map = t;
          m2.needsUpdate = true;
        }
      }
    };
    reglerNuit(0);
    const clavier = new Set<string>();
    const kd = (e: KeyboardEvent) => clavier.add(e.key.toLowerCase());
    const ku = (e: KeyboardEvent) => clavier.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    const joueur = { p: DEPART_BALADE.clone(), a: Math.PI, arrive: false };
    let dernier = performance.now();
    let raf = 0;
    const t0 = dernier;
    let dernierPos = 0;
    const tremble = new THREE.Vector3();
    const posVis = (pct: number) => 12 - pct * 0.32; // % de l'écran 2D -> z sur le trottoir
    const anime = (p: Perso, marche: boolean, t: number, vitesse = 9) => {
      const a = marche ? Math.sin(t * vitesse) * 0.6 : 0;
      p.jambes[0]!.rotation.x = a;
      p.jambes[1]!.rotation.x = -a;
      p.bras[0]!.rotation.x = -a * 0.8;
      p.bras[1]!.rotation.x = a * 0.8;
    };
    let cleVisage = "";
    const boucle = (n: number) => {
      raf = requestAnimationFrame(boucle);
      const dt = Math.min(0.05, (n - dernier) / 1000);
      dernier = n;
      const t = (n - t0) / 1000;
      const { vue: v, parle: qui, mode: md } = etat.current;
      // voitures
      for (const vt of monde.voitures) {
        vt.position.z += vt.userData.sens * vt.userData.vitesse * dt;
        if (vt.position.z > 40) vt.position.z = -150;
        if (vt.position.z < -150) vt.position.z = 40;
      }
      monde.salle.visible = md === "casino";
      const dehors = md !== "casino";
      // visages
      const cle = JSON.stringify([v?.fRougit, v?.fSourire, v?.bRougit, v?.bSourire, v?.colere]);
      if (cle !== cleVisage) {
        cleVisage = cle;
        F.visage({ rougit: v?.fRougit ?? 0, colere: false, sourire: !!v?.fSourire });
        B.visage({ rougit: v?.bRougit ?? 0, colere: !!v?.colere, sourire: !!v?.bSourire });
      }
      if (md === "menu") {
        reglerNuit(Math.min(1, Math.max(0, (Math.sin(t * 0.12 - 1.2) + 1) / 2)));
        F.g.position.set(-1.4, 0, -40);
        F.g.rotation.set(0, 0.25, 0);
        B.g.position.set(1.4, 0, -40);
        B.g.rotation.set(0, -0.25, 0);
        anime(F, false, t);
        anime(B, false, t);
        const z = -6 - ((t * 2.2) % 40);
        camPos.set(Math.sin(t * 0.2) * 3, 5 + Math.sin(t * 0.3), z + 24);
        camVise.set(0, 7, z - 20);
      } else if (md === "rue" && v) {
        reglerNuit(0.15);
        const fz = posVis(v.fx ?? 0);
        const bz = posVis(v.bx ?? 100);
        F.g.position.set(8.2, 0, fz);
        F.g.rotation.set(v.aTerre ? -Math.PI / 2 : 0, Math.PI, 0);
        if (v.aTerre) F.g.position.y = 0.4;
        B.g.position.set(8.8, 0, bz);
        B.g.rotation.set(0, 0, 0);
        F.g.visible = (v.fOpacite ?? 1) > 0.1;
        B.g.visible = (v.bOpacite ?? 1) > 0.1;
        anime(F, !!v.marche, t);
        anime(B, !!v.marche, t + 0.4);
        const mz = (fz + bz) / 2;
        const zoom = v.zoom ?? 1;
        if (qui === "blond") {
          camPos.set(3.6, 4.4, fz + 3.6);
          camVise.set(8.8, 3.4, bz);
        } else if (qui === "femboy") {
          camPos.set(4.0, 4.4, bz - 3.8);
          camVise.set(8.2, 3.4, fz);
        } else if (zoom > 1.5) {
          camPos.set(2.2, 3.8, mz + 3);
          camVise.set(8.5, 3.0, mz);
        } else {
          camPos.set(-3 + (zoom - 1) * 6, 4.5, mz + 12 - (zoom - 1) * 8);
          camVise.set(8.5, 2.8, mz);
        }
      } else if (md === "balade") {
        // le joueur
        const j = joy.current;
        let ax = j.x;
        let ay = j.y;
        if (clavier.has("arrowleft") || clavier.has("q") || clavier.has("a")) ax -= 1;
        if (clavier.has("arrowright") || clavier.has("d")) ax += 1;
        if (clavier.has("arrowup") || clavier.has("z") || clavier.has("w")) ay -= 1;
        if (clavier.has("arrowdown") || clavier.has("s")) ay += 1;
        const force = Math.min(1, Math.hypot(ax, ay));
        // déplacement relatif à la caméra (vers le casino = haut)
        if (force > 0.08) {
          const dir = new THREE.Vector3(ax, 0, ay).normalize();
          joueur.p.addScaledVector(dir, force * 7.5 * dt);
          joueur.a = Math.atan2(dir.x, dir.z);
        }
        joueur.p.x = Math.max(-10.5, Math.min(10.5, joueur.p.x));
        joueur.p.z = Math.max(-78.5, Math.min(14, joueur.p.z));
        // les voitures te bousculent
        for (const vt of monde.voitures) {
          if (Math.abs(vt.position.x - joueur.p.x) < 1.6 && Math.abs(vt.position.z - joueur.p.z) < 2.8) {
            joueur.p.x += joueur.p.x > vt.position.x ? 0.5 : -0.5;
            tremble.set((Math.random() - 0.5) * 0.4, 0, 0);
          }
        }
        F.g.position.copy(joueur.p);
        F.g.rotation.set(0, joueur.a, 0);
        anime(F, force > 0.08, t, 11);
        B.g.position.set(2.2, 0, -73);
        B.g.rotation.set(0, Math.atan2(joueur.p.x - 2.2, joueur.p.z + 73), 0);
        anime(B, false, t);
        reglerNuit(Math.min(1, Math.max(0, (-joueur.p.z - 5) / 60)));
        camPos.set(joueur.p.x * 0.45, 7.6, joueur.p.z + 11);
        camVise.set(joueur.p.x * 0.9, 2.4, joueur.p.z - 14);
        if (n - dernierPos > 120) {
          dernierPos = n;
          setPos({ x: joueur.p.x, z: joueur.p.z, a: joueur.a });
        }
        if (!joueur.arrive && joueur.p.distanceTo(PORTE) < 5) {
          joueur.arrive = true;
          etat.current.onArrivee?.();
        }
      } else if (md === "casino") {
        reglerNuit(1);
        const s = monde.salle.position;
        F.g.position.set(s.x, 0, s.z + 3.7);
        F.g.rotation.set(0, Math.PI, 0);
        B.g.position.set(s.x, 0, s.z - 3.7);
        B.g.rotation.set(0, 0, 0);
        if (v?.vol) {
          F.g.position.y = 2 + Math.sin(t * 3) * 0.5;
          F.g.position.z += 6;
          F.g.rotation.x = -1.2;
        }
        const debout = !!v?.debout;
        F.g.scale.y = 1;
        B.g.position.y = debout ? 0 : -0.25;
        F.g.position.y = v?.vol ? F.g.position.y : -0.25;
        anime(F, false, t);
        anime(B, false, t);
        if (qui === "blond") {
          camPos.set(s.x + 3.8, 5.4, s.z + 10.5);
          camVise.set(s.x + 0.3, 3.6, s.z - 3.7);
        } else if (qui === "femboy") {
          camPos.set(s.x - 3.8, 5.4, s.z - 10.5);
          camVise.set(s.x - 0.3, 3.6, s.z + 3.7);
        } else {
          camPos.set(s.x + 11 * Math.cos(t * 0.15 + 0.4), 7.5, s.z + 11 * Math.sin(t * 0.15 + 0.4));
          camVise.set(s.x, 3.2, s.z);
        }
      }
      if (dehors) {
        soleil.target.position.set(0, 0, md === "balade" ? joueur.p.z : -30);
        soleil.position.set(-40, 22, soleil.target.position.z - 30);
      }
      // caméra fluide (et secousse pendant la collision)
      const doux = md === "menu" ? 1 : 1 - Math.pow(0.002, dt);
      visePos.lerp(camPos, md === "menu" ? 1 : doux);
      viseCible.lerp(camVise, md === "menu" ? 1 : doux);
      if (v?.secousse) tremble.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4, 0);
      cam.position.copy(visePos).add(tremble);
      tremble.multiplyScalar(0.8);
      cam.lookAt(viseCible);
      r.render(sc, cam);
    };
    visePos.copy(camPos);
    viseCible.copy(camVise);
    raf = requestAnimationFrame(boucle);
    const ro = new ResizeObserver(() => {
      r.setSize(W(), H());
      cam.aspect = W() / H();
      cam.updateProjectionMatrix();
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      sc.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const x of mats) {
          (x as THREE.MeshLambertMaterial).map?.dispose();
          x.dispose();
        }
      });
      r.dispose();
      r.domElement.remove();
    };
  }, []);

  const balade = mode === "balade";
  const dist = Math.round(Math.hypot(pos.x - PORTE.x, pos.z - PORTE.z));
  return (
    <div className={`o3${balade ? " o3-balade" : ""}${mode === "rue" || mode === "casino" ? " o3-cine" : ""}`}>
      <div className="o3-rendu" ref={boite} />
      {mode === "rue" || mode === "casino" ? (
        <>
          <i className="o3-bande h" />
          <i className="o3-bande b" />
        </>
      ) : null}
      {balade ? (
        <>
          <div className="o3-carte" aria-hidden="true">
            <i className="o3-rue-v" />
            <i className="o3-rue-h" />
            <b className="o3-casino" style={{ top: `${50 + (PORTE.z - pos.z) * 0.9}%`, left: `${50 + (PORTE.x - pos.x) * 0.9}%` }}>C</b>
            <b className="o3-moi" style={{ transform: `translate(-50%, -50%) rotate(${Math.PI - pos.a}rad)` }} />
          </div>
          <div className="o3-objectif">
            Rejoins le <span>casino</span> · {dist} m
          </div>
          <div
            className="o3-joy-zone"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              joy.current = { x: 0, y: 0, actif: true, ox: e.clientX, oy: e.clientY };
              setPouce({ x: 0, y: 0 });
            }}
            onPointerMove={(e) => {
              const j = joy.current;
              if (!j.actif) return;
              const dx = (e.clientX - j.ox) / 50;
              const dy = (e.clientY - j.oy) / 50;
              const l = Math.max(1, Math.hypot(dx, dy));
              j.x = dx / l;
              j.y = dy / l;
              setPouce({ x: j.x * 34, y: j.y * 34 });
            }}
            onPointerUp={() => {
              joy.current = { x: 0, y: 0, actif: false, ox: 0, oy: 0 };
              setPouce(null);
            }}
            onPointerCancel={() => {
              joy.current = { x: 0, y: 0, actif: false, ox: 0, oy: 0 };
              setPouce(null);
            }}
          >
            <div className="o3-joy">
              <i style={pouce ? { transform: `translate(${pouce.x}px, ${pouce.y}px)` } : undefined} />
            </div>
            <span className="o3-aide">Glisse ici pour marcher</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
