import type { MetadataRoute } from "next";
import { DEFAULT_SITE_URL } from "@/lib/site";

const PATHS = ["/", "/qui-suis-je", "/a-propos", "/contact", "/projets"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((pathname) => ({
    url: pathname === "/" ? DEFAULT_SITE_URL : new URL(pathname, DEFAULT_SITE_URL).toString(),
  }));
}
