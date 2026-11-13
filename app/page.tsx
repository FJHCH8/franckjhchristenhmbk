import { Crests } from "@/components/Crests";
import { Glass } from "@/components/Glass";
import { Block, T } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";

export default function HomePage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-accueil" text="Franck J.H. CHRISTEN H.M.B.K." keep max={3.5} />
      <section className="hero shell scroll-reveal" id="accueil" aria-labelledby="titre-accueil">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="welcome">
              <T width="7.2em">Bienvenue</T>
            </p>
            <p className="epithet">
              <T width="9em">Polymathe</T>
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
