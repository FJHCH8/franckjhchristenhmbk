"use client";

import { useEffect, useState } from "react";
import { AnneauPS2 } from "@/components/AnneauPS2";

/** Une image visible à l'écran qui n'a pas fini de charger. */
function imageEnAttente() {
  const h = window.innerHeight;
  for (const img of Array.from(document.images)) {
    if (img.complete) continue;
    const r = img.getBoundingClientRect();
    if (r.width > 40 && r.bottom > 0 && r.top < h) return true;
  }
  return false;
}

/**
 * Le Starload PS2, partout où quelque chose charge :
 * — en grand, au milieu, quand une page tarde à venir (classe html.nav-lent) ;
 * — en petit, dans le coin, tant qu'une photo visible n'est pas encore arrivée.
 * Il n'est dessiné que pendant ce temps-là.
 */
export function Chargement() {
  const [lent, setLent] = useState(false);
  const [images, setImages] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const lire = () => setLent(root.classList.contains("nav-lent"));
    const obs = new MutationObserver(lire);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });

    let attente = 0;
    let verif = 0;
    // Petit délai : une photo déjà en cache ne fait jamais clignoter l'anneau.
    const verifier = () => {
      window.clearTimeout(attente);
      attente = window.setTimeout(() => {
        const encore = imageEnAttente();
        setImages(encore);
        window.clearTimeout(verif);
        if (encore) verif = window.setTimeout(verifier, 500);
      }, 350);
    };
    document.addEventListener("load", verifier, true);
    document.addEventListener("error", verifier, true);
    window.addEventListener("scrollend", verifier);
    window.addEventListener("load", verifier);
    verifier();
    return () => {
      obs.disconnect();
      window.clearTimeout(attente);
      window.clearTimeout(verif);
      document.removeEventListener("load", verifier, true);
      document.removeEventListener("error", verifier, true);
      window.removeEventListener("scrollend", verifier);
      window.removeEventListener("load", verifier);
    };
  }, []);

  return (
    <>
      <div className="chargement" role="status" aria-label="Chargement en cours">
        {lent ? <AnneauPS2 taille={96} className="starload-grand" /> : null}
      </div>
      <div className={images && !lent ? "chargement-coin is-on" : "chargement-coin"} aria-hidden="true">
        {images && !lent ? <AnneauPS2 taille={46} /> : null}
      </div>
    </>
  );
}
