"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";

export function ScrollTitle({
  id,
  children,
  icon,
  titleRef,
  tone = "ink",
  max = 5.1,
  min = 2,
}: {
  id: string;
  children: ReactNode;
  icon?: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
  tone?: "ink" | "sea";
  max?: number;
  min?: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const range = Math.max(1, window.innerHeight * 0.46);
      const progress = Math.max(0, Math.min(1, window.scrollY / range));
      const value = progress.toFixed(4);
      stage.style.setProperty("--p", value);
      document.documentElement.style.setProperty("--scroll-title", value);
      document.documentElement.classList.toggle("title-settled", progress >= 0.98);
      stage.classList.toggle("is-scrolled", window.scrollY > 6);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.style.removeProperty("--scroll-title");
      document.documentElement.classList.remove("title-settled");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={stageRef} className={tone === "sea" ? "scroll-stage tone-sea" : "scroll-stage"} style={{ ["--title-max" as string]: String(max), ["--title-min" as string]: String(min) }}>
      <div className="scroll-head">
        <h1 id={id} ref={titleRef}>
          {children}
        </h1>
        {icon ? <div className="scroll-mark">{icon}</div> : null}
        <span className="scroll-cue" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 9.5 12 14.5 17 9.5" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}
