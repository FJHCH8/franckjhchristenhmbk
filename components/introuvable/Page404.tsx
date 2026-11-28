"use client";

/**
 * La page 404 : la même ouverture que le site (le logo et l'anneau PS2), puis le logo
 * devient Teodor, perdu et apeuré. Le terminal en verre tape l'adresse introuvable.
 * Les textes suivent la langue du visiteur (l'allemand par défaut).
 */
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useTraduire } from "@/components/Locale";
import { Teodor } from "@/components/teodor/Teodor";
import "@/components/teodor/teodor.css";
import "./introuvable.css";

export function Page404() {
  const t = useTraduire();
  const [pret, setPret] = useState(false);
  const [chemin, setChemin] = useState("/seite");
  useEffect(() => {
    const p = decodeURIComponent(window.location.pathname || "/");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'adresse n'existe que dans le navigateur
    setChemin(p.length > 26 ? `${p.slice(0, 25)}…` : p);
  }, []);
  const lignes = [`$ open ${chemin}`, "error 404: not found", "$ cd ~"];
  return (
    <main className={`teo-page e404${pret ? " est-pret" : ""}`}>
      <div className="teo-terminal" translate="no" aria-label="error 404: not found">
        {lignes.map((l, i) => (
          <p key={i} className={i === 1 ? "err" : undefined} style={{ "--n": l.length, "--i": i } as CSSProperties}>
            <span>{l}</span>
            {i === 2 ? <b className="teo-curseur" /> : null}
          </p>
        ))}
      </div>
      <Teodor humeur="peur" onPret={() => setPret(true)} />
      <div className="teo-texte">
        <small className="teo-bas" style={{ marginTop: 0 }}>404</small>
        <h1>{t("Cette page n’existe pas.")}</h1>
        <div>
          <Link className="teo-btn" href="/">
            {t("Retour à l’accueil")} <em aria-hidden="true">→</em>
          </Link>
        </div>
      </div>
    </main>
  );
}
