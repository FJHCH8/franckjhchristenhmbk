"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Eclair } from "@/components/Eclair";
import { PROJECTS_OPENING_MS, PROJECTS_START_MS, countdownParts } from "@/lib/paris";

const INTRO_MS = 1500;

type Vue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  fraction: number;
  done: boolean;
  progress: number;
  color: string;
  glow: string;
  rolling: boolean;
  digits: number;
};

function teinte(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  const r = Math.round(240 + (255 - 240) * t);
  const g = Math.round(176 + (255 - 176) * t);
  const b = Math.round(42 + (255 - 42) * t);
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    glow: `0 0 8px rgba(${r}, ${g}, ${b}, 0.38), 0 0 16px rgba(${r}, ${g}, ${b}, 0.16)`,
  };
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Nombre de chiffres des jours, figé sur la valeur réelle pour que le chrono ne change jamais de largeur. */
function chiffresJours(remain: number) {
  return Math.max(2, String(countdownParts(PROJECTS_OPENING_MS - Math.max(0, remain)).days).length);
}

function vueDe(remain: number, progress: number, rolling: boolean, digits = chiffresJours(remain)): Vue {
  const parts = countdownParts(PROJECTS_OPENING_MS - Math.max(0, remain));
  const cap = 10 ** digits - 1;
  return { ...parts, days: Math.min(parts.days, cap), digits, progress, rolling, ...teinte(progress) };
}

function initiale(): Vue {
  const span = Math.max(0, PROJECTS_OPENING_MS - PROJECTS_START_MS);
  return vueDe(span, 0, true, 2);
}

const CompteContexte = createContext<Vue>(initiale());

export function CompteEndur({ children }: { children: ReactNode }) {
  const [vue, setVue] = useState<Vue>(initiale);

  useEffect(() => {
    const start = PROJECTS_START_MS;
    const end = PROJECTS_OPENING_MS;
    const span = Math.max(1, end - start);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cible = document.querySelector(".endur-haut");
    let started = false;
    let born = 0;
    let frame = 0;
    let last = "";
    const arm = (nowPerf: number) => {
      if (started) return;
      started = true;
      born = nowPerf;
    };
    const visible = (node: Element) => {
      const box = node.getBoundingClientRect();
      return box.top < window.innerHeight * 0.92 && box.bottom > 72;
    };
    let observer: IntersectionObserver | null = null;
    if (cible) {
      if (visible(cible)) arm(performance.now());
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) arm(performance.now());
      }, { threshold: 0.3 });
      observer.observe(cible);
    } else {
      arm(performance.now());
    }

    const tick = (nowPerf: number) => {
      if (!started) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      const wall = Date.now();
      const liveRemain = Math.max(0, end - wall);
      const liveProgress = Math.min(1, Math.max(0, (wall - start) / span));
      const eased = reduce ? 1 : easeOut(Math.min(1, (nowPerf - born) / INTRO_MS));
      const remain = eased >= 1 ? liveRemain : span * (1 - eased) + liveRemain * eased;
      const progress = eased >= 1 ? liveProgress : liveProgress * eased;
      const next = vueDe(remain, progress, eased < 1, chiffresJours(liveRemain));
      const key = `${next.days}|${next.hours}|${next.minutes}|${next.seconds}|${Math.round(next.progress * 10000)}|${Math.floor(next.fraction * 4)}|${next.rolling ? 1 : 0}`;
      if (key !== last) {
        last = key;
        setVue(next);
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return <CompteContexte.Provider value={vue}>{children}</CompteContexte.Provider>;
}

export function BarreCompte() {
  const vue = useContext(CompteContexte);
  return (
    <div className="count-barre" aria-hidden="true">
      <span
        style={{
          transform: `scaleX(${vue.progress.toFixed(4)})`,
          background: vue.color,
          boxShadow: vue.glow,
        }}
      />
      <i className="count-barre-tete" style={{ left: `${(vue.progress * 100).toFixed(2)}%`, background: vue.color }} />
    </div>
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function Flip({ value }: { value: string }) {
  return (
    <span className="flip" aria-hidden="true">
      <span key={value} className="flip-in">
        {value}
      </span>
    </span>
  );
}

function Digits({ value, min = 2 }: { value: number; min?: number }) {
  const text = String(Math.max(0, Math.floor(value))).padStart(min, "0");
  return (
    <span className="count-group">
      {text.split("").map((ch, index) => (
        <Flip key={`${text.length}-${index}`} value={ch} />
      ))}
    </span>
  );
}

export function Countdown() {
  const shown = useContext(CompteContexte);
  return (
    <div className="count-bloc is-on">
      <div
        className={shown.rolling ? "count is-defile" : "count"}
        style={{ ["--fraction" as string]: String(shown.done ? 0 : shown.fraction) }}
        aria-label={`${shown.days} jours ${pad(shown.hours)} ${pad(shown.minutes)} ${pad(shown.seconds)}`}
      >
        <Eclair />
        <Digits value={shown.days} min={shown.digits} />
        <span className="count-dot" aria-hidden="true" />
        <Digits value={shown.hours} />
        <span className="count-dot" aria-hidden="true" />
        <Digits value={shown.minutes} />
        <span className="count-dot count-dot-live" aria-hidden="true" />
        <Digits value={shown.seconds} />
      </div>
    </div>
  );
}
