"use client";

/**
 * La page 404 : la même ouverture que le site (le logo et l'anneau PS2), puis le logo
 * devient Teodor, curieux et méfiant. Le terminal en verre tape l'adresse introuvable.
 * Les textes suivent la langue du visiteur (l'allemand par défaut).
 */
import Link from "next/link";
import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useTraduire } from "@/components/Locale";
import { Teodor } from "@/components/teodor/Teodor";
import "@/components/teodor/teodor.css";
import "./introuvable.css";

export function Page404() {
  const t = useTraduire();
  const [pret, setPret] = useState(false);
  const [chemin, setChemin] = useState("/seite");
  useEffect(() => {
    // Teodor a sa propre ouverture : on retire celle du site, qui jouait en double en dessous
    document.documentElement.classList.remove("intro-joue");
    document.querySelector(".intro")?.remove();
    const p = decodeURIComponent(window.location.pathname || "/");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'adresse n'existe que dans le navigateur
    setChemin(p.length > 26 ? `${p.slice(0, 25)}…` : p);
  }, []);
  // quand on vise le bouton du retour, Teodor le regarde et reprend espoir
  const espoir = (ev: SyntheticEvent<HTMLElement> | null) => {
    const r = ev?.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("teodor-espoir", { detail: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null }));
  };
  const lignes = useMemo(() => [`$ open ${chemin}`, "error: strange", "$ cd ~"], [chemin]);
  // la frappe, lettre par lettre (en JavaScript : aucune police ne peut couper un mot)
  const [tape, setTape] = useState(0);
  const total = lignes.reduce((n, l) => n + l.length, 0);
  useEffect(() => {
    if (!pret || tape >= total) return;
    // une petite pause en fin de ligne, comme quelqu'un qui tape
    const finLigne = lignes.reduce<number[]>((a, l) => [...a, (a.at(-1) ?? 0) + l.length], []).includes(tape);
    const id = window.setTimeout(() => setTape((n) => n + 1), tape === 0 ? 250 : finLigne ? 420 : 38 + Math.random() * 30);
    return () => window.clearTimeout(id);
  }, [pret, tape, total, lignes]);
  let reste = tape;
  const vus = lignes.map((l) => {
    const k = Math.max(0, Math.min(l.length, reste));
    reste -= l.length;
    return l.slice(0, k);
  });
  const ligneCurseur = Math.min(lignes.length - 1, vus.findIndex((v, i) => v.length < lignes[i]!.length) === -1 ? lignes.length - 1 : vus.findIndex((v, i) => v.length < lignes[i]!.length));
  return (
    <main className={`teo-page e404${pret ? " est-pret" : ""}`}>
      <div className="teo-terminal" translate="no" aria-label="error: strange">
        <div className="teo-fenetre" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>teodor — zsh</span>
        </div>
        {lignes.map((l, i) => (
          <p key={i} className={i === 1 ? "err" : undefined}>
            <span>
              {vus[i]!.startsWith("$") ? <em className="invite">$</em> : null}
              {vus[i]!.startsWith("$") ? vus[i]!.slice(1) : vus[i]}
            </span>
            {i === ligneCurseur && pret ? <b className={`teo-curseur${tape >= total ? " clignote" : ""}`} /> : null}
          </p>
        ))}
      </div>
      <Teodor humeur="curieux" onPret={() => setPret(true)} />
      <div className="teo-texte">
        <small className="teo-bas" style={{ marginTop: 0 }}>{t("Erreur étrange")}</small>
        <h1>{t("Cette page n’existe pas.")}</h1>
        <p className="teo-question">{t("Qu’essayez-vous de faire ?")}</p>
        <p className="teo-indice">{t("Tout ce à quoi vous pouvez accéder se trouve sur le site.")}</p>
        <div>
          <Link className="teo-btn" href="/" onPointerEnter={espoir} onFocus={espoir} onPointerLeave={() => espoir(null)} onBlur={() => espoir(null)}>
            {t("Retour à l’accueil")} <em aria-hidden="true">→</em>
          </Link>
        </div>
      </div>
    </main>
  );
}
