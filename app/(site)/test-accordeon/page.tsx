import type { Metadata } from "next";
import { GalerieAccordeon } from "@/components/GaleriesTest";

export const metadata: Metadata = { title: "Test · Accordéon", robots: { index: false, follow: false } };

/** Page de test temporaire : la galerie « Accordéon », pour choisir celle de l’accueil. */
export default function Page() {
  return (
    <main id="contenu" className="gt-page">
      <GalerieAccordeon />
    </main>
  );
}
