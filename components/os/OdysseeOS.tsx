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
import { DauphinPixel, JeuDauphin } from "./Dauphin";
import { IconeAncienne } from "./IconesAnciennes";
import { LogoNounou, NavigateurNounou } from "./Nounou";
import { AppPulpus, LogoPulpus } from "./Pulpus";
import { AppSamTelecom } from "./SamTelecom";
import { AppPeeporn, AppSharkobank } from "./HorsLigne";

/* ---------------- Données ---------------- */

type IdAppli = "telephone" | "pulpus" | "samtelecom" | "sharkobank" | "peeporn" | "contacts" | "qui" | "album" | "projets" | "citations" | "messages" | "nounou" | "instagram" | "endurreisen" | "reglages" | "dauphin";
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
  { id: "instagram", nom: "Instagram", externe: "https://instagram.com/fjhchristenhmbk" },
  { id: "endurreisen", nom: "Endurreisen" },
  { id: "reglages", nom: "Réglages" },
];
const par = (id: IdAppli) => APPLIS.find((a) => a.id === id)!;
const PAGE1: IdAppli[] = ["projets", "album", "citations", "contacts", "endurreisen", "instagram", "pulpus", "reglages", "samtelecom"];
const PAGE2: IdAppli[] = ["sharkobank", "peeporn"];
const DOCK: IdAppli[] = ["telephone", "messages", "nounou", "contacts"];

const CODE = "6458";
const MAIL = "franckjhchristen@gmail.com";
const INSTA = "https://instagram.com/fjhchristenhmbk";
const OUVERTURE = new Date("2026-12-01T00:00:00+01:00").getTime();
const DEBUT_ENDU = new Date("2026-07-23T00:00:00+02:00").getTime();
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
  { id: "celjo", nom: "Celjo", photo: "/aakanos/celjo.svg" },
  { id: "pacifick", nom: "Pacifick", photo: "/aakanos/pacifick.svg" },
  { id: "samtelecom", nom: "Sam-Telecom", photo: "/aakanos/sam-telecom-tete.png" },
];
/** Les SMS automatiques de l'opérateur, reçus 5 secondes après le déverrouillage. On ne peut pas y répondre. */
const SMS_SAM_TELECOM = [
  "Sam-Telecom : Bonjour, nous vous remercions de votre fidélité. Votre facture de novembre est disponible dans votre Espace Client, sur notre site internet et dans l’application Sam-Telecom. Téléchargez l’application sur Pulpüs market pour suivre votre consommation et modifier votre forfait.",
  "Rappel : votre ligne bénéficie d’un forfait Connard. Il ne comprend ni la connexion à internet ni les appels : seul l’envoi de SMS est inclus. Les appels d’urgence ne sont pas disponibles sur cette ligne, car la fonction a été désactivée ou n’a pas encore été activée. Pour l’activer ou faire évoluer votre forfait, rendez-vous dans votre Espace Client. Sam-Telecom vous souhaite une excellente journée. Ceci est un message automatique, merci de ne pas y répondre.",
];
const REPONSE_CELJO = "Salut mon pote, écoute, je suis grave occupé à refaire ma moto, alors je te répondrai quand je pourrai.";
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
    case "instagram":
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
function useRetour(actif: boolean, f: () => void) {
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
  const t = useMaintenant();
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
  useEffect(() => () => minuteurs.current.forEach((m) => clearTimeout(m)), []);
  const envoyer = useCallback((qui: Correspondant, texte: string) => {
    const id = Date.now();
    let rang = 0;
    setConvs((c) => {
      rang = c[qui].filter((x) => x.de === "moi").length;
      return { ...c, [qui]: [...c[qui], { id, de: "moi", texte, h: heureCourte() }] };
    });
    const plus = (f: () => void, ms: number) => minuteurs.current.push(window.setTimeout(f, ms));
    const reponse = qui === "gael" ? REPONSES_GAEL[rang] : rang === 0 ? (qui === "celjo" ? REPONSE_CELJO : REPONSE_PACIFICK) : undefined;
    // Celjo ne lit plus rien après sa première réponse.
    if (qui === "celjo" && rang > 0) return;
    const vu = (qui === "gael" ? 5000 : 3000) + Math.random() * (qui === "gael" ? 5000 : 3000);
    plus(() => setConvs((c) => ({ ...c, [qui]: c[qui].map((x) => (x.id === id ? { ...x, lu: true } : x)) })), vu);
    if (!reponse) return;
    plus(() => {
      setEcrit(qui);
      plus(() => {
        setEcrit(null);
        setConvs((c) => ({ ...c, [qui]: [...c[qui], { id: Date.now(), de: "lui", texte: reponse, h: heureCourte() }] }));
        if (convOuverte.current !== qui) setNonLu((n) => ({ qui, n: n && n.qui === qui ? n.n + 1 : 1 }));
      }, 2200 + reponse.length * 35);
    }, vu + 900);
  }, []);
  const smsRecu = useRef(false);
  const [ticker, setTicker] = useState<string | null>(null);
  const recevoirSamTelecom = useCallback(() => {
    if (smsRecu.current) return;
    smsRecu.current = true;
    minuteurs.current.push(
      window.setTimeout(() => {
        const h = heureCourte();
        setConvs((c) => ({ ...c, samtelecom: SMS_SAM_TELECOM.map((texte, i) => ({ id: Date.now() + i, de: "lui" as const, texte, h })) }));
        if (convOuverte.current !== "samtelecom") setNonLu({ qui: "samtelecom", n: SMS_SAM_TELECOM.length });
        setTicker(SMS_SAM_TELECOM[0]!);
        minuteurs.current.push(window.setTimeout(() => setTicker(null), 4200));
      }, 5000),
    );
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
  }, []);

  // Un contact qu'on appelle ouvre l'appli Téléphone.
  useEffect(() => {
    const f = () => ouvrir(par("telephone"));
    window.addEventListener("aakanos-appel", f);
    return () => window.removeEventListener("aakanos-appel", f);
  }, [ouvrir]);
  const fermerFenetre = useCallback(() => {
    setFermeture(true);
    setTimeout(() => {
      setFenetre(null);
      setFermeture(false);
    }, 375);
  }, []);

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
    window.location.assign("/");
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
          <img src="/aakanos/sam-telecom-tete.png" alt="" width={40} height={40} style={{ objectFit: "contain" }} />
        ) : (
          <IconeAppli id="messages" taille={40} />
        ),
      titre: nonLu ? `${CORRESPONDANTS.find((c) => c.id === nonLu.qui)!.nom}${nonLu.n > 1 ? ` (${nonLu.n} messages)` : ""}` : "Gaël",
      texte: nonLu ? convs[nonLu.qui].filter((m) => m.de === "lui").at(-1)?.texte ?? "" : "Le contact de Franck est dans Contacts",
      h: nonLu ? convs[nonLu.qui].filter((m) => m.de === "lui").at(-1)?.h ?? "09:41" : "09:41",
      appli: par("messages"),
    },
  ];
  const notifs = toutes.filter((n): n is Notif => !!n && (!effacees.includes(n.id) || (n.id === "gael" && !!nonLu)));
  const notifsTriees = nonLu ? [...notifs.filter((n) => n.id === "gael"), ...notifs.filter((n) => n.id !== "gael")] : notifs;

  const correspond = (e: Etoile) => sansAccent(`${e.titre} ${e.texte}`).includes(sansAccent(requete));
  const resultats = APPLIS.filter((a) => sansAccent(a.nom).includes(sansAccent(requete)));
  const etoilesTrouvees = requete ? (etoiles ?? []).filter(correspond).slice(0, 8) : [];

  return (
    <RetourCtx.Provider value={{ poser }}>
      <div className="os">
        <div className="os-fond">
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
              <img src="/aakanos/sam-telecom-tete.png" alt="" width={18} height={18} />
              <span>
                <b>{ticker}</b>
              </span>
            </span>
          ) : null}
          <span className="os-statut-g">
            {!verrou
              ? notifs.map((n) => (
                  <i key={n.id} className="os-mini">
                    <PictoStatut type={n.id === "citation" ? "citation" : n.id === "gael" ? "message" : "alarme"} />
                  </i>
                ))
              : null}
          </span>
          <span className="os-statut-d">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="#33b5e5" aria-hidden="true">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <b className="os-barres">
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
          <Verrouillage heure={heure} date={date} onOuvrir={() => (setVerrou(false), recevoirSamTelecom())} onQuitter={quitter} />
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
                  <div className="os-horloge">
                    <div className="os-horloge-h">{heure}</div>
                    <div className="os-horloge-d">{date.split(" ").slice(0, 3).join(" ")}</div>
                  </div>
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
                  gael={{ convs, ecrit, envoyer, vu: vuConv }}
                />
              </FenetreAppli>
            ) : null}

            {recherche ? (
              <div className="os-recherche">
                <div className="os-recherche-barre">
                  <Loupe couleur="#33b5e5" />
                  <input autoFocus placeholder="Rechercher dans AakanOS" value={requete} onChange={(e) => setRequete(e.target.value)} />
                  <button aria-label="Effacer" onClick={() => (requete ? setRequete("") : setRecherche(false))}>
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
                    <img src="/aakanos/sam-telecom-tete.png" alt="" width={14} height={14} />
                    SAM-TELECOM
                  </span>
                  <br />
                  {date.split(" ")[0]?.toUpperCase()}
                  <br />
                  {date.split(" ").slice(1).join(" ").toUpperCase()} {d?.getFullYear()}
                </div>
                <button className="os-rideau-reglages" aria-label="Réglages" onClick={(e) => ouvrir(par("reglages"), e.currentTarget)}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#ccc">
                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                  </svg>
                </button>
              </div>
              <div className="os-rideau-liste">
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
                        <button onClick={() => setEffacees((x) => [...x, n.id])}>IGNORER</button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {notifs.length > 0 ? (
                  <button className="os-effacer" onClick={() => setEffacees(["citation", "endurreisen", "gael"])}>
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
      </div>
    </RetourCtx.Provider>
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
  return (
    <button className="os-app" onClick={(e) => ouvrir(a, e.currentTarget.querySelector(".os-icone"))}>
      <IconeAppli id={a.id} taille={sansNom ? 52 : 56} />
      {!sansNom && <span>{a.nom}</span>}
    </button>
  );
}

function Grille({ ids, ouvrir, cle }: { ids: IdAppli[]; ouvrir: (a: Appli, el?: Element | null) => void; cle?: string }) {
  return (
    <div className="os-grille" key={cle}>
      {ids.map((id, i) => (
        <div key={id} className="os-grille-case" style={{ animationDelay: `${i * 22}ms` }}>
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

function Verrouillage({ heure, date, onOuvrir, onQuitter }: { heure: string; date: string; onOuvrir: () => void; onQuitter: () => void }) {
  const [saisi, setSaisi] = useState("");
  const [erreur, setErreur] = useState(false);
  const [part, setPart] = useState(false);

  const verifier = useCallback(
    (code: string) => {
      if (code === CODE) {
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
      if (/^[0-9]$/.test(e.key)) appui(e.key);
      else if (e.key === "Backspace") appui("⌫");
      else if (e.key === "Enter") appui("OK");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [appui]);

  return (
    <div className={`os-verrou${part ? " part" : ""}`}>
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
          <button key={a} className={a === "OK" ? "ok" : a === "⌫" ? "eff" : ""} onClick={() => appui(a)} aria-label={a === "⌫" ? "Effacer" : a}>
            <b>{a}</b>
            <span>{b}</span>
          </button>
        ))}
      </div>
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
    <div className={`os-fenetre${fermeture ? " ferme" : ""}`} style={style}>
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
      return <AppEndurreisen t={t} />;
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
        <img src="/media/franck.jpg" alt="" />
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
      <div className="album-plein" onClick={() => setVue((v) => ((v ?? 0) + 1) % ALBUM.length)}>
        {el.kind === "video" ? (
          <video key={el.src} src={el.src} poster={el.poster} autoPlay loop playsInline muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={el.src} src={el.src} alt="" />
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
  // Notes : chaque citation est une note sur papier jaune.
  const liste = (etoiles ?? []).filter((e) => e.genre !== "projet" && e.texte?.trim());
  const [ouverte, setOuverte] = useState<string | null>(null);
  useRetour(ouverte !== null, () => setOuverte(null));
  const n = liste.find((c) => c.id === ouverte);
  if (n) {
    return (
      <div className="app-defile note-papier">
        <div className="note-date">{n.date}</div>
        <p className="note-texte">{n.texte}</p>
        <div className="note-signe">— {n.auteur}</div>
      </div>
    );
  }
  return (
    <div className="app-defile">
      <Titre>NOTES · {liste.length}</Titre>
      {etoiles === null ? <Chargement /> : null}
      {liste.map((c) => (
        <button key={c.id} className="note-ligne" onClick={() => setOuverte(c.id)}>
          <b>{c.texte.slice(0, 40)}{c.texte.length > 40 ? "…" : ""}</b>
          <span>{c.date}</span>
        </button>
      ))}
    </div>
  );
}

function AppEndurreisen({ t }: { t: number | null }) {
  const c = decompte(t, OUVERTURE);
  const p = t ? Math.min(1, Math.max(0, (t - DEBUT_ENDU) / (OUVERTURE - DEBUT_ENDU))) : 0;
  const R = 110;
  const L = 2 * Math.PI * R;
  return (
    <div className="app-defile endu">
      <div className="endu-boite">
        <svg viewBox="0 0 260 260" width="260" height="260">
          <circle cx="130" cy="130" r={R} fill="none" stroke="#2a2a2a" strokeWidth="10" />
          <circle
            cx="130"
            cy="130"
            r={R}
            fill="none"
            stroke="#33b5e5"
            strokeWidth="10"
            strokeDasharray={L}
            strokeDashoffset={L * (1 - p)}
            transform="rotate(-90 130 130)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <circle cx={130 + R * Math.sin(p * 2 * Math.PI)} cy={130 - R * Math.cos(p * 2 * Math.PI)} r="9" fill="#33b5e5" />
        </svg>
        <div className="endu-centre">
          <b>{c.fini ? "0" : c.j}</b>
          <span>jours</span>
          <em>
            {deux(c.h)}:{deux(c.m)}:{deux(c.s)}
          </em>
        </div>
      </div>
      <p className="endu-txt">{c.fini ? "Endurreisen est ouvert." : "avant l’ouverture d’Endurreisen, le 1ᵉʳ décembre 2026"}</p>
    </div>
  );
}

type PropsGael = { convs: Record<Correspondant, MsgGael[]>; ecrit: Correspondant | null; envoyer: (qui: Correspondant, t: string) => void; vu: (ouverte: Correspondant | null) => void };

function AppMessages({ convs, ecrit, envoyer, vu }: PropsGael) {
  const [conv, setConv] = useState<Correspondant | null>(null);
  const [texte, setTexte] = useState("");
  const liste = useRef<HTMLDivElement>(null);
  useRetour(conv !== null, () => setConv(null));
  useEffect(() => {
    vu(conv);
    return () => vu(null);
  }, [conv, vu]);
  const msgs = conv ? convs[conv] : [];
  useEffect(() => {
    const l = liste.current;
    if (l) l.scrollTo({ top: l.scrollHeight, behavior: "smooth" });
  }, [msgs.length, ecrit, conv]);

  if (!conv) {
    return (
      <div className="app-defile os-act entre">
        {[...CORRESPONDANTS]
          .filter((c) => c.id !== "samtelecom" || convs.samtelecom.length > 0)
          .sort((a, b) => (convs[b.id].at(-1)?.id ?? 0) - (convs[a.id].at(-1)?.id ?? 0))
          .map((c) => {
          const dernier = convs[c.id].at(-1);
          return (
            <button key={c.id} className="msg-conv" onClick={() => setConv(c.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="msg-avatar" src={c.photo} alt="" />
              <div>
                <b>{c.nom}</b>
                <span>{dernier ? `${dernier.de === "moi" ? "Moi : " : ""}${dernier.texte}` : c.accueil ? "Le contact de Franck est dans Contacts" : "Nouvelle conversation"}</span>
              </div>
              <em>{dernier?.h ?? (c.accueil ? "09:41" : "")}</em>
            </button>
          );
        })}
      </div>
    );
  }
  const c = CORRESPONDANTS.find((x) => x.id === conv)!;
  // eslint-disable-next-line @next/next/no-img-element
  const avatar = <img className="msg-avatar" src={c.photo} alt="" />;
  const derniersMoi = msgs.filter((m) => m.de === "moi").at(-1);
  const bloque = BLOQUE_APRES[conv] > 0 && msgs.filter((m) => m.de === "lui").length >= BLOQUE_APRES[conv];
  return (
    <div className="msg-fil os-act entre" key={conv}>
      <div className="msg-liste" ref={liste}>
        <div className="msg-date">AUJOURD’HUI</div>
        {c.accueil ? (
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
            <div key={m.id} className="msg-bulle moi">
              <p>
                {m.texte}
                <em>{m === derniersMoi ? (m.lu ? `Lu · ${m.h}` : `Envoyé · ${m.h}`) : m.h}</em>
              </p>
            </div>
          ) : (
            <div key={m.id} className="msg-bulle">
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
      {ecrit === conv ? <div className="msg-statut">{c.nom} est en train d’écrire…</div> : null}
      {conv === "samtelecom" ? (
        <div className="msg-bloque msg-noreply">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#888" aria-hidden="true">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          Vous ne pouvez pas répondre à ce message.
        </div>
      ) : bloque ? (
        <div className="msg-bloque">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4444" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z" />
          </svg>
          {c.nom} vous a bloqué. Vous ne pouvez plus lui écrire.
        </div>
      ) : (
        <form
          className="msg-saisie"
          onSubmit={(e) => {
            e.preventDefault();
            const v = texte.trim();
            if (!v) return;
            envoyer(conv, v);
            setTexte("");
          }}
        >
          <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={`Écrire un message à ${c.nom}`} enterKeyHint="send" />
          <button aria-label="Envoyer" disabled={!texte.trim()}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill={texte.trim() ? "#33b5e5" : "#555"}>
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

type Contact = { id: string; nom: string; photo: string; tel?: string; mail?: string; insta?: string; note?: string };
const CONTACTS: Contact[] = [
  { id: "celjo", nom: "Celjo", photo: "/aakanos/celjo.svg", tel: "+0-20070600084", note: "Le lapin, toujours sur son scooter." },
  { id: "franck", nom: "Franck J.H. Christen H.M.B.K.", photo: "/media/franck.jpg", mail: MAIL, insta: "@fjhchristenhmbk", note: "Une idée, une question, un projet à partager ? Deux chemins mènent jusqu’à lui." },
  { id: "gael", nom: "Gaël", photo: "/aakanos/gael.jpg", tel: "+0-2003220008" },
  { id: "pacifick", nom: "Pacifick", photo: "/aakanos/pacifick.svg", tel: "+0-43365470730", note: "L’orque. Il nage." },
];

/** Contacts : Celjo, Franck, Gaël, Pacifick. */
function AppContacts() {
  const [choisi, setChoisi] = useState<string | null>(null);
  useRetour(choisi !== null, () => setChoisi(null));
  const c = CONTACTS.find((x) => x.id === choisi);
  if (!c) {
    return (
      <div className="app-defile os-act entre">
        <div className="ct-recherche">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#888"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <span>Rechercher des contacts</span>
        </div>
        {CONTACTS.map((x, i) => {
          const l = x.nom[0]!.toUpperCase();
          const titre = i === 0 || CONTACTS[i - 1]!.nom[0]!.toUpperCase() !== l ? <div className="os-titre-holo">{l}</div> : null;
          return (
            <div key={x.id}>
              {titre}
              <button className="ct-ligne" onClick={() => setChoisi(x.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.photo} alt="" />
                <b>{x.nom}</b>
              </button>
            </div>
          );
        })}
        <p className="os-vide">{CONTACTS.length} contacts</p>
      </div>
    );
  }
  return (
    <div className="app-defile os-act entre" key={c.id}>
      <div className="ct-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.photo} alt="" />
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
            <img src="/aakanos/phone.png" alt="" />
          </a>
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
            <img src="/aakanos/email.png" alt="" />
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
            <img src="/aakanos/camera.png" alt="" />
          </a>
        </>
      ) : null}
      {c.note ? (
        <>
          <div className="os-titre-holo">NOTE</div>
          <p className="app-texte">{c.note}</p>
        </>
      ) : null}
    </div>
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

function AppTelephone() {
  // Ouvert depuis un contact : l'appel part tout de suite.
  const [numero, setNumero] = useState(() => appelEnAttente ?? "");
  const [appel, setAppel] = useState<null | "sonne" | "hs" | "fin">(() => (appelEnAttente ? "sonne" : null));
  const [duree, setDuree] = useState(0);
  const lancer = useCallback((n: string) => {
    if (!n) return;
    setNumero(n);
    setAppel("sonne");
    setDuree(0);
  }, []);
  useEffect(() => {
    appelEnAttente = null;
  }, []);
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
  const contact = CONTACTS.find((c) => c.tel && norme(c.tel) === norme(numero));

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
            <img src={contact.photo} alt="" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/aakanos/avatar.png" alt="" />
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
  return (
    <div className="tel">
      <div className="tel-numero">
        <span>{numero || " "}</span>
        {numero ? (
          <button type="button" aria-label="Effacer" onClick={() => setNumero((n) => n.slice(0, -1))}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="#aaa">
              <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="tel-pave">
        {TOUCHES_TEL.map(([a, b]) => (
          <button key={a} type="button" onClick={() => setNumero((n) => (n.length < 18 ? n + (a === "0" && n === "" ? "+" : a) : n))}>
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

function LigneReglage({ icone, titre, sous, onClick }: { icone: ReactNode; titre: string; sous?: string; onClick?: () => void }) {
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

function AppReglages({ quitter }: { quitter: () => void }) {
  const act = useActivite<"liste" | "apropos">("liste");
  const ecran = act.ecran;
  const [dialogue, setDialogueBrut] = useState<null | "apparence" | "langue">(null);
  const [dlgSort, setDlgSort] = useState(false);
  const setDialogue = (v: null | "apparence" | "langue") => {
    if (v) return setDialogueBrut(v);
    setDlgSort(true);
    window.setTimeout(() => {
      setDlgSort(false);
      setDialogueBrut(null);
    }, 220);
  };
  const [langue, setLangue] = useState<"fr" | "tavissiv">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("fjch-lang") === "tavissiv" ? "tavissiv" : "fr";
    } catch {
      return "fr";
    }
  });
  useRetour(ecran !== "liste" || dialogue !== null, () => (dialogue ? setDialogue(null) : act.retour()));

  const choisirLangue = (l: "fr" | "tavissiv") => {
    setLangue(l);
    try {
      localStorage.setItem("fjch-lang", l);
    } catch {}
    setDialogue(null);
  };

  if (ecran === "apropos") {
    return (
      <Activite act={act}>
      <div className="app-defile">
        <div className="apropos-logo">
          <DauphinPixel largeur={170} />
          <b>AakanOS</b>
        </div>
        <Titre>À PROPOS DU TÉLÉPHONE</Titre>
        {[
          ["Système", "AakanOS"],
          ["Version d’Odyssée", "0.2 · 24 novembre 2026"],
          ["Version précédente", "0.1 · 23 novembre 2026"],
          ["Propriétaire", "Franck J.H. Christen H.M.B.K."],
          ["Navigateur", "Nounou Browser"],
          ["Interface", "inspirée d’Android 4.1 Jelly Bean"],
        ].map(([a, b]) => (
          <div key={a} className="app-ligne">
            <b>{a}</b>
            <span>{b}</span>
          </div>
        ))}
        <a className="app-ligne" href="/aakanos/NOTICE.txt" target="_blank" rel="noopener noreferrer">
          <b>Licences open source</b>
          <span>Icônes système : Android Open Source Project, licence Apache 2.0</span>
        </a>
      </div>
      </Activite>
    );
  }

  return (
    <Activite act={act}>
    <div className="app-defile">
      <Titre>PERSONNEL</Titre>
      <LigneReglage
        icone={ic("M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.61-.23-1.2-.64-1.67a.528.528 0 0 1-.13-.33c0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm5.5 11c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zM5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S7.33 13 6.5 13 5 12.33 5 11.5zm6-4c0 .83-.67 1.5-1.5 1.5S8 8.33 8 7.5 8.67 6 9.5 6s1.5.67 1.5 1.5z")}
        titre="Apparence"
        sous="AakanOS"
        onClick={() => setDialogue("apparence")}
      />
      <LigneReglage
        icone={ic("M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z")}
        titre="Langue"
        sous={langue === "tavissiv" ? "Tavissiv (Aaka)" : "Français (Bretagne)"}
        onClick={() => setDialogue("langue")}
      />
      <Titre>APPAREIL</Titre>
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
      <LigneReglage
        icone={ic("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z")}
        titre="À propos du téléphone"
        sous="AakanOS · Odyssée 0.2"
        onClick={() => act.aller("apropos")}
      />
      <LigneReglage icone={ic("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z")} titre="Revenir au site classique" sous="Quitter AakanOS" onClick={quitter} />

      {dialogue ? (
        <div className={`dlg-fond${dlgSort ? " sort" : ""}`} onClick={() => setDialogue(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-titre">{dialogue === "apparence" ? "Apparence" : "Langue"}</div>
            {dialogue === "apparence" ? (
              <>
                <button className="dlg-choix" onClick={() => setDialogue(null)}>
                  AakanOS <i className="on" />
                </button>
                <button className="dlg-choix" onClick={quitter}>
                  Site classique <i />
                </button>
              </>
            ) : (
              <>
                <button className="dlg-choix" onClick={() => choisirLangue("fr")}>
                  Français (Bretagne) <i className={langue === "fr" ? "on" : ""} />
                </button>
                <button className="dlg-choix" onClick={() => choisirLangue("tavissiv")}>
                  Tavissiv (Aaka) <i className={langue === "tavissiv" ? "on" : ""} />
                </button>
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
