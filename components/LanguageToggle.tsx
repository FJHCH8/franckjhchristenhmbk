"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, type LocaleName } from "@/components/Locale";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const frRef = useRef<HTMLButtonElement>(null);
  const laRef = useRef<HTMLButtonElement>(null);
  const ready = useRef(false);
  const [gliding, setGliding] = useState(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setGliding(true);
    const timer = window.setTimeout(() => setGliding(false), 560);
    return () => window.clearTimeout(timer);
  }, [locale]);

  const choose = (next: LocaleName) => setLocale(next);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: LocaleName = event.key === "ArrowRight" ? "davissiv" : "fr";
    choose(next);
    (next === "fr" ? frRef : laRef).current?.focus();
  };

  return (
    <div className="lang" role="radiogroup" aria-label="Langue" onKeyDown={onKeyDown}>
      <span className={gliding ? "lang-thumb is-gliding" : "lang-thumb"} aria-hidden="true">
        <span className="lang-thumb-face" />
      </span>
      <button
        ref={frRef}
        type="button"
        role="radio"
        className="lang-fr"
        aria-checked={locale === "fr"}
        tabIndex={locale === "fr" ? 0 : -1}
        onClick={() => choose("fr")}
      >
        Français
      </button>
      <button
        ref={laRef}
        type="button"
        role="radio"
        className="lang-davissiv"
        aria-checked={locale === "davissiv"}
        tabIndex={locale === "davissiv" ? 0 : -1}
        onClick={() => choose("davissiv")}
        aria-label="Tavissiv"
      >
        <span className="davissis lang-tavissiv" lang="x-davissis" aria-hidden="true">
          tavissiv
        </span>
      </button>
    </div>
  );
}
