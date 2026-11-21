import type { MetadataRoute } from "next";
import { PERSON_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PERSON_NAME,
    short_name: "Bienvenue",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "fr",
    icons: [
      { src: "/icon-192.png?v=champs", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=champs", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png?v=champs", sizes: "180x180", type: "image/png" },
    ],
  };
}
