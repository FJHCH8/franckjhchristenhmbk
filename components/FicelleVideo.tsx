"use client";

import { useEffect, useRef } from "react";

const DOSSIER = "/ficelle";
const VITESSE = 1.6; // une transition de 4 s se joue en 2,5 s

const boucle = (i: number) => `${DOSSIER}/boucle-${i}.mp4`;
const affiche = (i: number) => `${DOSSIER}/boucle-${i}.jpg`;

/**
 * La ficelle des chapitres, en vidéo : la boucle du chapitre affiché ondule sans fin ;
 * quand le chapitre change, la transition (délacement puis nouveau nœud) se joue une fois,
 * puis la boucle suivante prend le relais. Les vidéos se jouent normalement, sans être
 * pilotées image par image : c'est fluide même sur un vieil appareil.
 */
export function FicelleVideo({ index, total, actif }: { index: number; total: number; actif: boolean }) {
  const boucleRef = useRef<HTMLVideoElement>(null);
  const passageRef = useRef<HTMLVideoElement>(null);
  const etat = useRef({ montre: 0, cible: 0, occupe: false });

  // Les transitions sont mises en cache dès que la partie approche, pour partir sans attendre.
  useEffect(() => {
    if (!actif) return;
    for (let i = 1; i < total; i += 1) {
      void fetch(`${DOSSIER}/vers-${i}.mp4`).catch(() => undefined);
      void fetch(`${DOSSIER}/retour-${i}.mp4`).catch(() => undefined);
    }
  }, [actif, total]);

  useEffect(() => {
    const v = boucleRef.current;
    if (!v) return;
    if (actif) void v.play().catch(() => undefined);
    else v.pause();
  }, [actif]);

  useEffect(() => {
    const e = etat.current;
    e.cible = index;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lecteur = boucleRef.current;
    const passage = passageRef.current;
    if (!lecteur || !passage) return;

    const avancer = () => {
      if (e.occupe || e.cible === e.montre) return;
      const suivant = e.cible > e.montre ? e.montre + 1 : e.montre - 1;
      if (calme) {
        e.montre = e.cible;
        lecteur.poster = affiche(e.montre);
        lecteur.src = boucle(e.montre);
        return;
      }
      e.occupe = true;
      passage.src = suivant > e.montre ? `${DOSSIER}/vers-${suivant}.mp4` : `${DOSSIER}/retour-${e.montre}.mp4`;
      passage.playbackRate = Math.abs(e.cible - e.montre) > 1 ? VITESSE * 1.6 : VITESSE;
      const lancer = () => {
        passage.classList.add("is-visible");
        void passage.play().catch(() => fin());
      };
      const fin = () => {
        passage.removeEventListener("ended", fin);
        e.montre = suivant;
        lecteur.poster = affiche(suivant);
        lecteur.src = boucle(suivant);
        const montrer = () => {
          lecteur.removeEventListener("playing", montrer);
          passage.classList.remove("is-visible");
          e.occupe = false;
          avancer();
        };
        lecteur.addEventListener("playing", montrer);
        void lecteur.play().catch(() => montrer());
      };
      passage.addEventListener("ended", fin);
      if (passage.readyState >= 2) lancer();
      else passage.addEventListener("loadeddata", lancer, { once: true });
    };
    avancer();
  }, [index]);

  return (
    <div className="ficelle-video" aria-hidden="true">
      <video ref={boucleRef} className="ficelle-boucle" src={boucle(0)} poster={affiche(0)} muted loop playsInline autoPlay preload="auto" />
      <video ref={passageRef} className="ficelle-passage" muted playsInline preload="auto" />
    </div>
  );
}
