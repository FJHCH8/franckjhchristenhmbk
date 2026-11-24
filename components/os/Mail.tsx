"use client";

/**
 * E-mail : la messagerie Jelly Bean du téléphone, compte castotessis@nounoumail.dav.
 * Pas d'internet avec le forfait Connard : on écrit, le message attend dans la boîte d'envoi.
 * Seule Sharkobank passe toujours, par son « réseau prioritaire » (facturé, évidemment).
 */
import { useEffect, useState, type ReactNode } from "react";
import { creerStore, heureCourte, notifier } from "./Memoire";
import { toast } from "./Systeme";
import { useRetour } from "./OdysseeOS";
import { sonSynth } from "./sonsSynth";

export const COMPTE = "castotessis@nounoumail.dav";

/* ---------------- Logos (originaux, en SVG) ---------------- */

/** Le logo Peeporn existant (celui de l'appli Peeporn), pour l'avatar et l'en-tête des courriels. */
const LOGO_PEEPORN = "/aakanos/peeporn.png";
/** L'icône Sharkobank existante (celle de l'appli) pour l'avatar de l'expéditeur. */
const LOGO_SHARKOBANK = "/aakanos/sharkobank.png";
/** Le logo envoyé par Franck, pour l'en-tête des courriers Sharkobank. */
const ENTETE_SHARKOBANK = "/aakanos/sharkobank-mail-logo.svg";

/** L'icône de l'appli E-mail d'Android 4.2 (AOSP, Apache 2.0). */
function IconeMail({ taille = 56 }: { taille?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="os-icone" src="/aakanos/aosp/ic_launcher_email.svg" width={taille} height={taille} alt="" draggable={false} />
  );
}
export { IconeMail };

/* ---------------- Le courrier ---------------- */

type Bloc = { p: string } | { fiche: [string, string][]; titre?: string } | { total: [string, string][] } | { logo: "peeporn" | "sharkobank" };
export type Courriel = { id: string; de: "peeporn" | "sharkobank"; nom: string; adresse: string; objet: string; date: string; heure: string; corps: Bloc[]; direct?: number };

const SK = { de: "sharkobank" as const, nom: "Sharkobank", adresse: "alertes@sharkobank.dav" };

export const COURRIELS: Courriel[] = [
  {
    id: "pp1",
    de: "peeporn",
    nom: "Peeporn sex-shop",
    adresse: "commandes@peeporn.dav",
    objet: "Paiement refusé pour votre commande 43-454535-86729",
    date: "23 nov.",
    heure: "22:14",
    corps: [
      { logo: "peeporn" },
      { p: "Bonjour," },
      { p: "Votre paiement pour la commande 43-454535-86729 a été refusé." },
      {
        titre: "Détail du panier : Plug anal en silicone",
        fiche: [
          ["Matière", "Silicone médical, sans phtalates"],
          ["Taille", "M"],
          ["Longueur totale", "10,5 cm"],
          ["Diamètre maximal", "3,2 cm"],
          ["Couleur", "Vert grenouille"],
          ["Base", "Évasée, de sécurité"],
          ["Lubrifiant", "Compatible à base d’eau"],
          ["Entretien", "Lavable à l’eau tiède savonneuse"],
          ["Expédition", "Emballage discret et neutre"],
          ["Quantité", "1"],
        ],
      },
      {
        total: [
          ["Total", "16,99 €"],
          ["Livraison", "5 €"],
          ["Frais d’annulation", "2,99 €"],
        ],
      },
      { p: "Votre commande a été annulée avec des frais de 2,99 € qu’il faudra payer avant de finaliser une autre commande." },
      { p: "Merci de renouveler votre paiement sur notre site ou notre application, ainsi que de payer vos frais d’annulation." },
      { p: "Au revoir," },
      { p: "L’équipe Peeporn sex-shop." },
    ],
  },
  {
    id: "sk1",
    ...SK,
    objet: "Votre compte est à découvert",
    date: "3 nov.",
    heure: "08:00",
    corps: [
      { logo: "sharkobank" },
      { p: "Cher Casto," },
      { p: "Nous avons remarqué que le solde de votre compte courant est passé sous zéro : −9,18 €." },
      { p: "Pas de panique. Enfin, un peu quand même." },
      { p: "Merci de régulariser votre situation dans les meilleurs délais." },
      { p: "Votre conseiller Sharkobank" },
    ],
  },
  {
    id: "sk2",
    ...SK,
    objet: "Rappel : votre compte est toujours à découvert",
    date: "7 nov.",
    heure: "08:00",
    corps: [
      { logo: "sharkobank" },
      { p: "Cher Casto," },
      { p: "Sauf erreur de notre part (il n’y en a jamais), votre compte est toujours à découvert." },
      { total: [["Ancien solde", "−9,18 €"], ["Frais de rappel", "−4,90 €"], ["Nouveau solde", "−14,08 €"]] },
      { p: "Ce rappel vous a été facturé, comme indiqué ci-dessus. Pour éviter d’autres rappels, régularisez votre situation." },
      { p: "Votre conseiller Sharkobank" },
    ],
  },
  {
    id: "sk3",
    ...SK,
    objet: "Frais de découvert appliqués",
    date: "12 nov.",
    heure: "07:58",
    corps: [
      { logo: "sharkobank" },
      { p: "Cher Casto," },
      { p: "Conformément à nos conditions générales (page 412, en tout petit), les frais suivants ont été prélevés :" },
      {
        total: [
          ["Frais de découvert", "−4,90 €"],
          ["Frais d’envoi du courriel annonçant les frais", "−4,90 €"],
          ["Commission d’intervention", "−4,10 €"],
          ["Nouveau solde", "−27,98 €"],
        ],
      },
      { p: "Régularisez votre situation au plus vite." },
      { p: "Votre conseiller Sharkobank" },
    ],
  },
  {
    id: "sk4",
    ...SK,
    objet: "Régularisez votre situation",
    date: "18 nov.",
    heure: "06:30",
    corps: [
      { logo: "sharkobank" },
      { p: "Casto," },
      { p: "Votre découvert atteint désormais −52,37 €. Nos requins commencent à tourner en rond." },
      { p: "Nous avons aussi facturé la lecture de ce message (4,90 €). Si vous ne l’avez pas lu, ils seront facturés quand même, pour non-lecture." },
      { p: "Merci de régulariser votre situation sous 48 heures." },
      { p: "Le service Recouvrement Sharkobank" },
    ],
  },
  {
    id: "sk5",
    ...SK,
    objet: "Dernier avertissement avant le dernier avertissement",
    date: "21 nov.",
    heure: "03:12",
    corps: [
      { logo: "sharkobank" },
      { p: "Casto," },
      { p: "Ceci est votre dernier avertissement avant le dernier avertissement. Le vrai dernier avertissement sera facturé 9,80 €." },
      { total: [["Découvert", "−79,00 €"], ["Frais d’avertissement", "−9,80 €"], ["Nouveau solde", "−88,80 €"]] },
      { p: "Notre conseiller a essayé de vous appeler, mais votre forfait ne vous permet pas de recevoir des appels. Cela aussi vous a été facturé." },
      { p: "Régularisez votre situation. Vraiment." },
      { p: "Le service Recouvrement Sharkobank" },
    ],
  },
  {
    id: "sk6",
    ...SK,
    objet: "Votre requin-conseiller s’inquiète",
    date: "",
    heure: "",
    direct: 45_000,
    corps: [
      { logo: "sharkobank" },
      { p: "Casto," },
      { p: "Votre découvert atteint −131,13 €. Votre requin-conseiller ne dort plus. Il ne dormait déjà pas avant, c’est un requin, mais il insiste pour que vous le sachiez." },
      { p: "Ce courriel vous parvient grâce au réseau prioritaire Sharkobank, qui fonctionne même sans forfait internet. Frais de réseau prioritaire : 4,90 €." },
      { p: "Régularisez votre situation avant que nous envoyions quelqu’un. Il a beaucoup de dents." },
      { p: "Le service Recouvrement Sharkobank" },
    ],
  },
  {
    id: "sk7",
    ...SK,
    objet: "Frais de notification",
    date: "",
    heure: "",
    direct: 150_000,
    corps: [
      { logo: "sharkobank" },
      { p: "Casto," },
      { p: "Votre téléphone vient de sonner pour vous annoncer ce courriel. Cette sonnerie vous a été facturée 4,90 €." },
      { total: [["Frais de notification", "−4,90 €"], ["Frais de vibration", "−0,99 €"], ["Nouveau solde", "−137,02 €"]] },
      { p: "Pour ne plus recevoir de frais de notification, régularisez votre situation. Pour vous désabonner, des frais de désabonnement s’appliquent." },
      { p: "Le service Recouvrement Sharkobank" },
    ],
  },
];

/* ---------------- Ce que le visiteur a fait (gardé dans la session) ---------------- */

type Envoye = { id: string; a: string; objet: string; texte: string; t: number };
type EtatMail = { lus: string[]; etoiles: string[]; dossier: Record<string, "archives" | "corbeille" | "supprime">; envoyes: Envoye[]; arrives: Record<string, string> };
export const etatMail = creerStore<EtatMail>("mail", { lus: [], etoiles: [], dossier: {}, envoyes: [], arrives: {} });

type Dossier = "reception" | "suivis" | "envoi" | "archives" | "corbeille";
const DOSSIERS: [Dossier, string][] = [
  ["reception", "Boîte de réception"],
  ["suivis", "Suivis"],
  ["envoi", "Boîte d’envoi"],
  ["archives", "Archives"],
  ["corbeille", "Corbeille"],
];

const logo = (de: Courriel["de"]) => (de === "peeporn" ? LOGO_PEEPORN : LOGO_SHARKOBANK);

/** Les courriels de Sharkobank qui arrivent pendant la visite (avec notification et son). */
export function GardienMail({ actif }: { actif: boolean }) {
  useEffect(() => {
    if (!actif) return;
    const ids: number[] = [];
    for (const c of COURRIELS) {
      if (!c.direct || etatMail.lire().arrives[c.id]) continue;
      ids.push(
        window.setTimeout(() => {
          if (etatMail.lire().arrives[c.id]) return;
          etatMail.ecrire((e) => ({ ...e, arrives: { ...e.arrives, [c.id]: heureCourte() } }));
          notifier({ titre: c.nom, texte: c.objet, appli: "mail", icone: logo(c.de) });
        }, c.direct),
      );
    }
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [actif]);
  return null;
}

/* ---------------- L'appli ---------------- */

/** Icônes d'action d'Android 4.2 (AOSP, Apache 2.0 : public/aakanos/aosp/LICENCES.txt). */
const Ico = ({ n }: { n: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/aakanos/aosp/${n}.svg`} alt="" width={32} height={32} />
);
function Etoile({ on }: { on: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/aakanos/aosp/${on ? "btn_star_big_on" : "btn_star_big_off"}.svg`} alt="" width={32} height={32} />;
}

export function AppMail() {
  const e = etatMail.useValeur();
  const [dossier, setDossier] = useState<Dossier>("reception");
  const [menu, setMenu] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [ecrire, setEcrire] = useState<{ a: string; objet: string; texte: string } | null>(null);
  const [cherche, setCherche] = useState("");
  useRetour(ouvert !== null || ecrire !== null || menu, () => (menu ? setMenu(false) : ecrire ? setEcrire(null) : setOuvert(null)));

  const visibles = COURRIELS.filter((c) => !c.direct || e.arrives[c.id]);
  const place = (c: Courriel) => e.dossier[c.id];
  const dans = (d: Dossier) =>
    visibles.filter((c) => (d === "suivis" ? e.etoiles.includes(c.id) && place(c) !== "supprime" && place(c) !== "corbeille" : d === "reception" ? !place(c) : place(c) === d));
  // Les nouveaux arrivent en haut.
  const trier = (l: Courriel[]) => [...l.filter((c) => c.direct).sort((a, b) => b.direct! - a.direct!), ...l.filter((c) => !c.direct)];
  const nonLus = dans("reception").filter((c) => !e.lus.includes(c.id)).length;
  const maj = (f: (x: EtatMail) => EtatMail) => etatMail.ecrire(f);
  const basculer = (cle: "lus" | "etoiles", id: string, v?: boolean) =>
    maj((x) => {
      const deja = x[cle].includes(id);
      const veut = v ?? !deja;
      return { ...x, [cle]: veut ? (deja ? x[cle] : [...x[cle], id]) : x[cle].filter((y) => y !== id) };
    });
  const deplacer = (id: string, d: "archives" | "corbeille" | "supprime" | null, msg: string) => {
    maj((x) => {
      const dossier = { ...x.dossier };
      if (d) dossier[id] = d;
      else delete dossier[id];
      return { ...x, dossier };
    });
    toast(msg);
    setOuvert(null);
  };
  const heure = (c: Courriel) => (c.direct ? e.arrives[c.id] ?? "" : c.date);

  const barre = (
    <div className="ml-barre">
      <button className="ml-compte" onClick={() => setMenu((m) => !m)}>
        <b>{DOSSIERS.find((d) => d[0] === dossier)![1]}</b>
        <small translate="no">{COMPTE}</small>
        <i aria-hidden="true">▾</i>
      </button>
      {dossier === "reception" && nonLus > 0 ? <em className="ml-compteur">{nonLus}</em> : null}
      <button className="ml-ic" aria-label="Nouveau message" onClick={() => setEcrire({ a: "", objet: "", texte: "" })}>
        <Ico n="ic_menu_compose" />
      </button>
    </div>
  );

  if (ecrire) {
    const envoyer = () => {
      if (!ecrire.a.trim()) return toast("Ajoutez au moins un destinataire");
      maj((x) => ({ ...x, envoyes: [{ id: `e${Date.now().toString(36)}`, a: ecrire.a.trim().slice(0, 80), objet: ecrire.objet.trim().slice(0, 120), texte: ecrire.texte.slice(0, 4000), t: Date.now() }, ...x.envoyes] }));
      sonSynth("envoye");
      toast("Message placé dans la boîte d’envoi : pas d’internet avec le forfait Connard");
      setEcrire(null);
    };
    return (
      <div className="ml ml-ecrire os-act entre">
        <div className="ml-barre">
          <b className="ml-titre">Nouveau message</b>
          <button className="ml-ic" aria-label="Envoyer" onClick={envoyer}>
            <Ico n="ic_menu_send" />
          </button>
        </div>
        <div className="ml-champ">
          <span>De</span>
          <b translate="no">{COMPTE}</b>
        </div>
        <label className="ml-champ">
          <span>À</span>
          <input value={ecrire.a} onChange={(v) => setEcrire({ ...ecrire, a: v.target.value })} inputMode="email" aria-label="À" />
        </label>
        <input className="ml-saisie" value={ecrire.objet} onChange={(v) => setEcrire({ ...ecrire, objet: v.target.value })} placeholder="Objet" aria-label="Objet" />
        <textarea className="ml-saisie ml-corps-saisie" value={ecrire.texte} onChange={(v) => setEcrire({ ...ecrire, texte: v.target.value })} placeholder="Rédigez votre message" aria-label="Rédigez votre message" />
      </div>
    );
  }

  const env = ouvert ? e.envoyes.find((x) => x.id === ouvert) : undefined;
  if (env) {
    return (
      <div className="ml ml-lire os-act entre">
        <div className="ml-barre">
          <b className="ml-titre">Boîte d’envoi</b>
          <button className="ml-ic" data-son="effacer" aria-label="Supprimer" onClick={() => (maj((x) => ({ ...x, envoyes: x.envoyes.filter((y) => y.id !== env.id) })), toast("Message supprimé"), setOuvert(null))}>
            <Ico n="ic_menu_delete" />
          </button>
        </div>
        <h2 className="ml-objet">{env.objet || "(Aucun objet)"}</h2>
        <div className="ml-expediteur">
          <i className="ml-moi" aria-hidden="true">C</i>
          <div>
            <b>Moi</b>
            <small>
              <span>À : </span>
              <span translate="no">{env.a}</span>
            </small>
          </div>
        </div>
        <p className="ml-attente">En attente de réseau · nouvelle tentative impossible sans forfait internet</p>
        <div className="ml-corps">
          {env.texte.split("\n").map((l, k) => (
            <p key={k} translate="no">
              {l || "\u00a0"}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const c = ouvert ? COURRIELS.find((x) => x.id === ouvert) : undefined;
  if (c) {
    const ici = place(c);
    return (
      <div className="ml ml-lire os-act entre">
        <div className="ml-barre ml-barre-actions">
          {ici === "corbeille" || ici === "archives" ? (
            <button className="ml-ic" data-son="entree" aria-label="Déplacer vers la boîte de réception" onClick={() => deplacer(c.id, null, "Déplacé vers la boîte de réception")}>
              <Ico n="ic_menu_back" />
            </button>
          ) : (
            <button className="ml-ic" data-son="entree" aria-label="Archiver" onClick={() => deplacer(c.id, "archives", "Conversation archivée")}>
              <Ico n="ic_menu_archive" />
            </button>
          )}
          <button data-son="effacer"
            className="ml-ic"
            aria-label={ici === "corbeille" ? "Supprimer définitivement" : "Supprimer"}
            onClick={() => (ici === "corbeille" ? deplacer(c.id, "supprime", "Message supprimé définitivement") : deplacer(c.id, "corbeille", "Message placé dans la corbeille"))}
          >
            <Ico n="ic_menu_delete" />
          </button>
          <button className="ml-ic" aria-label="Marquer comme non lu" onClick={() => (basculer("lus", c.id, false), toast("Marqué comme non lu"), setOuvert(null))}>
            <Ico n="sym_action_email" />
          </button>
          <button className="ml-ic" aria-label="Répondre" onClick={() => setEcrire({ a: c.adresse, objet: `Re: ${c.objet}`, texte: "" })}>
            <Ico n="ic_menu_revert" />
          </button>
        </div>
        <div className="ml-defile">
          <div className="ml-objet-ligne">
            <h2 className="ml-objet">{c.objet}</h2>
            <button className="ml-etoile" aria-label="Suivre" onClick={() => basculer("etoiles", c.id)}>
              <Etoile on={e.etoiles.includes(c.id)} />
            </button>
          </div>
          <div className="ml-expediteur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo(c.de)} alt="" />
            <div>
              <b>{c.nom}</b>
              <small translate="no">{c.adresse}</small>
              <small>
                <span>À : </span>
                <span translate="no">{COMPTE}</span>
              </small>
            </div>
            <em>{c.direct ? heure(c) : `${c.date} · ${c.heure}`}</em>
          </div>
          <div className="ml-corps">
            {c.corps.map((b, k) => (
              <BlocMail key={k} b={b} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const q = cherche.trim().toLowerCase();
  const liste = trier(dans(dossier)).filter((x) => !q || `${x.nom} ${x.objet}`.toLowerCase().includes(q));
  const envoyes = dossier === "envoi" ? e.envoyes.filter((x) => !q || `${x.a} ${x.objet}`.toLowerCase().includes(q)) : [];
  return (
    <div className="ml os-act entre">
      {barre}
      {menu ? (
        <div className="ml-menu">
          {DOSSIERS.map(([d, nom]) => (
            <button key={d} className={d === dossier ? "on" : ""} onClick={() => (setDossier(d), setMenu(false))}>
              <span>{nom}</span>
              <em>{d === "envoi" ? e.envoyes.length || "" : d === "reception" ? nonLus || "" : dans(d).length || ""}</em>
            </button>
          ))}
        </div>
      ) : null}
      <div className="ml-recherche">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/aosp/ic_menu_search_holo_light.svg" alt="" width={24} height={24} />
        <input value={cherche} onChange={(v) => setCherche(v.target.value)} placeholder="Rechercher dans les e-mails" aria-label="Rechercher dans les e-mails" />
      </div>
      <div className="ml-liste">
        {liste.map((x) => {
          const lu = e.lus.includes(x.id);
          return (
            <div key={x.id} className={`ml-ligne${lu ? "" : " nonlu"}`}>
              <button className="ml-ligne-corps" onClick={() => (basculer("lus", x.id, true), setOuvert(x.id))}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo(x.de)} alt="" />
                <div>
                  <b>{x.nom}</b>
                  <span>{x.objet}</span>
                  <small>{apercu(x)}</small>
                </div>
                <em>{heure(x)}</em>
              </button>
              <button className="ml-etoile" aria-label="Suivre" onClick={() => basculer("etoiles", x.id)}>
                <Etoile on={e.etoiles.includes(x.id)} />
              </button>
            </div>
          );
        })}
        {envoyes.map((x) => (
          <div key={x.id} className="ml-ligne">
            <button className="ml-ligne-corps" onClick={() => setOuvert(x.id)}>
              <i className="ml-moi" aria-hidden="true">C</i>
              <div>
                <b translate="no">{x.a}</b>
                <span>{x.objet || "(Aucun objet)"}</span>
                <small>En attente de réseau</small>
              </div>
              <em>{new Date(x.t).toTimeString().slice(0, 5)}</em>
            </button>
          </div>
        ))}
        {liste.length + envoyes.length === 0 ? <p className="ml-vide">{q ? "Aucun e-mail trouvé" : dossier === "envoi" ? "Aucun message en attente" : "Aucune conversation"}</p> : null}
      </div>
    </div>
  );
}

function apercu(c: Courriel) {
  const p = c.corps.find((b): b is { p: string } => "p" in b && b.p.length > 12);
  return p?.p ?? "";
}

function BlocMail({ b }: { b: Bloc }): ReactNode {
  if ("logo" in b)
    return b.logo === "peeporn" ? (
      <div className="ml-logo ml-logo-pp" translate="no">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_PEEPORN} alt="" width={192} height={192} />
        <b>Peeporn Sex-shop</b>
      </div>
    ) : (
      <div className="ml-logo ml-logo-sk" translate="no">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ENTETE_SHARKOBANK} alt="" width={240} height={255} />
        <b>Sharkobank</b>
      </div>
    );
  if ("p" in b) return <p>{b.p}</p>;
  if ("fiche" in b)
    return (
      <div className="ml-fiche">
        {b.titre ? <b>{b.titre}</b> : null}
        <table>
          <tbody>
            {b.fiche.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <table className="ml-total">
      <tbody>
        {b.total.map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td translate="no">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
