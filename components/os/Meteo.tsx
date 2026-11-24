"use client";

/**
 * Nounou Météo Services : la météo d'AakanOS, en Holo sombre comme Jelly Bean.
 * Icônes d'origine sous licence Apache 2.0 (AOSP et LockClock de CyanogenMod, voir public/aakanos/aosp/LICENCES.txt).
 * Sans connexion, évidemment : « --° », un bouton Réessayer qui échoue toujours.
 */
import { useEffect, useState } from "react";
import { LogoNounou } from "./Nounou";
import { toast } from "./Systeme";
import { son } from "./sonsAndroid";

const A = "/aakanos/aosp";

export function IconeMeteo({ taille = 56 }: { taille?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="os-icone" src={`${A}/dashclock-ic_weather_partly_cloudy.svg`} width={taille} height={taille} alt="" draggable={false} style={{ objectFit: "contain" }} />
  );
}

const JOURS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."];
const ECHECS = [
  "Toujours pas de connexion. Nounou a regardé par la fenêtre : il fait jour, probablement.",
  "Échec de la mise à jour : le forfait Connard ne comprend ni internet, ni le ciel.",
  "Nouvel échec. Les nuages refusent de répondre sans forfait.",
  "Connexion impossible. Prévision de secours : prenez un parapluie, au cas où.",
  "Le satellite de Nounou Météo Services est en pause déjeuner.",
];

/** Le cercle de chargement Holo (spinner_76 d'AOSP). */
function RoueHolo() {
  return (
    <span className="nm-roue" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${A}/spinner_76_outer_holo.svg`} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${A}/spinner_76_inner_holo.svg`} alt="" />
    </span>
  );
}

export function AppMeteo() {
  const [etat, setEtat] = useState<"charge" | "horsligne">("charge");
  const [essais, setEssais] = useState(0);
  useEffect(() => {
    if (etat !== "charge") return;
    const t = window.setTimeout(() => {
      setEtat("horsligne");
      if (essais > 0) {
        toast(ECHECS[(essais - 1) % ECHECS.length]!);
        // l'alerte « batterie faible » d'Android (LowBattery, AOSP) : le son le plus triste de Jelly Bean
        son("batterie", 0.6);
      }
    }, essais === 0 ? 2200 : 1600);
    return () => window.clearTimeout(t);
  }, [etat, essais]);
  const charge = etat === "charge";
  const reessayer = () => (setEssais((n) => n + 1), setEtat("charge"));
  return (
    <div className="app-defile nm">
      <div className="nm-actuel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="nm-icone" src={`${A}/lockclock-weather_na.svg`} alt="" />
        <div className="nm-infos">
          <b translate="no">--°</b>
          <span>{charge ? "Mise à jour…" : "Ciel inconnu"}</span>
          <small>Position introuvable · GPS sans forfait</small>
        </div>
        <button className="nm-rafraichir" aria-label="Réessayer" onClick={reessayer} disabled={charge}>
          {charge ? (
            <RoueHolo />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${A}/ic_menu_refresh.svg`} alt="" width={32} height={32} />
          )}
        </button>
      </div>
      <div className="nm-ligne-info">
        <span>Ressenti</span>
        <b translate="no">--°</b>
      </div>
      <div className="nm-ligne-info">
        <span>Vent</span>
        <b>-- km/h</b>
      </div>
      <div className="nm-ligne-info">
        <span>Humidité</span>
        <b>-- %</b>
      </div>
      <div className="os-titre-holo">PRÉVISIONS SUR 5 JOURS</div>
      {JOURS.map((j) => (
        <div key={j} className="nm-jour">
          <span>{j}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/lockclock-weather_na.svg`} alt="" />
          <b translate="no">--° / --°</b>
        </div>
      ))}
      {etat === "horsligne" ? (
        <div className="nm-vide">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/ic_dialog_alert_holo_dark.svg`} alt="" width={32} height={32} />
          <b>Pas de connexion</b>
          <p>Nounou ne voit pas le ciel d’ici. Votre forfait Sam-Telecom ne comprend pas internet, ni la météo.</p>
          <button className="jb-bouton nm-reessayer" onClick={reessayer}>
            Réessayer
          </button>
          {essais > 0 ? <small>{`Tentatives : ${essais}`}</small> : null}
        </div>
      ) : (
        <div className="nm-vide">
          <RoueHolo />
          <p>Connexion aux nuages…</p>
        </div>
      )}
      <div className="nm-pied">
        <span>Dernière mise à jour : jamais</span>
        <span>Prévision de secours : regardez par la fenêtre.</span>
        <span className="nm-source">
          <LogoNounou taille={18} />
          <span>Nounou Météo Services · Données fournies par personne</span>
        </span>
      </div>
    </div>
  );
}
