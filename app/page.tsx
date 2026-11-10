import { Crests } from "@/components/Crests";
import { Glass } from "@/components/Glass";

export default function HomePage() {
  return (
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
          </div>
          <Crests />
        </div>
      </section>
    </main>
  );
}
