"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CloudIcon, StarIcon } from "@/components/Icons";
import { holdPreviousTheme } from "@/components/ThemeVeil";
import { persistTheme, type ThemeName } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("clair");
  const clairRef = useRef<HTMLButtonElement>(null);
  const sombreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => {
      setTheme(document.documentElement.dataset.theme === "sombre" ? "sombre" : "clair");
    };
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  const choose = (next: ThemeName, origin?: HTMLElement | null) => {
    const current = document.documentElement.dataset.theme === "sombre" ? "sombre" : "clair";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && next !== current) holdPreviousTheme(origin ?? null);
    persistTheme(next);
    setTheme(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const next: ThemeName =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? "sombre" : "clair";
    choose(next, (next === "clair" ? clairRef : sombreRef).current);
    (next === "clair" ? clairRef : sombreRef).current?.focus();
  };

  return (
    <div className="toggle" role="radiogroup" aria-label="Thème du ciel" onKeyDown={onKeyDown}>
      <span className="toggle-thumb" aria-hidden="true" />
      <button
        ref={clairRef}
        type="button"
        role="radio"
        className="opt-clair"
        aria-checked={theme === "clair"}
        tabIndex={theme === "clair" ? 0 : -1}
        onClick={(event) => choose("clair", event.currentTarget)}
      >
        <CloudIcon />
        <span>Clair</span>
      </button>
      <button
        ref={sombreRef}
        type="button"
        role="radio"
        className="opt-sombre"
        aria-checked={theme === "sombre"}
        tabIndex={theme === "sombre" ? 0 : -1}
        onClick={(event) => choose("sombre", event.currentTarget)}
      >
        <StarIcon />
        <span>Sombre</span>
      </button>
    </div>
  );
}
