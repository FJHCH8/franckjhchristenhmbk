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
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const open = hover || focus || pinned;

  useEffect(() => {
    if (!open) return;
    const bubble = document.getElementById(bubbleId);
    if (!bubble) return;
    const nav = document.querySelector(".nav");
    const limit = nav ? nav.getBoundingClientRect().top - 12 : window.innerHeight - 12;
    const bottom = bubble.getBoundingClientRect().bottom;
    if (bottom > limit) window.scrollBy(0, bottom - limit);
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
        onClick={() => setPinned((value) => !value)}
        onPointerDown={(event) => {
          setPressed(true);
          const box = event.currentTarget.getBoundingClientRect();
          const id = performance.now();
          setRipples((current) => [...current, { id, x: event.clientX - box.left, y: event.clientY - box.top }]);
          window.setTimeout(() => {
            setRipples((current) => current.filter((ripple) => ripple.id !== id));
          }, 700);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      >
        i
        {ripples.map((ripple) => (
          <span key={ripple.id} className="info-ripple" style={{ left: ripple.x, top: ripple.y }} />
        ))}
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
