import { Suspense } from "react";
import { Nouveau } from "@/components/nouveau/Nouveau";

export default function PageNouveau() {
  return (
    <Suspense>
      <Nouveau />
    </Suspense>
  );
}
