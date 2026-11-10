import { Glass } from "@/components/Glass";
import { ChevronIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      <main id="contenu">
        <section className="hero shell" id="accueil" aria-labelledby="titre-accueil">
          <div className="hero-copy">
            <p className="kicker">Site personnel</p>
            <h1 id="titre-accueil" translate="no">
              <span className="name-first">Franck</span>
              <span className="name-mid">J.H. Christen</span>
              <span className="name-sig">
                <span className="sig-rule" aria-hidden="true" />
                H.M.B.K.
              </span>
            </h1>
            <p className="lead">Le ciel accompagne la descente et la remontée.</p>
            <p className="sub">Ce site sera complété lorsque son contenu aura été choisi.</p>
            <a className="descend" href="#a-propos">
              <span className="descend-line" aria-hidden="true" />
              Continuer
              <ChevronIcon />
            </a>
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
              <p className="write">Écrire</p>
              <p className="prose">
                Une adresse de correspondance sera indiquée à cet endroit. D’ici là, la page demeure un seuil, sans
                message à envoyer.
              </p>
              <p className="status">
                <span className="status-dot" aria-hidden="true" />
                Adresse à venir
              </p>
            </Glass>
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <p translate="no">© {year} Franck J.H. Christen H.M.B.K.</p>
          <p>Site personnel</p>
          <a href="#accueil">Haut de page</a>
        </div>
      </footer>
    </>
  );
}
