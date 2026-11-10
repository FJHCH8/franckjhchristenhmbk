"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ORDER = ["/", "/qui-suis-je", "/a-propos", "/contact"];

let previousPath = "";
let pendingDir = "same";

function direction(from: string, to: string) {
  const start = ORDER.indexOf(from);
  const end = ORDER.indexOf(to);
  if (start < 0 || end < 0 || start === end) return "same";
  return end > start ? "forward" : "back";
}

function readDirection(pathname: string) {
  if (typeof window === "undefined") return "same";
  if (!previousPath) {
    previousPath = pathname;
    pendingDir = "same";
  } else if (previousPath !== pathname) {
    pendingDir = direction(previousPath, pathname);
    previousPath = pathname;
  }
  return pendingDir;
}

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dir = readDirection(pathname);
  return <div className={`page-enter is-${dir}`}>{children}</div>;
}
