import { CielProjets } from "@/components/CielProjets";
import { Block } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { SmileyMark } from "@/components/TitleMarks";
import { readEtat, vuePublique } from "@/lib/etoiles/etat";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("Projets", "Des projets paraîtront ici.", "/projets");

export default async function ProjectsPage() {
  const etoiles = vuePublique(await readEtat());
  return (
    <main id="contenu" className="projets">
      <ScrollTitle id="titre-projets" text="Projets" tone="sea" icon={<SmileyMark />} max={5.2} />
      <p className="projets-attente">
        <Block lines={["86%"]}>
          <>Des projets paraîtront ici.</>
        </Block>
      </p>
      <CielProjets initial={etoiles} />
    </main>
  );
}
