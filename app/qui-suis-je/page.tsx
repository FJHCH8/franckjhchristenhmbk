import type { Metadata } from "next";
import { QuiScene } from "@/components/QuiScene";

export const metadata: Metadata = {
  title: "Qui suis-je",
  description: "Qui suis-je. Franck J.H. CHRISTEN H.M.B.K.",
};

export default function QuiSuisJePage() {
  return (
    <main id="contenu" className="qui">
      <QuiScene />
    </main>
  );
}
