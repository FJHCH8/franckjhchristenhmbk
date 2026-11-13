"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Descend({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }
    let last = window.scrollY;
    let down = false;
    const reveal = () => {
      if (!down || node.classList.contains("is-visible")) return;
      const box = node.getBoundingClientRect();
      const view = window.innerHeight;
      if (box.top < view * 0.92 && box.bottom > view * 0.05) node.classList.add("is-visible");
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last + 0.5) down = true;
      else if (y < last - 0.5) down = false;
      last = y;
      reveal();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div ref={ref} className={className ? `descend-only ${className}` : "descend-only"}>{children}</div>;
}
