"use client";

/**
 * Sharkobank et Peeporn : on les ouvre… un chargement… et forcément, pas de connexion.
 * Sharkobank, en bonne banque, facture chaque tentative.
 */
import { useEffect, useState } from "react";

function useChargement(cle: number) {
  const [charge, setCharge] = useState(true);
  useEffect(() => {
    const debut = window.setTimeout(() => setCharge(true), 0);
    const fin = window.setTimeout(() => setCharge(false), 1600);
    return () => {
      window.clearTimeout(debut);
      window.clearTimeout(fin);
    };
  }, [cle]);
  return charge;
}

export function AppSharkobank() {
  const [essais, setEssais] = useState(1);
  const charge = useChargement(essais);
  const frais = (essais * 4.9).toFixed(2).replace(".", ",");
  return (
    <div className="hl hl-banque">
      {charge ? (
        <div className="hl-charge">
          <i />
          <span>Connexion sécurisée…</span>
        </div>
      ) : (
        <div className="hl-ecran">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/aakanos/sharkobank.png" alt="" />
          <h2>Connexion impossible</h2>
          <p>Vous n’êtes pas connecté à internet. Vos comptes ne peuvent pas être affichés.</p>
          <p className="rouge">
            Frais de tentative de connexion : {frais} € prélevés sur votre compte{essais > 1 ? ` (${essais} tentatives)` : ""}.
          </p>
          <button type="button" className="jb-bouton" onClick={() => setEssais((n) => n + 1)}>
            Réessayer (4,90 €)
          </button>
        </div>
      )}
    </div>
  );
}

export function AppPeeporn() {
  const [essais, setEssais] = useState(0);
  const charge = useChargement(essais);
  return (
    <div className="hl hl-peeporn">
      {charge ? (
        <div className="hl-charge">
          <i />
          <span>Chargement…</span>
        </div>
      ) : (
        <div className="hl-ecran">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/aakanos/peeporn.png" alt="" />
          <h2>Pas de connexion</h2>
          <p>Vous n’êtes pas connecté à internet.</p>
          <p className="rouge">Votre forfait Connard ne permet pas d’accéder à ce contenu.</p>
          <button type="button" className="jb-bouton" onClick={() => setEssais((n) => n + 1)}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
