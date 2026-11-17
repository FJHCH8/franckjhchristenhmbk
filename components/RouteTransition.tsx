"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const OUT_MS = 220;
const IN_MS = 260;

function calm() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearBlur() {
  const root = document.documentElement;
  root.classList.remove("nav-out", "nav-in");
}

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const booted = useRef(false);
  const popping = useRef(false);
  const timer = useRef(0);

  useLayoutEffect(() => {
    if (!booted.current) {
      booted.current = true;
      return;
    }
    const root = document.documentElement;
    root.classList.remove("nav-out");
    if (popping.current || calm()) {
      popping.current = false;
      root.classList.remove("nav-in");
      return;
    }
    root.classList.add("nav-in");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => root.classList.remove("nav-in"), IN_MS);
    return () => window.clearTimeout(timer.current);
  }, [pathname]);

  useEffect(() => {
    const onPop = () => {
      popping.current = true;
      clearBlur();
    };
    const onShow = () => clearBlur();
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (calm()) return;

      event.preventDefault();
      event.stopPropagation();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const root = document.documentElement;
      root.classList.remove("nav-in");
      root.classList.add("nav-out");
      window.setTimeout(() => {
        router.push(destination);
      }, OUT_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
