"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

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

/* ── 9 · Constellation : chaque rond du logo est une rubrique ── */
const POINTS: [number, number][] = [
  [148.7, 17.6], [112.1, 80.8], [128.0, 89.6], [116.8, 91.6], [27.2, 75.0], [29.2, 90.4], [70.6, 136.2], [123.8, 171.7], [168.1, 176.5],
];
/** Quel point du logo porte quelle rubrique. */
const PLACES: Record<string, number> = { insta: 0, projets: 2, qui: 4, apropos: 6, contact: 8 };

export function GalerieConstellation() {
  const [choix, setChoix] = useState("qui");
  const r = RUBRIQUES.find((x) => x.id === choix)!;
  return (
    <section className="gt gt-constellation">
      <p className="gt-kicker">explorer</p>
      <h2 className="gt-titre">la constellation</h2>
      <div className="gt-ciel">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path d={"M" + POINTS.map(([x, y]) => `${x} ${y}`).join(" L")} fill="none" stroke="#3a3a3a" strokeWidth="1" strokeLinejoin="round" />
          {POINTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#555" />
          ))}
        </svg>
        {RUBRIQUES.map((x) => {
          const [px, py] = POINTS[PLACES[x.id]!]!;
          return (
            <button
              key={x.id}
              type="button"
              className={x.id === choix ? "gt-astre is-actif" : "gt-astre"}
              style={{ left: `${(px / 200) * 100}%`, top: `${(py / 200) * 100}%` } as CSSProperties}
              onClick={() => setChoix(x.id)}
              aria-pressed={x.id === choix}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.photo} alt="" style={{ objectPosition: x.cadre }} />
              <span>{x.titre}</span>
            </button>
          );
        })}
      </div>
      <div className="gt-fiche" key={r.id}>
        <p className="gt-kicker">0{RUBRIQUES.indexOf(r) + 1} · {r.titre}</p>
        <p className="gt-fiche-texte">{r.texte}</p>
        <Ouvrir r={r} className="gt-bouton" />
      </div>
    </section>
  );
}

/* ── 8 · Accordéon : des bandes, une seule ouverte en grand ── */
export function GalerieAccordeon() {
  const [ouvert, setOuvert] = useState(0);
  return (
    <section className="gt gt-accordeon">
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

/* ── 12 · Tableau en liège : photos épinglées, un appui les décroche ── */
const EPINGLES: { x: number; y: number; r: number }[] = [
  { x: 6, y: 9, r: -6 }, { x: 50, y: 22, r: 5 }, { x: 8, y: 44, r: 4 }, { x: 47, y: 60, r: -5 }, { x: 14, y: 77, r: 3 },
];

export function GalerieLiege() {
  const [decroche, setDecroche] = useState<string | null>(null);
  const r = RUBRIQUES.find((x) => x.id === decroche);
  return (
    <section className="gt gt-liege">
      <p className="gt-kicker">explorer</p>
      <h2 className="gt-titre">le tableau</h2>
      <div className="gt-tableau">
        <svg className="gt-fil" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={"M" + EPINGLES.map((p) => `${p.x + 20} ${p.y + 1}`).join(" L")} fill="none" stroke="#b22" strokeWidth="0.4" />
        </svg>
        <div className="gt-postit">Ta deuxième vie commence quand tu comprends que tu n’en as qu’une.</div>
        {RUBRIQUES.map((x, i) => {
          const p = EPINGLES[i]!;
          return (
            <button
              key={x.id}
              type="button"
              className={decroche === x.id ? "gt-polaroid is-decroche" : "gt-polaroid"}
              style={{ left: `${p.x}%`, top: `${p.y}%`, ["--r" as string]: `${p.r}deg` } as CSSProperties}
              onClick={() => setDecroche(decroche === x.id ? null : x.id)}
            >
              <span className="gt-punaise" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.photo} alt="" style={{ objectPosition: x.cadre }} />
              <span className="gt-ecrit">{x.titre}</span>
            </button>
          );
        })}
        {r ? (
          <div className="gt-liege-fiche" key={r.id}>
            <p>{r.texte}</p>
            <div>
              <Ouvrir r={r} className="gt-bouton" />
              <button type="button" className="gt-bouton gt-bouton-doux" onClick={() => setDecroche(null)}>
                raccrocher
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
