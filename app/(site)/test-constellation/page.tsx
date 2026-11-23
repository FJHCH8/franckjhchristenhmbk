import type { Metadata } from "next";
import { GalerieConstellation } from "@/components/GaleriesTest";

export const metadata: Metadata = { title: "Test · Constellation", robots: { index: false, follow: false } };

/** Page de test temporaire : la galerie « Constellation », pour choisir celle de l’accueil. */
export default function Page() {
  return (
    <main id="contenu" className="gt-page">
      <GalerieConstellation />
    </main>
  );
}
