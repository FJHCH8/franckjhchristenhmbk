"use client";

import { useEffect, useLayoutEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeBoot() {
  useIsoLayoutEffect(() => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* private mode */
    }
    delete document.documentElement.dataset.theme;
  }, []);

  return null;
}
