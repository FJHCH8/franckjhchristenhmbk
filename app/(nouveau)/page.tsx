import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";
import { Maintenance } from "@/components/teodor/Maintenance";
import { HOME_DESCRIPTION, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(null, HOME_DESCRIPTION, "/");

/** Pendant la maintenance, l'accueil est fermé : Teodor accueille les visiteurs. Mettre à false pour rouvrir. */
const MAINTENANCE = true;

export default function Accueil() {
  if (MAINTENANCE) return <Maintenance />;
  return (
    <Suspense>
      <Nouveau vue="accueil" />
    </Suspense>
  );
}
