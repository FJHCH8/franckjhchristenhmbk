"use client";

/**
 * Pulpüs market : la boutique d'applis d'AakanOS (logo : le poulpe de Franck dans un sac de courses).
 * À l'ouverture, un chargement… puis le poulpe dort avec sa bulle et son livre : pas d'internet.
 */
import { useEffect, useState } from "react";

function Poulpe({ dort = false }: { dort?: boolean }) {
  // D'après la peluche : rouge, reflets orangés et jaunes, grands yeux ronds, petit sourire.
  return (
    <g>
      <defs>
        <radialGradient id={`pp-corps-${dort ? "d" : "e"}`} cx=".32" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffb020" />
          <stop offset=".35" stopColor="#ff4a28" />
          <stop offset="1" stopColor="#d11a1a" />
        </radialGradient>
      </defs>
      {/* tentacules */}
      <path d="M14 46 C6 50 4 58 10 60 C16 62 20 54 24 50 Z" fill="#e8281f" />
      <path d="M50 46 C58 50 60 58 54 60 C48 62 44 54 40 50 Z" fill="#e8281f" />
      <path d="M22 50 C18 58 20 64 26 63 C31 62 30 55 32 51 Z" fill="#f0381f" />
      <path d="M42 50 C46 58 44 64 38 63 C33 62 34 55 32 51 Z" fill="#f0381f" />
      <path d="M8 58 C12 54 16 56 14 60 Z" fill="#ffc23a" />
      {/* tête */}
      <ellipse cx="32" cy="32" rx="22" ry="21" fill={`url(#pp-corps-${dort ? "d" : "e"})`} />
      <ellipse cx="20" cy="30" rx="5" ry="9" fill="#ffc23a" opacity=".55" />
      {dort ? (
        <>
          <path d="M22 33 q4 3 8 0" stroke="#3a1206" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M34 33 q4 3 8 0" stroke="#3a1206" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M29 40 q3 1.5 6 0" stroke="#3a1206" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="25" cy="31" rx="3.6" ry="4.2" fill="#2a1008" />
          <ellipse cx="39" cy="31" rx="3.6" ry="4.2" fill="#2a1008" />
          <circle cx="26.2" cy="29.6" r="1.1" fill="#fff" />
          <circle cx="40.2" cy="29.6" r="1.1" fill="#fff" />
          <path d="M28.5 38 q3.5 3 7 0" stroke="#2a1008" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** Le logo : un sac de courses blanc, le poulpe qui en sort. */
export function LogoPulpus({ taille = 56 }: { taille?: number }) {
  return (
    <svg className="os-icone" viewBox="0 0 64 64" width={taille} height={taille} aria-hidden="true">
      <defs>
        <linearGradient id="pp-sac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe4ea" />
        </linearGradient>
      </defs>
      <path d="M22 18 C22 8 42 8 42 18" fill="none" stroke="#9aa4ae" strokeWidth="3" />
      <path d="M8 20 H56 L52 60 H12 Z" fill="url(#pp-sac)" stroke="#9aa4ae" strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(13 22) scale(.6)">
        <Poulpe />
      </g>
      <path d="M8 20 H56 L55.5 26 H8.5 Z" fill="#33b5e5" />
    </svg>
  );
}

export function AppPulpus() {
  const [charge, setCharge] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setCharge(false), 1800);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="pulpus">
      {charge ? (
        <div className="pulpus-charge">
          <i />
          <span>Chargement…</span>
        </div>
      ) : (
        <div className="pulpus-hs">
          <svg viewBox="0 0 120 100" width="230" aria-hidden="true">
            {/* livre ouvert posé devant */}
            <path d="M30 86 Q45 80 60 86 Q75 80 90 86 V96 Q75 90 60 96 Q45 90 30 96 Z" fill="#f4efe2" stroke="#b9ab88" strokeWidth="1.2" />
            <path d="M60 86 V96" stroke="#b9ab88" strokeWidth="1.2" />
            <path d="M36 88 h18 M36 91 h16 M66 88 h18 M66 91 h16" stroke="#cfc4a6" strokeWidth=".8" />
            <g transform="translate(28 22)">
              <Poulpe dort />
            </g>
            {/* la bulle qui gonfle, et les z */}
            <circle className="pulpus-bulle" cx="66" cy="62" r="5" fill="rgba(190,230,255,.5)" stroke="#9fd6ff" strokeWidth="1" />
            <text className="pulpus-z" x="88" y="30" fill="#9fd6ff" fontSize="10" fontFamily="sans-serif">z</text>
            <text className="pulpus-z b" x="96" y="20" fill="#9fd6ff" fontSize="13" fontFamily="sans-serif">Z</text>
          </svg>
          <p>Vous n’êtes malheureusement pas connecté à internet.</p>
          <button type="button" className="pulpus-reessayer" onClick={() => setCharge(true)}>
            RÉESSAYER
          </button>
        </div>
      )}
    </div>
  );
}
