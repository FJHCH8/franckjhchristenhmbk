import { CielProjets } from "@/components/CielProjets";
import { ScrollTitle } from "@/components/ScrollTitle";
import { SmileyMark } from "@/components/TitleMarks";
import { readEtat, vuePublique } from "@/lib/etoiles/etat";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("Projets", "Citations et projets.", "/projets");

export default async function ProjectsPage() {
  const etoiles = vuePublique(await readEtat());
  return (
    <main id="contenu" className="projets">
      <ScrollTitle id="titre-projets" text="Projets" tone="sea" icon={<SmileyMark />} max={5.2} />
      <CielProjets initial={etoiles} />
    </main>
  );
}
