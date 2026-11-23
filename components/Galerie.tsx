"use client";

import Link from "next/link";
import { useState } from "react";

type Rubrique = { id: string; titre: string; texte: string; href: string; photo: string; cadre: string; externe?: boolean };

const RUBRIQUES: Rubrique[] = [
  { id: "qui", titre: "qui suis-je", texte: "Né différent. Il regarde ce que personne ne voulait voir.", href: "/qui-suis-je", photo: "/media/franck.jpg", cadre: "50% 30%" },
  { id: "apropos", titre: "à propos", texte: "Les coulisses du site, et ce qui s’y prépare.", href: "/?parametres=apropos", photo: "/fond/judo-960.webp", cadre: "50% 20%" },
  { id: "contact", titre: "contact", texte: "Une idée, une question ? Deux chemins mènent jusqu’à Franck.", href: "/?parametres=contact", photo: "/fond/avion-960.webp", cadre: "68% 42%" },
  { id: "projets", titre: "projets", texte: "Des citations, des projets, et Endurreisen qui approche.", href: "/projets", photo: "/fond/rose-960.webp", cadre: "46% 30%" },
  { id: "insta", titre: "instagram", texte: "@fjhchristenhmbk — les nouveautés, au fil des jours.", href: "https://instagram.com/fjhchristenhmbk", photo: "/media/franck-enfant-900.webp", cadre: "50% 25%", externe: true },
];

function Ouvrir({ r, className }: { r: Rubrique; className?: string }) {
  return r.externe ? (
    <a className={className} href={r.href} target="_blank" rel="noopener noreferrer">ouvrir</a>
  ) : (
    <Link className={className} href={r.href}>ouvrir</Link>
  );
}

/* ── 8 · Accordéon : des bandes, une seule ouverte en grand ── */
/**
 * La galerie de l'accueil, en accordéon : une bande de photo par rubrique ;
 * un appui en ouvre une en grand (photo, phrase, bouton), les autres se resserrent.
 */
export function Galerie() {
  const [ouvert, setOuvert] = useState(0);
  return (
    <section className="gt gt-accordeon" aria-label="Explorer le site">
      <p className="gt-kicker">explorer</p>
      <h2 className="gt-titre">franck j.h. christen</h2>
      <div className="gt-bandes">
        {RUBRIQUES.map((r, i) => (
          <article key={r.id} className={i === ouvert ? "gt-bande is-ouvert" : "gt-bande"} onClick={() => setOuvert(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.photo} alt="" style={{ objectPosition: r.cadre }} />
            <div className="gt-bande-voile" />
            <div className="gt-bande-texte">
              <p className="gt-bande-titre">
                <small>0{i + 1}</small> {r.titre}
              </p>
              <div className="gt-bande-plus">
                <p>{r.texte}</p>
                <Ouvrir r={r} className="gt-bouton" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

