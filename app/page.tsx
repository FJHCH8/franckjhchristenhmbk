import { Crests } from "@/components/Crests";
import { Glass } from "@/components/Glass";
import { ChevronIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      <main id="contenu">
        <section className="hero shell" id="accueil" aria-labelledby="titre-accueil">
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="welcome">Bienvenue</p>
              <h1 id="titre-accueil" translate="no">
                Franck J.H. CHRISTEN H.M.B.K.
              </h1>
              <p className="epithet" translate="no">
                Polyhymate
              </p>
              <Glass className="motto-glass">
                <figure className="motto">
                  <blockquote>
                    <p>« Ta deuxième vie commence quand tu comprends que tu n’en as qu’une. »</p>
                  </blockquote>
                  <figcaption>— Raphaëlle Giordano</figcaption>
                </figure>
              </Glass>
              <a className="descend" href="#a-propos">
                <span className="descend-line" aria-hidden="true" />
                Continuer
                <ChevronIcon />
              </a>
            </div>
            <Crests />
          </div>
        </section>

        <section className="section shell" id="a-propos" aria-labelledby="titre-apropos">
          <Reveal>
            <p className="kicker">02 — Réserve</p>
            <h2 id="titre-apropos">À propos</h2>
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

        <section className="section shell" id="contact" aria-labelledby="titre-contact">
          <Reveal>
            <p className="kicker">03 — Seuil</p>
            <h2 id="titre-contact">Contact</h2>
          </Reveal>
          <Reveal delay={120}>
            <Glass>
              <div className="contact-links">
                <a href="mailto:franckjhchristen@gmail.com">franckjhchristen@gmail.com</a>
                <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank">
                  Instagram : @fjhchristenhmbk
                </a>
              </div>
            </Glass>
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <p translate="no">© {year} Franck J.H. CHRISTEN H.M.B.K.</p>
          <p>Bienvenue</p>
          <a href="#accueil">Haut de page</a>
        </div>
      </footer>
    </>
  );
}
