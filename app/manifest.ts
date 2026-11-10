import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Franck J.H. Christen H.M.B.K.",
    short_name: "Franck J.H.",
    description: "Site personnel de Franck J.H. Christen H.M.B.K.",
    start_url: "/",
    display: "standalone",
    background_color: "#8ec4ee",
    theme_color: "#8ebfe6",
    lang: "fr",
  };
}
