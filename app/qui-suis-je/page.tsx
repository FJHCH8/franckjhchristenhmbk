import { QuiBlend } from "@/components/QuiBlend";
import { QuiScene } from "@/components/QuiScene";
import { SkinField } from "@/components/SkinField";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Qui suis-je",
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France.",
  "/qui-suis-je",
);

export default function QuiSuisJePage() {
  return (
    <main id="contenu" className="qui">
      <SkinField />
      <QuiBlend />
      <QuiScene />
    </main>
  );
}
