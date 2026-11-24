"use client";

/**
 * L'appli de l'opérateur Sam-Telecom dans AakanOS.
 * L'interface du site (Odyssée : fond noir, Chakra Petch, reflet bleu clair, coins en équerre, « // 01 »)
 * sous une savane de nuit en 8 bits, avec les boutons et les boîtes de dialogue de Jelly Bean.
 * On voit sa conso et son forfait (le forfait Connard), mais on ne peut rien changer : pas connecté.
 */
import { useEffect, useId, useState } from "react";

const COEUR = "M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z";

type Dialogue = null | "forfait" | "appareils" | "assistance";

const DIALOGUES: Record<Exclude<Dialogue, null>, { titre: string; texte: string; rouge: string }> = {
  forfait: {
    titre: "Changer de forfait",
    texte: "Vous n’êtes pas connecté. Pour modifier votre forfait, une connexion à internet est nécessaire.",
    rouge: "Votre forfait Connard ne comprend pas la connexion à internet.",
  },
  appareils: {
    titre: "Nos appareils",
    texte: "Impossible de charger le catalogue : vous n’êtes pas connecté.",
    rouge: "Votre forfait Connard ne comprend pas la connexion à internet.",
  },
  assistance: {
    titre: "Assistance",
    texte: "Nos conseillers vous répondent par téléphone, 7 jours sur 7, de 8 h à 22 h.",
    rouge: "Votre forfait Connard ne permet pas de passer des appels.",
  },
};

function salut() {
  const h = new Date().getHours();
  return h >= 22 || h < 6 ? "BONNE NUIT CASTO" : h >= 18 ? "BONSOIR CASTO" : "BONJOUR CASTO";
}

function Anneau() {
  const id = useId().replace(/:/g, "");
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <svg className="st-anneau" viewBox="0 0 150 150" aria-hidden="true">
      <defs>
        <linearGradient id={`st${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4fbff" />
          <stop offset=".5" stopColor="#6fbdf5" />
          <stop offset="1" stopColor="#f4fbff" />
        </linearGradient>
      </defs>
      <circle cx="75" cy="75" r={r} fill="none" stroke="#1b2229" strokeWidth="10" />
      <circle className="st-arc" cx="75" cy="75" r={r} fill="none" stroke={`url(#st${id})`} strokeWidth="10" strokeDasharray={`${c * 0.72} ${c}`} transform="rotate(-90 75 75)" />
      <circle cx="75" cy="75" r="44" fill="none" stroke="#1b2229" strokeWidth="2" strokeDasharray="2 4" />
      <text x="75" y="81" textAnchor="middle" className="st-n">
        142
      </text>
      <text x="75" y="99" textAnchor="middle" className="st-n2">
        SMS ENVOYÉS
      </text>
    </svg>
  );
}

const Coins = () => (
  <>
    <i className="st-co a" />
    <i className="st-co b" />
    <i className="st-co c" />
    <i className="st-co d" />
  </>
);

export function AppSamTelecom() {
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [essai, setEssai] = useState(false);
  const [bonjour, setBonjour] = useState("BONSOIR CASTO");
  useEffect(() => {
    const id = window.setTimeout(() => setBonjour(salut()), 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!essai) return;
    const id = window.setTimeout(() => setEssai(false), 1600);
    return () => window.clearTimeout(id);
  }, [essai]);
  const d = dialogue ? DIALOGUES[dialogue] : null;

  return (
    <div className="st">
      <div className="st-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="st-sam" src="/aakanos/sam-telecom.png" alt="" />
        <div className="st-titre">
          <small>{`// ${bonjour}`}</small>
          <b>SAM-TELECOM</b>
          <span>CASTO · +0-2007 06 45</span>
        </div>
      </div>

      <div className="st-carte">
        <Coins />
        <small className="st-lab">{"// 01 · VOTRE CONSO"}</small>
        <div className="st-conso">
          <Anneau />
          <ul>
            <li>
              <i className="on" />
              <b>SMS</b>
              <em>ILLIMITÉS</em>
            </li>
            <li>
              <i />
              <b>INTERNET</b>
              <em>NON INCLUS</em>
            </li>
            <li>
              <i />
              <b>APPELS</b>
              <em>NON INCLUS</em>
            </li>
          </ul>
        </div>
        <div className="st-coeurs" aria-hidden="true">
          {Array.from({ length: 10 }, (_, k) => (
            <svg key={k} viewBox="0 0 7 6" preserveAspectRatio="none" shapeRendering="crispEdges">
              <path d={COEUR} fill={k < 7 ? "#8fd0ff" : "#2a2d31"} />
            </svg>
          ))}
        </div>
        <small className="st-mono">SMS CE MOIS · 142 · RENOUVELLEMENT LE 01/12</small>
      </div>

      <div className="st-ligne">
        <small className="st-lab">{"// 02 · MA LIGNE"}</small>
        <div className="st-forfait">
          <b>FORFAIT CONNARD</b>
          <span>
            2,99 €<em>/MOIS</em>
          </span>
        </div>
        <small className="st-mono">FACTURE DE NOVEMBRE DISPONIBLE · 2,99 €</small>
      </div>

      <div className="st-actions">
        <button type="button" className="jb-bouton" onClick={() => setDialogue("forfait")}>
          Changer de forfait
        </button>
        <button type="button" className="jb-bouton" onClick={() => setDialogue("appareils")}>
          Nos appareils
        </button>
        <button type="button" className="jb-bouton" onClick={() => setDialogue("assistance")}>
          Assistance
        </button>
      </div>
      <div className="st-pied">
        <span>© SAM-TELECOM</span>
        <span>RÉSEAU NATIONAL</span>
      </div>

      {d ? (
        <div className="dlg-fond" onClick={() => setDialogue(null)}>
          <div className="dlg" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-titre">{d.titre}</div>
            <div className="st-dlg-texte">
              {essai ? (
                <p className="st-essai">
                  <i />
                  Connexion à Sam-Telecom…
                </p>
              ) : (
                <>
                  <p>{d.texte}</p>
                  <p className="rouge">{d.rouge}</p>
                </>
              )}
            </div>
            <div className="jb-boutons-dlg">
              <button type="button" onClick={() => setDialogue(null)}>
                Annuler
              </button>
              <button type="button" disabled={essai} onClick={() => setEssai(true)}>
                {dialogue === "assistance" ? "Appeler" : "Réessayer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
