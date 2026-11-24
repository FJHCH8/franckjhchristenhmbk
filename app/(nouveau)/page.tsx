import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";
import { HOME_DESCRIPTION, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(null, HOME_DESCRIPTION, "/");

export default function Accueil() {
  return (
    <Suspense>
      <Nouveau vue="accueil" />
    </Suspense>
  );
}
