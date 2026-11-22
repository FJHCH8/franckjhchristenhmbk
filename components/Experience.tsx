"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { clic, tic } from "@/lib/sons";

const CIBLES = "a, button, [role='button'], label, summary, [data-magnet]";

function scrollable(node: Element | null, deltaY: number) {
  let el: Element | null = node;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const style = getComputedStyle(el);
      const oy = style.overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        if (deltaY < 0 && el.scrollTop > 0) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Curseur qui suit la souris avec inertie, boutons aimantés et défilement lissé à la molette.
 * Seulement avec une souris ou un pavé tactile, et jamais si le mouvement est réduit.
 */
export function Experience() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const stopScroll = useRef<() => void>(() => undefined);

  useEffect(() => {
    stopScroll.current();
  }, [pathname]);

  // Micro-sons : un tic en arrivant sur un élément cliquable, une goutte au clic (souris et doigt).
  useEffect(() => {
    let survol: Element | null = null;
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const hit = (event.target as Element | null)?.closest(CIBLES) ?? null;
      if (hit && hit !== survol) tic();
      survol = hit;
    };
    const onDown = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest(CIBLES)) clic();
    };
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // Police variable réactive : les lettres des grands titres s'épaississent près du curseur.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;
    const TITRES = ".scroll-head h1 .kt-c, .chap-mot .kt-c, .bento-titre .kt-c, .suite-titre .kt-c, .gravite-titre .kt-c";
    let lettres: HTMLElement[] = [];
    let lues = 0;
    let frame = 0;
    const pos = { x: -9999, y: -9999 };
    const paint = () => {
      frame = 0;
      const now = performance.now();
      if (now - lues > 700) {
        lettres = [...document.querySelectorAll<HTMLElement>(TITRES)];
        lues = now;
      }
      const view = window.innerHeight;
      for (const lettre of lettres) {
        const box = lettre.getBoundingClientRect();
        if (box.bottom < 0 || box.top > view) continue;
        const d = Math.hypot(box.left + box.width / 2 - pos.x, box.top + box.height / 2 - pos.y);
        const k = Math.max(0, 1 - d / 260);
        const value = (k * k * 260).toFixed(0);
        if (lettre.dataset.fw !== value) {
          lettre.dataset.fw = value;
          lettre.style.setProperty("--dw", value);
        }
      }
    };
    const onMove = (event: PointerEvent) => {
      pos.x = event.clientX;
      pos.y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Bordures lumineuses : les cartes proches du curseur s'éclairent sur leur contour.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    let cartes: HTMLElement[] = [];
    let lues = 0;
    let frame = 0;
    const pos = { x: -9999, y: -9999 };
    const paint = () => {
      frame = 0;
      const now = performance.now();
      if (now - lues > 800) {
        cartes = [...document.querySelectorAll<HTMLElement>("[data-glow], .glass")];
        lues = now;
      }
      for (const carte of cartes) {
        const box = carte.getBoundingClientRect();
        const dx = Math.max(box.left - pos.x, 0, pos.x - box.right);
        const dy = Math.max(box.top - pos.y, 0, pos.y - box.bottom);
        const reach = Math.hypot(dx, dy);
        const glow = Math.max(0, 1 - reach / 240);
        if (glow <= 0) {
          if (carte.dataset.lit) {
            carte.style.setProperty("--go", "0");
            delete carte.dataset.lit;
          }
          continue;
        }
        carte.dataset.lit = "1";
        carte.style.setProperty("--gx", `${(pos.x - box.left).toFixed(0)}px`);
        carte.style.setProperty("--gy", `${(pos.y - box.top).toFixed(0)}px`);
        carte.style.setProperty("--go", glow.toFixed(3));
      }
    };
    const onMove = (event: PointerEvent) => {
      pos.x = event.clientX;
      pos.y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;
    const root = document.documentElement;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    root.classList.add("has-curseur");

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let scale = 1;
    let scaleTarget = 1;
    let shown = false;
    let magnet: HTMLElement | null = null;
    let frame = 0;
    let last = performance.now();

    // Défilement lissé
    let target = window.scrollY;
    let current = window.scrollY;
    let gliding = false;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * 16);
      ringPos.x += (mouse.x - ringPos.x) * k;
      ringPos.y += (mouse.y - ringPos.y) * k;
      scale += (scaleTarget - scale) * (1 - Math.exp(-dt * 12));
      dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale.toFixed(3)})`;

      if (gliding) {
        current += (target - current) * (1 - Math.exp(-dt * 8.5));
        if (Math.abs(target - current) < 0.4) {
          current = target;
          gliding = false;
        }
        window.scrollTo({ top: current, behavior: "instant" as ScrollBehavior });
      }
      frame = window.requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!shown) {
        shown = true;
        ringPos.x = mouse.x;
        ringPos.y = mouse.y;
        root.classList.add("curseur-on");
      }
      const hit = (event.target as Element | null)?.closest<HTMLElement>(CIBLES) ?? null;
      const text = (event.target as Element | null)?.closest("input, textarea, select, [contenteditable='true']");
      root.classList.toggle("curseur-lien", Boolean(hit) && !text);
      root.classList.toggle("curseur-texte", Boolean(text));
      scaleTarget = text ? 0.4 : hit ? 2.4 : 1;

      const pull = hit && (hit.matches("[data-magnet], .chap-lien, .scroll-cue, .return-link") ? hit : null);
      if (magnet && magnet !== pull) {
        magnet.style.translate = "";
        magnet = null;
      }
      if (pull) {
        const box = pull.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        pull.style.translate = `${(dx * 0.28).toFixed(1)}px ${(dy * 0.34).toFixed(1)}px`;
        magnet = pull;
      }
    };

    const onLeave = () => {
      shown = false;
      root.classList.remove("curseur-on", "curseur-lien");
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };
    const onDown = () => {
      scaleTarget *= 0.7;
    };
    const onUp = () => {
      scaleTarget /= 0.7;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (scrollable(event.target as Element | null, event.deltaY)) return;
      if (document.documentElement.classList.contains("nav-vt")) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1;
      if (!gliding) {
        current = window.scrollY;
        target = window.scrollY;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = Math.max(0, Math.min(max, target + event.deltaY * unit));
      gliding = true;
    };

    const onScroll = () => {
      if (!gliding) {
        current = window.scrollY;
        target = current;
      }
    };

    stopScroll.current = () => {
      gliding = false;
      current = window.scrollY;
      target = current;
    };

    frame = window.requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", stopScroll.current);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", stopScroll.current);
      root.classList.remove("has-curseur", "curseur-on", "curseur-lien", "curseur-texte");
      if (magnet) magnet.style.translate = "";
    };
  }, []);

  return (
    <>
      <div className="curseur-anneau" ref={ringRef} aria-hidden="true" />
      <div className="curseur-point" ref={dotRef} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
