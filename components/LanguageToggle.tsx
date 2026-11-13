"use client";

import { useRef, type KeyboardEvent } from "react";
import { useLocale, type LocaleName } from "@/components/Locale";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const frRef = useRef<HTMLButtonElement>(null);
  const laRef = useRef<HTMLButtonElement>(null);

  const choose = (next: LocaleName) => setLocale(next);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: LocaleName = event.key === "ArrowRight" ? "lassavi" : "fr";
    choose(next);
    (next === "fr" ? frRef : laRef).current?.focus();
  };

  return (
    <div className="lang" role="radiogroup" aria-label="Langue" onKeyDown={onKeyDown}>
      <span className="lang-thumb" aria-hidden="true" />
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
        className="lang-lassavi"
        aria-checked={locale === "lassavi"}
        tabIndex={locale === "lassavi" ? 0 : -1}
        onClick={() => choose("lassavi")}
      >
        Lassavi
      </button>
    </div>
  );
}
