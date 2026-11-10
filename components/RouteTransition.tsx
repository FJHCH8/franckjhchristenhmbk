"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const ORDER = ["/", "/qui-suis-je", "/a-propos", "/contact", "/projets"];

type StartViewTransition = (update: () => void | Promise<void>) => { finished: Promise<void> };

function viewTransition(): StartViewTransition | null {
  const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  return typeof start === "function" ? start.bind(document) : null;
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
      const clear = () => {
        root.classList.remove("nav-vt");
        delete root.dataset.nav;
      };
      const navigate = () =>
        new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 800);
          pending.current = () => {
            window.clearTimeout(timer);
            resolve();
          };
          router.push(destination);
        });
      try {
        const transition = start(navigate);
        transition.finished.finally(clear);
      } catch {
        clear();
        router.push(destination);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
