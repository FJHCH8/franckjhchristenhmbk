import type { MetadataRoute } from "next";
import { DEFAULT_SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/edition" },
    sitemap: `${DEFAULT_SITE_URL}/sitemap.xml`,
  };
}
