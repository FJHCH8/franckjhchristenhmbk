"use client";

/**
 * La mémoire du téléphone AakanOS : tout ce que fait le visiteur (contacts, messages, notes,
 * alarmes, numéros bloqués, notifications) est gardé dans le sessionStorage de l'onglet,
 * jusqu'à « Réinitialiser le téléphone » ou la fermeture de la page.
 * Plus les notifications façon Jelly Bean (bandeau en haut + rideau + son) et les alarmes qui sonnent.
 */
import { useEffect, useRef, useState } from "react";
import { choixSons, jouerNotification, jouerSonnerie } from "./sonneries";

export { creerStore, ecrireSession, lireSession } from "./session";
import { creerStore } from "./session";

/* ---------------- Données du visiteur ---------------- */

export type ContactPerso = { id: string; nom: string; tel?: string; mail?: string; note?: string };
export const contactsPerso = creerStore<ContactPerso[]>("contacts", []);

/** Numéros (ou identifiants de conversation) bloqués par le visiteur. */
export const bloques = creerStore<string[]>("bloques", []);

export type MsgPerso = { id: number; de: "moi"; texte: string; h: string };
/** Conversations avec les contacts créés par le visiteur (clé : id du contact). */
export const convsPerso = creerStore<Record<string, MsgPerso[]>>("convs-perso", {});

export type NotePerso = { id: string; texte: string; modifie: number };
export const notesPerso = creerStore<NotePerso[]>("notes", []);

export type Alarme = { id: string; h: number; m: number; jours: number[]; libelle?: string; texte?: string; on: boolean; date?: string; son?: string };
export const ALARMES_DEPART: Alarme[] = [
  { id: "a1", h: 7, m: 0, jours: [1, 2, 3, 4, 5], texte: "Lun., mar., mer., jeu., ven.", on: true },
  { id: "a2", h: 9, m: 30, jours: [6, 0], texte: "Sam., dim.", on: false },
  { id: "a3", h: 0, m: 0, jours: [], texte: "Ouverture d’Endurreisen", on: true, date: "2026-12-01" },
];
export const alarmes = creerStore<Alarme[]>("alarmes", ALARMES_DEPART);

export type NotifSup = { id: string; titre: string; texte: string; h: string; appli: string; icone?: string };
export const notifsSup = creerStore<NotifSup[]>("notifs", []);

export const heureCourte = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Ouvre une appli depuis une autre (Messages → Contacts, Contacts → Messages…). */
export let ouvertureEnAttente: { appli: string; cible?: string } | null = null;
export function ouvrirAppli(appli: string, cible?: string) {
  ouvertureEnAttente = { appli, cible };
  window.dispatchEvent(new CustomEvent("aakanos-ouvrir", { detail: appli }));
}
export function prendreCible(appli: string) {
  if (ouvertureEnAttente?.appli !== appli) return undefined;
  const c = ouvertureEnAttente.cible;
  ouvertureEnAttente = null;
  return c;
}

/* ---------------- Notifications ---------------- */

export type Annonce = { titre: string; texte: string; appli: string; icone?: string; son?: boolean; rideau?: boolean };

/** Une notification reçue : bandeau Jelly Bean en haut, ligne dans le rideau, son. */
export function notifier(a: Annonce) {
  window.dispatchEvent(new CustomEvent<Annonce>("aakanos-notif", { detail: a }));
}

export function Bandeau({ ouvrir }: { ouvrir: (appli: string) => void }) {
  const [b, setB] = useState<(Annonce & { cle: number; sort?: boolean }) | null>(null);
  useEffect(() => {
    let t1 = 0;
    let t2 = 0;
    const f = (e: Event) => {
      const a = (e as CustomEvent<Annonce>).detail;
      if (a.rideau !== false) {
        notifsSup.ecrire((l) => [{ id: `n${Date.now()}`, titre: a.titre, texte: a.texte, h: heureCourte(), appli: a.appli, icone: a.icone }, ...l].slice(0, 12));
      }
      if (a.son !== false) jouerNotification();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      setB({ ...a, cle: Date.now() });
      const d = Math.min(9, Math.max(4.2, (a.titre.length + a.texte.length) * 0.075)) * 1000;
      t1 = window.setTimeout(() => setB((x) => (x ? { ...x, sort: true } : x)), d);
      t2 = window.setTimeout(() => setB(null), d + 200);
    };
    window.addEventListener("aakanos-notif", f);
    return () => {
      window.removeEventListener("aakanos-notif", f);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  if (!b) return null;
  // Comme Jelly Bean : le texte défile dans la barre d'état (le « ticker »), puis la notification reste dans le volet.
  const duree = Math.min(9, Math.max(4.2, (b.titre.length + b.texte.length) * 0.075));
  return (
    <button key={b.cle} type="button" className="os-bandeau" onClick={() => (setB(null), ouvrir(b.appli))} aria-live="polite">
      <span className="os-ticker">
        {b.icone ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.icone} alt="" width={18} height={18} />
        ) : null}
        <span>
          <b style={{ animationDuration: `${duree}s` }}>
            <span>{b.titre}</span>
            <span translate="no">{" : "}</span>
            <span>{b.texte}</span>
          </b>
        </span>
      </span>
    </button>
  );
}

/* ---------------- Réinitialiser ---------------- */

export function reinitialiserTelephone() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith("aakanos")) sessionStorage.removeItem(k);
    localStorage.removeItem("aakanos-systeme");
    localStorage.removeItem("aakanos-muet");
  } catch {}
  window.location.reload();
}

/* ---------------- Les alarmes qui sonnent ---------------- */

export const deux = (n: number) => String(Math.floor(n)).padStart(2, "0");

function aSonner(a: Alarme, d: Date) {
  if (!a.on || a.h !== d.getHours() || a.m !== d.getMinutes()) return false;
  if (a.date) return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}` === a.date;
  return a.jours.length === 0 || a.jours.includes(d.getDay());
}

/** Surveille les alarmes (et les rappels « Répéter ») ; affiche l'écran qui sonne. */
export function GardienAlarmes({ actif }: { actif: boolean }) {
  const liste = alarmes.useValeur();
  const [sonne, setSonne] = useState<{ a: Alarme; depuis: number } | null>(null);
  const dejaFait = useRef<Record<string, string>>({});
  const repetitions = useRef<{ a: Alarme; a_: number }[]>([]);
  useEffect(() => {
    if (!actif) return;
    const verifier = () => {
      const d = new Date();
      const minute = `${d.getFullYear()}${d.getMonth()}${d.getDate()}${d.getHours()}${d.getMinutes()}`;
      for (const a of liste) {
        if (aSonner(a, d) && dejaFait.current[a.id] !== minute) {
          dejaFait.current[a.id] = minute;
          if (a.jours.length === 0 && !a.date) alarmes.ecrire((l) => l.map((x) => (x.id === a.id ? { ...x, on: false } : x)));
          setSonne({ a, depuis: Date.now() });
          return;
        }
      }
      const r = repetitions.current.find((x) => x.a_ <= Date.now());
      if (r) {
        repetitions.current = repetitions.current.filter((x) => x !== r);
        setSonne({ a: r.a, depuis: Date.now() });
      }
    };
    verifier();
    const id = window.setInterval(verifier, 5000);
    return () => window.clearInterval(id);
  }, [liste, actif]);
  useEffect(() => {
    if (!sonne) return;
    const stop = jouerSonnerie(sonne.a.son ?? choixSons.lire().alarme, true, "alarme");
    // Personne ne répond : au bout d'une minute, alarme manquée.
    const t = window.setTimeout(() => {
      setSonne(null);
      notifier({ titre: "Alarme manquée", texte: `${deux(sonne.a.h)}:${deux(sonne.a.m)}${sonne.a.libelle ? ` · ${sonne.a.libelle}` : ""}`, appli: "endurreisen", icone: "/aakanos/aosp/ic_lock_idle_alarm.svg", son: false });
    }, 60000);
    return () => {
      stop();
      window.clearTimeout(t);
    };
  }, [sonne]);
  if (!sonne) return null;
  const { a } = sonne;
  const arreter = () => {
    setSonne(null);
  };
  const repeter = () => {
    repetitions.current.push({ a, a_: Date.now() + 5 * 60000 });
    setSonne(null);
    notifier({ titre: "Alarme répétée", texte: `Elle sonnera à nouveau dans 5 minutes`, appli: "endurreisen", icone: "/aakanos/aosp/ic_lock_idle_alarm.svg", son: false });
  };
  return (
    <div className="os-alarme-sonne" role="alertdialog" aria-label="Alarme">
      <div className="oas-heure">
        {deux(a.h)}:{deux(a.m)}
      </div>
      <div className="oas-libelle">{a.libelle || a.texte || "Alarme"}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="oas-icone" src="/aakanos/aosp/ic_lock_idle_alarm.svg" alt="" width={64} height={64} />
      <div className="oas-boutons">
        <button type="button" className="oas-repeter" onClick={repeter}>
          <b>Répéter</b>
          <small>5 min</small>
        </button>
        <button type="button" className="oas-arreter" onClick={arreter}>
          <b>Arrêter</b>
        </button>
      </div>
    </div>
  );
}
