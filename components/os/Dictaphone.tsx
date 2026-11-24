"use client";

/**
 * Dictaphone : le Magnétophone d'Android 4.1 (AOSP packages/apps/SoundRecorder, licence Apache 2.0) :
 * grand compteur 00:00 sur le dégradé d'origine, vumètre à aiguille, boutons Enregistrer / Lire / Arrêter.
 * Le micro du téléphone est cassé : appuyer sur Enregistrer échoue toujours (« Erreur interne de l'application »).
 * Le navigateur n'est jamais sollicité : aucune demande d'accès au micro, aucun getUserMedia.
 * Sons : uniquement des effets AOSP Jelly Bean (VideoRecord au départ, LowBattery à l'échec).
 */
import { useState } from "react";
import { creerStore } from "./session";
import { son } from "./sonsAndroid";
import { ouvrirAppli } from "./Memoire";

const A = "/aakanos/aosp";

export function IconeDictaphone({ taille = 56 }: { taille?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="os-icone" src={`${A}/soundrecorder-ic_launcher_soundrecorder.svg`} width={taille} height={taille} alt="" draggable={false} />;
}

const memoireDictaphone = creerStore<{ essais: number }>("dictaphone", { essais: 0 });

function Ic({ n, alt = "" }: { n: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${A}/${n}.svg`} alt={alt} draggable={false} />;
}

export function AppDictaphone() {
  const { essais } = memoireDictaphone.useValeur();
  const [etat, setEtat] = useState<"pret" | "tentative" | "erreur">("pret");
  const enregistrer = () => {
    if (etat !== "pret") return;
    setEtat("tentative");
    son("videoDebut", 0.8);
    window.setTimeout(() => {
      setEtat("erreur");
      son("batterie", 0.6);
      memoireDictaphone.ecrire((m) => ({ essais: m.essais + 1 }));
    }, 650);
  };
  return (
    <div className="di">
      <div className="di-ecran">
        <span className="di-compteur" translate="no">
          00:00
        </span>
        <span className="di-message">
          {etat === "tentative" ? (
            <>
              <Ic n="soundrecorder-recording_led" />
              <span>Enregistrement audio</span>
            </>
          ) : (
            <span>Enregistrez votre message</span>
          )}
        </span>
        <span className="di-dispo">Micro indisponible</span>
      </div>
      <div className="di-vumetre" aria-hidden="true">
        <Ic n="soundrecorder-vumeter" />
        <i className="di-aiguille" />
      </div>
      <div className="di-enregistrements">
        <div className="os-titre-holo">MES ENREGISTREMENTS AUDIO</div>
        <button type="button" className="di-vide" onClick={() => ouvrirAppli("fichiers")}>
          <b>Aucun enregistrement</b>
          <span>{essais > 0 ? `Tentatives d'enregistrement : ${essais}` : "Le dossier Recordings est vide."}</span>
        </button>
      </div>
      <div className="di-boutons">
        <button type="button" data-son="aucun" aria-label="Enregistrer" onClick={enregistrer} disabled={etat === "tentative"}>
          <Ic n="soundrecorder-record" />
        </button>
        <button type="button" aria-label="Lire" disabled>
          <Ic n="soundrecorder-play" />
        </button>
        <button type="button" aria-label="Arrêter" disabled>
          <Ic n="soundrecorder-stop" />
        </button>
      </div>
      {etat === "erreur" ? (
        <div className="dlg-fond" onClick={() => setEtat("pret")}>
          <div className="dlg" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-titre">Dictaphone</div>
            <div className="dlg-corps di-erreur">
              <Ic n="ic_dialog_alert_holo_dark" />
              <span>
                <b>Erreur interne de l&apos;application.</b>
                <span>Microphone indisponible : le micro de ce téléphone est cassé, impossible d&apos;enregistrer.</span>
              </span>
            </div>
            <div className="jb-boutons-dlg">
              <button type="button" onClick={() => setEtat("pret")}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
