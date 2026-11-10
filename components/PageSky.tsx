"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function PageSky() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pathname === "/qui-suis-je" || pathname === "/projets") root.dataset.page = pathname.slice(1);
    else delete root.dataset.page;
    return () => {
      delete root.dataset.page;
    };
  }, [pathname]);

  return null;
}
