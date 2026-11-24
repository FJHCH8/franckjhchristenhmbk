"use client";

/**
 * Deux outils du Hanck 7 Pro Max :
 * – Alarme (horloge, alarmes, minuteur, chronomètre), qui marchent vraiment ;
 * – Calculatrice, qui répond n'importe quoi (2 + 2 = 6).
 */
import { useEffect, useRef, useState } from "react";
import { sonSonnerie } from "./sonsAndroid";

const deux = (n: number) => String(Math.floor(n)).padStart(2, "0");

/* ---------------- Alarme ---------------- */

type Onglet = "horloge" | "alarme" | "minuteur" | "chrono";
const ONGLETS: [Onglet, string][] = [
  ["horloge", "Horloge"],
  ["alarme", "Alarmes"],
  ["minuteur", "Minuteur"],
  ["chrono", "Chrono"],
];

export function AppHorloge() {
  const [onglet, setOnglet] = useState<Onglet>("horloge");
  return (
    <div className="hz">
      <div className="hz-onglets">
        {ONGLETS.map(([id, nom]) => (
          <button key={id} type="button" className={onglet === id ? "on" : ""} onClick={() => setOnglet(id)}>
            {nom}
          </button>
        ))}
      </div>
      <div className="hz-corps">
        {onglet === "horloge" ? <Horloge /> : onglet === "alarme" ? <Alarmes /> : onglet === "minuteur" ? <Minuteur /> : <Chrono />}
      </div>
    </div>
  );
}

function useMaintenant(ms = 1000) {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    const maj = () => setT(new Date());
    const debut = window.setTimeout(maj, 0);
    const id = window.setInterval(maj, ms);
    return () => {
      window.clearTimeout(debut);
      window.clearInterval(id);
    };
  }, [ms]);
  return t;
}

function Horloge() {
  const t = useMaintenant();
  if (!t) return null;
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(t);
  return (
    <div className="hz-horloge">
      <div className="hz-heure">
        {deux(t.getHours())}
        <span>:</span>
        {deux(t.getMinutes())}
        <small>{deux(t.getSeconds())}</small>
      </div>
      <div className="hz-date">{date}</div>
      <div className="hz-ville">Paris</div>
    </div>
  );
}

function Alarmes() {
  const [liste, setListe] = useState([
    { h: "07:00", jours: "Lun., mar., mer., jeu., ven.", on: true },
    { h: "09:30", jours: "Sam., dim.", on: false },
    { h: "00:00", jours: "Ouverture d’Endurreisen", on: true },
  ]);
  return (
    <div className="hz-alarmes">
      {liste.map((a, i) => (
        <button key={i} type="button" className={`hz-alarme${a.on ? " on" : ""}`} onClick={() => setListe((l) => l.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))}>
          <b>{a.h}</b>
          <span>{a.jours}</span>
          <i className="hz-interrupteur">{a.on ? "OUI" : "NON"}</i>
        </button>
      ))}
      <button type="button" className="jb-bouton hz-ajouter" onClick={() => setListe((l) => [...l, { h: "08:00", jours: "Une fois", on: true }])}>
        + Ajouter une alarme
      </button>
    </div>
  );
}

function Minuteur() {
  const [total, setTotal] = useState(60);
  const [reste, setReste] = useState(60);
  const [marche, setMarche] = useState(false);
  const [fini, setFini] = useState(false);
  useEffect(() => {
    if (!marche) return;
    const id = window.setInterval(() => {
      setReste((r) => {
        if (r <= 1) {
          setMarche(false);
          setFini(true);
          sonSonnerie();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [marche]);
  const ajouter = (s: number) => {
    setFini(false);
    setTotal((t) => t + s);
    setReste((r) => r + s);
  };
  return (
    <div className="hz-minuteur">
      <div className={`hz-gros${fini ? " fini" : ""}`}>
        {deux(reste / 60)}:{deux(reste % 60)}
      </div>
      {fini ? <p className="hz-fini">Temps écoulé !</p> : null}
      <div className="hz-ajouts">
        {[10, 60, 300].map((s) => (
          <button key={s} type="button" className="jb-bouton" onClick={() => ajouter(s)}>
            {s < 60 ? `+${s} s` : `+${s / 60} min`}
          </button>
        ))}
      </div>
      <div className="hz-actions">
        <button type="button" className="jb-bouton" onClick={() => (setMarche(false), setFini(false), setReste(total))}>
          Réinitialiser
        </button>
        <button type="button" className="jb-bouton hz-principal" disabled={reste === 0} onClick={() => setMarche((m) => !m)}>
          {marche ? "Pause" : "Démarrer"}
        </button>
      </div>
    </div>
  );
}

function Chrono() {
  const [ecoule, setEcoule] = useState(0);
  const [marche, setMarche] = useState(false);
  const [tours, setTours] = useState<number[]>([]);
  const debut = useRef(0);
  useEffect(() => {
    if (!marche) return;
    debut.current = performance.now() - ecoule;
    let raf = 0;
    const pas = () => {
      setEcoule(performance.now() - debut.current);
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marche]);
  const f = (ms: number) => `${deux(ms / 60000)}:${deux((ms / 1000) % 60)}.${deux((ms / 10) % 100)}`;
  return (
    <div className="hz-chrono">
      <div className="hz-gros">{f(ecoule)}</div>
      <div className="hz-actions">
        <button type="button" className="jb-bouton" onClick={() => (marche ? setTours((t) => [ecoule, ...t]) : (setEcoule(0), setTours([])))}>
          {marche ? "Tour" : "Réinitialiser"}
        </button>
        <button type="button" className="jb-bouton hz-principal" onClick={() => setMarche((m) => !m)}>
          {marche ? "Arrêter" : "Démarrer"}
        </button>
      </div>
      <ol className="hz-tours">
        {tours.map((t, i) => (
          <li key={i}>
            <span>Tour {tours.length - i}</span>
            <b>{f(t)}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Calculatrice (qui dit n'importe quoi) ---------------- */

const TOUCHES = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "C", "0", "=", "+"];

function calculer(expr: string): number | null {
  const m = expr.match(/\d+(?:[.,]\d+)?|[+−×÷]/g);
  if (!m) return null;
  // d'abord × et ÷, puis + et −
  const pile: (number | string)[] = [];
  for (const x of m) {
    const top = pile[pile.length - 1];
    if (/\d/.test(x)) {
      const v = Number(x.replace(",", "."));
      if (top === "×" || top === "÷") {
        pile.pop();
        const a = pile.pop() as number;
        pile.push(top === "×" ? a * v : v === 0 ? Infinity : a / v);
      } else pile.push(v);
    } else pile.push(x);
  }
  let r = typeof pile[0] === "number" ? pile[0] : 0;
  for (let i = 1; i < pile.length; i += 2) {
    const op = pile[i];
    const v = pile[i + 1];
    if (typeof v !== "number") break;
    r = op === "+" ? r + v : r - v;
  }
  return r;
}

const BETISES = [
  (r: number) => String(r + 2),
  (r: number) => String(r * 2 + 1),
  (r: number) => `environ ${r + 3}`,
  () => "42",
  () => "trop",
  () => "beaucoup",
  () => "demande à Pacifick",
  () => "π",
  (r: number) => String(-r),
  () => "∞ et des poussières",
  (r: number) => `${r}… ou pas`,
];

export function AppCalculatrice() {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState<string | null>(null);
  const graine = useRef(20070645);
  const appui = (k: string) => {
    if (k === "C") return setExpr(""), setRes(null);
    if (k === "=") {
      const vrai = calculer(expr);
      if (vrai === null) return;
      const propre = expr.replace(/\s/g, "");
      if (propre === "2+2") return setRes("6");
      const r = Math.round(vrai * 1000) / 1000;
      graine.current = (graine.current * 1103515245 + 12345) % 2147483648;
      setRes(BETISES[graine.current % BETISES.length]!(r));
      return;
    }
    if (res !== null) setRes(null);
    setExpr((e) => (e.length < 24 ? e + k : e));
  };
  return (
    <div className="calc">
      <div className="calc-ecran">
        <span className="calc-expr">{expr || "0"}</span>
        <b className="calc-res">{res === null ? "" : `= ${res}`}</b>
      </div>
      <div className="calc-pave">
        {TOUCHES.map((k) => (
          <button key={k} type="button" className={/[÷×−+=]/.test(k) ? "op" : k === "C" ? "c" : ""} onClick={() => appui(k)}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
