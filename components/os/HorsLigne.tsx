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
          {Array.from({ length: essais }, (_, k) => (
            <li key={`f${k}`} className="frais">
              <span>
                <b>Frais de tentative de connexion</b>
                <em>AUJOURD’HUI · SHARKOBANK</em>
              </span>
              <strong>−{euros(FRAIS)}</strong>
            </li>
          ))}
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
        <small className="st-mono">TOTAL DES FRAIS AUJOURD’HUI · {euros(FRAIS * essais)}</small>
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

const RUBRIQUES = ["Tendances", "Nouveautés", "Étangs", "Têtards", "Nénuphars"];

export function AppPeeporn() {
  const [essais, setEssais] = useState(0);
  const [rub, setRub] = useState(0);
  const charge = useEchec(essais, 2200);
  return (
    <div className="hl pp">
      <div className="pp-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/aakanos/peeporn.png" alt="" />
        <b>PEEPORN</b>
        <span className="pp-loupe" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#ddd">
            <path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
          </svg>
        </span>
      </div>
      <div className="pp-rub">
        {RUBRIQUES.map((r, k) => (
          <button key={r} type="button" className={k === rub ? "on" : ""} onClick={() => (setRub(k), setEssais((n) => n + 1))}>
            {r}
          </button>
        ))}
      </div>
      <div className="pp-grille">
        {Array.from({ length: 8 }, (_, k) => (
          <div key={k} className="pp-vignette">
            <div className={`pp-img${charge ? " charge" : " ko"}`}>{charge ? <i className="pp-spin" /> : <span>⚠</span>}</div>
            <i className="sq sq-ligne" />
            <i className="sq sq-court" />
          </div>
        ))}
      </div>

      {!charge ? (
        <div className="pp-voile">
          <div className="pp-miroir">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/aakanos/peeporn-miroir.jpg" alt="" />
            <p>
              Vous allez devoir utiliser un miroir…
              <b>pas de connexion bébé.</b>
            </p>
            <button type="button" className="jb-bouton" onClick={() => setEssais((n) => n + 1)}>
              Réessayer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
