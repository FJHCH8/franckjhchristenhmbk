import { Descend } from "@/components/Descend";
import { Glass } from "@/components/Glass";
import { Split } from "@/components/Kinetic";
import { PhotoField } from "@/components/PhotoField";
import { QuiBlend } from "@/components/QuiBlend";
import { ScrollTitle } from "@/components/ScrollTitle";
import { InfinityMark } from "@/components/TitleMarks";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "À propos",
  "Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.",
  "/a-propos",
);

export default function AboutPage() {
  return (
    <main id="contenu" className="photo-page">
      <PhotoField name="judo" width={1500} height={2386} focus="center 26%" />
      <QuiBlend />
      <ScrollTitle id="titre-apropos" text="À propos" icon={<InfinityMark />} />
      <section className="section shell page-solo" aria-labelledby="titre-apropos">
        <Descend>
          <p className="kicker">
            <Split text="02 — Le site" mode="chars" lang />
          </p>
        </Descend>
        <Descend>
          <Glass>
            <p className="prose">
              <Split text="Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck." />
            </p>
            <dl className="reserve">
              <div>
                <dt>
                  <Split text="Présentation" mode="chars" lang />
                </dt>
                <dd>
                  <Split text="La vie, les projets et les annonces de Franck y prennent place." delay={160} />
                </dd>
              </div>
              <div>
                <dt>
                  <Split text="Horizon" mode="chars" lang />
                </dt>
                <dd>
                  <Split
                    text="Le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les 7 jours."
                    delay={160}
                  />
                </dd>
              </div>
            </dl>
          </Glass>
        </Descend>
      </section>
    </main>
  );
}
