"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function PageSky() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pathname === "/qui-suis-je") root.dataset.page = "qui-suis-je";
    else if (pathname === "/a-propos") root.dataset.page = "a-propos";
    else if (pathname === "/contact") root.dataset.page = "contact";
    else root.dataset.page = "etoile";
    return () => {
      delete root.dataset.page;
    };
  }, [pathname]);

  return null;
}
