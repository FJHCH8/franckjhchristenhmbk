"use client";

import { useEffect, useState } from "react";
import { PROJECTS_OPENING_MS, PROJECTS_START_MS } from "@/lib/paris";

function parties(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { j: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

const deux = (n: number) => String(n).padStart(2, "0");

/** Le compte à rebours d'Endurreisen, en chiffres fins, à la seconde. */
export function Compte({ grand = false }: { grand?: boolean }) {
  const [maintenant, setMaintenant] = useState<number | null>(null);
  useEffect(() => {
    const premier = window.requestAnimationFrame(() => setMaintenant(Date.now()));
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(premier);
      window.clearInterval(t);
    };
  }, []);
  const p = parties(maintenant == null ? 0 : PROJECTS_OPENING_MS - maintenant);
  const bloc = (v: number, u: string) => (
    <span className="flex flex-col items-center">
      <span className={`${grand ? "text-[clamp(2.2rem,11vw,4.5rem)]" : "text-3xl"} font-light tabular-nums tracking-tight`}>{maintenant == null ? "––" : deux(v)}</span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-doux">{u}</span>
    </span>
  );
  return (
    <div className={`flex items-start justify-between ${grand ? "gap-1 sm:gap-6" : "gap-3"}`} aria-label="Compte à rebours d'Endurreisen">
      {bloc(p.j, "jours")}
      <span className="pt-2 text-2xl font-thin text-doux/40">:</span>
      {bloc(p.h, "heures")}
      <span className="pt-2 text-2xl font-thin text-doux/40">:</span>
      {bloc(p.m, "min")}
      <span className="pt-2 text-2xl font-thin text-doux/40">:</span>
      {bloc(p.s, "s")}
    </div>
  );
}

/** La progression d'Endurreisen (0 à 1). */
export function useProgression() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const maj = () => setP(Math.min(1, Math.max(0, (Date.now() - PROJECTS_START_MS) / (PROJECTS_OPENING_MS - PROJECTS_START_MS))));
    const premier = window.requestAnimationFrame(maj);
    const t = window.setInterval(maj, 60_000);
    return () => {
      window.cancelAnimationFrame(premier);
      window.clearInterval(t);
    };
  }, []);
  return p;
}
