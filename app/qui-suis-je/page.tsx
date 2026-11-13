import type { Metadata } from "next";
import { QuiBlend } from "@/components/QuiBlend";
import { QuiScene } from "@/components/QuiScene";
import { SkinField } from "@/components/SkinField";

export const metadata: Metadata = {
  title: "Qui suis-je",
  description: "Qui suis-je. Franck J.H. CHRISTEN H.M.B.K.",
};

export default function QuiSuisJePage() {
  return (
    <main id="contenu" className="qui">
      <SkinField />
      <QuiBlend />
      <QuiScene />
    </main>
  );
}
