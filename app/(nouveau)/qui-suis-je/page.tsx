import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Qui suis-je", "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France.", "/qui-suis-je");

export default function QuiSuisJe() {
  return (
    <Suspense>
      <Nouveau vue="qui" />
    </Suspense>
  );
}
