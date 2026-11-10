import fs from "node:fs";
import path from "node:path";
import { extraPublicPaths } from "@/lib/site";

const PAGE_FILES = new Set(["page.js", "page.jsx", "page.ts", "page.tsx"]);

function normalizePath(value: string) {
  if (!value || value === "/") return "/";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function walk(dir: string, url: string, found: Set<string>) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  if (entries.some((entry) => entry.isFile() && PAGE_FILES.has(entry.name))) {
    found.add(normalizePath(url));
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith("_") || name.startsWith("@") || name.includes("[")) continue;
    const group = name.startsWith("(") && name.endsWith(")");
    const nextUrl = group ? url : `${url}/${name}`.replace(/\/{2,}/g, "/");
    walk(path.join(dir, name), nextUrl, found);
  }
}

/** Real public routes. Hash sections of the homepage (#accueil, #a-propos, #contact) stay on `/`. */
export function publicPaths() {
  const found = new Set<string>();
  walk(path.join(process.cwd(), "app"), "", found);
  for (const extra of extraPublicPaths) found.add(normalizePath(extra));
  return [...found].sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b, "fr")));
}
