"use client";

import { useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import { titleLabel, useLocale } from "@/components/Locale";

type Slot = { x: number; y: number };
type Layout = { slots: Slot[]; height: number };

function layoutWords(widths: number[], space: number, maxWidth: number, lineHeight: number): Layout {
  const lines: number[][] = [];
  let line: number[] = [];
  let width = 0;
  widths.forEach((wordWidth, index) => {
    const next = line.length ? width + space + wordWidth : wordWidth;
    if (line.length && next > maxWidth) {
      lines.push(line);
      line = [index];
      width = wordWidth;
      return;
    }
    line.push(index);
    width = next;
  });
  if (line.length) lines.push(line);
  const slots: Slot[] = widths.map(() => ({ x: 0, y: 0 }));
  lines.forEach((indexes, lineIndex) => {
    const lineWidth = indexes.reduce((sum, index, position) => sum + widths[index] + (position ? space : 0), 0);
    let x = Math.max(0, (maxWidth - lineWidth) / 2);
    indexes.forEach((index) => {
      slots[index] = { x, y: lineIndex * lineHeight };
      x += widths[index] + space;
    });
  });
  return { slots, height: Math.max(lineHeight, lines.length * lineHeight) };
}

export function ScrollTitle({
  id,
  text,
  keep = false,
  icon,
  titleRef,
  tone = "ink",
  max = 5.1,
  min = 2,
}: {
  id: string;
  text: string;
  keep?: boolean;
  icon?: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
  tone?: "ink" | "sea";
  max?: number;
  min?: number;
}) {
  const { locale } = useLocale();
  const label = titleLabel(locale, text, keep);
  const words = label ? label.split(/\s+/).filter(Boolean) : [];
  const multi = words.length > 1;
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const heading = stage?.querySelector("h1");
    if (!stage || !(heading instanceof HTMLElement)) return;
    const head = heading;
    const wordEls = Array.from(head.querySelectorAll<HTMLElement>(".fluid-word"));
    let layouts: Layout[] = [];
    let maxPx = 1;
    let rootPx = 16;
    let frame = 0;

    const liveWords = label ? label.split(/\s+/).filter(Boolean) : [];

    const measure = () => {
      if (!multi) return;
      const style = getComputedStyle(head);
      rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      maxPx = max * rootPx;
      const minPx = min * rootPx;
      const family = style.fontFamily || "Georgia, serif";
      const weight = style.fontWeight || "520";
      const maxWidth = Math.max(1, (head.parentElement ?? stage).clientWidth);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const at = (px: number) => {
        const font = `${weight} ${px}px ${family}`;
        let space = px * 0.28;
        const widths = liveWords.map((word) => {
          if (!ctx) return word.length * px * 0.52;
          ctx.font = font;
          const pen = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
          pen.letterSpacing = "-0.045em";
          space = ctx.measureText(" ").width || space;
          return ctx.measureText(word).width;
        });
        return layoutWords(widths, space, maxWidth, px * 0.92);
      };
      const linesOf = (layout: Layout) => new Set(layout.slots.map((slot) => slot.y)).size;
      const fit = (limit: number, start: number, end: number) => {
        let lo = start;
        let hi = end;
        for (let step = 0; step < 8; step += 1) {
          const mid = (lo + hi) / 2;
          if (linesOf(at(mid)) > limit) hi = mid;
          else lo = mid;
        }
        return lo;
      };
      const full = at(maxPx);
      const twoPx = linesOf(full) > 2 ? fit(2, minPx * 0.55, maxPx) : (maxPx + minPx) / 2;
      const onePx = linesOf(at(twoPx)) > 1 ? fit(1, maxPx * 0.34, twoPx) : Math.min(minPx, twoPx);
      maxPx = max * rootPx;
      layouts = [full, at(twoPx), at(onePx)];
      head.dataset.one = String(onePx);
    };

    const apply = () => {
      frame = 0;
      const range = Math.max(1, window.innerHeight * 0.46);
      const progress = Math.max(0, Math.min(1, window.scrollY / range));
      const value = progress.toFixed(4);
      stage.style.setProperty("--p", value);
      document.documentElement.style.setProperty("--scroll-title", value);
      document.documentElement.classList.toggle("title-settled", progress >= 0.98);
      stage.classList.toggle("is-scrolled", window.scrollY > 6);
      const onePx = parseFloat(head.dataset.one || "") || min * rootPx;
      const fontPx = multi ? maxPx + (onePx - maxPx) * progress : (max + (min - max) * progress) * rootPx;
      head.style.setProperty("--visual", `${fontPx}px`);
      if (!multi || layouts.length < 3) return;
      const segment = progress < 0.5 ? 0 : 1;
      const local = progress < 0.5 ? progress / 0.5 : (progress - 0.5) / 0.5;
      const ease = local * local * (3 - 2 * local);
      const from = layouts[segment];
      const to = layouts[segment + 1];
      const scale = fontPx / maxPx;
      head.style.height = `${from.height + (to.height - from.height) * ease}px`;
      wordEls.forEach((el, index) => {
        const start = from.slots[index];
        const end = to.slots[index];
        if (!start || !end) return;
        const x = start.x + (end.x - start.x) * ease;
        const y = start.y + (end.y - start.y) * ease;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };
    const onResize = () => {
      measure();
      apply();
    };
    measure();
    apply();
    document.fonts?.ready.then(onResize).catch(() => undefined);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.documentElement.style.removeProperty("--scroll-title");
      document.documentElement.classList.remove("title-settled");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [label, max, min, multi]);

  return (
    <div
      ref={stageRef}
      className={tone === "sea" ? "scroll-stage tone-sea" : "scroll-stage"}
      style={{ ["--title-max" as string]: String(max), ["--title-min" as string]: String(min) }}
    >
      <div className="scroll-head">
        <h1 id={id} ref={titleRef} className={multi ? "is-fluid" : undefined}>
          {label ? (
            multi ? (
              words.map((word, index) => (
                <span className="fluid-word" key={`${word}-${index}`}>
                  {word}
                </span>
              ))
            ) : (
              label
            )
          ) : (
            <span className="skel" style={{ width: "6.5em" }} aria-hidden="true" />
          )}
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
