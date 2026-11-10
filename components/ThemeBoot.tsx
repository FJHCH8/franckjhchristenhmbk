"use client";

import { useEffect, useLayoutEffect } from "react";
import { applyThemeAttribute, resolveInitialTheme, THEME_STORAGE_KEY, type ThemeName } from "@/lib/theme";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeBoot() {
  useIsoLayoutEffect(() => {
    applyThemeAttribute(resolveInitialTheme());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue === "clair" || event.newValue === "sombre") {
        applyThemeAttribute(event.newValue);
        window.dispatchEvent(new Event("themechange"));
      }
    };

    const onScheme = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        stored = "clair";
      }
      if (stored === "clair" || stored === "sombre") return;
      const next: ThemeName = event.matches ? "sombre" : "clair";
      applyThemeAttribute(next);
      window.dispatchEvent(new Event("themechange"));
    };

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", onStorage);
    scheme.addEventListener("change", onScheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      scheme.removeEventListener("change", onScheme);
    };
  }, []);

  return null;
}
