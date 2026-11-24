import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Projets", "Citations et projets.", "/projets");

export default function Projets() {
  return (
    <Suspense>
      <Nouveau vue="projets" />
    </Suspense>
  );
}
