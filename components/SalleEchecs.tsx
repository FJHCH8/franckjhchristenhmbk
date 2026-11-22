"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Split } from "@/components/Kinetic";
import { clic, souffle } from "@/lib/sons";

const PIECES = ["roi", "reine", "tour", "fou", "cavalier", "pion"];
const ORBES = 12;

type JeuProps = { travailleur: Worker; onFermer: () => void };

function image(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Le bouton « Jouer aux échecs ». Au clic, tout le jeu se charge (code, pièces, bot)
 * derrière une barre de chargement ; il ne s'affiche qu'une fois entièrement prêt.
 */
export function SalleEchecs() {
  const [phase, setPhase] = useState<"repos" | "charge" | "jeu">("repos");
  const [avance, setAvance] = useState(0);
  const [partie, setPartie] = useState<{ Jeu: ComponentType<JeuProps>; travailleur: Worker } | null>(null);
  const travailleurRef = useRef<Worker | null>(null);

  const ouvrir = async () => {
    if (phase !== "repos") return;
    clic();
    setPhase("charge");
    setAvance(0);
    const etapes = 2 + PIECES.length;
    let faites = 0;
    const fini = () => {
      faites += 1;
      setAvance(faites / etapes);
    };
    const debut = performance.now();
    const [module] = await Promise.all([
      import("@/components/Echecs").then((m) => {
        fini();
        return m;
      }),
      new Promise<void>((resolve) => {
        const w = travailleurRef.current ?? new Worker(new URL("../lib/bot.worker.ts", import.meta.url), { type: "module" });
        travailleurRef.current = w;
        const pret = () => {
          w.removeEventListener("message", pret);
          fini();
          resolve();
        };
        w.addEventListener("message", pret);
        w.postMessage({ id: -1, ping: true });
      }),
      ...PIECES.map((p) => image(`/echecs/${p}.png`).then(fini)),
    ]);
    const travailleur = travailleurRef.current;
    // La barre a le temps d'arriver au bout avant que le jeu s'ouvre.
    const reste = Math.max(0, 1100 - (performance.now() - debut));
    window.setTimeout(() => {
      if (travailleur) setPartie({ Jeu: module.default, travailleur });
      setPhase("jeu");
      souffle();
    }, reste + 450);
  };

  const fermer = useCallback(() => {
    setPhase("repos");
    clic();
  }, []);

  // Pendant le chargement et la partie, la page derrière ne défile plus.
  useEffect(() => {
    if (phase === "repos") return;
    const lenis = (window as Window & { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("jeu-ouvert");
    return () => {
      document.documentElement.classList.remove("jeu-ouvert");
      lenis?.start();
      document.documentElement.style.overflow = avant;
    };
  }, [phase]);

  useEffect(() => () => travailleurRef.current?.terminate(), []);

  const Jeu = partie?.Jeu;
  const pourcent = Math.round(avance * 100);

  return (
    <section className="echecs shell" aria-labelledby="titre-echecs">
      <p className="kicker">
        <Split text="Échecs" mode="chars" />
      </p>
      <h2 className="echecs-titre" id="titre-echecs">
        <Split text="Une partie ?" mode="chars" className="kt-x" />
      </h2>
      <button type="button" className="echecs-lancer" onClick={() => void ouvrir()} data-glow="" data-magnet="">
        <span className="echecs-lancer-piece" aria-hidden="true" />
        <span className="echecs-lancer-texte">
          <span>Jouer aux échecs</span>
          <small>Contre le bot · trois niveaux</small>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {phase === "charge" ? createPortal(
        <div className="jeu-chargement" role="status" aria-live="polite">
          <p className="jeu-chargement-titre">Chargement en cours</p>
          <div className="jeu-chargement-ligne">
            <div className="wiiu-barre" aria-hidden="true">
              <span style={{ ["--avance" as string]: avance } as CSSProperties} />
            </div>
            <div className="intro-anneau is-petit" aria-hidden="true">
              {Array.from({ length: ORBES }, (_, i) => (
                <span key={i} style={{ ["--i" as string]: i, ["--n" as string]: ORBES } as CSSProperties} />
              ))}
            </div>
          </div>
          <p className="jeu-chargement-pourcent">{pourcent} %</p>
        </div>,
        document.body,
      ) : null}

      {phase === "jeu" && Jeu && partie ? createPortal(<Jeu travailleur={partie.travailleur} onFermer={fermer} />, document.body) : null}
    </section>
  );
}
