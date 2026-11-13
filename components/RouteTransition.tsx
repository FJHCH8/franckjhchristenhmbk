"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const ORDER = ["/", "/qui-suis-je", "/a-propos", "/contact", "/projets"];

type StartViewTransition = (update: () => void | Promise<void>) => { finished: Promise<void> };

function iosBrowser() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function viewTransition(): StartViewTransition | null {
  if (iosBrowser()) return null;
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  return typeof start === "function" ? start.bind(document) : null;
}

function clearNav() {
  const root = document.documentElement;
  root.classList.remove("nav-vt");
  delete root.dataset.nav;
  document.querySelector(".theme-veil")?.remove();
}

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const resolve = pending.current;
    pending.current = null;
    resolve?.();
  }, [pathname]);

  useEffect(() => {
    const onShow = () => clearNav();
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onShow);
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
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const start = viewTransition();
      if (!start) return;

      event.preventDefault();
      event.stopPropagation();
      const from = ORDER.indexOf(window.location.pathname);
      const to = ORDER.indexOf(url.pathname);
      const root = document.documentElement;
      root.dataset.nav = from >= 0 && to >= 0 && to < from ? "back" : "forward";
      root.classList.add("nav-vt");
      document.querySelector(".theme-veil")?.remove();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const navigate = () =>
        new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 800);
          pending.current = () => {
            window.clearTimeout(timer);
            resolve();
          };
          router.push(destination);
        });
      const failSafe = window.setTimeout(clearNav, 1400);
      try {
        const transition = start(navigate);
        transition.finished.finally(() => {
          window.clearTimeout(failSafe);
          clearNav();
        });
      } catch {
        window.clearTimeout(failSafe);
        clearNav();
        router.push(destination);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
