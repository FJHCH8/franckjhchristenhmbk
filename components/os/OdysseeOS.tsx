"use client";

/**
 * AakanOS : le site comme un téléphone Android 4.1 « Jelly Bean » (Holo).
 * Verrouillage à code → bureau (barre de recherche, horloge, icônes, dock) → tiroir d'applis,
 * rideau de notifications, applis récentes, et des applis natives : Qui suis-je, Album, Projets,
 * Citations, Endurreisen, Messages (Gaël), Nounou Browser, Dauphin, Réglages.
 * Icônes système : Android Open Source Project (Apache 2.0, voir /aakanos/NOTICE.txt).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as PE,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AppMail, GardienMail, IconeMail, etatMail } from "./Mail";
import { eurosCentimes, releve } from "./banque";
import { AppMeteo, IconeMeteo } from "./Meteo";
import { AppFichiers, IconeFichiers } from "./Fichiers";
import { AppMusique, IconeMusique, NotifMusique, StatutMusique, memoireMusique, useLecteur } from "./Musique";
import { useProtectionTelechargement } from "./protection";
import { AppDictaphone, IconeDictaphone } from "./Dictaphone";
import { AppOpakaalt, IconeOpakaalt } from "./Opakaalt";
import { AppNounoumappa, IconeNounoumappa } from "./Nounoumappa";
import { DauphinPixel, JeuDauphin } from "./Dauphin";
import { LogoAakanos } from "./LogoAakanos";
import { IconeAncienne } from "./IconesAnciennes";
import { LogoNounou, NavigateurNounou } from "./Nounou";
import { AppPulpus, LogoPulpus } from "./Pulpus";
import { AppSamTelecom } from "./SamTelecom";
import { useLocale, type LocaleName } from "@/components/Locale";
import { dtmf, prechargerSons, son, sonAppli, tonaliteRetour, type NomSon } from "./sonsAndroid";

/** Les sons « clavier » suivent l'interrupteur « Sons des touches » ; les autres sons d'action jouent toujours (sauf en silencieux). */
const TOUCHES_CLAVIER = new Set(["touche", "effacer", "entree", "espace", "tick"]);
import { AppCalculatrice, AppHorloge } from "./Outils";
import { AppAppareilPhoto, AppPeeporn, AppSharkobank } from "./HorsLigne";
import { estMuet, sonSynth } from "./sonsSynth";
import { Demarrage, Dlg, Interrupteur, SousReglage, SystemeCtx, THEMES, Toasts, Touches, toast, useEtatSysteme, useSysteme, type EcranReglage } from "./Systeme";
import { creerStore } from "./session";
import { Bandeau, GardienAlarmes, bloques, contactsPerso, convsPerso, ecrireSession, lireSession, notesPerso, notifier, notifsSup, ouvrirAppli, prendreCible, reinitialiserTelephone, type ContactPerso, type NotePerso } from "./Memoire";

/* ---------------- Données ---------------- */

type IdAppli = "telephone" | "pulpus" | "samtelecom" | "sharkobank" | "peeporn" | "contacts" | "qui" | "album" | "projets" | "citations" | "messages" | "nounou" | "appareil" | "calculatrice" | "endurreisen" | "reglages" | "dauphin" | "mail" | "meteo" | "fichiers" | "musique" | "dictaphone" | "opakaalt" | "nounoumappa";
type Appli = { id: IdAppli; nom: string; externe?: string };

const APPLIS: Appli[] = [
  { id: "telephone", nom: "Téléphone" },
  { id: "pulpus", nom: "Pulpüs market" },
  { id: "samtelecom", nom: "Sam-Telecom" },
  { id: "sharkobank", nom: "Sharkobank" },
  { id: "peeporn", nom: "Peeporn" },
  { id: "contacts", nom: "Contacts" },
  { id: "projets", nom: "Calendrier" },
  { id: "album", nom: "Album" },
  { id: "citations", nom: "Notes" },
  { id: "messages", nom: "Messages" },
  { id: "nounou", nom: "Nounou" },
  { id: "mail", nom: "E-mail" },
  { id: "meteo", nom: "Météo" },
  { id: "fichiers", nom: "Fichiers" },
  { id: "musique", nom: "Musique" },
  { id: "dictaphone", nom: "Dictaphone" },
  { id: "opakaalt", nom: "Opakaalt" },
  { id: "nounoumappa", nom: "Nounoumappa" },
  { id: "appareil", nom: "Appareil photo" },
  { id: "endurreisen", nom: "Alarme" },
  { id: "calculatrice", nom: "Calculatrice" },
  { id: "reglages", nom: "Réglages" },
];
const par = (id: IdAppli) => APPLIS.find((a) => a.id === id)!;
// L'accueil ne garde que la barre du bas : toutes les applis sont dans le tiroir.
const PAGE1: IdAppli[] = [];
const PAGE2: IdAppli[] = [];
const DOCK: IdAppli[] = ["telephone", "messages", "nounou", "appareil"];

/* Les pastilles de notification (point bleu Holo sur l'icône) : une appli qui a une notification non vue.
   Elles disparaissent à l'ouverture de l'appli ou quand la notification est effacée ; gardées dans la session. */
const pastillesVues = creerStore<string[]>("pastilles-vues", []);
const PastillesCtx = createContext<Set<string>>(new Set());
let clesCourantes: [string, string][] = [];
function marquerVu(appli: string, cles: [string, string][]) {
  const a = cles.filter(([x]) => x === appli).map(([, k]) => k);
  const v = pastillesVues.lire();
  if (a.every((k) => v.includes(k))) return;
  pastillesVues.ecrire((l) => [...l.filter((k) => !a.includes(k)), ...a].slice(-200));
}

const CODE = "6458";
const MAIL = "franckjhchristen@gmail.com";
const INSTA = "https://instagram.com/fjhchristenhmbk";
const OUVERTURE = new Date("2026-12-01T00:00:00+01:00").getTime();
const AUBE_DEBUT = new Date("2026-12-03T00:00:00+01:00").getTime();
const AUBE_FIN = new Date("2027-06-03T00:00:00+02:00").getTime();

const PRESENTATION = [
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K.",
  "Je suis né en 2007 en France.",
  "Je suis né différent : TTHPI, profondément et exceptionnellement surdoué, et TDAH.",
  "Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder.",
  "Depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment.",
  "Ce site sert à publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymathe au quotidien.",
];
const ALBUM = [
  { kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg", nom: "Vidéo" },
  { kind: "photo" as const, src: "/media/franck.jpg", poster: undefined, nom: "Photo" },
];

type MsgGael = { id: number; de: "moi" | "lui"; texte: string; h: string; lu?: boolean };
type Correspondant = "gael" | "celjo" | "pacifick" | "samtelecom";
const CORRESPONDANTS: { id: Correspondant; nom: string; photo: string; accueil?: string }[] = [
  { id: "gael", nom: "Gaël", photo: "/aakanos/gael.jpg", accueil: "Salut ! Tu veux joindre Franck ? Son contact est dans l’appli Contacts." },
  { id: "celjo", nom: "Celjo", photo: "/aakanos/celjo.jpg" },
  { id: "pacifick", nom: "Pacifick", photo: "/aakanos/pacifick.jpg" },
  { id: "samtelecom", nom: "Sam-Telecom", photo: "/aakanos/sam-telecom-tete.png" },
];
/** Les SMS automatiques de l'opérateur, reçus 5 secondes après le déverrouillage. On ne peut pas y répondre. */
const SMS_SAM_TELECOM = [
  "Sam-Telecom : Bonjour, nous vous remercions de votre fidélité. Votre facture de novembre est disponible dans votre Espace Client, sur notre site internet et dans l’application Sam-Telecom. Téléchargez l’application sur Pulpüs market pour suivre votre consommation et modifier votre forfait.",
  "Rappel : votre ligne bénéficie d’un forfait Connard. Il ne comprend ni la connexion à internet ni les appels : seul l’envoi de SMS est inclus. Les appels d’urgence ne sont pas disponibles sur cette ligne, car la fonction a été désactivée ou n’a pas encore été activée. Pour l’activer ou faire évoluer votre forfait, rendez-vous dans votre Espace Client. Sam-Telecom vous souhaite une excellente journée. Ceci est un message automatique, merci de ne pas y répondre.",
];
const REPONSE_CELJO = "Salut mon pote, écoute, je suis grave occupé à refaire ma moto, alors je te répondrai quand je pourrai.";
// Au 5e message envoyé à Celjo (compté dans la session, même si la conversation est effacée), il craque ; au 6e, il répond une dernière fois et bloque.
const REPONSE_CELJO_5 = "T’es un grand malade toi à harceler les gens comme ça connard, la prochaine fois que tu m’envoies un message je te jure je te bloque et je baise ta sœur!!!";
const REPONSE_CELJO_6 = "Ok, tu seras bientôt oncle! Et après peut être même que je viendrais mettre ma carotte dans ta bouche sale connard! En attendant ce joyeux événement je te bloque, je dois repérer ma bécane et préparer mon coup avec ta jolie sœurette.";
const celjoEnvoyes = creerStore<number>("celjo-envoyes", 0);
const celjoBloque = creerStore<boolean>("celjo-bloque", false);
const REPONSE_PACIFICK = "Tu me parles encore après m’avoir dit que j’avais faux ?! Va te faire voir !";
/** Après combien de réponses la personne bloque la conversation (0 = jamais). */
const BLOQUE_APRES: Record<Correspondant, number> = { gael: 3, celjo: 0, pacifick: 1, samtelecom: 0 };
const REPONSES_GAEL = [
  "Je suis désolé, mais moi, je ne peux pas te répondre. Il faut que tu envoies un mail à Franck.",
  "Je suis désolé. Mais je ne peux pas te répondre.",
  "Putain, tu commences à vraiment me faire chier, va te faire enculer.",
];
const heureCourte = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

type Etoile = { id: string; titre: string; texte: string; auteur: string; date: string; genre?: "citation" | "projet" };

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const deux = (n: number) => String(n).padStart(2, "0");
const sansAccent = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function useMaintenant() {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    const maj = () => setT(Date.now());
    maj();
    const id = setInterval(maj, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
function decompte(t: number | null, cible: number) {
  const r = Math.max(0, cible - (t ?? cible));
  const s = Math.floor(r / 1000);
  return { j: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60, fini: t != null && r <= 0 };
}

/* ---------------- Icônes ---------------- */

function IconeDauphin({ taille }: { taille: number }) {
  return (
    <span className="os-icone os-icone-dauphin" style={{ width: taille, height: taille }}>
      <DauphinPixel largeur={Math.round(taille * 0.84)} />
    </span>
  );
}

export function IconeAppli({ id, taille = 56 }: { id: IdAppli; taille?: number }) {
  const png = (f: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="os-icone" src={`/aakanos/${f}.png`} width={taille} height={taille} alt="" draggable={false} />
  );
  switch (id) {
    case "telephone":
      return png("phone");
    case "pulpus":
      return <LogoPulpus taille={taille} />;
    case "mail":
      return <IconeMail taille={taille} />;
    case "meteo":
      return <IconeMeteo taille={taille} />;
    case "fichiers":
      return <IconeFichiers taille={taille} />;
    case "musique":
      return <IconeMusique taille={taille} />;
    case "dictaphone":
      return <IconeDictaphone taille={taille} />;
    case "opakaalt":
      return <IconeOpakaalt taille={taille} />;
    case "nounoumappa":
      return <IconeNounoumappa taille={taille} />;
    case "sharkobank":
      return png("sharkobank");
    case "peeporn":
      return png("peeporn");
    case "samtelecom":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="os-icone" src="/aakanos/sam-telecom-tete.png" width={taille} height={taille} alt="" draggable={false} style={{ objectFit: "contain" }} />
      );
    case "contacts":
      return png("contacts");
    case "qui":
      return <IconeAncienne nom="qui" taille={taille} />;
    case "projets":
      return png("calendar");
    case "messages":
      return png("mms");
    case "appareil":
      return png("camera");
    case "reglages":
      return png("settings");
    case "nounou":
      return <LogoNounou taille={taille} />;
    case "album":
      return <IconeAncienne nom="album" taille={taille} />;
    case "citations":
      return <IconeAncienne nom="citations" taille={taille} />;
    case "endurreisen":
      return <IconeAncienne nom="endurreisen" taille={taille} />;
    case "calculatrice":
      return png("calculator");
    case "dauphin":
      return <IconeDauphin taille={taille} />;
  }
}

/** Petits pictogrammes de notification de la barre d'état (style Android 4.1). */
function PictoStatut({ type }: { type: "citation" | "message" | "alarme" }) {
  const d =
    type === "citation"
      ? "M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"
      : type === "message"
        ? "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        : "M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39 6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a9 9 0 0 0 0-18zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z";
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="#ddd" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---------------- Retour (bouton ◁) dans les applis ---------------- */

const RetourCtx = createContext<{ poser: (f: (() => boolean) | null) => void }>({ poser: () => {} });
/** Une appli qui a des sous-écrans déclare ici comment revenir en arrière. */
export function useRetour(actif: boolean, f: () => void) {
  const { poser } = useContext(RetourCtx);
  const ref = useRef(f);
  useEffect(() => {
    ref.current = f;
  });
  useEffect(() => {
    poser(
      actif
        ? () => {
            ref.current();
            return true;
          }
        : null,
    );
    return () => poser(null);
  }, [actif, poser]);
}

/* ---------------- Sous-écrans (activités) ---------------- */

type Act<E extends string> = { ecran: E; sens: "init" | "avant" | "arriere"; sortie: boolean; aller: (e: E) => void; retour: () => void };
/** Pile d'écrans d'une appli : ouverture = activity_open_enter, retour = activity_close_exit (300 ms). */
function useActivite<E extends string>(depart: E): Act<E> {
  const [pile, setPile] = useState<E[]>([depart]);
  const [sens, setSens] = useState<"init" | "avant" | "arriere">("init");
  const [sortie, setSortie] = useState(false);
  const aller = useCallback((e: E) => {
    setSens("avant");
    setPile((p) => [...p, e]);
  }, []);
  const retour = useCallback(() => {
    setSortie(true);
    window.setTimeout(() => {
      setSortie(false);
      setSens("arriere");
      setPile((p) => (p.length > 1 ? p.slice(0, -1) : p));
    }, 280);
  }, []);
  return { ecran: pile[pile.length - 1]!, sens, sortie, aller, retour };
}
function Activite<E extends string>({ act, children }: { act: Act<E>; children: ReactNode }) {
  return (
    <div key={act.ecran} className={`os-act${act.sortie ? " sort" : act.sens === "avant" ? " entre" : ""}`}>
      {children}
    </div>
  );
}

/* ---------------- Le système ---------------- */

type Fenetre = { appli: Appli; depuis: { x: number; y: number; w: number; h: number; W: number; H: number } | null };

export function OdysseeOS() {
  useProtectionTelechargement();
  const t = useMaintenant();
  const sys = useEtatSysteme();
  const [boot, setBoot] = useState<boolean | null>(null);
  useEffect(() => {
    let deja = false;
    try {
      deja = sessionStorage.getItem("aakanos-boot") === "1";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le démarrage ne se joue qu’une fois par session
    setBoot(!deja);
  }, []);
  const finBoot = useCallback(() => {
    try { sessionStorage.setItem("aakanos-boot", "1"); } catch {}
    setBoot(false);
  }, []);
  const [qs, setQs] = useState(false);
  const [verrou, setVerrou] = useState(true);
  const [tiroir, setTiroir] = useState(false);
  const [onglet, setOnglet] = useState<"applis" | "widgets">("applis");
  const [rideau, setRideau] = useState(false);
  const [recents, setRecents] = useState(false);
  const [recherche, setRecherche] = useState(false);
  const [requete, setRequete] = useState("");
  const [page, setPage] = useState(0);
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [fermeture, setFermeture] = useState(false);
  const [historique, setHistorique] = useState<Appli[]>([]);
  const [effacees, setEffacees] = useState<string[]>([]);
  const [etoiles, setEtoiles] = useState<Etoile[] | null>(null);
  // Le téléphone repart de zéro à chaque chargement : les conversations aussi.
  const [convs, setConvs] = useState<Record<Correspondant, MsgGael[]>>({ gael: [], celjo: [], pacifick: [], samtelecom: [] });
  const [ecrit, setEcrit] = useState<Correspondant | null>(null);
  const [nonLu, setNonLu] = useState<{ qui: Correspondant; n: number } | null>(null);
  const minuteurs = useRef<number[]>([]);
  const convOuverte = useRef<Correspondant | null>(null);
  // La session garde les conversations, les notifications lues ou effacées (jusqu'à « Réinitialiser le téléphone »).
  const memoireChargee = useRef(false);
  useEffect(() => {
    const c = lireSession<Record<Correspondant, MsgGael[]>>("convs");
    const n = lireSession<{ qui: Correspondant; n: number } | null>("non-lu");
    const e = lireSession<string[]>("effacees");
    if (c) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique de la session au montage
      setConvs((x) => ({ ...x, ...c }));
    }
    if (n) setNonLu(n);
    if (e) setEffacees(e);
    memoireChargee.current = true;
  }, []);
  useEffect(() => {
    if (memoireChargee.current) ecrireSession("convs", convs);
  }, [convs]);
  useEffect(() => {
    if (memoireChargee.current) ecrireSession("non-lu", nonLu);
  }, [nonLu]);
  useEffect(() => {
    if (memoireChargee.current) ecrireSession("effacees", effacees);
  }, [effacees]);
  useEffect(() => () => minuteurs.current.forEach((m) => clearTimeout(m)), []);
  const envoyer = useCallback((qui: Correspondant, texte: string) => {
    const id = Date.now();
    let rang = 0;
    setConvs((c) => {
      rang = c[qui].filter((x) => x.de === "moi").length;
      return { ...c, [qui]: [...c[qui], { id, de: "moi", texte, h: heureCourte() }] };
    });
    sonSynth("envoye");
    const plus = (f: () => void, ms: number) => minuteurs.current.push(window.setTimeout(f, ms));
    const nCeljo = qui === "celjo" ? celjoEnvoyes.lire() + 1 : 0;
    if (qui === "celjo") celjoEnvoyes.ecrire(nCeljo);
    const reponse =
      qui === "celjo" ? (nCeljo === 1 ? REPONSE_CELJO : nCeljo === 5 ? REPONSE_CELJO_5 : nCeljo === 6 ? REPONSE_CELJO_6 : undefined) : qui === "gael" ? REPONSES_GAEL[rang] : rang === 0 ? REPONSE_PACIFICK : undefined;
    // Celjo ne lit que le 1er, le 5e et le 6e message ; après sa réponse au 6e, il vous bloque.
    if (qui === "celjo" && !reponse) return;
    const vu = (qui === "gael" ? 5000 : 3000) + Math.random() * (qui === "gael" ? 5000 : 3000);
    plus(() => setConvs((c) => ({ ...c, [qui]: c[qui].map((x) => (x.id === id ? { ...x, lu: true } : x)) })), vu);
    if (!reponse) return;
    plus(() => {
      setEcrit(qui);
      plus(() => {
        setEcrit(null);
        if (reponse === REPONSE_CELJO_6) celjoBloque.ecrire(true);
        // Un contact bloqué n'arrive plus jusqu'au téléphone.
        if (bloques.lire().includes(qui)) return;
        setConvs((c) => ({ ...c, [qui]: [...c[qui], { id: Date.now(), de: "lui", texte: reponse, h: heureCourte() }] }));
        if (convOuverte.current !== qui) setNonLu((n) => ({ qui, n: n && n.qui === qui ? n.n + 1 : 1 }));
        son("notif");
        if (convOuverte.current !== qui) {
          const cor = CORRESPONDANTS.find((x) => x.id === qui)!;
          notifier({ titre: cor.nom, texte: reponse, appli: "messages", icone: cor.photo, son: false, rideau: false });
        }
      }, 2200 + reponse.length * 35);
    }, vu + 900);
  }, []);
  const smsRecu = useRef(false);
  const [ticker, setTicker] = useState<string | null>(null);
  const recevoirSamTelecom = useCallback(() => {
    if (smsRecu.current) return;
    smsRecu.current = true;
    // Déjà reçu plus tôt dans la session : on ne le renvoie pas.
    if (lireSession<Record<string, unknown[]>>("convs")?.samtelecom?.length) return;
    minuteurs.current.push(
      window.setTimeout(() => {
        const h = heureCourte();
        setConvs((c) => ({ ...c, samtelecom: SMS_SAM_TELECOM.map((texte, i) => ({ id: Date.now() + i, de: "lui" as const, texte, h })) }));
        if (convOuverte.current !== "samtelecom") setNonLu({ qui: "samtelecom", n: SMS_SAM_TELECOM.length });
        setTicker(SMS_SAM_TELECOM[0]!);
        son("notif");
        minuteurs.current.push(window.setTimeout(() => setTicker(null), 4200));
      }, 5000),
    );
  }, []);
  const effacerConv = useCallback((qui: Correspondant) => {
    setConvs((c) => ({ ...c, [qui]: [] }));
    setNonLu((n) => (n && n.qui === qui ? null : n));
  }, []);
  const vuConv = useCallback((qui: Correspondant | null) => {
    convOuverte.current = qui;
    if (qui) setNonLu((n) => (n && n.qui === qui ? null : n));
  }, []);
  const retourAppli = useRef<(() => boolean) | null>(null);
  const poser = useCallback((f: (() => boolean) | null) => {
    retourAppli.current = f;
  }, []);

  useEffect(() => {
    let vivant = true;
    fetch("/api/etoiles")
      .then((r) => r.json())
      .then((d: { etoiles?: Etoile[] }) => {
        if (vivant) setEtoiles(d.etoiles ?? []);
      })
      .catch(() => {
        if (vivant) setEtoiles([]);
      });
    return () => {
      vivant = false;
    };
  }, []);

  const d = t ? new Date(t) : null;
  const heure = d ? `${deux(d.getHours())}:${deux(d.getMinutes())}` : "--:--";
  const date = d ? `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}` : "";
  const endu = decompte(t, OUVERTURE);
  const citations = (etoiles ?? []).filter((e) => e.genre !== "projet" && e.texte?.trim());
  const derniere = citations[0];

  const ouvrir = useCallback((a: Appli, el?: Element | null) => {
    if (a.externe) {
      window.open(a.externe, "_blank", "noopener");
      return;
    }
    const r = el?.getBoundingClientRect();
    const o = document.querySelector(".os")?.getBoundingClientRect();
    setFermeture(false);
    setFenetre({ appli: a, depuis: r && o ? { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, W: o.width, H: o.height - 48 } : null });
    setHistorique((h) => [a, ...h.filter((x) => x.id !== a.id)].slice(0, 8));
    setTiroir(false);
    setRecents(false);
    setRecherche(false);
    setRideau(false);
    sonAppli(a.id);
    marquerVu(a.id, clesCourantes);
  }, []);

  // Une appli qui en ouvre une autre (Messages → Contacts, Contacts → Messages, notifications…)
  useEffect(() => {
    const f = (e: Event) => {
      const a = APPLIS.find((x) => x.id === (e as CustomEvent<string>).detail);
      if (a) ouvrir(a);
    };
    window.addEventListener("aakanos-ouvrir", f);
    return () => window.removeEventListener("aakanos-ouvrir", f);
  }, [ouvrir]);
  // Un contact qu'on appelle ouvre l'appli Téléphone.
  useEffect(() => {
    const f = () => ouvrir(par("telephone"));
    window.addEventListener("aakanos-appel", f);
    return () => window.removeEventListener("aakanos-appel", f);
  }, [ouvrir]);
  const fermerFenetre = useCallback(() => {
    // la fermeture d'une appli : le petit son « Undock » d'Android (AOSP), discret
    son("undock", 0.45);
    setFermeture(true);
    setTimeout(() => {
      setFenetre(null);
      setFermeture(false);
    }, 375);
  }, []);
  // Une appli peut se fermer toute seule (Peeporn qui te jette, l'appareil photo cassé…)
  useEffect(() => {
    const f = () => fermerFenetre();
    window.addEventListener("aakanos-fermer-appli", f);
    return () => window.removeEventListener("aakanos-fermer-appli", f);
  }, [fermerFenetre]);

  const retour = () => {
    if (rideau) return setRideau(false);
    if (recents) return setRecents(false);
    if (recherche) return setRecherche(false);
    if (fenetre) {
      if (retourAppli.current?.()) return;
      return fermerFenetre();
    }
    if (tiroir) return setTiroir(false);
    if (page) return setPage(0);
  };
  const accueil = () => {
    setRideau(false);
    setRecents(false);
    setRecherche(false);
    setTiroir(false);
    setPage(0);
    if (fenetre) fermerFenetre();
  };
  const quitter = () => {
    try {
      localStorage.setItem("fjch-apparence", "classique");
    } catch {}
    son("verrou");
    window.setTimeout(() => window.location.assign("/"), 250);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") retour();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // Glisser le bureau
  const glisse = useRef<{ x: number; y: number } | null>(null);
  const [decalage, setDecalage] = useState(0);
  const finGlisse = (e: PE) => {
    if (!glisse.current) return;
    const dx = e.clientX - glisse.current.x;
    const dy = e.clientY - glisse.current.y;
    glisse.current = null;
    setDecalage(0);
    if (dx < -60) setPage(1);
    else if (dx > 60) setPage(0);
    else if (dy < -80) setTiroir(true);
  };

  // Tirer le rideau depuis la barre d'état
  const tirage = useRef<number | null>(null);
  const [tire, setTire] = useState(0);

  const sup = notifsSup.useValeur();
  type Notif = { id: string; icone: ReactNode; titre: string; texte: string; auteur?: string; h: string; appli: Appli };
  const toutes: (Notif | null)[] = [
    derniere
      ? { id: "citation", icone: <IconeAppli id="citations" taille={40} />, titre: "Nouvelle note", texte: `« ${derniere.texte} »`, auteur: derniere.auteur, h: "11:20", appli: par("citations") }
      : null,
    {
      id: "endurreisen",
      icone: <IconeAppli id="endurreisen" taille={40} />,
      titre: "Endurreisen",
      texte: endu.fini ? "C’est ouvert !" : `Ouverture dans ${endu.j} j ${endu.h} h`,
      h: "10:00",
      appli: par("endurreisen"),
    },
    {
      id: "gael",
      icone:
        nonLu?.qui === "samtelecom" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img draggable={false} src="/aakanos/sam-telecom-tete.png" alt="" width={40} height={40} style={{ objectFit: "contain" }} />
        ) : (
          <IconeAppli id="messages" taille={40} />
        ),
      titre: nonLu ? `${CORRESPONDANTS.find((c) => c.id === nonLu.qui)!.nom}${nonLu.n > 1 ? ` (${nonLu.n} messages)` : ""}` : "Gaël",
      texte: nonLu ? convs[nonLu.qui].filter((m) => m.de === "lui").at(-1)?.texte ?? "" : "Le contact de Franck est dans Contacts",
      h: nonLu ? convs[nonLu.qui].filter((m) => m.de === "lui").at(-1)?.h ?? "09:41" : "09:41",
      appli: par("messages"),
    },
  ];
  // Les notifications reçues pendant la session (alarmes, minuteur, contacts…)
  for (const n of sup) {
    const a = APPLIS.find((x) => x.id === n.appli) ?? par("messages");
    toutes.push({
      id: n.id,
      icone: n.icone ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img draggable={false} src={n.icone} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
      ) : (
        <IconeAppli id={a.id} taille={40} />
      ),
      titre: n.titre,
      texte: n.texte,
      h: n.h,
      appli: a,
    });
  }
  const notifs = toutes.filter((n): n is Notif => !!n && (!effacees.includes(n.id) || (n.id === "gael" && !!nonLu)));
  const lecteurMusique = useLecteur();
  const reglagesMusique = memoireMusique.useValeur();
  const vuesPastilles = pastillesVues.useValeur();
  const clesPastilles: [string, string][] = notifs.map((n) => [n.appli.id, n.id === "gael" && nonLu ? `gael:${nonLu.qui}:${nonLu.n}:${convs[nonLu.qui].length}` : n.id]);
  if (reglagesMusique.file && lecteurMusique.charge === "pret") clesPastilles.push(["musique", "musique"]);
  const pastilles = new Set(clesPastilles.filter(([, k]) => !vuesPastilles.includes(k)).map(([a]) => a));
  const appliOuverte = fenetre?.appli.id;
  useEffect(() => {
    clesCourantes = clesPastilles;
    // l'appli ouverte n'a pas de pastille : ce qui y arrive est vu
    if (appliOuverte) marquerVu(appliOuverte, clesPastilles);
  });
  const notifsTriees = nonLu ? [...notifs.filter((n) => n.id === "gael"), ...notifs.filter((n) => n.id !== "gael")] : notifs;

  const correspond = (e: Etoile) => sansAccent(`${e.titre} ${e.texte}`).includes(sansAccent(requete));
  const resultats = APPLIS.filter((a) => sansAccent(a.nom).includes(sansAccent(requete)));
  const etoilesTrouvees = requete ? (etoiles ?? []).filter(correspond).slice(0, 8) : [];

  return (
    <SystemeCtx.Provider value={sys}>
    <PastillesCtx.Provider value={pastilles}>
    <RetourCtx.Provider value={{ poser }}>
      <div
        className={`os theme-${sys.theme ?? "holo"}${sys.limites ? " os-limites" : ""}`}
        onPointerDownCapture={(e) => {
          void prechargerSons();
          const t = (e.target as HTMLElement).closest("button, .app-ligne, .ml-ligne, .mu-ligne, .fi-ligne, .os-notif, .reg2-reseau");
          if (!(t instanceof HTMLElement) || t.closest("[data-son='aucun']") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const r = t.getBoundingClientRect();
          const o = document.createElement("i");
          o.className = "os-ondulation";
          o.style.left = `${e.clientX - r.left}px`;
          o.style.top = `${e.clientY - r.top}px`;
          t.classList.add("os-ondulable");
          t.appendChild(o);
          window.setTimeout(() => o.remove(), 480);
        }}
        onClickCapture={(e) => {
          // le « tick » d'Android à chaque toucher (le pavé du téléphone joue ses propres tonalités)
          const el = (e.target as Element).closest("button, a, [role=button]");
          if (!el || el.closest(".tel-pave") || (el as HTMLButtonElement).disabled) return;
          // un bouton peut demander son propre son AOSP (data-son) : effacer, valider, verrouiller…
          const propre = el.closest("[data-son]")?.getAttribute("data-son");
          if (propre === "aucun") return;
          if (propre && !TOUCHES_CLAVIER.has(propre)) return son(propre as NomSon);
          if (!sys.sonsTouches) return;
          if (propre) son(propre as NomSon);
          else son("tick", 0.8);
        }}
        onKeyDownCapture={(e) => {
          // le clavier d'Android : chaque touche tapée dans un champ a son son (KeypressStandard, Delete, Return, Spacebar)
          const t = e.target as HTMLElement;
          if (!sys.sonsTouches || e.repeat || !t.matches?.("input, textarea") || t.matches("[type=range], [type=checkbox]")) return;
          if (e.key === "Backspace" || e.key === "Delete") son("effacer");
          else if (e.key === "Enter") son("entree");
          else if (e.key === " ") son("espace");
          else if (e.key.length === 1) son("touche");
        }}
      >
        <div className={`os-fond fond-${sys.fond}`}>
          <i />
          <i />
          <i />
          <i />
        </div>

        {/* Barre d'état */}
        <div
          className="os-statut"
          onPointerDown={(e) => {
            if (verrou) return;
            tirage.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (tirage.current !== null) setTire(Math.max(0, e.clientY - tirage.current));
          }}
          onPointerUp={() => {
            if (tirage.current !== null && (tire > 50 || tire < 4)) setRideau(true);
            tirage.current = null;
            setTire(0);
          }}
        >
          {ticker ? (
            <span className="os-ticker" aria-live="polite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img draggable={false} src="/aakanos/sam-telecom-tete.png" alt="" width={18} height={18} />
              <span>
                <b>{ticker}</b>
              </span>
            </span>
          ) : null}
          <span className="os-statut-g">
            <StatutMusique />
            {!verrou
              ? notifs.map((n) => (
                  <i key={n.id} className="os-mini">
                    <PictoStatut type={n.id === "citation" ? "citation" : n.id === "gael" || n.appli.id === "messages" ? "message" : "alarme"} />
                  </i>
                ))
              : null}
          </span>
          <span className="os-statut-d">
            {sys.muet ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#ddd" aria-hidden="true"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
            ) : null}
            {sys.bt && !sys.avion ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#ddd" aria-hidden="true"><path d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" /></svg>
            ) : null}
            {sys.avion ? (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#ddd" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
            ) : sys.wifi ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="#33b5e5" aria-hidden="true">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            ) : null}
            <b className={`os-barres${sys.avion ? " eteint" : ""}`}>
              <i />
              <i />
              <i />
              <i />
            </b>
            <b className="os-batt" />
            {heure}
          </span>
        </div>

        {verrou ? (
          <Verrouillage heure={heure} date={date} notifs={notifs} onOuvrir={() => (setVerrou(false), recevoirSamTelecom())} onQuitter={quitter} />
        ) : (
          <>
            <div className={`os-bureau${tiroir ? " os-cache" : ""}`}>
              <button className="os-cherche" onClick={() => setRecherche(true)}>
                <b>AakanOS</b>
                <span />
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#ccc" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                </svg>
              </button>

              <div
                className="os-pages"
                onPointerDown={(e) => {
                  glisse.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  if (!glisse.current) return;
                  const dx = e.clientX - glisse.current.x;
                  if (Math.abs(dx) > 8) setDecalage(dx);
                }}
                onPointerUp={finGlisse}
                onPointerCancel={() => {
                  glisse.current = null;
                  setDecalage(0);
                }}
                style={{ "--page": page, "--dx": `${decalage}px` } as CSSProperties}
              >
                <div className="os-page">
                  <button type="button" className="os-horloge w-horloge" onClick={(e) => ouvrir(par("endurreisen"), e.currentTarget)}>
                    <div className="os-horloge-h">{heure}</div>
                    <div className="os-horloge-d">{date.split(" ").slice(0, 3).join(" ")}</div>
                    <span className="w-meteo" onClick={(e) => (e.stopPropagation(), ouvrir(par("meteo"), e.currentTarget))}>
                      <IconeAppli id="meteo" taille={18} /> --° · Ciel inconnu
                    </span>
                  </button>
                  <WidgetsAccueil ouvrir={ouvrir} />
                  <Grille ids={PAGE1} ouvrir={ouvrir} />
                </div>
                <div className="os-page">
                  <button className="os-widget" onClick={(e) => ouvrir(par("endurreisen"), e.currentTarget)}>
                    <IconeAppli id="endurreisen" taille={42} />
                    <div>
                      <b>{endu.j}</b>
                      <span>jours avant Endurreisen</span>
                    </div>
                  </button>
                  {derniere ? (
                    <button className="os-widget os-widget-citation" onClick={(e) => ouvrir(par("citations"), e.currentTarget)}>
                      <IconeAppli id="citations" taille={42} />
                      <div>
                        <span>CITATION DU JOUR</span>
                        <q>{derniere.texte}</q>
                      </div>
                    </button>
                  ) : null}
                  <Grille ids={PAGE2} ouvrir={ouvrir} />
                </div>
              </div>

              <div className="os-points">
                <i className={page === 0 ? "on" : ""} onClick={() => setPage(0)} />
                <i className={page === 1 ? "on" : ""} onClick={() => setPage(1)} />
              </div>

              <div className="os-dock">
                {DOCK.slice(0, 2).map((id) => (
                  <Icone key={id} a={par(id)} ouvrir={ouvrir} sansNom />
                ))}
                <button className="os-tous" aria-label="Toutes les applis" onClick={() => setTiroir(true)}>
                  <span>
                    {Array.from({ length: 6 }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                </button>
                {DOCK.slice(2).map((id) => (
                  <Icone key={id} a={par(id)} ouvrir={ouvrir} sansNom />
                ))}
              </div>
            </div>

            {/* Tiroir d'applis */}
            <div className={`os-tiroir${tiroir ? " ouvert" : ""}`} aria-hidden={!tiroir}>
              <div className="os-onglets">
                <button className={onglet === "applis" ? "on" : ""} onClick={() => setOnglet("applis")}>
                  APPLIS
                </button>
                <button className={onglet === "widgets" ? "on" : ""} onClick={() => setOnglet("widgets")}>
                  WIDGETS
                </button>
                <button className="os-onglets-loupe" aria-label="Rechercher" onClick={() => setRecherche(true)}>
                  <Loupe couleur="#ccc" />
                </button>
              </div>
              {onglet === "applis" ? (
                <Grille ids={[...APPLIS].sort((a, b) => a.nom.localeCompare(b.nom, "fr")).map((a) => a.id)} ouvrir={ouvrir} cle={tiroir ? "o" : "f"} />
              ) : (
                <div className="os-widgets">
                  <div className="os-widget-apercu">
                    <div className="os-horloge-h" style={{ fontSize: 44 }}>
                      {heure}
                    </div>
                    <span>Horloge numérique · 4 × 2</span>
                  </div>
                  <div className="os-widget-apercu">
                    <div className="os-widget" style={{ margin: 0, width: "100%" }}>
                      <IconeAppli id="endurreisen" taille={40} />
                      <div>
                        <b>{endu.j}</b>
                        <span>jours avant Endurreisen</span>
                      </div>
                    </div>
                    <span>Compte à rebours · 4 × 1</span>
                  </div>
                </div>
              )}
            </div>

            {fenetre ? (
              <FenetreAppli f={fenetre} fermeture={fermeture} onRetour={retour}>
                <ContenuAppli
                  id={fenetre.appli.id}
                  t={t}
                  etoiles={etoiles}
                  ouvrir={ouvrir}
                  quitter={quitter}
                  gael={{ convs, ecrit, envoyer, vu: vuConv, effacer: effacerConv }}
                />
              </FenetreAppli>
            ) : null}

            {recherche ? (
              <div className="os-recherche">
                <div className="os-recherche-barre">
                  <Loupe couleur="#33b5e5" />
                  <input autoFocus placeholder="Rechercher dans AakanOS" value={requete} onChange={(e) => setRequete(e.target.value)} />
                  <button data-son="effacer" aria-label="Effacer" onClick={() => (requete ? setRequete("") : setRecherche(false))}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#aaa"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                  </button>
                </div>
                <div className="os-titre-holo">APPLIS</div>
                {resultats.map((a) => (
                  <button key={a.id} className="os-ligne" onClick={(e) => ouvrir(a, e.currentTarget)}>
                    <IconeAppli id={a.id} taille={40} />
                    <span>{a.nom}</span>
                  </button>
                ))}
                {etoilesTrouvees.length ? (
                  <>
                    <div className="os-titre-holo">CITATIONS ET PROJETS</div>
                    {etoilesTrouvees.map((e) => (
                      <button key={e.id} className="os-ligne" onClick={(ev) => ouvrir(par(e.genre === "projet" ? "projets" : "citations"), ev.currentTarget)}>
                        <IconeAppli id={e.genre === "projet" ? "projets" : "citations"} taille={40} />
                        <span className="os-ligne-txt">
                          {e.titre || "Citation"}
                          <small>{e.texte}</small>
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                {resultats.length === 0 && etoilesTrouvees.length === 0 ? <p className="os-vide">Aucun résultat</p> : null}
              </div>
            ) : null}

            {recents ? (
              <div className="os-recents" onClick={() => setRecents(false)}>
                {historique.length === 0 && <p className="os-vide">Aucune appli récente</p>}
                {historique.map((a, i) => (
                  <Recent key={a.id} a={a} i={i} ouvrir={ouvrir} retirer={() => setHistorique((h) => h.filter((x) => x.id !== a.id))} />
                ))}
              </div>
            ) : null}

            {/* Rideau de notifications */}
            <div
              className={`os-rideau${rideau ? " ouvert" : ""}`}
              style={!rideau && tire ? ({ transform: `translateY(calc(-100% + ${tire}px))`, transition: "none" } as CSSProperties) : undefined}
            >
              <div className="os-rideau-tete">
                <div className="os-rideau-h">{heure}</div>
                <div className="os-rideau-d">
                  <span className="os-operateur-r">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img draggable={false} src="/aakanos/sam-telecom-tete.png" alt="" width={14} height={14} />
                    SAM-TELECOM
                  </span>
                  <br />
                  {date.split(" ")[0]?.toUpperCase()}
                  <br />
                  {date.split(" ").slice(1).join(" ").toUpperCase()} {d?.getFullYear()}
                </div>
                <button className={`os-rideau-qs${qs ? " on" : ""}`} aria-label="Réglages rapides" onClick={() => setQs((q) => !q)}>
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="#ccc" aria-hidden="true"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" /></svg>
                </button>
                <button className="os-rideau-reglages" aria-label="Réglages" onClick={(e) => ouvrir(par("reglages"), e.currentTarget)}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#ccc">
                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                  </svg>
                </button>
              </div>
              {qs ? (
                <ReglagesRapides
                  ouvrirReglages={(e) => ouvrir(par("reglages"), e)}
                  verrouiller={() => {
                    son("verrou");
                    setRideau(false);
                    setQs(false);
                    if (fenetre) fermerFenetre();
                    setTiroir(false);
                    setVerrou(true);
                  }}
                />
              ) : (
              <div className="os-rideau-liste">
                <NotifMusique ouvrir={(el) => ouvrir(par("musique"), el)} />
                {notifsTriees.map((n, i) => (
                  <div key={n.id} className="os-notif-bloc" style={{ animationDelay: `${i * 40}ms` }}>
                    <button className={`os-notif${i === 0 ? " grande" : ""}`} onClick={(e) => ouvrir(n.appli, e.currentTarget)}>
                      <span className="os-notif-ic">{n.icone}</span>
                      <span className="os-notif-t">
                        <b>{n.titre}</b>
                        <span>{n.texte}</span>
                        {i === 0 && n.auteur ? <em>{n.auteur}</em> : null}
                      </span>
                      <span className="os-notif-h">{n.h}</span>
                    </button>
                    {i === 0 ? (
                      <div className="os-notif-actions">
                        <button onClick={(e) => ouvrir(n.appli, e.currentTarget)}>OUVRIR</button>
                        <button onClick={() => (setEffacees((x) => [...x, n.id]), notifsSup.ecrire((l) => l.filter((y) => y.id !== n.id)))}>IGNORER</button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {notifs.length > 0 ? (
                  <button className="os-effacer" onClick={() => (setEffacees(["citation", "endurreisen", "gael"]), notifsSup.ecrire([]))}>
                    EFFACER
                  </button>
                ) : (
                  <p className="os-vide">Aucune notification</p>
                )}
                <button className="os-quitter" onClick={quitter}>
                  <span>Revenir au site classique</span>
                  <small>quitter AakanOS</small>
                </button>
              </div>
              )}
              <button className="os-rideau-poignee" aria-label="Fermer" onClick={() => setRideau(false)} />
            </div>
          </>
        )}

        <nav className="os-nav">
          <button aria-label="Retour" onClick={retour}>
            <svg viewBox="0 0 32 24" width="32" height="24">
              <path d="M26 7H10V3L3 9l7 6v-4h16c2 0 3 1 3 3v1c0 2-1 3-3 3H14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button aria-label="Accueil" onClick={accueil}>
            <svg viewBox="0 0 32 24" width="32" height="24">
              <path d="M5 12L16 3l11 9M8 10v11h16V10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button aria-label="Applis récentes" onClick={() => !verrou && setRecents((r) => !r)}>
            <svg viewBox="0 0 32 24" width="32" height="24">
              <rect x="6" y="7" width="14" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <path d="M11 3h16v13" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
          </button>
        </nav>
        {!verrou ? <Bandeau ouvrir={(id) => { const a = APPLIS.find((x) => x.id === id); if (a) ouvrir(a); }} /> : null}
        <GardienAlarmes actif={boot === false} />
        <GardienMail actif={!verrou && boot === false} />
        <Toasts />
        {sys.touches ? <Touches /> : null}
        <i className="os-lum" style={{ opacity: (1 - sys.lum) * 0.75 }} aria-hidden="true" />
        {boot ? <Demarrage fini={finBoot} /> : null}
        {boot === null ? <div className="os-boot" /> : null}
      </div>
    </RetourCtx.Provider>
    </PastillesCtx.Provider>
    </SystemeCtx.Provider>
  );
}

function Loupe({ couleur }: { couleur: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={couleur} aria-hidden="true">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

function Icone({ a, ouvrir, sansNom }: { a: Appli; ouvrir: (a: Appli, el?: Element | null) => void; sansNom?: boolean }) {
  const pastille = useContext(PastillesCtx).has(a.id);
  return (
    <button className={`os-app${pastille ? " a-pastille" : ""}`} onClick={(e) => ouvrir(a, e.currentTarget.querySelector(".os-icone"))}>
      <IconeAppli id={a.id} taille={sansNom ? 52 : 56} />
      {pastille ? <i className="os-pastille" role="status" aria-label="Nouvelle notification" /> : null}
      {!sansNom && <span>{a.nom}</span>}
    </button>
  );
}

function Grille({ ids, ouvrir, cle }: { ids: IdAppli[]; ouvrir: (a: Appli, el?: Element | null) => void; cle?: string }) {
  return (
    <div className="os-grille" key={cle}>
      {ids.map((id, i) => (
        <div key={id} className="os-grille-case">
          <Icone a={par(id)} ouvrir={ouvrir} />
        </div>
      ))}
    </div>
  );
}

/** Une carte d'appli récente : toucher pour rouvrir, glisser de côté pour la retirer (comme Jelly Bean). */
function Recent({ a, i, ouvrir, retirer }: { a: Appli; i: number; ouvrir: (a: Appli, el?: Element | null) => void; retirer: () => void }) {
  const [dx, setDx] = useState(0);
  const depart = useRef<number | null>(null);
  return (
    <div
      className="os-recent"
      style={{ animationDelay: `${i * 45}ms`, transform: dx ? `translateX(${dx}px)` : undefined, opacity: dx ? 1 - Math.abs(dx) / 260 : undefined }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        depart.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (depart.current !== null) setDx(e.clientX - depart.current);
      }}
      onPointerUp={(e) => {
        const fin = depart.current !== null ? e.clientX - depart.current : 0;
        depart.current = null;
        if (Math.abs(fin) > 110) retirer();
        else if (Math.abs(fin) < 6) ouvrir(a, e.currentTarget);
        setDx(0);
      }}
    >
      <div className="os-recent-vignette">
        <i />
        <span>{a.nom}</span>
      </div>
      <IconeAppli id={a.id} taille={40} />
      <b>{a.nom}</b>
    </div>
  );
}

/* ---------------- Verrouillage à code ---------------- */

const TOUCHES: [string, string][] = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["⌫", ""],
  ["0", "+"],
  ["OK", ""],
];

/** L'anneau de déverrouillage de Jelly Bean : on tire le cadenas hors du cercle. */
function AnneauVerrou({ onFini }: { onFini: () => void }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  const [fini, setFini] = useState(false);
  const centre = useRef<{ x: number; y: number } | null>(null);
  const R = 118;
  const d = p ? Math.hypot(p.x, p.y) : 0;
  const lim = p && d > R ? { x: (p.x / d) * R, y: (p.y / d) * R } : p;
  return (
    <div className={`anneau${p ? " actif" : ""}${fini ? " fini" : ""}`}>
      <div className="anneau-zone">
        <i className="anneau-cercle" />
        <i className="anneau-cible" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" /></svg>
        </i>
        <button
          className="anneau-poignee"
          aria-label="Déverrouiller"
          style={lim ? { transform: `translate(${lim.x}px, ${lim.y}px)` } : undefined}
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            centre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            e.currentTarget.setPointerCapture(e.pointerId);
            setP({ x: 0, y: 0 });
          }}
          onPointerMove={(e) => {
            if (!centre.current) return;
            setP({ x: e.clientX - centre.current.x, y: e.clientY - centre.current.y });
          }}
          onPointerUp={() => {
            centre.current = null;
            if (d > R * 0.85) {
              setFini(true);
              sonSynth("bulle");
              window.setTimeout(onFini, 260);
            } else setP(null);
          }}
          onClick={(e) => {
            // Au clavier (Entrée), ou un simple toucher : on indique le geste.
            if (e.detail === 0) onFini();
          }}
        >
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
        </button>
      </div>
      <p className="anneau-aide">{p ? "Relâchez hors du cercle" : "Faites glisser le cadenas pour déverrouiller"}</p>
    </div>
  );
}

/** Les widgets de l'accueil : la conso Sam-Telecom, le solde Sharkobank (en direct) et les contacts favoris. */
function WidgetsAccueil({ ouvrir }: { ouvrir: (a: Appli, el?: Element | null) => void }) {
  const mail = etatMail.useValeur();
  const { solde, operations } = releve(mail.arrives);
  const dernier = operations.find((o) => o.statut !== "rejete");
  return (
    <div className="w-pile">
      <button type="button" className="w-carte" onClick={(e) => ouvrir(par("samtelecom"), e.currentTarget)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/sam-telecom-tete.png" alt="" draggable={false} />
        <span>
          <small>SAM-TELECOM · FORFAIT CONNARD</small>
          <i className="w-jauge">
            <i style={{ width: "72%" }} />
          </i>
          <em>142 SMS · Internet 0 Mo · Appels 0 min</em>
        </span>
      </button>
      <button type="button" className="w-carte rouge" onClick={(e) => ouvrir(par("sharkobank"), e.currentTarget)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/sharkobank.png" alt="" draggable={false} />
        <span>
          <small>SHARKOBANK · COMPTE COURANT</small>
          <b key={solde}>{eurosCentimes(solde)}</b>
          <em>{dernier ? `⚠ À découvert · dernier prélèvement ${eurosCentimes(dernier.montant)}` : "⚠ À découvert"}</em>
        </span>
      </button>
      <div className="w-favoris">
        {CORRESPONDANTS.filter((c) => c.id !== "samtelecom").map((c) => (
          <button key={c.id} type="button" onClick={(e) => ouvrir(par("messages"), e.currentTarget)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.photo} alt="" draggable={false} />
            <span>{c.nom}</span>
          </button>
        ))}
        <button type="button" className="w-plus" onClick={(e) => ouvrir(par("contacts"), e.currentTarget)} aria-label="Contacts">
          +
        </button>
      </div>
    </div>
  );
}

function Verrouillage({
  heure,
  date,
  onOuvrir,
  onQuitter,
  notifs = [],
}: {
  heure: string;
  date: string;
  onOuvrir: () => void;
  onQuitter: () => void;
  notifs?: { id: string; icone: ReactNode; titre: string; texte: string }[];
}) {
  const [saisi, setSaisi] = useState("");
  const [erreur, setErreur] = useState(false);
  const [part, setPart] = useState(false);
  const [etape, setEtape] = useState<"anneau" | "code">("anneau");

  const verifier = useCallback(
    (code: string) => {
      if (code === CODE) {
        son("deverrou");
        setPart(true);
        setTimeout(onOuvrir, 200);
      } else {
        setErreur(true);
        setTimeout(() => {
          setSaisi("");
          setErreur(false);
        }, 650);
      }
    },
    [onOuvrir],
  );

  const appui = useCallback(
    (k: string) => {
      if (erreur || part) return;
      if (k === "⌫") return setSaisi((s) => s.slice(0, -1));
      if (k === "OK") return verifier(saisi);
      if (saisi.length >= 4) return;
      const s = saisi + k;
      setSaisi(s);
      if (s.length === 4) setTimeout(() => verifier(s), 140);
    },
    [erreur, part, saisi, verifier],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (etape === "anneau") {
        if (/^[0-9]$/.test(e.key) || e.key === "Enter" || e.key === " ") setEtape("code");
        return;
      }
      if (/^[0-9]$/.test(e.key)) appui(e.key);
      else if (e.key === "Backspace") appui("⌫");
      else if (e.key === "Enter") appui("OK");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [appui, etape]);

  return (
    <div className={`os-verrou${part ? " part" : ""} etape-${etape}`}>
      <div className="os-operateur">
        {/* Sam en cubes 3D, qui tourne sur lui-même (24 images calculées en 3D) */}
        <i className="sam-tourne" aria-hidden="true" />
        Sam-Telecom
      </div>
      <div className="os-verrou-heure">
        {heure.slice(0, 2)}
        <span>:</span>
        {heure.slice(3)}
      </div>
      <div className="os-verrou-date">{date}</div>
      <div className="os-verrou-modele">HANCK 7 PRO MAX</div>
      <NotifMusique compact />
      {etape === "anneau" && notifs.length ? (
        <div className="os-verrou-notifs">
          {notifs.slice(0, 3).map((n) => (
            <div key={n.id}>
              <i>{n.icone}</i>
              <b>{n.titre}</b>
              <span>{n.texte}</span>
            </div>
          ))}
        </div>
      ) : null}
      {etape === "anneau" ? (
        <>
          <AnneauVerrou onFini={() => setEtape("code")} />
          <button type="button" className="os-verrou-quitter anneau-quitter" onClick={onQuitter}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5zM4 5h7V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H4z" />
            </svg>
            Quitter AakanOS
          </button>
        </>
      ) : (
      <>
      <div className={`os-verrou-msg${erreur ? " erreur" : ""}`}>{erreur ? "Code incorrect, réessaie" : "Saisis ton code"}</div>
      <div className={`os-code${erreur ? " secoue" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < saisi.length ? "plein" : ""} />
        ))}
      </div>
      {/* Tant que le code n'est pas entré, on peut repartir vers le site classique. */}
      <button type="button" className="os-verrou-quitter" onClick={onQuitter}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5zM4 5h7V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H4z" />
        </svg>
        Quitter AakanOS
      </button>
      <div className="os-clavier">
        {TOUCHES.map(([a, b]) => (
          <button key={a} data-son={a === "⌫" ? "effacer" : a === "OK" ? "entree" : "touche"} className={a === "OK" ? "ok" : a === "⌫" ? "eff" : ""} onClick={() => appui(a)} aria-label={a === "⌫" ? "Effacer" : a}>
            <b>{a}</b>
            <span>{b}</span>
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}

/* ---------------- Fenêtre d'appli ---------------- */

function FenetreAppli({ f, fermeture, onRetour, children }: { f: Fenetre; fermeture: boolean; onRetour: () => void; children: ReactNode }) {
  // ActivityOptions.makeScaleUpAnimation : la fenêtre grandit depuis le rectangle de l'icône (300 ms, decelerate_cubic).
  const d = f.depuis;
  const sx = d ? d.w / d.W : 0.8;
  const sy = d ? d.h / d.H : 0.8;
  const px = d ? d.x / (1 - sx) : d === null ? 0 : 0;
  const py = d ? d.y / (1 - sy) : 0;
  const style = (d
    ? { "--sx": sx, "--sy": sy, transformOrigin: fermeture ? "50% 50%" : `${px}px ${py}px` }
    : { "--sx": 0.8, "--sy": 0.8, transformOrigin: "50% 50%" }) as CSSProperties;
  return (
    <div className={`os-fenetre${fermeture ? " ferme" : ""}${f.appli.id === "opakaalt" ? " os-fenetre-opakaalt" : ""}`} style={style}>
      <div className="os-barre-action">
        <button className="os-barre-retour" onClick={onRetour} aria-label="Retour">
          <svg viewBox="0 0 12 24" width="10" height="22">
            <path d="M10 4L3 12l7 8" fill="none" stroke="#ccc" strokeWidth="2" />
          </svg>
          <IconeAppli id={f.appli.id} taille={34} />
        </button>
        <b>{f.appli.nom}</b>
        <span className="os-barre-menu" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#ccc"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
        </span>
      </div>
      <div className="os-fenetre-corps">{children}</div>
    </div>
  );
}

function ContenuAppli({
  id,
  t,
  etoiles,
  ouvrir,
  quitter,
  gael,
}: {
  id: IdAppli;
  t: number | null;
  etoiles: Etoile[] | null;
  ouvrir: (a: Appli, el?: Element | null) => void;
  quitter: () => void;
  gael: PropsGael;
}) {
  switch (id) {
    case "contacts":
      return <AppContacts />;
    case "telephone":
      return <AppTelephone />;
    case "pulpus":
      return <AppPulpus />;
    case "samtelecom":
      return <AppSamTelecom />;
    case "sharkobank":
      return <AppSharkobank />;
    case "appareil":
      return <AppAppareilPhoto />;
    case "peeporn":
      return <AppPeeporn />;
    case "qui":
      return <AppQui ouvrir={ouvrir} />;
    case "album":
      return <AppAlbum />;
    case "projets":
      return <AppProjets t={t} etoiles={etoiles} />;
    case "citations":
      return <AppCitations etoiles={etoiles} />;
    case "endurreisen":
      return <AppHorloge />;
    case "calculatrice":
      return <AppCalculatrice />;
    case "mail":
      return <AppMail />;
    case "meteo":
      return <AppMeteo />;
    case "fichiers":
      return <AppFichiers />;
    case "musique":
      return <AppMusique />;
    case "dictaphone":
      return <AppDictaphone />;
    case "opakaalt":
      return <AppOpakaalt />;
    case "nounoumappa":
      return <AppNounoumappa />;
    case "messages":
      return <AppMessages {...gael} />;
    case "nounou":
      return (
        <NavigateurNounou />
      );
    case "dauphin":
      return (
        <div className="app-defile app-clair">
          <div className="nounou-jeu">
            <JeuDauphin />
            <p>Touche l’écran (ou espace) pour sauter les mines. Glisse vers le bas (ou flèche bas) pour plonger sous les oiseaux.</p>
          </div>
        </div>
      );
    case "reglages":
      return <AppReglages quitter={quitter} />;
    default:
      return null;
  }
}

/* ---------------- Applis ---------------- */

function Titre({ children }: { children: ReactNode }) {
  return <div className="os-titre-holo">{children}</div>;
}

function AppQui({ ouvrir }: { ouvrir: (a: Appli, el?: Element | null) => void }) {
  return (
    <div className="app-defile">
      <div className="qui-entete">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img draggable={false} src="/media/franck.jpg" alt="" />
        <div>
          <b>Franck J.H. Christen H.M.B.K.</b>
          <span>Polymathe · né en 2007, en France</span>
        </div>
      </div>
      <Titre>PRÉSENTATION</Titre>
      {PRESENTATION.map((l) => (
        <p key={l} className="app-texte">
          {l}
        </p>
      ))}
      <Titre>IDENTITÉ</Titre>
      <div className="app-ligne">
        <b>Nom</b>
        <span>Franck J.H. Christen H.M.B.K.</span>
      </div>
      <div className="app-ligne">
        <b>Né</b>
        <span>2007, en France</span>
      </div>
      <Titre>ALBUM</Titre>
      <button className="qui-vignettes" onClick={(e) => ouvrir(par("album"), e.currentTarget)}>
        <i style={{ backgroundImage: "url(/media/franck-poster.jpg)" }} />
        <i style={{ backgroundImage: "url(/media/franck.jpg)" }} />
        <i className="plus">›</i>
      </button>
    </div>
  );
}

function AppAlbum() {
  const [vue, setVue] = useState<number | null>(null);
  useRetour(vue !== null, () => setVue(null));
  if (vue !== null) {
    const el = ALBUM[vue]!;
    return (
      <div className="album-plein" onClick={() => (son("espace", 0.7), setVue((v) => ((v ?? 0) + 1) % ALBUM.length))}>
        {el.kind === "video" ? (
          <video draggable={false} controlsList="nodownload noremoteplayback" disablePictureInPicture key={el.src} src={el.src} poster={el.poster} autoPlay loop playsInline muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img draggable={false} key={el.src} src={el.src} alt="" />
        )}
        <span>
          {vue + 1} / {ALBUM.length}
        </span>
      </div>
    );
  }
  return (
    <div className="app-defile">
      <Titre>FRANCK · {ALBUM.length} ÉLÉMENTS</Titre>
      <div className="album-grille">
        {ALBUM.map((el, i) => (
          <button key={el.src} onClick={() => setVue(i)} style={{ backgroundImage: `url(${el.poster ?? el.src})` }}>
            {el.kind === "video" ? (
              <span>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function Decompte({ t, cible }: { t: number | null; cible: number }) {
  const c = decompte(t, cible);
  if (c.fini) return <span className="decompte fini">ouvert</span>;
  return (
    <span className="decompte">
      {c.j} j {deux(c.h)} h {deux(c.m)} min {deux(c.s)} s
    </span>
  );
}

function Chargement() {
  return (
    <div className="os-charge-petit">
      <i />
    </div>
  );
}

function MoisCalendrier({ t }: { t: number | null }) {
  // Décembre 2026 : le 1er (Endurreisen) et le 3 (L’aube) sont marqués, aujourd’hui entouré.
  const auj = t ? new Date(t) : null;
  const premier = new Date(2026, 11, 1).getDay(); // 0 = dimanche
  const decal = (premier + 6) % 7;
  const cases = [...Array.from({ length: decal }, () => 0), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="cal">
      <div className="cal-tete">
        <b>décembre 2026</b>
      </div>
      <div className="cal-grille">
        {["L", "M", "M", "J", "V", "S", "D"].map((j, i) => (
          <span key={i} className="cal-j">
            {j}
          </span>
        ))}
        {cases.map((n, i) => (
          <span
            key={i}
            className={`cal-c${n === 1 ? " e1" : ""}${n === 3 ? " e2" : ""}${auj && auj.getFullYear() === 2026 && auj.getMonth() === 11 && auj.getDate() === n ? " auj" : ""}`}
          >
            {n || ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function AppProjets({ t, etoiles }: { t: number | null; etoiles: Etoile[] | null }) {
  const projets = (etoiles ?? []).filter((e) => e.genre === "projet");
  return (
    <div className="app-defile">
      <MoisCalendrier t={t} />
      <Titre>ÉVÉNEMENTS</Titre>
      <div className="agenda">
        <i style={{ background: "#33b5e5" }} />
        <div>
          <b>Endurreisen</b>
          <span>Ouverture le 1ᵉʳ décembre 2026</span>
          <Decompte t={t} cible={OUVERTURE} />
        </div>
      </div>
      <div className="agenda">
        <i style={{ background: "#99cc00" }} />
        <div>
          <b>L’aube</b>
          <span>Du 3 décembre 2026 au 3 juin 2027 · 6 mois</span>
          {t != null && t >= AUBE_DEBUT ? <Decompte t={t} cible={AUBE_FIN} /> : <Decompte t={t} cible={AUBE_DEBUT} />}
        </div>
      </div>
      <Titre>PROJETS</Titre>
      {etoiles === null ? <Chargement /> : null}
      {etoiles && projets.length === 0 ? <p className="os-vide">Les projets arrivent à l’ouverture d’Endurreisen.</p> : null}
      {projets.map((p) => (
        <div key={p.id} className="app-ligne">
          <b>{p.titre}</b>
          <span>{p.texte}</span>
        </div>
      ))}
    </div>
  );
}

function AppCitations({ etoiles }: { etoiles: Etoile[] | null }) {
  // Notes : chaque citation est une note sur papier jaune. Le visiteur peut aussi écrire les siennes.
  const liste = (etoiles ?? []).filter((e) => e.genre !== "projet" && e.texte?.trim());
  const mes = notesPerso.useValeur();
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [edite, setEdite] = useState<NotePerso | null>(null);
  const [cherche, setCherche] = useState("");
  const fermerEdition = () => {
    if (!edite) return;
    const t = edite.texte.trim();
    if (t) notesPerso.ecrire((l) => (l.some((x) => x.id === edite.id) ? l.map((x) => (x.id === edite.id ? { ...edite, texte: t, modifie: Date.now() } : x)) : [{ ...edite, texte: t, modifie: Date.now() }, ...l]));
    else notesPerso.ecrire((l) => l.filter((x) => x.id !== edite.id));
    setEdite(null);
  };
  useRetour(ouverte !== null || edite !== null, () => (edite ? fermerEdition() : setOuverte(null)));
  const [confirmer, setConfirmer] = useState(false);
  const n = liste.find((c) => c.id === ouverte);
  if (edite) {
    return (
      <div className="app-defile note-papier note-edition">
        <div className="note-barre">
          <button data-son="entree" onClick={fermerEdition}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#6b5a1e" aria-hidden="true">
              <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            OK
          </button>
          {mes.some((x) => x.id === edite.id) ? (
            <button onClick={() => setConfirmer(true)}>Supprimer</button>
          ) : null}
        </div>
        <div className="note-date">{dateNote(edite.modifie)}</div>
        <textarea className="note-saisie" value={edite.texte} onChange={(e) => setEdite({ ...edite, texte: e.target.value.slice(0, 2000) })} placeholder="Écrire une note" aria-label="Écrire une note" autoFocus />
        {confirmer ? (
          <DlgFenetre titre="Supprimer la note ?" fermer={() => setConfirmer(false)}>
            <p className="dlg-corps">Cette note sera supprimée.</p>
            <div className="dlg-boutons">
              <button onClick={() => setConfirmer(false)}>Annuler</button>
              <button data-son="effacer"
                onClick={() => {
                  notesPerso.ecrire((l) => l.filter((x) => x.id !== edite.id));
                  setConfirmer(false);
                  setEdite(null);
                  toast("Note supprimée");
                }}
              >
                Supprimer
              </button>
            </div>
          </DlgFenetre>
        ) : null}
      </div>
    );
  }
  if (n) {
    return (
      <div className="app-defile note-papier">
        <div className="note-date">{n.date}</div>
        <p className="note-texte">{n.texte}</p>
        <div className="note-signe">— {n.auteur}</div>
      </div>
    );
  }
  const q = sansAccent(cherche.trim());
  const garde = (t: string) => !q || sansAccent(t).includes(q);
  const mesVues = mes.filter((x) => garde(x.texte));
  const citVues = liste.filter((c) => garde(`${c.texte} ${c.auteur ?? ""}`));
  return (
    <div className="app-defile">
      <div className="ct-recherche note-recherche">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#888"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
        <input className="ct-cherche" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Rechercher dans les notes" aria-label="Rechercher dans les notes" />
        <button className="ct-ajout" aria-label="Nouvelle note" onClick={() => setEdite({ id: `n${Date.now().toString(36)}`, texte: "", modifie: Date.now() })}>
          <Aosp n="ic_menu_add" />
        </button>
      </div>
      <Titre>MES NOTES · {mesVues.length}</Titre>
      {mesVues.map((x) => (
        <button key={x.id} className="note-ligne note-perso" onClick={() => setEdite(x)}>
          <b>{x.texte.slice(0, 40)}{x.texte.length > 40 ? "…" : ""}</b>
          <span>{dateNote(x.modifie)}</span>
        </button>
      ))}
      {mes.length === 0 ? (
        <button className="note-ligne note-nouvelle" onClick={() => setEdite({ id: `n${Date.now().toString(36)}`, texte: "", modifie: Date.now() })}>
          <b>+ Nouvelle note</b>
          <span>Elle reste sur ce téléphone jusqu’à la fin de la session</span>
        </button>
      ) : null}
      <Titre>NOTES · {citVues.length}</Titre>
      {etoiles === null ? <Chargement /> : null}
      {citVues.map((c) => (
        <button key={c.id} className="note-ligne" onClick={() => setOuverte(c.id)}>
          <b>{c.texte.slice(0, 40)}{c.texte.length > 40 ? "…" : ""}</b>
          <span>{c.date}</span>
        </button>
      ))}
      {q && mesVues.length + citVues.length === 0 ? <p className="os-vide">Aucune note trouvée</p> : null}
    </div>
  );
}

function dateNote(t: number) {
  const d = new Date(t);
  return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

type PropsGael = { convs: Record<Correspondant, MsgGael[]>; ecrit: Correspondant | null; envoyer: (qui: Correspondant, t: string) => void; vu: (ouverte: Correspondant | null) => void; effacer: (qui: Correspondant) => void };

/** Une boîte de dialogue posée sur toute la fenêtre de l'appli, même quand la liste a défilé. */
function DlgFenetre(props: { titre: string; children: ReactNode; fermer: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cible, setCible] = useState<Element | null>(null);
  useEffect(() => {
    setCible(ref.current?.closest(".os-fenetre-corps") ?? null);
  }, []);
  return (
    <>
      <span ref={ref} hidden />
      {cible ? createPortal(<Dlg {...props} />, cible) : null}
    </>
  );
}

/** Icônes Holo de la barre d'action (Jelly Bean). */
const IC_BLOQUE = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z";

/** Une icône d'Android 4.2 (AOSP, Apache 2.0 : public/aakanos/aosp/LICENCES.txt). */
const Aosp = ({ n, t = 32 }: { n: string; t?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img draggable={false} src={`/aakanos/aosp/${n}.svg`} alt="" width={t} height={t} style={{ display: "block" }} />
);

/** Appui long (500 ms) : le menu contextuel de Jelly Bean. */
function useAppuiLong(f: () => void) {
  const t = useRef<number | null>(null);
  const long = useRef(false);
  const fin = () => {
    if (t.current !== null) window.clearTimeout(t.current);
    t.current = null;
  };
  return {
    onPointerDown: () => {
      long.current = false;
      fin();
      t.current = window.setTimeout(() => {
        long.current = true;
        f();
      }, 500);
    },
    onPointerUp: fin,
    onPointerLeave: fin,
    onContextMenu: (e: { preventDefault: () => void }) => {
      e.preventDefault();
      fin();
      long.current = true;
      f();
    },
    estLong: () => long.current,
  };
}

function copier(texte: string) {
  void navigator.clipboard?.writeText(texte).catch(() => {});
  toast("Texte copié");
}

type Interlocuteur = { cle: string; nom: string; photo: string; tel?: string; contact?: string; perso: boolean };

/** Tous ceux à qui on peut écrire : les correspondants d'origine, puis les contacts créés par le visiteur. */
function interlocuteurs(perso: ContactPerso[]): Interlocuteur[] {
  return [
    ...CORRESPONDANTS.map((c) => {
      const ct = CONTACTS.find((x) => x.id === c.id);
      return { cle: c.id, nom: c.nom, photo: c.photo, tel: ct?.tel, contact: ct?.id, perso: false };
    }),
    ...perso.map((p) => ({ cle: p.id, nom: p.nom, photo: avatarLettre(p.nom), tel: p.tel, contact: p.id, perso: true })),
  ];
}

function AppMessages({ convs, ecrit, envoyer, vu, effacer }: PropsGael) {
  const perso = contactsPerso.useValeur();
  const mesConvs = convsPerso.useValeur();
  const bloc = bloques.useValeur();
  const celjoABloque = celjoBloque.useValeur();
  const [conv, setConv] = useState<string | null>(() => prendreCible("messages") ?? null);
  const [ecrire, setEcrire] = useState(false);
  const [menu, setMenu] = useState<Interlocuteur | null>(null);
  const [bulle, setBulle] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState<Interlocuteur | null>(null);
  const [texte, setTexte] = useState("");
  const liste = useRef<HTMLDivElement>(null);
  useRetour(conv !== null || ecrire, () => (ecrire ? setEcrire(false) : setConv(null)));
  const estCorr = (k: string | null): k is Correspondant => !!k && CORRESPONDANTS.some((c) => c.id === k);
  useEffect(() => {
    vu(estCorr(conv) ? conv : null);
    return () => vu(null);
  }, [conv, vu]);
  const tous = interlocuteurs(perso);
  const msgsDe = (k: string): { id: number; de: "moi" | "lui"; texte: string; h: string; lu?: boolean }[] => (estCorr(k) ? convs[k] : mesConvs[k] ?? []);
  const msgs = conv ? msgsDe(conv) : [];
  useEffect(() => {
    const l = liste.current;
    if (l) l.scrollTo({ top: l.scrollHeight, behavior: "smooth" });
  }, [msgs.length, ecrit, conv]);

  const basculerBloque = (x: Interlocuteur) => {
    const deja = bloc.includes(x.cle);
    bloques.ecrire((l) => (deja ? l.filter((y) => y !== x.cle) : [...l, x.cle]));
    toast(deja ? "Contact débloqué" : "Contact bloqué");
  };
  const supprimer = (x: Interlocuteur) => {
    if (estCorr(x.cle)) effacer(x.cle);
    else convsPerso.ecrire((c) => ({ ...c, [x.cle]: [] }));
    toast("Conversation supprimée");
    setConv(null);
  };
  const options = (x: Interlocuteur) => (
    <DlgFenetre titre={x.nom} fermer={() => setMenu(null)}>
      {x.tel ? (
        <button className="dlg-choix" onClick={() => (setMenu(null), appelerDepuisAakanOS(x.tel!))}>
          Appeler
        </button>
      ) : null}
      {x.contact ? (
        <button className="dlg-choix" onClick={() => (setMenu(null), ouvrirAppli("contacts", x.contact))}>
          Voir le contact
        </button>
      ) : null}
      {x.tel ? (
        <button className="dlg-choix" onClick={() => (setMenu(null), copier(x.tel!))}>
          Copier le numéro
        </button>
      ) : null}
      <button className="dlg-choix" data-son={bloc.includes(x.cle) ? "deverrou" : "verrou"} onClick={() => (setMenu(null), basculerBloque(x))}>
        {bloc.includes(x.cle) ? "Débloquer le contact" : "Bloquer le contact"}
      </button>
      <button className="dlg-choix" onClick={() => (setMenu(null), setConfirmer(x))}>
        Supprimer la conversation
      </button>
    </DlgFenetre>
  );
  const dialogues = (
    <>
      {menu ? options(menu) : null}
      {confirmer ? (
        <DlgFenetre titre="Supprimer la conversation ?" fermer={() => setConfirmer(null)}>
          <p className="dlg-corps">Toute la conversation sera supprimée.</p>
          <div className="dlg-boutons">
            <button onClick={() => setConfirmer(null)}>Annuler</button>
            <button data-son="effacer" onClick={() => (supprimer(confirmer), setConfirmer(null))}>Supprimer</button>
          </div>
        </DlgFenetre>
      ) : null}
    </>
  );

  if (ecrire) {
    return (
      <div className="app-defile os-act entre">
        <div className="msg-barre">
          <b>Nouveau message</b>
        </div>
        <Titre>À :</Titre>
        {tous
          .filter((x) => x.tel)
          .map((x) => (
            <button key={x.cle} className="msg-conv" onClick={() => (setEcrire(false), setConv(x.cle))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img draggable={false} className="msg-avatar" src={x.photo} alt="" />
              <div>
                <b>{x.nom}</b>
                <span>{x.tel}</span>
              </div>
            </button>
          ))}
        <button className="msg-conv msg-nouveau-contact" onClick={() => (setEcrire(false), ouvrirAppli("contacts", "nouveau"))}>
          <i className="msg-avatar msg-plus" aria-hidden="true">+</i>
          <div>
            <b>Créer un contact</b>
            <span>Dans l’appli Contacts</span>
          </div>
        </button>
      </div>
    );
  }

  if (!conv) {
    const persoAvecMsgs = tous.filter((x) => x.perso && (mesConvs[x.cle]?.length ?? 0) > 0);
    return (
      <div className="app-defile os-act entre">
        <div className="msg-barre">
          <b>{`Conversations`}</b>
          <button aria-label="Nouveau message" onClick={() => setEcrire(true)}>
            <Aosp n="ic_menu_compose" />
          </button>
        </div>
        {[...CORRESPONDANTS]
          .filter((c) => c.id !== "samtelecom" || convs.samtelecom.length > 0)
          .sort((a, b) => (convs[b.id].at(-1)?.id ?? 0) - (convs[a.id].at(-1)?.id ?? 0))
          .map((c) => (
            <LigneConv
              key={c.id}
              x={tous.find((y) => y.cle === c.id)!}
              bloque={bloc.includes(c.id)}
              ouvrir={() => setConv(c.id)}
              menu={setMenu}
              heure={convs[c.id].at(-1)?.h ?? (c.accueil ? "09:41" : "")}
            >
              {(() => {
                const dernier = convs[c.id].at(-1);
                return <span>{dernier ? `${dernier.de === "moi" ? "Moi : " : ""}${dernier.texte}` : c.accueil ? "Le contact de Franck est dans Contacts" : "Nouvelle conversation"}</span>;
              })()}
            </LigneConv>
          ))}
        {persoAvecMsgs.map((x) => {
          const dernier = mesConvs[x.cle]!.at(-1)!;
          return (
            <LigneConv key={x.cle} x={x} bloque={bloc.includes(x.cle)} ouvrir={() => setConv(x.cle)} menu={setMenu} heure={dernier.h}>
              <span>{`Moi : ${dernier.texte}`}</span>
            </LigneConv>
          );
        })}
        <p className="os-vide msg-astuce">Appui long sur une conversation pour plus d’options</p>
        {dialogues}
      </div>
    );
  }

  const x = tous.find((y) => y.cle === conv);
  if (!x) return null;
  const c = estCorr(conv) ? CORRESPONDANTS.find((y) => y.id === conv)! : null;
  // eslint-disable-next-line @next/next/no-img-element
  const avatar = <img draggable={false} className="msg-avatar" src={x.photo} alt="" />;
  const derniersMoi = msgs.filter((m) => m.de === "moi").at(-1);
  const bloque = (estCorr(conv) && BLOQUE_APRES[conv] > 0 && msgs.filter((m) => m.de === "lui").length >= BLOQUE_APRES[conv]) || (conv === "celjo" && celjoABloque);
  const jaiBloque = bloc.includes(conv);
  const choixBulle = msgs.find((m) => String(m.id) === bulle);
  return (
    <div className="msg-fil os-act entre" key={conv}>
      <div className="msg-tete">
        {avatar}
        <div>
          <b>{x.nom}</b>
          <span>{x.tel ?? "SMS de l’opérateur"}</span>
        </div>
        {x.tel ? (
          <button aria-label="Appeler" onClick={() => appelerDepuisAakanOS(x.tel!)}>
            <Aosp n="ic_menu_call" />
          </button>
        ) : null}
        <button aria-label="Options" onClick={() => setMenu(x)}>
          <Aosp n="ic_menu_moreoverflow_normal_holo_dark" />
        </button>
      </div>
      <div className="msg-liste" ref={liste}>
        <div className="msg-date">AUJOURD’HUI</div>
        {c?.accueil ? (
          <div className="msg-bulle">
            {avatar}
            <p>
              {c.accueil}
              <em>09:40</em>
            </p>
          </div>
        ) : null}
        {msgs.map((m) =>
          m.de === "moi" ? (
            <div key={m.id} className="msg-bulle moi" onClick={() => setBulle(String(m.id))}>
              <p>
                {m.texte}
                <em>{m === derniersMoi ? (m.lu ? `Lu · ${m.h}` : `Envoyé · ${m.h}`) : m.h}</em>
              </p>
            </div>
          ) : (
            <div key={m.id} className="msg-bulle" onClick={() => setBulle(String(m.id))}>
              {avatar}
              <p>
                {m.texte}
                <em>{m.h}</em>
              </p>
            </div>
          ),
        )}
        {ecrit === conv ? (
          <div className="msg-bulle">
            {avatar}
            <p className="msg-ecrit">
              <span />
              <span />
              <span />
            </p>
          </div>
        ) : null}
      </div>
      {ecrit === conv ? <div className="msg-statut">{`${x.nom} est en train d’écrire…`}</div> : null}
      {conv === "samtelecom" ? (
        <div className="msg-bloque msg-noreply">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#888" aria-hidden="true">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          Vous ne pouvez pas répondre à ce message.
        </div>
      ) : jaiBloque ? (
        <div className="msg-bloque">
          <Aosp n="ic_menu_block" t={24} />
          <span>Vous avez bloqué ce contact.</span>
          <button className="msg-debloquer" onClick={() => basculerBloque(x)}>
            DÉBLOQUER
          </button>
        </div>
      ) : bloque ? (
        <div className="msg-bloque">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4444" aria-hidden="true">
            <path d={IC_BLOQUE} />
          </svg>
          {`${x.nom} vous a bloqué. Vous ne pouvez plus lui écrire.`}
        </div>
      ) : (
        <form
          className="msg-saisie"
          onSubmit={(e) => {
            e.preventDefault();
            const v = texte.trim();
            if (!v) return;
            if (estCorr(conv)) envoyer(conv, v);
            else {
              convsPerso.ecrire((cv) => ({ ...cv, [conv]: [...(cv[conv] ?? []), { id: Date.now(), de: "moi", texte: v, h: heureCourte() }] }));
              sonSynth("envoye");
            }
            setTexte("");
          }}
        >
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => son(e.key === "Backspace" ? "effacer" : e.key === "Enter" ? "entree" : "touche", 0.7)}
            placeholder={x.perso ? "Écrire un message" : `Écrire un message à ${x.nom}`}
            enterKeyHint="send"
          />
          <button aria-label="Envoyer" disabled={!texte.trim()}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill={texte.trim() ? "#33b5e5" : "#555"}>
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      )}
      {choixBulle ? (
        <DlgFenetre titre="Options du message" fermer={() => setBulle(null)}>
          <button className="dlg-choix" onClick={() => (setBulle(null), copier(choixBulle.texte))}>
            Copier le texte
          </button>
          {x.tel ? (
            <button className="dlg-choix" onClick={() => (setBulle(null), appelerDepuisAakanOS(x.tel!))}>
              Appeler
            </button>
          ) : null}
          <div className="dlg-corps msg-details">{`${choixBulle.de === "moi" ? "Envoyé" : "Reçu"} · ${choixBulle.h}`}</div>
        </DlgFenetre>
      ) : null}
      {dialogues}
    </div>
  );
}

function LigneConv({ x, bloque, ouvrir, menu, heure, children }: { x: Interlocuteur; bloque: boolean; ouvrir: () => void; menu: (x: Interlocuteur) => void; heure: string; children: ReactNode }) {
  const appui = useAppuiLong(() => menu(x));
  return (
    <button
      className={`msg-conv${bloque ? " msg-conv-bloque" : ""}`}
      onClick={() => !appui.estLong() && ouvrir()}
      onPointerDown={appui.onPointerDown}
      onPointerUp={appui.onPointerUp}
      onPointerLeave={appui.onPointerLeave}
      onContextMenu={appui.onContextMenu}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img draggable={false} className="msg-avatar" src={x.photo} alt="" />
      <div>
        <b>
          {x.nom}
          {bloque ? <small className="msg-etiquette">BLOQUÉ</small> : null}
        </b>
        {children}
      </div>
      <em>{heure}</em>
    </button>
  );
}

type Contact = { id: string; nom: string; photo: string; tel?: string; mail?: string; insta?: string; note?: string };
const CONTACTS: Contact[] = [
  { id: "celjo", nom: "Celjo", photo: "/aakanos/celjo.jpg", tel: "+0-20070600084", note: "Le lapin motard, toujours sur sa moto." },
  { id: "franck", nom: "Franck J.H. Christen H.M.B.K.", photo: "/media/franck.jpg", mail: MAIL, insta: "@fjhchristenhmbk", note: "Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à lui." },
  { id: "gael", nom: "Gaël", photo: "/aakanos/gael.jpg", tel: "+0-2003220008" },
  { id: "pacifick", nom: "Pacifick", photo: "/aakanos/pacifick.jpg", tel: "+0-43365470730", note: "L’orque, prof de maths au fond de l’océan." },
  { id: "psy", nom: "Cabinet Spaloova", photo: "/aakanos/psy-spaloova.svg", mail: "meinepsychologieverstehen@spaloova.tav", note: "Mon psychologue. Le wifi du cabinet est gratuit." },
];

/** Avatar à initiale pour les contacts créés sur le téléphone (aucune image à télécharger). */
const TEINTES = ["#33b5e5", "#aa66cc", "#99cc00", "#ffbb33", "#ff4444", "#0099cc"];
function avatarLettre(nom: string) {
  const l = (nom.trim()[0] ?? "?").toUpperCase().replace(/[<&>"']/g, "?");
  const f = TEINTES[[...nom].reduce((a, c) => a + c.charCodeAt(0), 0) % TEINTES.length]!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${f}"/><text x="48" y="64" font-family="Roboto,sans-serif" font-size="48" fill="#fff" text-anchor="middle">${l}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type FicheContact = Contact & { perso?: boolean };
function tousLesContacts(perso: ContactPerso[]): FicheContact[] {
  return [...CONTACTS, ...perso.map((p) => ({ ...p, photo: avatarLettre(p.nom), perso: true }))].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

/** Contacts : Celjo, Franck, Gaël, Pacifick, le cabinet Spaloova, et ceux que le visiteur crée. */
function AppContacts() {
  const perso = contactsPerso.useValeur();
  const bloc = bloques.useValeur();
  const [choisi, setChoisi] = useState<string | null>(() => {
    const c = prendreCible("contacts");
    return c && c !== "nouveau" ? c : null;
  });
  const [edition, setEdition] = useState<ContactPerso | "nouveau" | null>(() => (prendreCible("contacts") === "nouveau" ? "nouveau" : null));
  const [cherche, setCherche] = useState("");
  const [supprimer, setSupprimer] = useState(false);
  useRetour(choisi !== null || edition !== null, () => (edition ? setEdition(null) : setChoisi(null)));
  const tous = tousLesContacts(perso);
  const c = tous.find((x) => x.id === choisi);

  if (edition) return <FormContact depart={edition === "nouveau" ? null : edition} fini={(id) => (setEdition(null), id ? setChoisi(id) : null)} />;

  if (!c) {
    const q = sansAccent(cherche.trim());
    const vus = q ? tous.filter((x) => sansAccent(x.nom).includes(q) || (x.tel ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")) : tous;
    return (
      <div className="app-defile os-act entre">
        <div className="ct-recherche">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#888"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <input className="ct-cherche" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Rechercher des contacts" aria-label="Rechercher des contacts" />
          <button className="ct-ajout" aria-label="Nouveau contact" onClick={() => setEdition("nouveau")}>
            <Aosp n="ic_menu_invite" />
          </button>
        </div>
        {vus.map((x, i) => {
          const l = x.nom[0]!.toUpperCase();
          const titre = i === 0 || vus[i - 1]!.nom[0]!.toUpperCase() !== l ? <div className="os-titre-holo">{l}</div> : null;
          return (
            <div key={x.id}>
              {titre}
              <button className="ct-ligne" onClick={() => setChoisi(x.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img draggable={false} src={x.photo} alt="" />
                <b>{x.nom}</b>
              </button>
            </div>
          );
        })}
        {q && vus.length === 0 ? <p className="os-vide">Aucun contact trouvé</p> : null}
        <p className="os-vide">{tous.length} contacts</p>
        <button className="ct-nouveau" onClick={() => setEdition("nouveau")}>
          + Nouveau contact
        </button>
      </div>
    );
  }
  const correspondant = CORRESPONDANTS.some((y) => y.id === c.id) || c.perso;
  return (
    <div className="app-defile os-act entre" key={c.id}>
      <div className="ct-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img draggable={false} src={c.photo} alt="" />
        <b>{c.nom}</b>
      </div>
      {c.tel ? (
        <>
          <div className="os-titre-holo">TÉLÉPHONE</div>
          <a
            className="ct-champ"
            href={`tel:${c.tel}`}
            onClick={(e) => {
              e.preventDefault();
              appelerDepuisAakanOS(c.tel!);
            }}
          >
            <span>
              <b>{c.tel}</b>
              <small>MOBILE</small>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img draggable={false} src="/aakanos/phone.png" alt="" />
          </a>
          {correspondant ? (
            <button className="ct-champ ct-action" onClick={() => ouvrirAppli("messages", c.id)}>
              <span>
                <b>Envoyer un message</b>
                <small>SMS</small>
              </span>
              <Aosp n="ic_menu_compose" />
            </button>
          ) : null}
        </>
      ) : null}
      {c.mail ? (
        <>
          <div className="os-titre-holo">E-MAIL</div>
          <a className="ct-champ" href={`mailto:${c.mail}`}>
            <span>
              <b>{c.mail}</b>
              <small>PERSONNEL</small>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img draggable={false} src="/aakanos/email.png" alt="" />
          </a>
        </>
      ) : null}
      {c.insta ? (
        <>
          <div className="os-titre-holo">RÉSEAUX</div>
          <a className="ct-champ" href={INSTA} target="_blank" rel="noopener noreferrer">
            <span>
              <b>{c.insta}</b>
              <small>INSTAGRAM</small>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img draggable={false} src="/aakanos/camera.png" alt="" />
          </a>
        </>
      ) : null}
      {c.note ? (
        <>
          <div className="os-titre-holo">NOTE</div>
          <p className="app-texte">{c.note}</p>
        </>
      ) : null}
      {c.tel || c.perso ? <div className="os-titre-holo">OPTIONS</div> : null}
      {c.tel ? (
        <button data-son={bloc.includes(c.id) ? "deverrou" : "verrou"}
          className="ct-option"
          onClick={() => {
            const deja = bloc.includes(c.id);
            bloques.ecrire((l) => (deja ? l.filter((y) => y !== c.id) : [...l, c.id]));
            toast(deja ? "Contact débloqué" : "Contact bloqué");
          }}
        >
          {bloc.includes(c.id) ? "Débloquer le contact" : "Bloquer le contact"}
        </button>
      ) : null}
      {c.perso ? (
        <>
          <button className="ct-option" onClick={() => setEdition(perso.find((p) => p.id === c.id) ?? null)}>
            Modifier le contact
          </button>
          <button className="ct-option ct-danger" onClick={() => setSupprimer(true)}>
            Supprimer le contact
          </button>
        </>
      ) : null}
      {supprimer ? (
        <DlgFenetre titre="Supprimer le contact ?" fermer={() => setSupprimer(false)}>
          <p className="dlg-corps">Ce contact sera supprimé de ce téléphone.</p>
          <div className="dlg-boutons">
            <button onClick={() => setSupprimer(false)}>Annuler</button>
            <button data-son="effacer"
              onClick={() => {
                contactsPerso.ecrire((l) => l.filter((p) => p.id !== c.id));
                convsPerso.ecrire((cv) => ({ ...cv, [c.id]: [] }));
                setSupprimer(false);
                setChoisi(null);
                toast("Contact supprimé");
              }}
            >
              Supprimer
            </button>
          </div>
        </DlgFenetre>
      ) : null}
    </div>
  );
}

function FormContact({ depart, fini }: { depart: ContactPerso | null; fini: (id: string | null) => void }) {
  const [nom, setNom] = useState(depart?.nom ?? "");
  const [tel, setTel] = useState(depart?.tel ?? "");
  const [mail, setMail] = useState(depart?.mail ?? "");
  const [note, setNote] = useState(depart?.note ?? "");
  const valide = nom.trim().length > 0 && (tel.trim() === "" || /^[+\d][\d\s().-]{2,}$/.test(tel.trim()));
  return (
    <form
      className="app-defile os-act entre ct-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valide) return;
        const fiche: ContactPerso = {
          id: depart?.id ?? `p${Date.now().toString(36)}`,
          nom: nom.trim().slice(0, 60),
          tel: tel.trim().slice(0, 30) || undefined,
          mail: mail.trim().slice(0, 80) || undefined,
          note: note.trim().slice(0, 300) || undefined,
        };
        contactsPerso.ecrire((l) => (depart ? l.map((p) => (p.id === depart.id ? fiche : p)) : [...l, fiche]));
        toast(depart ? "Contact modifié" : "Contact enregistré");
        fini(fiche.id);
      }}
    >
      <div className="ct-form-barre">
        <button type="submit" data-son="entree" disabled={!valide}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill={valide ? "#33b5e5" : "#555"} aria-hidden="true">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          OK
        </button>
        <button type="button" onClick={() => fini(depart?.id ?? null)}>
          Annuler
        </button>
      </div>
      <div className="ct-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img draggable={false} src={avatarLettre(nom || "?")} alt="" />
        <b>{depart ? "Modifier le contact" : "Nouveau contact"}</b>
      </div>
      <div className="os-titre-holo">NOM</div>
      <input className="ct-saisie" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" aria-label="Nom" autoFocus />
      <div className="os-titre-holo">TÉLÉPHONE</div>
      <input className="ct-saisie" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Téléphone" aria-label="Téléphone" inputMode="tel" />
      <div className="os-titre-holo">E-MAIL</div>
      <input className="ct-saisie" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="E-mail" aria-label="E-mail" inputMode="email" />
      <div className="os-titre-holo">NOTE</div>
      <textarea className="ct-saisie" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" aria-label="Note" rows={3} />
      {!valide && nom.trim() ? <p className="os-vide">Ce numéro de téléphone n’est pas valide</p> : null}
    </form>
  );
}

/* ---------------- Téléphone (réseau Sam-Telecom) ---------------- */

let appelEnAttente: string | null = null;
function appelerDepuisAakanOS(num: string) {
  appelEnAttente = num;
  window.dispatchEvent(new Event("aakanos-appel"));
}

/** Les trois notes montantes du « numéro hors service ». */
function sonHorsService() {
  try {
    if (estMuet()) return;
    const ctx = new AudioContext();
    [913.8, 1370.6, 1776.7].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.38;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.setValueAtTime(0.18, t0 + 0.3);
      g.gain.linearRampToValueAtTime(0, t0 + 0.33);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
    });
    window.setTimeout(() => void ctx.close(), 1600);
  } catch {}
}

const TOUCHES_TEL: [string, string][] = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
];

/** Le journal d'appels de Casto (la session y ajoute ses propres appels, tous hors service). */
type Appel = { id: number | string; num: string; quand: string; type: "entrant" | "manque" | "sortant" | "rejete"; note: string };
const journalAppels: Appel[] = [
  { id: "j1", num: "700", quand: "Hier 09:41", type: "entrant", note: "message vocal" },
  { id: "j2", num: "700", quand: "Hier 09:40", type: "manque", note: "service client" },
  { id: "j3", num: "+0-2003220008", quand: "Mar.", type: "sortant", note: "hors service" },
  { id: "j4", num: "+0-20070600084", quand: "Lun.", type: "manque", note: "×3" },
  { id: "j5", num: "+0-43365470730", quand: "Lun.", type: "rejete", note: "il t’a bloqué" },
];
const FAVORIS_TEL = ["gael", "celjo", "pacifick"];

function AppTelephone() {
  // Ouvert depuis un contact : l'appel part tout de suite.
  const [numero, setNumero] = useState(() => appelEnAttente ?? "");
  const [appel, setAppel] = useState<null | "sonne" | "hs" | "fin">(() => (appelEnAttente ? "sonne" : null));
  const [duree, setDuree] = useState(0);
  const [onglet, setOnglet] = useState<"clavier" | "journal" | "contacts" | "favoris">("clavier");
  const lancer = useCallback((n: string) => {
    if (!n) return;
    journalAppels.unshift({ id: Date.now(), num: n, quand: `Aujourd’hui ${heureCourte()}`, type: "sortant", note: "hors service" });
    setNumero(n);
    setAppel("sonne");
    setDuree(0);
  }, []);
  useEffect(() => {
    appelEnAttente = null;
  }, []);
  useEffect(() => {
    if (appel !== "sonne") return;
    return tonaliteRetour();
  }, [appel]);
  useEffect(() => {
    if (appel !== "sonne") return;
    const t1 = window.setTimeout(() => {
      setAppel("hs");
      sonHorsService();
    }, 2600);
    return () => window.clearTimeout(t1);
  }, [appel]);
  useEffect(() => {
    if (appel !== "hs") return;
    const t = window.setTimeout(() => setAppel("fin"), 6500);
    return () => window.clearTimeout(t);
  }, [appel]);
  useEffect(() => {
    if (appel !== "sonne") return;
    const id = window.setInterval(() => setDuree((d) => d + 1), 1000);
    return () => window.clearInterval(id);
  }, [appel]);
  useRetour(appel !== null, () => setAppel(null));
  const norme = (x: string) => x.replace(/[^\d+]/g, "");
  const perso = contactsPerso.useValeur();
  const fiches = tousLesContacts(perso);
  const contact = fiches.find((c) => c.tel && norme(c.tel) === norme(numero));
  const chiffres = numero.replace(/\D/g, "");
  const suggestion = !contact && chiffres.length >= 2 ? fiches.find((c) => c.tel && c.tel.replace(/\D/g, "").includes(chiffres)) : undefined;

  if (appel) {
    return (
      <div className="tel-appel os-act entre">
        <div className="tel-appel-haut">
          <small>{appel === "sonne" ? "APPEL EN COURS" : appel === "hs" ? "SAM-TELECOM" : "APPEL TERMINÉ"}</small>
          <b>{contact ? contact.nom : numero}</b>
          {contact ? <span>{numero}</span> : null}
          <em>{appel === "sonne" ? `Appel… 00:${String(duree).padStart(2, "0")}` : appel === "hs" ? "Numéro hors service" : "Appel terminé"}</em>
        </div>
        <div className="tel-appel-photo">
          {contact ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img draggable={false} src={contact.photo} alt="" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img draggable={false} src="/aakanos/avatar.png" alt="" />
          )}
          {appel !== "sonne" ? (
            <div className="tel-hs">
              <p>Désolé, mais votre forfait ne vous permet pas d’accéder à internet ou d’appeler.</p>
              <p>Merci de faire évoluer votre forfait avec Sam-Telecom.</p>
            </div>
          ) : null}
        </div>
        <button type="button" className={`tel-raccrocher${appel === "fin" ? " fini" : ""}`} onClick={() => setAppel(null)} aria-label="Raccrocher">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </button>
      </div>
    );
  }
  const onglets = (
    <div className="tel-onglets" role="tablist">
      {(
        [
          ["clavier", "M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"],
          ["journal", "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.95 8.95 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"],
          ["contacts", "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"],
          ["favoris", "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"],
        ] as const
      ).map(([id, d]) => (
        <button key={id} type="button" role="tab" aria-selected={onglet === id} className={onglet === id ? "on" : ""} onClick={() => setOnglet(id)} aria-label={id}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d={d} />
          </svg>
        </button>
      ))}
    </div>
  );
  const nomDe = (n: string) => fiches.find((c) => c.tel && norme(c.tel) === norme(n));
  if (onglet !== "clavier") {
    const liste =
      onglet === "journal"
        ? journalAppels.map((j) => ({ ...j, fiche: nomDe(j.num) }))
        : fiches
            .filter((c) => c.tel && (onglet === "contacts" || FAVORIS_TEL.includes(c.id)))
            .map((c) => ({ id: c.id, num: c.tel!, quand: c.tel!, type: "" as const, note: "", fiche: c }));
    return (
      <div className="tel">
        {onglets}
        <div className="tel-liste">
          <div className="tel-sous">{onglet === "journal" ? "JOURNAL D’APPELS" : onglet === "contacts" ? "CONTACTS" : "FAVORIS"}</div>
          {liste.map((l) => (
            <button key={l.id} type="button" className="tel-ligne" onClick={() => (setOnglet("clavier"), lancer(l.num))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img draggable={false} src={l.fiche?.photo ?? (l.num === "700" ? "/aakanos/sam-telecom-tete.png" : "/aakanos/avatar.png")} alt="" />
              <span>
                <b>{l.fiche?.nom ?? (l.num === "700" ? "Sam-Telecom" : l.num)}</b>
                <small>
                  {l.type ? <i className={`tel-${l.type}`}>{l.type === "manque" ? "↙" : l.type === "entrant" ? "↙" : l.type === "rejete" ? "⊘" : "↗"}</i> : null}
                  {` ${l.quand}${l.note ? ` · ${l.note}` : ""}`}
                </small>
              </span>
              <em aria-hidden="true">☎</em>
            </button>
          ))}
          {onglet === "journal" ? <p className="tel-vide">Les appels sortants sont coupés : forfait Connard.</p> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="tel">
      {onglets}
      <div className="tel-numero">
        <span>{numero || " "}</span>
        {numero ? (
          <button type="button" data-son="effacer" aria-label="Effacer" onClick={() => setNumero((n) => n.slice(0, -1))}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="#aaa">
              <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
            </svg>
          </button>
        ) : null}
      </div>
      {suggestion ? (
        <button type="button" className="tel-suggestion" onClick={() => setNumero(suggestion.tel!)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img draggable={false} src={suggestion.photo} alt="" />
          <b>{suggestion.nom}</b>
          <span>{suggestion.tel}</span>
        </button>
      ) : contact ? (
        <div className="tel-suggestion">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img draggable={false} src={contact.photo} alt="" />
          <b>{contact.nom}</b>
        </div>
      ) : null}
      <div className="tel-pave">
        {TOUCHES_TEL.map(([a, b]) => (
          <button key={a} type="button" onClick={() => (dtmf(a), setNumero((n) => (n.length < 18 ? n + (a === "0" && n === "" ? "+" : a) : n)))}>
            <b>{a}</b>
            <span>{b}</span>
          </button>
        ))}
      </div>
      <button type="button" className="tel-appeler" onClick={() => lancer(numero)} disabled={!numero} aria-label="Appeler">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      </button>
    </div>
  );
}

function LigneReglage({ icone, titre, sous, onClick, droite }: { icone: ReactNode; titre: string; sous?: string; onClick?: () => void; droite?: ReactNode }) {
  if (droite) {
    return (
      <div className="reg-ligne" role="button" tabIndex={0} onClick={onClick}>
        <span className="reg-ic">{icone}</span>
        <span className="reg-t">
          <b>{titre}</b>
          {sous ? <small>{sous}</small> : null}
        </span>
        <span className="reg-droite">{droite}</span>
      </div>
    );
  }
  return (
    <button className="reg-ligne" onClick={onClick}>
      <span className="reg-ic">{icone}</span>
      <span className="reg-t">
        <b>{titre}</b>
        {sous ? <small>{sous}</small> : null}
      </span>
    </button>
  );
}
const ic = (d: string) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="#aaa" aria-hidden="true">
    <path d={d} />
  </svg>
);

const LANGUES_TEL: [LocaleName, string][] = [
  ["de", "Deutsch (Deutschland)"],
  ["fr", "Français (Bretagne)"],
  ["sv", "Svenska (Sverige)"],
  ["br", "Brezhoneg (Breizh)"],
  ["tavissiv", "Tavissiv (Aaka)"],
];

const TITRES_REGLAGES: Record<EcranReglage, string> = {
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  affichage: "Affichage",
  son: "Son",
  stockage: "Stockage",
  batterie: "Batterie",
  dateheure: "Date et heure",
  dev: "Options pour les développeurs",
};

/** Le panneau « Réglages rapides » du rideau (tuiles façon Jelly Bean). */
function ReglagesRapides({ ouvrirReglages, verrouiller }: { ouvrirReglages: (el: Element) => void; verrouiller: () => void }) {
  const s = useSysteme();
  const tuile = (cle: string, titre: string, sous: string, actif: boolean, d: string, onClick: (el: Element) => void) => (
    <button key={cle} className={`qs-tuile${actif ? " on" : ""}`} onClick={(e) => onClick(e.currentTarget)}>
      <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
        <path d={d} />
      </svg>
      <b>{titre}</b>
      <small>{sous}</small>
    </button>
  );
  return (
    <div className="qs">
      {tuile("casto", "Casto", "Propriétaire", true, "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z", () => toast("Casto. Magnifique, d’après lui."))}
      {tuile("lum", "Luminosité", `${Math.round(s.lum * 100)} %`, true, "M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18a6 6 0 1 1 0-12z", () => s.regler({ lum: s.lum >= 0.95 ? 0.3 : s.lum >= 0.55 ? 1 : 0.6 }))}
      {tuile("reglages", "Réglages", "Tous les réglages", true, "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z", ouvrirReglages)}
      {tuile("wifi", "Wi-Fi", s.avion ? "Mode Avion" : s.wifi ? "Pas d’internet" : "Désactivé", s.wifi && !s.avion, "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z", () => (s.avion ? toast("Désactivez d’abord le mode Avion") : s.regler({ wifi: !s.wifi })))}
      {tuile("reseau", "Sam-Telecom", "Forfait Connard", !s.avion, "M2 22h20V2z", () => toast("Forfait Connard : SMS uniquement"))}
      {tuile("batt", "Batterie", "75 %", true, "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z", () => toast("75 %. Il en reste assez pour attendre."))}
      {tuile("bt", "Bluetooth", s.bt && !s.avion ? "Activé" : "Désactivé", s.bt && !s.avion, "M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z", () => (s.avion ? toast("Désactivez d’abord le mode Avion") : s.regler({ bt: !s.bt })))}
      {tuile("son", s.muet ? "Silencieux" : "Son", s.muet ? "Aucun son" : "Activé", !s.muet, s.muet ? "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" : "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z", () => {
        s.regler({ muet: !s.muet });
        if (s.muet) window.setTimeout(() => sonSynth("bulle"), 30);
      })}
      {tuile("avion", "Mode Avion", s.avion ? "Activé" : "Désactivé", s.avion, "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z", () => s.regler({ avion: !s.avion }))}
      {tuile("verrou", "Verrouiller", "Écran", false, "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z", verrouiller)}
    </div>
  );
}

function AppReglages({ quitter }: { quitter: () => void }) {
  const act = useActivite<"liste" | "apropos" | EcranReglage>("liste");
  const sys = useSysteme();
  const tapes = useRef(0);
  const ecran = act.ecran;
  const [dialogue, setDialogueBrut] = useState<null | "apparence" | "langue">(null);
  const [remise, setRemise] = useState(false);
  const [dlgSort, setDlgSort] = useState(false);
  const setDialogue = (v: null | "apparence" | "langue") => {
    if (v) return setDialogueBrut(v);
    setDlgSort(true);
    window.setTimeout(() => {
      setDlgSort(false);
      setDialogueBrut(null);
    }, 220);
  };
  // La langue est celle du site (choisie avant d'entrer), et on peut la changer ici.
  const { locale: langue, setLocale } = useLocale();
  useRetour(ecran !== "liste" || dialogue !== null, () => (dialogue ? setDialogue(null) : act.retour()));

  const choisirLangue = (l: LocaleName) => {
    setLocale(l);
    setDialogue(null);
  };

  if (ecran !== "liste" && ecran !== "apropos") {
    return (
      <Activite act={act}>
        <div className="reg2-entete">{TITRES_REGLAGES[ecran]}</div>
        <div className="reg2-cadre">
          <SousReglage ecran={ecran} />
        </div>
      </Activite>
    );
  }
  const build = () => {
    if (sys.dev) return toast("Inutile, vous êtes déjà développeur.");
    tapes.current += 1;
    const reste = 7 - tapes.current;
    if (reste <= 0) {
      tapes.current = 0;
      sys.regler({ dev: true });
      sonSynth("dev");
      toast("Vous êtes maintenant développeur !");
    } else if (reste <= 4) toast(`Plus que ${reste} étape${reste > 1 ? "s" : ""} pour devenir développeur.`);
  };

  if (ecran === "apropos") {
    return (
      <Activite act={act}>
      <div className="app-defile">
        <div className="apropos-logo">
          <LogoAakanos icone taille={120} className="apropos-etoiles" />
          <b>AakanOS</b>
        </div>
        <Titre>À PROPOS DU TÉLÉPHONE</Titre>
        {[
          ["Système", "AakanOS"],
          ["Version d’Odyssée", "0.2 · 24 novembre 2026"],
          ["Version précédente", "0.1 · 23 novembre 2026"],
          ["Propriétaire", "Casto"],
          ["Modèle", "Hanck 7 Pro Max"],
          ["Navigateur", "Nounou Browser"],
          ["Interface", "AakanOS"],
          ["Opérateur", "Sam-Telecom · forfait Connard"],
          ["Version de bande de base", "SAM-CONNARD-01"],
        ].map(([a, b]) => (
          <div key={a} className="app-ligne">
            <b>{a}</b>
            <span>{b}</span>
          </div>
        ))}
        <button className="app-ligne reg2-build" onClick={build}>
          <b>Numéro de build</b>
          <span>ODY-0.2.241124 · test-keys</span>
        </button>
        <a className="app-ligne" href="/aakanos/NOTICE.txt" target="_blank" rel="noopener noreferrer">
          <b>Licences open source</b>
          <span>Icônes et sons système : licence Apache 2.0</span>
        </a>
      </div>
      </Activite>
    );
  }

  return (
    <Activite act={act}>
    <div className="app-defile">
      <Titre>SANS FIL ET RÉSEAUX</Titre>
      <LigneReglage
        icone={ic("M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z")}
        titre="Wi-Fi"
        sous={sys.avion ? "Mode Avion activé" : sys.wifi ? "Pas d’accès à internet" : "Désactivé"}
        onClick={() => act.aller("wifi")}
        droite={<Interrupteur on={sys.wifi && !sys.avion} onChange={(v) => (sys.avion ? toast("Désactivez d’abord le mode Avion") : sys.regler({ wifi: v }))} />}
      />
      <LigneReglage
        icone={ic("M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z")}
        titre="Bluetooth"
        sous={sys.bt && !sys.avion ? "Visible : Hanck 7 Pro Max" : "Désactivé"}
        onClick={() => act.aller("bluetooth")}
        droite={<Interrupteur on={sys.bt && !sys.avion} onChange={(v) => (sys.avion ? toast("Désactivez d’abord le mode Avion") : sys.regler({ bt: v }))} />}
      />
      <LigneReglage
        icone={ic("M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z")}
        titre="Mode Avion"
        sous="Aucun effet sur le forfait Connard, qui ne fait déjà presque rien"
        onClick={() => sys.regler({ avion: !sys.avion })}
        droite={<Interrupteur on={sys.avion} onChange={(v) => sys.regler({ avion: v })} />}
      />
      <Titre>PERSONNEL</Titre>
      <LigneReglage
        icone={ic("M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.61-.23-1.2-.64-1.67a.528.528 0 0 1-.13-.33c0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm5.5 11c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zM5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S7.33 13 6.5 13 5 12.33 5 11.5zm6-4c0 .83-.67 1.5-1.5 1.5S8 8.33 8 7.5 8.67 6 9.5 6s1.5.67 1.5 1.5z")}
        titre="Apparence"
        sous={`Thème ${THEMES.find((th) => th.id === (sys.theme ?? "holo"))?.nom ?? "Holo"}`}
        onClick={() => setDialogue("apparence")}
      />
      <LigneReglage
        icone={ic("M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z")}
        titre="Langue"
        sous={LANGUES_TEL.find(([id]) => id === langue)?.[1] ?? "Deutsch"}
        onClick={() => setDialogue("langue")}
      />
      <Titre>APPAREIL</Titre>
      <LigneReglage icone={ic("M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z")} titre="Son" sous={sys.muet ? "Mode silencieux" : "Sons activés"} onClick={() => act.aller("son")} />
      <LigneReglage icone={ic("M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z")} titre="Affichage" sous={`Luminosité ${Math.round(sys.lum * 100)} % · fond d’écran`} onClick={() => act.aller("affichage")} />
      <LigneReglage icone={ic("M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z")} titre="Stockage" sous="Le stockage du téléphone" onClick={() => act.aller("stockage")} />
      <LigneReglage icone={ic("M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z")} titre="Batterie" sous="Sur batterie · 75 %" onClick={() => act.aller("batterie")} />
      <LigneReglage
        icone={ic("M19 9c-2-2-3.01-7-9.03-7C4.95 2 1.94 6 2 11.52 2.06 17.04 6.96 19 9.73 19c2.6 0 4.3-1.38 5.65-2.88C17 14.3 21 13.24 21 11.5c0-1.06-1.13-1.6-2-2.5z")}
        titre="Easter egg"
        sous="Écrire en Aaka (dans le site)"
        onClick={() => window.location.assign("/?parametres=oeuf")}
      />
      <LigneReglage
        icone={ic("M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z")}
        titre="Édition"
        sous="Code à 6 chiffres (dans le site)"
        onClick={() => window.location.assign("/?parametres=edition")}
      />
      <Titre>SYSTÈME</Titre>
      <LigneReglage icone={ic("M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z")} titre="Date et heure" sous="Automatique · Europe/Paris" onClick={() => act.aller("dateheure")} />
      {sys.dev ? (
        <LigneReglage icone={ic("M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z")} titre="Options pour les développeurs" onClick={() => act.aller("dev")} />
      ) : null}
      <LigneReglage
        icone={ic("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z")}
        titre="À propos du téléphone"
        sous="AakanOS · Odyssée 0.2"
        onClick={() => act.aller("apropos")}
      />
      <LigneReglage
        icone={ic("M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18z")}
        titre="Réinitialiser le téléphone"
        sous="Efface contacts, messages, notes, alarmes et réglages de cette session"
        onClick={() => setRemise(true)}
      />
      <LigneReglage icone={ic("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z")} titre="Revenir au site classique" sous="Quitter AakanOS" onClick={quitter} />
      {remise ? (
        <DlgFenetre titre="Réinitialiser le téléphone ?" fermer={() => setRemise(false)}>
          <p className="dlg-corps">Tout ce que vous avez fait sur ce téléphone sera effacé : contacts créés, messages, notes, alarmes, contacts bloqués et réglages. Le téléphone redémarrera.</p>
          <div className="dlg-boutons">
            <button onClick={() => setRemise(false)}>Annuler</button>
            <button data-son="undock" onClick={reinitialiserTelephone}>Réinitialiser</button>
          </div>
        </DlgFenetre>
      ) : null}

      {dialogue ? (
        <div className={`dlg-fond${dlgSort ? " sort" : ""}`} onClick={() => setDialogue(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-titre">{dialogue === "apparence" ? "Apparence" : "Langue"}</div>
            {dialogue === "apparence" ? (
              <>
                <div className="dlg-themes">
                  {THEMES.map((th) => (
                    <button key={th.id} type="button" className={`dlg-theme${(sys.theme ?? "holo") === th.id ? " on" : ""}`} onClick={() => (sys.regler({ theme: th.id }), toast(`Thème : ${th.nom}`))}>
                      <i className={`apercu-${th.id}`} />
                      <b>{th.nom}</b>
                      <small>{th.sous}</small>
                    </button>
                  ))}
                </div>
                <button className="dlg-choix" onClick={() => setDialogue(null)}>
                  AakanOS <i className="on" />
                </button>
                <button className="dlg-choix" onClick={quitter}>
                  Site classique <i />
                </button>
              </>
            ) : (
              <>
                {LANGUES_TEL.map(([id, nom]) => (
                  <button key={id} className="dlg-choix" translate="no" onClick={() => choisirLangue(id)}>
                    {nom} <i className={langue === id ? "on" : ""} />
                  </button>
                ))}
              </>
            )}
            <button className="dlg-annuler" onClick={() => setDialogue(null)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
    </Activite>
  );
}
