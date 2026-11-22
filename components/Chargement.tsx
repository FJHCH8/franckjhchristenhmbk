"use client";

import { useEffect, useState } from "react";
import { AnneauPS2 } from "@/components/AnneauPS2";

/**
 * L'anneau de chargement façon PS2, affiché seulement si une page tarde à venir
 * (classe html.nav-lent). Il n'est dessiné que pendant ce temps-là.
 */
export function Chargement() {
  const [lent, setLent] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const lire = () => setLent(root.classList.contains("nav-lent"));
    const obs = new MutationObserver(lire);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return <div className="chargement" aria-hidden="true">{lent ? <AnneauPS2 taille={110} /> : null}</div>;
}
