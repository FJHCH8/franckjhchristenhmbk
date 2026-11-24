"use client";

/**
 * Sharkobank et Peeporn : de vraies interfaces… où rien ne charge, parce qu'il n'y a jamais de connexion.
 * L'UI du site (Odyssée : Chakra Petch, « // 01 », coins en équerre) avec les boutons de Jelly Bean.
 * Sharkobank facture chaque tentative ; Peeporn conseille un miroir.
 */
import { useEffect, useState, type ReactNode } from "react";

/** Chargement qui dure un peu, puis échoue ; relancé à chaque changement de `cle`. */
function useEchec(cle: number, ms = 1900) {
  const [charge, setCharge] = useState(true);
  useEffect(() => {
    const debut = window.setTimeout(() => setCharge(true), 0);
    const fin = window.setTimeout(() => setCharge(false), ms);
    return () => {
      window.clearTimeout(debut);
      window.clearTimeout(fin);
    };
  }, [cle, ms]);
  return charge;
}

const Coins = () => (
  <>
    <i className="st-co a" />
    <i className="st-co b" />
    <i className="st-co c" />
    <i className="st-co d" />
  </>
);

function Dialogue({ titre, children, fermer }: { titre: string; children: ReactNode; fermer: () => void }) {
  return (
    <div className="dlg-fond hl-dlg" onClick={fermer}>
      <div className="dlg" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-titre">{titre}</div>
        <div className="st-dlg-texte">{children}</div>
        <div className="jb-boutons-dlg">
          <button type="button" onClick={fermer}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sharkobank ---------------- */

const FRAIS = 4.9;
const euros = (v: number) => `${v.toFixed(2).replace(".", ",")} €`;

export function AppSharkobank() {
  const [essais, setEssais] = useState(1);
  const [dlg, setDlg] = useState<string | null>(null);
  const charge = useEchec(essais);
  return (
    <div className="hl sk">
      <div className="sk-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/sharkobank.png" alt="" />
        <div>
          <small>{"// BONJOUR FRANCK"}</small>
          <b>SHARKOBANK</b>
          <span>COMPTE COURANT · N° FR76 •••• 2007</span>
        </div>
      </div>

      <div className="sk-carte">
        <Coins />
        <small className="st-lab">{"// 01 · SOLDE DU COMPTE"}</small>
        {charge ? (
          <>
            <i className="sq sq-grand" />
            <i className="sq sq-moyen" />
          </>
        ) : (
          <>
            <div className="sk-solde">
              — — —,— — <em>€</em>
            </div>
            <p className="sk-err">⚠ Solde indisponible : vous n’êtes pas connecté.</p>
          </>
        )}
      </div>

      <div className="sk-bloc">
        <small className="st-lab">{"// 02 · DERNIÈRES OPÉRATIONS"}</small>
        <ul className="sk-ops">
          <li className="frais">
            <span>
              <b>Frais de tentative de connexion{essais > 1 ? ` ×${essais}` : ""}</b>
              <em>AUJOURD’HUI · SHARKOBANK</em>
            </span>
            <strong>−{euros(FRAIS * essais)}</strong>
          </li>
          {[0, 1, 2, 3].map((k) =>
            charge ? (
              <li key={k} className="vide">
                <i className="sq sq-ligne" />
                <i className="sq sq-court" />
              </li>
            ) : (
              <li key={k} className="ko">
                <span>
                  <b>Opération non chargée</b>
                  <em>CONNEXION REQUISE</em>
                </span>
                <strong>?</strong>
              </li>
            ),
          )}
        </ul>
      </div>

      <div className="sk-actions">
        <button type="button" className="jb-bouton" onClick={() => setDlg("Virement")}>
          Virement
        </button>
        <button type="button" className="jb-bouton" onClick={() => setDlg("Ma carte")}>
          Ma carte
        </button>
        <button type="button" className="jb-bouton" onClick={() => setDlg("Épargne")}>
          Épargne
        </button>
        <button type="button" className="jb-bouton sk-reessai" disabled={charge} onClick={() => setEssais((n) => n + 1)}>
          {charge ? "Connexion sécurisée…" : `Réessayer (${euros(FRAIS)})`}
        </button>
      </div>

      {dlg ? (
        <Dialogue titre={dlg} fermer={() => setDlg(null)}>
          <p>Cette opération nécessite une connexion à internet.</p>
          <p className="rouge">Votre forfait Connard ne comprend pas la connexion à internet.</p>
        </Dialogue>
      ) : null}
    </div>
  );
}

/* ---------------- Peeporn ---------------- */

const RUBRIQUES = ["Tendances", "Nouveautés", "Grenouilles gays", "Grenouille et poney", "Live cam", "Crapauds musclés", "Cuisses de grenouille", "Nénuphars chauds", "Bave & ASMR", "Mouches en folie", "Spécial mare"];
const VIDEOS: { titre: string; duree: string; vues: string; badge?: "LIVE" | "HD" | "4K" }[] = [
  { titre: "Elle coasse toute la nuit", duree: "12:34", vues: "1,2 M", badge: "HD" },
  { titre: "La mare est chaude ce soir", duree: "EN DIRECT", vues: "8 412 spectateurs", badge: "LIVE" },
  { titre: "Grenouille en string sur nénuphar", duree: "07:59", vues: "864 k" },
  { titre: "Crapaud musclé sous la pluie", duree: "18:20", vues: "2,4 M", badge: "4K" },
  { titre: "Il gobe les mouches avec la langue", duree: "03:12", vues: "640 k" },
  { titre: "Deux rainettes, une seule mare", duree: "22:05", vues: "3,1 M", badge: "HD" },
  { titre: "Cuisses de grenouille XXL", duree: "09:41", vues: "1,7 M" },
  { titre: "Bave partout (ASMR)", duree: "31:00", vues: "420 k", badge: "HD" },
];

export function AppPeeporn() {
  const [age, setAge] = useState<null | "oui" | "non">(null);
  const [essais, setEssais] = useState(0);
  const [rub, setRub] = useState(0);
  const charge = useEchec(essais, 2200);
  const relancer = () => setEssais((n) => n + 1);
  return (
    <div className="hl pp">
      <div className="pp-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/peeporn.png" alt="" />
        <b>PEEPORN</b>
        <em className="pp-18">18+</em>
        <span className="pp-loupe" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffb3d9">
            <path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
          </svg>
        </span>
      </div>
      <div className="pp-rub">
        {RUBRIQUES.map((r, k) => (
          <button key={r} type="button" className={`${k === rub ? "on" : ""}${r === "Live cam" ? " live" : ""}`} onClick={() => (setRub(k), relancer())}>
            {r === "Live cam" ? <i /> : null}
            {r}
          </button>
        ))}
      </div>
      <small className="pp-titre-rub">{`// ${RUBRIQUES[rub]!.toUpperCase()} · LES PLUS COASSÉES`}</small>
      <div className="pp-grille">
        {VIDEOS.map((v) => (
          <div key={v.titre} className="pp-vignette">
            <div className={`pp-img${charge ? " charge" : " ko"}`}>
              {charge ? <i className="pp-spin" /> : <span>⚠</span>}
              {v.badge ? <em className={`pp-badge ${v.badge === "LIVE" ? "live" : ""}`}>{v.badge === "LIVE" ? "● LIVE" : v.badge}</em> : null}
              <em className="pp-duree">{v.duree}</em>
            </div>
            <b>{v.titre}</b>
            <span>{v.vues}{v.badge === "LIVE" ? "" : " vues"} · ♥ 98 %</span>
          </div>
        ))}
      </div>

      {age === null ? (
        <div className="dlg-fond hl-dlg">
          <div className="dlg pp-age" role="dialog" aria-modal="true">
            <div className="dlg-titre">Contenu pour adultes</div>
            <div className="st-dlg-texte">
              <p>Ce site contient des grenouilles très peu habillées. Avez-vous plus de 18 ans ?</p>
            </div>
            <div className="jb-boutons-dlg">
              <button type="button" onClick={() => setAge("non")}>
                Non
              </button>
              <button type="button" onClick={() => (setAge("oui"), relancer())}>
                Oui
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {age === "non" ? (
        <div className="pp-voile">
          <div className="pp-miroir pp-non">
            <p>
              Retourne aider Gypsy le dauphin à nager.
              <b>Allez, ouste.</b>
            </p>
            <button type="button" className="jb-bouton" onClick={() => setAge(null)}>
              Retour
            </button>
          </div>
        </div>
      ) : null}
      {age === "oui" && !charge ? (
        <div className="pp-voile">
          <div className="pp-miroir">
            <p className="pp-puce">Désolé ma puce…</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aakanos/peeporn-miroir.jpg" alt="" />
            <p>
              Vous allez devoir utiliser un miroir…
              <b>pas de connexion bébé.</b>
            </p>
            <button type="button" className="jb-bouton" onClick={relancer}>
              Réessayer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
