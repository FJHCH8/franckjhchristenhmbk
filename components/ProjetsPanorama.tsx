"use client";

import { HanckTerrain } from "@/components/nouveau/HanckTerrain";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Countdown, useCompte } from "@/components/Countdown";
import { LogoProgression } from "@/components/LogoProgression";
import { AUBE_END_MS, AUBE_START_MS, EVENEMENTS, PROJECTS_OPENING_MS } from "@/lib/paris";

const JOUR = 86_400_000;

function dateCourte(ms: number) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(ms));
}

function dateLongue(ms: number) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(ms));
}

/** L'heure, rafraîchie chaque minute (null pendant le rendu serveur, pour éviter tout décalage). */
export function useMaintenant() {
  const [maintenant, setMaintenant] = useState<number | null>(null);
  useEffect(() => {
    const premier = window.requestAnimationFrame(() => setMaintenant(Date.now()));
    const minute = window.setInterval(() => setMaintenant(Date.now()), 60_000);
    return () => {
      window.cancelAnimationFrame(premier);
      window.clearInterval(minute);
    };
  }, []);
  return maintenant;
}

const ETAPES = [0, 0.25, 0.5, 0.75, 1];

/** L'aube, en cinq étapes qui s'allument au passage. */
function Aube({ maintenant }: { maintenant: number | null }) {
  const span = AUBE_END_MS - AUBE_START_MS;
  const p = maintenant == null ? 0 : Math.min(1, Math.max(0, (maintenant - AUBE_START_MS) / span));
  const avant = maintenant != null && maintenant < AUBE_START_MS;
  const fini = maintenant != null && maintenant >= AUBE_END_MS;
  const statut =
    maintenant == null
      ? " "
      : avant
        ? `commence dans ${Math.ceil((AUBE_START_MS - maintenant) / JOUR)} jours`
        : fini
          ? "terminée"
          : `${Math.round(p * 100)} % · fin le ${dateCourte(AUBE_END_MS)}`;
  return (
    <div className="aube">
      <p className="pano-etiquette">l&apos;aube · du {dateCourte(AUBE_START_MS)} au {dateCourte(AUBE_END_MS)} · 6 mois</p>
      <p className="pano-statut">{statut}</p>
      <div className="aube-frise" style={{ ["--p" as string]: p } as CSSProperties}>
        <span className="aube-ligne" />
        <span className="aube-ligne aube-ligne-faite" />
        {ETAPES.map((e) => (
          <span key={e} className={p >= e && !avant ? "aube-etape is-on" : "aube-etape"} style={{ ["--e" as string]: e } as CSSProperties}>
            <i />
            <small>{dateCourte(AUBE_START_MS + span * e)}</small>
          </span>
        ))}
        {!avant && !fini ? <span className="aube-curseur" /> : null}
      </div>
    </div>
  );
}

/** Le cadran : 100 traits partagés entre les rubriques selon leur nombre. */
function Cadran({ comptes }: { comptes: { nom: string; nombre: number; couleur: string }[] }) {
  const total = comptes.reduce((a, c) => a + c.nombre, 0);
  const traits: { couleur: string; debut: boolean }[] = [];
  if (total > 0) {
    let deja = 0;
    comptes.forEach((c, k) => {
      const fin = k === comptes.length - 1 ? 100 : Math.round(((deja + c.nombre) / total) * 100);
      const depart = traits.length;
      for (let i = depart; i < fin; i++) traits.push({ couleur: c.couleur, debut: i === depart });
      deja += c.nombre;
    });
  }
  while (traits.length < 100) traits.push({ couleur: "#262626", debut: false });
  return (
    <div className="cadran">
      <p className="pano-etiquette">le cadran · toutes les rubriques = 100</p>
      <div className="cadran-corps">
        <svg viewBox="0 0 200 200" className="cadran-svg" aria-hidden="true">
          {traits.map((t, i) => (
            <rect key={i} x="98.6" y="6" width="2.8" height={t.debut ? 26 : 18} fill={t.couleur} transform={`rotate(${i * 3.6} 100 100)`} />
          ))}
          <text x="100" y="104" textAnchor="middle" className="cadran-total">
            {total}
          </text>
          <text x="100" y="126" textAnchor="middle" className="cadran-legende-total">
            ÉLÉMENTS
          </text>
        </svg>
        <ul className="cadran-legende">
          {comptes.map((c) => (
            <li key={c.nom}>
              <span style={{ background: c.couleur }} />
              {c.nombre} {c.nom}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Le haut de la page Projets, en panorama Windows Phone : trois volets qu'on fait glisser
 * (endurreisen, l'aube, le cadran). Derrière, le mot « vayak » géant et le logo de Franck,
 * qui grandit avec la progression ; les deux défilent avec le doigt, à des vitesses différentes.
 */
export function ProjetsPanorama({ comptes }: { comptes: { nom: string; nombre: number; couleur: string }[] }) {
  const vue = useCompte();
  const maintenant = useMaintenant();
  const piste = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [volet, setVolet] = useState(0);

  const endurFini = maintenant != null && maintenant >= PROJECTS_OPENING_MS;
  const aube = maintenant == null ? 0 : Math.min(1, Math.max(0, (maintenant - AUBE_START_MS) / (AUBE_END_MS - AUBE_START_MS)));
  // Le logo du fond suit Endurreisen, puis L'aube une fois Endurreisen terminé.
  const courant = endurFini ? aube : vue.progress;

  useEffect(() => {
    const node = piste.current;
    const fond = scene.current;
    if (!node || !fond) return;
    let frame = 0;
    const peindre = () => {
      frame = 0;
      const x = node.scrollLeft;
      fond.style.setProperty("--px", `${(-x).toFixed(1)}px`);
      const i = Math.round(x / Math.max(1, node.clientWidth));
      setVolet((avant) => (avant === i ? avant : i));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(peindre);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const aller = (i: number) => {
    const node = piste.current;
    if (node) node.scrollTo({ left: i * node.clientWidth, behavior: "smooth" });
  };

  const VOLETS = ["hanck 7 pro max", "endurreisen", "l'aube", "cadran"];
  const finis = maintenant == null ? 0 : EVENEMENTS.filter((e) => maintenant >= e.fin).length;
  const tousComptes = [...comptes, { nom: "événements", nombre: finis, couleur: "#339933" }];

  return (
    <section className="pano" ref={scene} aria-label="Actualité : Hanck 7 Pro Max, endurreisen, l'aube et le cadran">
      <div className="pano-fond" aria-hidden="true">
        <span className="pano-mot tavissiv" lang="x-tavissiv">vayak</span>
        <div className="pano-logo" style={{ ["--taille" as string]: (0.45 + 0.55 * courant).toFixed(3) } as CSSProperties}>
          <LogoProgression id="pano-fond" progress={courant} />
        </div>
      </div>
      <p className="pano-actualite">actualité</p>
      <nav className="pano-pivot" aria-label="Volets">
        {VOLETS.map((v, i) => (
          <button key={v} type="button" className={volet === i ? "is-actif" : ""} onClick={() => aller(i)}>
            {v}
          </button>
        ))}
      </nav>
      <div className="pano-piste" ref={piste}>
        <div className="pano-volet pano-volet-hanck">
          <HanckTerrain />
        </div>
        <div className="pano-volet">
          <LogoProgression id="pano-endur" progress={vue.progress} className="pano-logo-principal" />
          <div className="pano-chrono">
            <div>
              <p className="pano-etiquette">endurreisen · ouverture le {dateLongue(PROJECTS_OPENING_MS)}</p>
              <Countdown />
            </div>
            <p className="pano-pourcent">
              {Math.floor(vue.progress * 100)}
              <small>%</small>
            </p>
          </div>
        </div>
        <div className="pano-volet">
          <Aube maintenant={maintenant} />
        </div>
        <div className="pano-volet">
          <Cadran comptes={tousComptes} />
        </div>
      </div>
    </section>
  );
}

/** Une case « événement » : le logo complet avec un reflet, et dedans le déroulement entier. */
export function EvenementsTuiles() {
  const maintenant = useMaintenant();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const finis = maintenant == null ? [] : EVENEMENTS.filter((e) => maintenant >= e.fin);
  const choisi = finis.find((e) => e.id === ouvert);
  return (
    <div className="evenements" id="evenements">
      <p className="pano-etiquette">événements · {finis.length}</p>
      {!finis.length ? <p className="evenements-vide">Aucun événement pour l&apos;instant. Chaque compte à rebours terminé viendra s&apos;y ranger.</p> : null}
      <div className="evenements-grille">
        {finis.map((e) => (
          <button key={e.id} type="button" className="evenement-tuile" aria-expanded={ouvert === e.id} onClick={() => setOuvert(ouvert === e.id ? null : e.id)}>
            <LogoProgression id={`evt-${e.id}`} progress={1} className="evenement-logo" />
            <span className="evenement-reflet" aria-hidden="true" />
            <span className="evenement-texte">
              <small>événement</small>
              <strong>{e.nom}</strong>
              <em>le {dateLongue(e.fin)}</em>
            </span>
          </button>
        ))}
      </div>
      {choisi ? (
        <div className="evenement-detail">
          <LogoProgression id={`evt-detail-${choisi.id}`} progress={1} className="evenement-detail-logo" />
          <p className="pano-etiquette">déroulement</p>
          <p className="evenement-duree">
            du {dateLongue(choisi.debut)} au {dateLongue(choisi.fin)}
            <br />
            {Math.round((choisi.fin - choisi.debut) / JOUR)} jours
          </p>
        </div>
      ) : null}
    </div>
  );
}
