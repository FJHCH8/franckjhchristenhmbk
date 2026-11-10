import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Franck J.H. CHRISTEN H.M.B.K.",
    short_name: "Bienvenue",
    description: "Bienvenue. Franck J.H. CHRISTEN H.M.B.K. Polyhymate.",
    start_url: "/",
    display: "standalone",
    background_color: "#8ec4ee",
    theme_color: "#8ebfe6",
    lang: "fr",
  };
}
