import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";
import { Maintenance } from "@/components/teodor/Maintenance";
import { MAINTENANCE } from "@/lib/maintenance";
import { HOME_DESCRIPTION, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(null, HOME_DESCRIPTION, "/");

export default function Accueil() {
  if (MAINTENANCE) return <Maintenance />;
  return (
    <Suspense>
      <Nouveau vue="accueil" />
    </Suspense>
  );
}
