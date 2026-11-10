"use client";

import { useEffect, useRef, useState } from "react";

const STARS = [
  { x: 18, y: 20, s: 1 },
  { x: 31, y: 34, s: 0.78 },
  { x: 8, y: 44, s: 0.66 },
  { x: 76, y: 18, s: 0.94 },
  { x: 90, y: 32, s: 1.06 },
  { x: 64, y: 28, s: 0.72 },
  { x: 84, y: 48, s: 0.64 },
  { x: 49, y: 16, s: 0.84 },
];

type StarState = "present" | "leaving" | "gone" | "returning";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Aurora({ on }: { on: boolean }) {
  return (
    <div className={on ? "aurora is-on" : "aurora"} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function NightStars({ onAurora }: { onAurora: (on: boolean) => void }) {
  const [stars, setStars] = useState<StarState[]>(() => STARS.map(() => "present"));
  const [night, setNight] = useState(false);
  const cycle = useRef<"idle" | "busy">("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const read = () => setNight(document.documentElement.dataset.theme === "sombre");
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  useEffect(() => {
    const bag = timers.current;
    return () => {
      for (const id of bag) window.clearTimeout(id);
      bag.length = 0;
      onAurora(false);
    };
  }, [onAurora]);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => {
    if (cycle.current !== "idle") return;
    if (!stars.every((state) => state === "leaving" || state === "gone")) return;
    if (cycle.current !== "idle") return;
    cycle.current = "busy";
    const reduce = prefersReducedMotion();
    const fadeIn = reduce ? 0 : 1000;
    const fadeOut = reduce ? 0 : 1200;
    const hold = 8000;
    onAurora(true);
    const hide = window.setTimeout(() => onAurora(false), fadeIn + hold);
    const back = window.setTimeout(() => {
      setStars(STARS.map(() => "returning"));
      const done = window.setTimeout(() => {
        setStars(STARS.map(() => "present"));
        cycle.current = "idle";
      }, reduce ? 0 : 160 * (STARS.length - 1) + 1300);
      timers.current.push(done);
    }, fadeIn + hold + fadeOut);
    timers.current.push(hide, back);
  }, [onAurora, stars]);

  const choose = (index: number) => {
    if (cycle.current !== "idle") return;
    setStars((current) => {
      if (current[index] !== "present") return current;
      const next = current.slice();
      next[index] = prefersReducedMotion() ? "gone" : "leaving";
      return next;
    });
    if (!prefersReducedMotion()) {
      later(() => {
        setStars((current) => {
          if (current[index] !== "leaving") return current;
          const next = current.slice();
          next[index] = "gone";
          return next;
        });
      }, 560);
    }
  };

  return (
    <div className="night-stars" role="group" aria-label="Étoiles" inert={night ? undefined : true}>
      {STARS.map((star, index) => {
        const state = stars[index] ?? "present";
        return (
          <button
            key={index}
            type="button"
            className="night-star"
            data-state={state}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              ["--s" as string]: String(star.s),
              animationDelay: state === "returning" ? `${index * 0.16}s` : undefined,
            }}
            aria-label={`Étoile ${index + 1}`}
            aria-disabled={state !== "present"}
            tabIndex={night && state === "present" ? 0 : -1}
            onClick={() => choose(index)}
          >
            <span className="night-star-glow" style={{ animationDelay: `${index * 0.37}s` }} />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .4c.55 4.5 1.85 6.7 6.5 8.05-4.65 1.3-5.95 3.5-6.5 8.05-.55-4.55-1.85-6.75-6.5-8.05C10.15 7.1 11.45 4.9 12 .4Z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
