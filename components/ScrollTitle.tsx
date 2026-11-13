"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
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
}: {
  id: string;
  text: string;
  keep?: boolean;
  icon?: ReactNode;
  tone?: "ink" | "sea";
  max?: number;
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

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dockAt = 0;
    let shown = 0;
    let velocity = 0;
    let target = 0;
    let frame = 0;
    let width = window.innerWidth;

    const measure = () => {
      const header = document.querySelector(".header");
      const headerH = header instanceof HTMLElement ? header.offsetHeight : 76;
      document.documentElement.style.setProperty("--title-dock", `${headerH + 8}px`);
      const top = hero.getBoundingClientRect().top + window.scrollY;
      dockAt = Math.max(0, top - headerH - 4);
    };

    const paint = (value: number) => {
      const travel = clamp(value);
      hero.style.opacity = (1 - travel).toFixed(3);
      hero.style.transform = `translate3d(0, ${(-12 * travel).toFixed(2)}px, 0)`;
      bar.style.opacity = travel.toFixed(3);
      bar.style.transform = `translate3d(0, ${(10 * (1 - travel)).toFixed(2)}px, 0)`;
      bar.style.visibility = travel < 0.02 ? "hidden" : "visible";
      const mark = travel.toFixed(4);
      document.documentElement.style.setProperty("--scroll-title", mark);
      document.documentElement.classList.toggle("title-settled", travel > 0.94);
      stage.classList.toggle("is-scrolled", travel > 0.12);
    };

    const readTarget = () => clamp((window.scrollY - (dockAt - 64)) / 64);

    const step = () => {
      frame = 0;
      target = readTarget();
      if (motion.matches || document.hidden) {
        shown = target;
        velocity = 0;
      } else {
        velocity += (target - shown) * 0.22;
        velocity *= 0.64;
        shown += velocity;
      }
      paint(shown);
      const settled = Math.abs(target - shown) < 0.0015 && Math.abs(velocity) < 0.0015;
      if (!settled && !document.hidden) frame = window.requestAnimationFrame(step);
    };

    const wake = () => {
      if (frame || document.hidden) return;
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
      measure();
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
      document.documentElement.style.removeProperty("--scroll-title");
      document.documentElement.style.removeProperty("--title-dock");
      document.documentElement.classList.remove("title-settled");
    };
  }, [label]);

  const face = label ?? <span className="skel" style={{ width: "6.5em" }} aria-hidden="true" />;

  return (
    <div ref={stageRef} className={tone === "sea" ? "scroll-stage tone-sea" : "scroll-stage"} style={{ ["--title-max" as string]: String(max) }}>
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
        <p className="title-dock-pill">{label ?? <span className="skel" style={{ width: "5.5em" }} />}</p>
      </div>
    </div>
  );
}
