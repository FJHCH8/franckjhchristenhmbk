"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { persistTheme, type ThemeName } from "@/lib/theme";
import { CloudIcon, StarIcon } from "@/components/Icons";

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

  const choose = (next: ThemeName) => {
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
    choose(next);
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
        onClick={() => choose("clair")}
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
        onClick={() => choose("sombre")}
      >
        <StarIcon />
        <span>Sombre</span>
      </button>
    </div>
  );
}
