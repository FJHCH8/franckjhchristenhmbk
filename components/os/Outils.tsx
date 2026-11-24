"use client";

/**
 * Deux outils du Hanck 7 Pro Max :
 * – Alarme (horloge, alarmes, minuteur, chronomètre), qui marchent vraiment ;
 * – Calculatrice, qui répond n'importe quoi (2 + 2 = 6).
 */
import { useEffect, useRef, useState } from "react";
import { alarmes, notifier, type Alarme } from "./Memoire";
import { ChoixSonnerie, toast } from "./Systeme";
import { choixSons, jouerSonnerie, nomSonnerie } from "./sonneries";

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

const JOURS_COURTS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0];

/** « Lun., mar., … » : chaque jour est un nœud de texte à part, pour que les traductions suivent. */
function TexteJours({ a }: { a: Alarme }) {
  if (a.texte) return <>{a.texte}</>;
  if (a.jours.length === 0) return <>Une fois</>;
  if (a.jours.length === 7) return <>Tous les jours</>;
  const j = ORDRE_JOURS.filter((x) => a.jours.includes(x));
  return (
    <>
      {j.map((x, k) => (
        <span key={x} className="hz-jour">
          {k === 0 ? JOURS_COURTS[x] : JOURS_COURTS[x]!.toLowerCase()}
          {k < j.length - 1 ? <span translate="no">{", "}</span> : null}
        </span>
      ))}
    </>
  );
}

function Alarmes() {
  // Les trois alarmes d'origine, puis celles du visiteur : tout est gardé dans la session.
  const liste = alarmes.useValeur();
  const [edite, setEdite] = useState<Alarme | null>(null);
  return (
    <div className="hz-alarmes">
      {liste.map((a) => (
        <div key={a.id} className="hz-ligne">
          <button type="button" className={`hz-alarme${a.on ? " on" : ""}`} onClick={() => alarmes.ecrire((l) => l.map((x) => (x.id === a.id ? { ...x, on: !x.on } : x)))}>
            <b>{`${deux(a.h)}:${deux(a.m)}`}</b>
            <span>
              {a.libelle ? <em className="hz-libelle">{a.libelle}</em> : null}
              {a.libelle ? <span translate="no">{" · "}</span> : null}
              <TexteJours a={a} />
            </span>
            <i className="hz-interrupteur">{a.on ? "OUI" : "NON"}</i>
          </button>
          <button type="button" className="hz-modifier" aria-label="Modifier l’alarme" onClick={() => setEdite(a)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aakanos/aosp/ic_menu_edit.svg" alt="" width={28} height={28} style={{ display: "block" }} />
          </button>
        </div>
      ))}
      {liste.length === 0 ? <p className="hz-vide">Aucune alarme</p> : null}
      <button type="button" className="jb-bouton hz-ajouter" onClick={() => setEdite({ id: "", h: 8, m: 0, jours: [], on: true })}>
        + Ajouter une alarme
      </button>
      {edite ? <EditeurAlarme depart={edite} fermer={() => setEdite(null)} /> : null}
    </div>
  );
}

function EditeurAlarme({ depart, fermer }: { depart: Alarme; fermer: () => void }) {
  const [h, setH] = useState(depart.h);
  const [m, setM] = useState(depart.m);
  const [jours, setJours] = useState<number[]>(depart.jours);
  const [libelle, setLibelle] = useState(depart.libelle ?? "");
  const [sonA, setSonA] = useState<string | undefined>(depart.son);
  const [choix, setChoix] = useState(false);
  const sons = choixSons.useValeur();
  const nouvelle = depart.id === "";
  const tourner = (v: number, d: number, max: number) => (v + d + max) % max;
  const roue = (v: number, set: (n: number) => void, max: number, pas: number, nom: string) => (
    <div className="hz-roue">
      <button type="button" aria-label={`${nom} +`} onClick={() => set(tourner(v, pas, max))}>
        ▲
      </button>
      <b translate="no">{deux(v)}</b>
      <button type="button" aria-label={`${nom} −`} onClick={() => set(tourner(v, -pas, max))}>
        ▼
      </button>
    </div>
  );
  const enregistrer = () => {
    const changeJours = jours.join() !== depart.jours.join();
    const a: Alarme = {
      ...depart,
      id: nouvelle ? `al${Date.now().toString(36)}` : depart.id,
      h,
      m,
      jours,
      libelle: libelle.trim().slice(0, 40) || undefined,
      son: sonA,
      // Le texte d'origine reste tant qu'on ne touche pas aux jours.
      texte: changeJours ? undefined : depart.texte,
      date: changeJours ? undefined : depart.date,
      on: true,
    };
    alarmes.ecrire((l) => (nouvelle ? [...l, a] : l.map((x) => (x.id === a.id ? a : x))));
    toast(`Alarme réglée pour ${deux(h)}:${deux(m)}`);
    fermer();
  };
  return (
    <div className="dlg-fond" onClick={fermer}>
      <div className="dlg hz-editeur" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-titre">{nouvelle ? "Nouvelle alarme" : "Modifier l’alarme"}</div>
        <div className="dlg-corps">
          <div className="hz-roues">
            {roue(h, setH, 24, 1, "Heures")}
            <span>:</span>
            {roue(m, setM, 60, 5, "Minutes")}
          </div>
          <div className="hz-jours">
            {ORDRE_JOURS.map((x) => (
              <button
                key={x}
                type="button"
                className={jours.includes(x) ? "on" : ""}
                onClick={() => setJours((l) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x].sort()))}
              >
                {JOURS_COURTS[x]}
              </button>
            ))}
          </div>
          <input className="holo-champ" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Libellé" aria-label="Libellé" />
        </div>
        <button type="button" className="dlg-choix hz-son" onClick={() => setChoix(true)}>
          <span>
            <b>Sonnerie</b>
            <small translate="no">{nomSonnerie(sonA ?? sons.alarme)}</small>
          </span>
        </button>
        {choix ? <ChoixSonnerie categorie="alarme" valeur={sonA ?? sons.alarme} choisir={setSonA} fermer={() => setChoix(false)} /> : null}
        {!nouvelle ? (
          <button data-son="effacer"
            type="button"
            className="dlg-choix hz-supprimer"
            onClick={() => {
              alarmes.ecrire((l) => l.filter((x) => x.id !== depart.id));
              toast("Alarme supprimée");
              fermer();
            }}
          >
            Supprimer l’alarme
          </button>
        ) : null}
        <div className="dlg-boutons">
          <button type="button" onClick={fermer}>
            Annuler
          </button>
          <button type="button" data-son="entree" onClick={enregistrer}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function Minuteur() {
  const [total, setTotal] = useState(60);
  const [reste, setReste] = useState(60);
  const [marche, setMarche] = useState(false);
  const [fini, setFini] = useState(false);
  useEffect(() => {
    if (fini) notifier({ titre: "Minuteur", texte: "Le temps est écoulé", appli: "endurreisen", icone: "/aakanos/aosp/ic_lock_idle_alarm.svg", son: false });
  }, [fini]);
  useEffect(() => {
    if (!marche) return;
    const id = window.setInterval(() => {
      setReste((r) => {
        if (r <= 1) {
          setMarche(false);
          setFini(true);
          // la fin du minuteur sonne avec l'alarme choisie (Argon par défaut, AOSP), 6 secondes
          window.setTimeout(jouerSonnerie(choixSons.lire().alarme, true, "alarme"), 6000);
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
        <button type="button" data-son="effacer" className="jb-bouton" onClick={() => (setMarche(false), setFini(false), setReste(total))}>
          Réinitialiser
        </button>
        <button type="button" data-son={marche ? "videoFin" : "videoDebut"} className="jb-bouton hz-principal" disabled={reste === 0} onClick={() => setMarche((m) => !m)}>
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
        <button type="button" data-son={marche ? "declencheur" : "effacer"} className="jb-bouton" onClick={() => (marche ? setTours((t) => [ecoule, ...t]) : (setEcoule(0), setTours([])))}>
          {marche ? "Tour" : "Réinitialiser"}
        </button>
        <button type="button" data-son={marche ? "videoFin" : "videoDebut"} className="jb-bouton hz-principal" onClick={() => setMarche((m) => !m)}>
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
          <button key={k} type="button" data-son={k === "C" ? "effacer" : k === "=" ? "entree" : "touche"} className={/[÷×−+=]/.test(k) ? "op" : k === "C" ? "c" : ""} onClick={() => appui(k)}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
