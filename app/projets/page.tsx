import type { Metadata } from "next";
import { Countdown } from "@/components/Countdown";
import { Block } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { SmileyMark } from "@/components/TitleMarks";

export const metadata: Metadata = {
  title: "Projets",
};

export default function ProjectsPage() {
  return (
    <main id="contenu" className="projets">
      <ScrollTitle id="titre-projets" text="Projets" tone="sea" icon={<SmileyMark />} max={5.2} />
      <section className="section shell page-solo projets-copy scroll-reveal" aria-labelledby="titre-projets">
        <div className="ice">
          <p>
            <Block lines={["86%"]}>
              <>Des projets paraîtront ici.</>
            </Block>
          </p>
          <p>
            <Block lines={["100%", "72%"]}>
              <>L’attente n’est pas un vide : c’est le noir où les choses prennent forme.</>
            </Block>
          </p>
        </div>
        <Countdown />
        <p className="endurreisen" translate="no">
          Endurreisen
        </p>
      </section>
    </main>
  );
}
