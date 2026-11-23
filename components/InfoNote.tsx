"use client";

import { useId, useState } from "react";
import { Icone } from "@/components/Icone";
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
          <Icone nom="info" />
        </span>
        <span className="infobloc-titre">
          <T>information</T>
        </span>
        <Icone nom="chevron_right" className="infobloc-chevron" />
      </button>
      <div className="infobloc-corps" id={id} role="region" aria-hidden={!ouvert} inert={ouvert ? undefined : true}>
        <div>
          <p>{BUBBLE}</p>
          <a href="https://www.instagram.com/fjhchristenhmbk/" rel="noopener noreferrer" target="_blank" translate="no">
            <Icone nom="photo_camera" />
            @fjhchristenhmbk
          </a>
        </div>
      </div>
    </div>
  );
}
