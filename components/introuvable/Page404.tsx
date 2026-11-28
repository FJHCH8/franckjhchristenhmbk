"use client";

/**
 * La page 404 : le robot en trame de points qui s'efface vers le bas,
 * un terminal en verre qui tape l'adresse introuvable, et un grand texte.
 * Les textes suivent la langue du visiteur (l'allemand par défaut).
 */
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useTraduire } from "@/components/Locale";
import "./introuvable.css";

export function Page404() {
  const t = useTraduire();
  const [chemin, setChemin] = useState("/seite");
  useEffect(() => {
    const p = decodeURIComponent(window.location.pathname || "/");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'adresse n'existe que dans le navigateur
    setChemin(p.length > 26 ? `${p.slice(0, 25)}…` : p);
  }, []);
  const lignes = [`$ open ${chemin}`, "error 404: not found", "$ cd ~"];
  return (
    <main className="e404">
      <div className="e404-trame" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/robot-404.webp" alt="" width={640} height={536} />
        <i />
      </div>
      <div className="e404-terminal" translate="no" aria-label="error 404: not found">
        {lignes.map((l, i) => (
          <p key={i} className={i === 1 ? "err" : undefined} style={{ "--n": l.length, "--i": i } as CSSProperties}>
            <span>{l}</span>
          </p>
        ))}
        <b className="e404-curseur" />
      </div>
      <div className="e404-bas">
        <small>404</small>
        <h1>{t("Cette page n’existe pas.")}</h1>
        <Link className="e404-btn" href="/">
          {t("Retour à l’accueil")} <em aria-hidden="true">→</em>
        </Link>
      </div>
    </main>
  );
}
