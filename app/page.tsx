import { Crests } from "@/components/Crests";
import { Glass } from "@/components/Glass";
import { Block, T } from "@/components/Locale";

export default function HomePage() {
  return (
    <main id="contenu">
      <section className="hero shell" id="accueil" aria-labelledby="titre-accueil">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="welcome">
              <T width="7.2em">Bienvenue</T>
            </p>
            <h1 id="titre-accueil" translate="no">
              Franck J.H. CHRISTEN H.M.B.K.
            </h1>
            <p className="epithet">
              <T width="9em">Polyhymate</T>
            </p>
            <Glass className="motto-glass">
              <figure className="motto">
                <blockquote>
                  <Block lines={["100%", "78%"]}>
                    <p>« Ta deuxième vie commence quand tu comprends que tu n’en as qu’une. »</p>
                  </Block>
                </blockquote>
                <figcaption>
                  <Block lines={["13em"]}>
                    <>— Raphaëlle Giordano</>
                  </Block>
                </figcaption>
              </figure>
            </Glass>
          </div>
          <Crests />
        </div>
      </section>
    </main>
  );
}
