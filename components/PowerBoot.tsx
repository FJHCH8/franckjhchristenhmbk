"use client";

import { useLayoutEffect } from "react";

type NavigatorPower = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function modestNow() {
  const nav = navigator as NavigatorPower;
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return true;
  if (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) return true;
  return false;
}

export function PowerBoot() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const apply = (lite: boolean) => {
      root.dataset.power = lite ? "lite" : "full";
    };
    apply(modestNow());
    let frames = 0;
    let start = 0;
    let raf = 0;
    const sample = (now: number) => {
      if (!start) start = now;
      frames += 1;
      if (now - start < 280) {
        raf = requestAnimationFrame(sample);
        return;
      }
      const fps = (frames * 1000) / (now - start);
      if (fps < 32) apply(true);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
