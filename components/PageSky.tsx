"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function PageSky() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pathname === "/qui-suis-je") root.dataset.page = "qui-suis-je";
    else if (pathname === "/a-propos" || pathname === "/contact" || pathname === "/projets") root.dataset.page = "etoile";
    else delete root.dataset.page;
    return () => {
      delete root.dataset.page;
    };
  }, [pathname]);

  return null;
}
