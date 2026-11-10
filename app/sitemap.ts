import type { MetadataRoute } from "next";
import { publicPaths } from "@/lib/public-paths";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const lastModified = new Date();

  return publicPaths().map((pathname) => ({
    url: new URL(pathname, `${origin}/`).toString(),
    lastModified,
    changeFrequency: pathname === "/" ? "monthly" : "yearly",
    priority: pathname === "/" ? 1 : 0.7,
  }));
}
