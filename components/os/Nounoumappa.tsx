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
        <linearGradient id={`${id}ciel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5ec4ee" />
          <stop offset=".55" stopColor="#1a86c2" />
          <stop offset="1" stopColor="#0b4f86" />
        </linearGradient>
        <linearGradient id={`${id}bril`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".42" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}n`} x1=".5" y1="0" x2=".5" y2="1">
          <stop offset="0" stopColor="#ff5a5a" />
          <stop offset="1" stopColor="#b0141c" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect width="64" height="64" rx="14" ry="14" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" ry="14" fill={`url(#${id}ciel)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* fond de carte original : terres, mer, quadrillage */}
        <path d="M-4 40c8-9 16-7 22-3 7 5 11-2 18-4 8-3 14 4 20 1 6-3 10-1 12 3v32H-4z" fill="#7ed39a" opacity=".88" />
        <path d="M-2 48c7-4 13 1 19 0 8-1 10-7 17-6 6 1 9 6 16 5 5-1 10-5 16-2v24H-2z" fill="#5bb87c" opacity=".8" />
        <path d="M8 18c6-8 14-4 16 2 2 7-4 11-1 16 2 4 9 3 8 9-8 3-18-2-22-9-3-6-6-12-1-18z" fill="#8fddaa" opacity=".75" />
        <path d="M44 10c7-3 16 3 18 10 2 6-2 10 1 14 3 5-1 9-6 10-8 1-12-8-16-14-4-6-5-17 3-20z" fill="#6fc894" opacity=".7" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${10 + i * 7}h64`} fill="none" stroke="#dff6ff" strokeWidth=".5" opacity=".35" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <path key={`v${i}`} d={`M${10 + i * 7} 0v64`} fill="none" stroke="#dff6ff" strokeWidth=".5" opacity=".35" />
        ))}
        <path d="M6 46c8-3 12 2 20 1 7-1 11-6 18-5 6 1 10 5 16 3" fill="none" stroke="#f4e2a4" strokeWidth="1.4" strokeLinecap="round" opacity=".85" />
        <path d="M18 30c5 2 7 7 13 8 6 1 9-3 15-2" fill="none" stroke="#f7eec0" strokeWidth="1.1" strokeLinecap="round" opacity=".75" />
        {/* rose des vents originale, aiguille rouge et blanche */}
        <g transform="translate(32 26)">
          <circle r="13.6" fill="#0a3a5c" fillOpacity=".18" stroke="#fff" strokeWidth="1.4" />
          <circle r="11.6" fill="none" stroke="#d7f3ff" strokeWidth=".6" opacity=".8" />
          {([0, 45, 90, 135, 180, 225, 270, 315] as const).map((a) => (
            <rect key={a} x="-.5" y="-13.2" width="1" height={a % 90 === 0 ? 3.2 : 2} fill="#fff" transform={`rotate(${a})`} />
          ))}
          <path d="M0-9L2.1-2.2 0-1.2-2.1-2.2Z" fill="#f7fbff" />
          <path d="M0 9L2.1 2.2 0 1.2-2.1 2.2Z" fill="#f7fbff" />
          <path d="M9 0L2.2 2.1 1.2 0 2.2-2.1Z" fill="#f7fbff" />
          <path d="M-9 0L-2.2 2.1-1.2 0-2.2-2.1Z" fill="#f7fbff" />
          <path d="M0-11.2L2.4 0 0 1.4Z" fill={`url(#${id}n)`} />
          <path d="M0-11.2L-2.4 0 0 1.4Z" fill="#e63a3a" />
          <path d="M0 11.2L2.4 0 0-1.4Z" fill="#f4f7fb" />
          <path d="M0 11.2L-2.4 0 0-1.4Z" fill="#d8dee8" />
          <circle r="2.1" fill="#fff" stroke="#173a58" strokeWidth="1" />
          <circle r=".7" fill="#173a58" />
          <text x="0" y="-15.2" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="4.4" fill="#fff">N</text>
        </g>
        <rect x="0" y="47" width="64" height="17" fill="#07253c" fillOpacity=".55" />
        <text x="32" y="58.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="9.2" letterSpacing=".4" fill="#fff" stroke="#07253c" strokeWidth="2.4" paintOrder="stroke">Nounou</text>
        <rect width="64" height="64" rx="14" ry="14" fill={`url(#${id}bril)`} />
      </g>
      <rect width="64" height="64" rx="14" ry="14" fill="none" stroke="#08324a" strokeWidth="1.25" />
      <rect x="1.1" y="1.1" width="61.8" height="61.8" rx="13" ry="13" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth=".9" />
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
