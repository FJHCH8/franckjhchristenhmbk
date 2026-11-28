"use client";

/** La page des visiteurs bannis (pour l'instant : les téléphones Android). Teodor, rouge, dit non. */
import { useEffect, useState } from "react";
import { LocaleProvider, useTraduire } from "@/components/Locale";
import { Logo } from "@/components/Logo";
import { PERSON_NAME } from "@/lib/site";
import { Teodor } from "./Teodor";
import "./teodor.css";

const ROUGE = [235, 52, 64];

function Contenu() {
  const t = useTraduire();
  const [pret, setPret] = useState(false);
  useEffect(() => {
    document.documentElement.classList.remove("intro-joue");
    document.querySelector(".intro")?.remove();
  }, []);
  return (
    <main className={`teo-page teo-banni${pret ? " est-pret" : ""}`}>
      <Teodor humeur="non" teinte={ROUGE} onPret={() => setPret(true)} />
      <div className="teo-texte">
        <h1>{t("Vous avez un Android ? Dommage.")}</h1>
        <p className="teo-sous">{t("(Le site n’est accessible qu’avec un iPhone ou un ordinateur.)")}</p>
      </div>
      <p className="teo-marque" translate="no">
        <Logo />
        <span>{PERSON_NAME.toUpperCase()}</span>
      </p>
    </main>
  );
}

export function Banni() {
  return (
    <LocaleProvider>
      <Contenu />
    </LocaleProvider>
  );
}
