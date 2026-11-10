import type { Metadata } from "next";
import { LifeTree } from "@/components/LifeTree";

export const metadata: Metadata = {
  title: "Qui suis-je",
  description: "Qui suis-je. Franck J.H. CHRISTEN H.M.B.K.",
};

export default function QuiSuisJePage() {
  return (
    <main id="contenu" className="qui">
      <section className="qui-stage" aria-labelledby="titre-qui">
        <div className="qui-pin">
          <h1 id="titre-qui">Qui suis-je</h1>
          <LifeTree />
        </div>
      </section>
    </main>
  );
}
