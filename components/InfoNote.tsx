"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Gemme } from "@/components/Gemme";
import { Block } from "@/components/Locale";

const BUBBLE =
  "Ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. Suivez le compte Instagram de Franck et peut-être serez-vous averti des nouveautés.";

type Phase = "repos" | "course" | "ouvert" | "fermeture";

function calme() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function InfoNote() {
  const [phase, setPhase] = useState<Phase>("repos");
  const [eclat, setEclat] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const bubbleId = useId();
  const ouvert = phase === "ouvert" || phase === "fermeture";

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (phase !== "ouvert") return;
    setEclat(true);
    const flash = window.setTimeout(() => setEclat(false), 480);
    const note = wrapRef.current;
    const bubble = document.getElementById(bubbleId);
    const lift = () => {
      if (!note || !bubble) return;
      note.style.paddingBottom = `${bubble.offsetHeight + 28}px`;
      const nav = document.querySelector(".nav")?.getBoundingClientRect();
      const limit = nav && nav.top > window.innerHeight * 0.45 ? nav.top - 20 : window.innerHeight - 16;
      const bottom = bubble.getBoundingClientRect().bottom;
      if (bottom > limit) window.scrollBy(0, bottom - limit);
    };
    lift();
    const later = window.setTimeout(lift, calme() ? 0 : 420);
    return () => {
      window.clearTimeout(flash);
      window.clearTimeout(later);
      if (note) note.style.paddingBottom = "";
    };
  }, [phase, bubbleId]);

  useEffect(() => {
    if (phase !== "ouvert") return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) fermer();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") fermer();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [phase]);

  function ouvrir() {
    if (phase === "course" || phase === "fermeture" || phase === "ouvert") return;
    if (calme()) {
      setPhase("ouvert");
      return;
    }
    setPhase("course");
  }

  function fermer() {
    if (phase !== "ouvert") return;
    if (calme()) {
      setPhase("repos");
      setEclat(false);
      return;
    }
    setPhase("fermeture");
    setEclat(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("repos"), 420);
  }

  const bulle =
    phase === "ouvert" ? "info-bubble is-open" : phase === "fermeture" ? "info-bubble is-closing" : "info-bubble";

  return (
    <div className="info-note" ref={wrapRef}>
      <div className="info-pair">
        <button
          type="button"
          className="info-dot"
          aria-expanded={phase === "ouvert"}
          aria-controls={bubbleId}
          aria-label="Informations"
          onClick={ouvrir}
        >
          <Gemme tone="ame" pose={phase === "repos" ? "tourne" : "face"} eclat={eclat} onFace={() => setPhase("ouvert")} />
        </button>
        <button type="button" className="info-word" aria-expanded={phase === "ouvert"} aria-controls={bubbleId} onClick={ouvrir}>
          Information
          <span className="info-sheen" aria-hidden="true" />
        </button>
      </div>
      <div className={bulle} id={bubbleId} role="region" aria-hidden={phase !== "ouvert"} inert={phase === "ouvert" ? undefined : true}>
        <p className="info-ligne" style={{ ["--i" as string]: 0 }}>
          <Block lines={["100%", "96%", "88%", "70%"]}>{BUBBLE}</Block>
        </p>
        <a className="info-ligne" style={{ ["--i" as string]: 1 }} href="https://www.instagram.com/fjhchristenhmbk/" rel="noopener noreferrer" target="_blank">
          @fjhchristenhmbk
        </a>
        <button type="button" className="etoile-fermer info-ligne" style={{ ["--i" as string]: 2 }} onClick={fermer}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
          </svg>
          Fermer
        </button>
      </div>
    </div>
  );
}
