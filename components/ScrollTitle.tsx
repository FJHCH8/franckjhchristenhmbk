"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Split } from "@/components/Kinetic";
import { titleLabel, useLocale } from "@/components/Locale";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function ScrollTitle({
  id,
  text,
  keep = false,
  icon,
  tone = "ink",
  max = 5.1,
  fond,
}: {
  id: string;
  text: string;
  keep?: boolean;
  icon?: ReactNode;
  tone?: "ink" | "sea";
  max?: number;
  /** Photo plein cadre derrière le titre ; le titre s'y inverse (couleurs en négatif). */
  fond?: string;
}) {
  const { locale } = useLocale();
  const label = titleLabel(locale, text, keep);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const hero = heroRef.current;
    const bar = barRef.current;
    if (!stage || !hero || !bar) return;
    // Le titre reste posé : plus aucun mouvement piloté par script pendant le défilement,
    // car sur iPhone il arrive toujours une image en retard et fait trembler la page.
    const fige = true;
    if (fige) {
      document.documentElement.classList.add("title-settled");
      stage.classList.add("is-scrolled");
      return () => document.documentElement.classList.remove("title-settled");
    }

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // La variable de défilement vit sur <main> : l'écrire sur <html> recalculait tout le site à chaque image.
    // La variable ne va qu'aux éléments qui l'utilisent : l'écrire sur toute la page
    // obligeait le navigateur à tout revérifier à chaque image.
    const racine = stage.closest("main") ?? document.documentElement;
    const cibles = () => [stage, ...racine.querySelectorAll<HTMLElement>(".scroll-reveal")];
    let porteurs = cibles();
    const host = {
      style: {
        setProperty: (nom: string, valeur: string) => porteurs.forEach((el) => el.style.setProperty(nom, valeur)),
        removeProperty: (nom: string) => porteurs.forEach((el) => el.style.removeProperty(nom)),
      },
    };
    let dockAt = 0;
    let shown = 0;
    let target = 0;
    let frame = 0;
    let width = window.innerWidth;
    let last = performance.now();
    let heroOn = true;
    let barOn = false;
    let settledOn = false;
    let scrolledOn = false;
    let lastMark = "";

    const measure = () => {
      porteurs = cibles();
      const header = document.querySelector(".header");
      const headerH = header instanceof HTMLElement ? header.offsetHeight : 76;
      document.documentElement.style.setProperty("--title-dock", `${headerH + 8}px`);
      const top = hero.getBoundingClientRect().top + window.scrollY;
      dockAt = Math.max(0, top - headerH - 4);
    };

    const paint = (value: number) => {
      const travel = clamp(value);
      const mark = travel.toFixed(3);
      if (mark !== lastMark) {
        lastMark = mark;
        hero.style.opacity = (1 - travel).toFixed(3);
        // Déplacements arrondis au pixel : un texte posé entre deux pixels devient flou.
        hero.style.transform = `translate3d(0, ${Math.round(-10 * travel)}px, 0)`;
        bar.style.opacity = travel.toFixed(3);
        bar.style.transform = travel >= 0.999 ? "none" : `translate3d(0, ${Math.round(8 * (1 - travel))}px, 0)`;
        host.style.setProperty("--scroll-title", mark);
      }
      const nextBar = travel >= 0.04;
      if (nextBar !== barOn) {
        barOn = nextBar;
        bar.style.visibility = nextBar ? "visible" : "hidden";
      }
      const nextHero = travel < 0.98;
      if (nextHero !== heroOn) {
        heroOn = nextHero;
        hero.style.visibility = nextHero ? "visible" : "hidden";
      }
      const nextSettled = travel > 0.94;
      if (nextSettled !== settledOn) {
        settledOn = nextSettled;
        document.documentElement.classList.toggle("title-settled", nextSettled);
      }
      const nextScrolled = travel > 0.12;
      if (nextScrolled !== scrolledOn) {
        scrolledOn = nextScrolled;
        stage.classList.toggle("is-scrolled", nextScrolled);
      }
    };

    const readTarget = () => clamp((window.scrollY - (dockAt - 64)) / 64);

    const step = (now: number) => {
      if (document.hidden) {
        frame = 0;
        return;
      }
      const dt = Math.min(0.05, ((now || performance.now()) - last) / 1000);
      last = now || performance.now();
      target = readTarget();
      if (motion.matches) shown = target;
      else {
        shown += (target - shown) * (1 - Math.exp(-dt / 0.08));
        if (Math.abs(target - shown) < 0.0006) shown = target;
      }
      paint(shown);
      if (shown !== target) frame = window.requestAnimationFrame(step);
      else frame = 0;
    };

    const wake = () => {
      if (frame || document.hidden) return;
      last = performance.now();
      frame = window.requestAnimationFrame(step);
    };

    const onResize = () => {
      if (Math.abs(window.innerWidth - width) < 48) return;
      width = window.innerWidth;
      measure();
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      wake();
    };

    measure();
    shown = readTarget();
    paint(shown);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    document.fonts?.ready.then(() => {
      measure();
      wake();
    }).catch(() => undefined);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      host.style.removeProperty("--scroll-title");
      document.documentElement.style.removeProperty("--title-dock");
      document.documentElement.classList.remove("title-settled");
    };
  }, [label]);

  const face = label ? <Split text={text} lang={!keep} mode="chars" delay={120} /> : <span className="skel" style={{ width: "6.5em" }} aria-hidden="true" />;

  return (
    <div
      ref={stageRef}
      className={["scroll-stage", tone === "sea" ? "tone-sea" : "", fond ? "a-fond" : ""].filter(Boolean).join(" ")}
      style={{ ["--title-max" as string]: String(max) }}
    >
      {fond ? (
        <img
          className="scroll-fond"
          src={`${fond}-1500.webp`}
          srcSet={`${fond}-900.webp 900w, ${fond}-1500.webp 1500w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
      ) : null}
      <div className="scroll-head" ref={heroRef}>
        <h1 id={id}>{face}</h1>
        {icon ? <div className="scroll-mark">{icon}</div> : null}
        <span className="scroll-cue" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 9.5 12 14.5 17 9.5" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div className="title-dock" ref={barRef} aria-hidden="true">
        <p className="title-dock-pill">
          {label && label !== text ? <span className="davissis">{label}</span> : (label ?? <span className="skel" style={{ width: "5.5em" }} />)}
        </p>
      </div>
    </div>
  );
}
