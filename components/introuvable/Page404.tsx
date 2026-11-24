"use client";

/**
 * La page 404 : le robot, « Erreur 404 » qui bugue, et un bouton du site pour rentrer.
 * Les textes suivent la langue du visiteur (l'allemand par défaut).
 */
import Link from "next/link";
import { useTraduire } from "@/components/Locale";
import "./introuvable.css";

export function Page404() {
  const t = useTraduire();
  const titre = t("Erreur 404");
  return (
    <main className="e404">
      <div className="e404-cadre">
        <i className="e404-co a" />
        <i className="e404-co b" />
        <i className="e404-co c" />
        <i className="e404-co d" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/robot-404.webp" alt="" width={640} height={536} />
        <span className="e404-lignes" aria-hidden="true" />
        <small className="e404-rec">{"// SIGNAL PERDU"}</small>
      </div>
      <h1 className="e404-titre" data-texte={titre}>
        {titre}
      </h1>
      <p className="e404-texte">{t("La page que vous voulez n’existe pas.")}</p>
      <Link className="e404-btn" href="/">
        <i className="e404-co a" />
        <i className="e404-co b" />
        <i className="e404-co c" />
        <i className="e404-co d" />
        <b>01</b>
        <span>{t("Retour à l’accueil")}</span>
        <em aria-hidden="true">›</em>
      </Link>
    </main>
  );
}
