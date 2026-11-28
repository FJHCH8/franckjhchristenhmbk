"use client";

/** La page d'accueil pendant la maintenance : Teodor content, et un mot pour les visiteurs. */
import { useEffect, useState } from "react";
import { LocaleProvider, useTraduire } from "@/components/Locale";
import { Teodor } from "./Teodor";
import "./teodor.css";

function Contenu() {
  const t = useTraduire();
  const [pret, setPret] = useState(false);
  // Teodor a sa propre ouverture : on retire celle du site, qui jouait en double en dessous
  useEffect(() => {
    document.documentElement.classList.remove("intro-joue");
    document.querySelector(".intro")?.remove();
  }, []);
  return (
    <main className={`teo-page${pret ? " est-pret" : ""}`}>
      <Teodor humeur="joie" onPret={() => setPret(true)} />
      <div className="teo-texte">
        <h1>{t("Site en maintenance")}</h1>
        <p className="teo-sous">{t("(Votre site va revenir encore plus beau)")}</p>
        <p className="teo-bas">{t("Votre site devrait être prêt en fin de journée.")}</p>
      </div>
      <p className="teo-aide">{t("Caresse Teodor. Ne le tape pas.")}</p>
    </main>
  );
}

export function Maintenance() {
  return (
    <LocaleProvider>
      <Contenu />
    </LocaleProvider>
  );
}
