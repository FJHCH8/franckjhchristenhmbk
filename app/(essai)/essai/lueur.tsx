"use client";

import { useEffect } from "react";

/** La lueur des cartes suit la souris ou le doigt, comme sur Raycast. */
export function Lueur() {
  useEffect(() => {
    const bouge = (e: PointerEvent) => {
      const carte = (e.target as Element | null)?.closest<HTMLElement>(".carte");
      if (!carte) return;
      const r = carte.getBoundingClientRect();
      carte.style.setProperty("--x", `${e.clientX - r.left}px`);
      carte.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    const touche = (e: PointerEvent) => {
      const carte = (e.target as Element | null)?.closest<HTMLElement>(".carte");
      if (!carte) return;
      bouge(e);
      carte.classList.add("is-touche");
      window.setTimeout(() => carte.classList.remove("is-touche"), 700);
    };
    window.addEventListener("pointermove", bouge, { passive: true });
    window.addEventListener("pointerdown", touche, { passive: true });
    return () => {
      window.removeEventListener("pointermove", bouge);
      window.removeEventListener("pointerdown", touche);
    };
  }, []);
  return null;
}
