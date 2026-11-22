import { CielProjets } from "@/components/CielProjets";
import { PhotoField } from "@/components/PhotoField";
import { QuiBlend } from "@/components/QuiBlend";
import { ScrollTitle } from "@/components/ScrollTitle";
import { SmileyMark } from "@/components/TitleMarks";
import { readEtat, vuePublique } from "@/lib/etoiles/etat";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("Projets", "Citations et projets.", "/projets");

export default async function ProjectsPage() {
  const etoiles = vuePublique(await readEtat());
  return (
    <main id="contenu" className="projets photo-page">
      <PhotoField name="rose" width={1500} height={2291} focus="46% 34%" />
      <QuiBlend />
      <CielProjets initial={etoiles} titre={<ScrollTitle id="titre-projets" text="Projets" tone="sea" icon={<SmileyMark />} max={5.2} />} />
    </main>
  );
}
