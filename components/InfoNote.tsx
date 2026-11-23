"use client";

import { useId, useState } from "react";
import { T } from "@/components/Locale";

const BUBBLE =
  "Ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. Suivez le compte Instagram de Franck et peut-être serez-vous averti des nouveautés.";

/**
 * « Information », comme une ligne des paramètres : une tuile, le titre, une flèche.
 * Un appui la déplie en douceur et montre le texte et le lien Instagram.
 */
export function InfoNote() {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <div className={ouvert ? "infobloc is-ouvert" : "infobloc"}>
      <button type="button" className="infobloc-tete" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)}>
        <span className="infobloc-tuile" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 10v9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="12" cy="5.6" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <span className="infobloc-titre">
          <T>information</T>
        </span>
        <svg className="infobloc-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="infobloc-corps" id={id} role="region" aria-hidden={!ouvert} inert={ouvert ? undefined : true}>
        <div>
          <p>{BUBBLE}</p>
          <a href="https://www.instagram.com/fjhchristenhmbk/" rel="noopener noreferrer" target="_blank" translate="no">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="16.8" cy="7.2" r="1" fill="currentColor" />
            </svg>
            @fjhchristenhmbk
          </a>
        </div>
      </div>
    </div>
  );
}
