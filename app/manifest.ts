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
  };
}
