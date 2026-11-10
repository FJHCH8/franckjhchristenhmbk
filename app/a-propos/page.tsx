import type { Metadata } from "next";
import { Descend } from "@/components/Descend";
import { Glass } from "@/components/Glass";
import { Block, T } from "@/components/Locale";

export const metadata: Metadata = {
  title: "À propos",
};

export default function AboutPage() {
  return (
    <main id="contenu">
      <section className="section shell page-solo" id="a-propos" aria-labelledby="titre-apropos">
        <Descend>
          <p className="kicker">
            <T width="11em">02 — Réserve</T>
          </p>
          <h1 id="titre-apropos">
            <T>À propos</T>
          </h1>
        </Descend>
        <Descend>
          <Glass>
            <p className="prose">
              <Block lines={["100%", "94%", "62%"]}>
                <>
                  Cette page est laissée en réserve. Rien n’y figure encore{"\u202F"}: ni présentation, ni parcours, ni
                  projets. Lorsque des mots seront choisis, ils prendront place ici.
                </>
              </Block>
            </p>
            <dl className="reserve">
              <div>
                <dt>
                  <T width="8.5em">Présentation</T>
                </dt>
                <dd>
                  <T width="8em">Texte à venir.</T>
                </dd>
              </div>
              <div>
                <dt>
                  <T width="5.5em">Repères</T>
                </dt>
                <dd>
                  <Block lines={["100%", "72%"]}>
                    <>Aucune information n’est publiée pour le moment.</>
                  </Block>
                </dd>
              </div>
              <div>
                <dt>
                  <T width="5.5em">Horizon</T>
                </dt>
                <dd>
                  <Block lines={["100%", "78%"]}>
                    <>D’autres sections pourront s’ajouter, le moment venu.</>
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
