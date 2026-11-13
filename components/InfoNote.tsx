"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Block } from "@/components/Locale";

const BUBBLE =
  "Ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. Suivez le compte Instagram de Franck et peut-être serez-vous averti des nouveautés.";

export function InfoNote() {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pressed, setPressed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const open = hover || focus || pinned;

  useEffect(() => {
    const note = wrapRef.current;
    const bubble = document.getElementById(bubbleId);
    if (!open || !note || !bubble) return;
    const lift = () => {
      note.style.paddingBottom = `${bubble.offsetHeight + 28}px`;
      const nav = document.querySelector(".nav")?.getBoundingClientRect();
      const limit = nav && nav.top > window.innerHeight * 0.45 ? nav.top - 20 : window.innerHeight - 16;
      const bottom = bubble.getBoundingClientRect().bottom;
      if (bottom > limit) window.scrollBy(0, bottom - limit);
    };
    lift();
    const later = window.setTimeout(lift, 420);
    return () => {
      window.clearTimeout(later);
      note.style.paddingBottom = "";
    };
  }, [open, bubbleId]);

  useEffect(() => {
    if (!pinned) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setPinned(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div
      className="info-note"
      ref={wrapRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onFocus={() => setFocus(true)}
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node)) setFocus(false);
      }}
    >
      <button
        type="button"
        className={pressed ? "info-dot is-pressed" : "info-dot"}
        aria-expanded={open}
        aria-controls={bubbleId}
        aria-label="Informations"
        onClick={() => setPinned((value) => !value)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      >
        <span className="info-orb-glow" aria-hidden="true" />
        <svg className="info-orb-mark" viewBox="0 0 32 42" aria-hidden="true">
          <path d="M16 1.5c1.4 6.2 8 10.4 8 17.2a8 8 0 1 1-16 0C8 11.9 14.6 7.7 16 1.5z" />
        </svg>
      </button>
      <div className={open ? "info-bubble is-open" : "info-bubble"} id={bubbleId} role="region" aria-hidden={!open} inert={open ? undefined : true}>
        <p>
          <Block lines={["100%", "96%", "88%", "70%"]}>{BUBBLE}</Block>
        </p>
        <a href="https://www.instagram.com/fjhchristenhmbk/" rel="noopener noreferrer" target="_blank">
          @fjhchristenhmbk
        </a>
      </div>
    </div>
  );
}
