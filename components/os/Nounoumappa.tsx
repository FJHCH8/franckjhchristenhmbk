"use client";

/**
 * Nounoumappa : les cartes d'AakanOS. Le service est hors ligne, comme le reste du téléphone
 * sans forfait internet : une grille de tuiles vides, et la carte ne charge jamais.
 */
import { useEffect, useState } from "react";
import { toast } from "./Systeme";

export function IconeNounoumappa({ taille = 56 }: { taille?: number }) {
  const id = `nm${taille}`;
  return (
    <svg className="os-icone" viewBox="0 0 64 64" width={taille} height={taille} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5ec8ef" />
          <stop offset="1" stopColor="#1a8bb8" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b5b" />
          <stop offset="1" stopColor="#c62828" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="8" fill={`url(#${id}g)`} />
      <path d="M8 18l16-6 16 6 16-6v38l-16 6-16-6-16 6z" fill="#e8f6fb" opacity=".95" />
      <path d="M24 12v38M40 18v38" fill="none" stroke="#7aa7c4" strokeWidth="1.4" />
      <path d="M8 18l16-6 16 6 16-6" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M24 18h16l.5 22-8 3-8.5-3z" fill="#c5d9c0" />
      <path d="M24 28h16M24 34h16" stroke="#9bb89a" strokeWidth="1" />
      <path d="M32 22c-5.2 0-8 3.8-8 8.4 0 6.2 8 13.6 8 13.6s8-7.4 8-13.6c0-4.6-2.8-8.4-8-8.4z" fill={`url(#${id}p)`} stroke="#fff" strokeWidth="1.2" />
      <circle cx="32" cy="30" r="2.6" fill="#fff" />
    </svg>
  );
}

export function AppNounoumappa() {
  const [intro, setIntro] = useState(true);
  const [essai, setEssai] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1600);
    return () => window.clearTimeout(t);
  }, []);

  const reessayer = () => {
    if (essai) return;
    setEssai(true);
    window.setTimeout(() => {
      setEssai(false);
      toast("Impossible de charger la carte. Vérifiez votre connexion.");
    }, 1400);
  };

  if (intro) {
    return (
      <div className="nm-splash" role="status" aria-label="Nounoumappa">
        <IconeNounoumappa taille={96} />
        <b translate="no">Nounoumappa</b>
        <small>Cartes</small>
      </div>
    );
  }

  return (
    <div className="nm">
      <form className="nm-cherche" onSubmit={(e) => e.preventDefault()}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#888" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input placeholder="Rechercher un lieu" disabled aria-disabled="true" />
      </form>

      <div className="nm-carte" aria-hidden="true">
        <div className={`nm-tuiles${essai ? " charge" : ""}`}>
          {Array.from({ length: 48 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="nm-flou" />
      </div>

      <div className="nm-erreur" role="alert">
        {essai ? (
          <span className="nm-spin" aria-label="Chargement…" />
        ) : (
          <>
            <b>Aucune connexion</b>
            <p>Impossible de charger la carte. Vérifiez votre connexion.</p>
            <button type="button" className="nm-reessayer" onClick={reessayer}>
              Réessayer
            </button>
          </>
        )}
      </div>

      <button type="button" className="nm-position" onClick={() => toast("GPS indisponible")} aria-label="Ma position">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#33b5e5" aria-hidden="true">
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.99 8.99 0 0 0 13 3.06V1h-2v2.06A8.99 8.99 0 0 0 3.06 11H1v2h2.06A8.99 8.99 0 0 0 11 20.94V23h2v-2.06A8.99 8.99 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      </button>
    </div>
  );
}
