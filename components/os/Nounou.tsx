"use client";

/**
 * Nounou Browser : le navigateur d'AakanOS (logo globe-ourson au N bleu, couleurs du tee-shirt de Nounou).
 * Quoi qu'on cherche, Internet ne répond pas : le dauphin est échoué sur le sable… et on peut jouer.
 */
import { useState, type FormEvent } from "react";
import { DauphinPixel, JeuDauphin } from "./Dauphin";

const MENTHE = "#e2ecdd";
const RAYURE = "#7aa7c4";
const RAYURE2 = "#5f8fb0";

export function LogoNounou({ taille = 56 }: { taille?: number }) {
  const p = `nn${taille}`;
  return (
    <svg className="os-icone" viewBox="0 0 64 64" width={taille} height={taille} aria-hidden="true">
      <defs>
        <pattern id={`${p}r`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill={MENTHE} />
          <rect y="4.4" width="7" height="2.6" fill={RAYURE} />
        </pattern>
        <radialGradient id={`${p}g`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f9fc0" />
          <stop offset="1" stopColor="#3f6f92" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="16" r="9" fill={`url(#${p}r)`} stroke={RAYURE2} strokeWidth="2" />
      <circle cx="49" cy="16" r="9" fill={`url(#${p}r)`} stroke={RAYURE2} strokeWidth="2" />
      <circle cx="32" cy="36" r="24" fill={`url(#${p}r)`} stroke={RAYURE2} strokeWidth="2.4" />
      <path d="M22 50V22h5.5l9.5 14.5V22H42v28h-5.5L27 35.5V50z" fill={`url(#${p}n)`} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="32" cy="36" r="24" fill={`url(#${p}g)`} />
    </svg>
  );
}

type Vue = "accueil" | "chargement" | "horsligne" | "jeu";

export function NavigateurNounou({ raccourcis }: { raccourcis: { nom: string; icone: React.ReactNode; ouvrir: () => void }[] }) {
  const [saisie, setSaisie] = useState("");
  const [adresse, setAdresse] = useState("");
  const [vue, setVue] = useState<Vue>("accueil");

  const aller = (e: FormEvent) => {
    e.preventDefault();
    const q = saisie.trim();
    if (!q) return;
    setAdresse(q);
    setVue("chargement");
    (document.activeElement as HTMLElement | null)?.blur();
    window.setTimeout(() => setVue("horsligne"), 1300);
  };

  return (
    <div className="nounou">
      <form className="nounou-barre" onSubmit={aller}>
        <button type="button" className="nounou-logo" aria-label="Accueil Nounou" onClick={() => setVue("accueil")}>
          <LogoNounou taille={30} />
        </button>
        <input
          value={vue === "accueil" ? saisie : saisie || adresse}
          onChange={(e) => setSaisie(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="Rechercher ou saisir une adresse"
          enterKeyHint="go"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className="nounou-onglets">1</span>
        {vue === "chargement" ? <i className="nounou-progression" /> : null}
      </form>

      <div className="nounou-page">
        {vue === "accueil" || vue === "chargement" ? (
          <div className="nounou-accueil">
            <LogoNounou taille={120} />
            <div className="nounou-nom">Nounou</div>
            <div className="nounou-sous">BROWSER</div>
            <div className="nounou-tuiles">
              {raccourcis.map((r) => (
                <button key={r.nom} type="button" onClick={r.ouvrir}>
                  <span>{r.icone}</span>
                  {r.nom}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {vue === "horsligne" ? (
          <div className="nounou-horsligne">
            <div className="nounou-plage">
              <DauphinPixel taille={6} triste />
              <i className="nounou-sable" />
            </div>
            <h2>Hors connexion</h2>
            <p>Le dauphin s’est échoué sur le sable… Internet ne répond pas.</p>
            <button type="button" className="nounou-jouer" onClick={() => setVue("jeu")}>
              ▶ AIDER LE DAUPHIN À NAGER
            </button>
            <small>Impossible d’ouvrir « {adresse} »</small>
          </div>
        ) : null}

        {vue === "jeu" ? (
          <div className="nounou-jeu">
            <JeuDauphin />
            <p>Touche l’écran (ou espace) pour sauter les mines. Glisse vers le bas (ou flèche bas) pour plonger sous les oiseaux.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
