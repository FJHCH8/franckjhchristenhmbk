import type { Metadata } from "next";
import { Glass } from "@/components/Glass";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "À propos",
};

export default function AboutPage() {
  return (
    <main id="contenu">
      <section className="section shell page-solo" id="a-propos" aria-labelledby="titre-apropos">
        <Reveal>
          <p className="kicker">02 — Réserve</p>
          <h1 id="titre-apropos">À propos</h1>
        </Reveal>
        <Reveal delay={120}>
          <Glass>
            <p className="prose">
              Cette page est laissée en réserve. Rien n’y figure encore{"\u202F"}: ni présentation, ni parcours, ni
              projets. Lorsque des mots seront choisis, ils prendront place ici.
            </p>
            <dl className="reserve">
              <div>
                <dt>Présentation</dt>
                <dd>Texte à venir.</dd>
              </div>
              <div>
                <dt>Repères</dt>
                <dd>Aucune information n’est publiée pour le moment.</dd>
              </div>
              <div>
                <dt>Horizon</dt>
                <dd>D’autres sections pourront s’ajouter, le moment venu.</dd>
              </div>
            </dl>
          </Glass>
        </Reveal>
      </section>
    </main>
  );
}
