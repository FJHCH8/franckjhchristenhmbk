import type { Metadata } from "next";
import { GalerieLiege } from "@/components/GaleriesTest";

export const metadata: Metadata = { title: "Test · Tableau en liège", robots: { index: false, follow: false } };

/** Page de test temporaire : la galerie « Tableau en liège », pour choisir celle de l’accueil. */
export default function Page() {
  return (
    <main id="contenu" className="gt-page">
      <GalerieLiege />
    </main>
  );
}
