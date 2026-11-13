import type { Metadata } from "next";
import { Descend } from "@/components/Descend";
import { Glass } from "@/components/Glass";
import { Block, T } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { InfinityMark } from "@/components/TitleMarks";

export const metadata: Metadata = {
  title: "À propos",
};

export default function AboutPage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-apropos" text="À propos" icon={<InfinityMark />} />
      <section className="section shell page-solo" aria-labelledby="titre-apropos">
        <Descend>
          <p className="kicker">
            <T width="9em">02 — Le site</T>
          </p>
        </Descend>
        <Descend>
          <Glass>
            <p className="prose">
              <Block lines={["100%", "86%"]}>
                <>Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.</>
              </Block>
            </p>
            <dl className="reserve">
              <div>
                <dt>
                  <T width="8.5em">Présentation</T>
                </dt>
                <dd>
                  <Block lines={["100%", "78%"]}>
                    <>La vie, les projets et les annonces de Franck y prennent place.</>
                  </Block>
                </dd>
              </div>
              <div>
                <dt>
                  <T width="5.5em">Horizon</T>
                </dt>
                <dd>
                  <Block lines={["100%", "92%", "70%"]}>
                    <>
                      Le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les 7
                      jours.
                    </>
                  </Block>
                </dd>
              </div>
            </dl>
          </Glass>
        </Descend>
      </section>
    </main>
  );
}
