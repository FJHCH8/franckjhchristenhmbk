import { Crests } from "@/components/Crests";
import { Glass } from "@/components/Glass";
import { Bento } from "@/components/Bento";
import { Chapitres } from "@/components/Chapitres";
import { SalleEchecs } from "@/components/SalleEchecs";
import { Split } from "@/components/Kinetic";
import { ScrollTitle } from "@/components/ScrollTitle";
import { HOME_DESCRIPTION, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(null, HOME_DESCRIPTION, "/");

export default function HomePage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-accueil" text="Franck J.H. CHRISTEN H.M.B.K." max={3.5} fond="/media/franck-enfant" />
      <section className="hero shell scroll-reveal" id="accueil" aria-labelledby="titre-accueil">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="welcome">
              <Split text="Bienvenue" mode="chars" lang />
            </p>
            <p className="epithet">
              <Split text="Polymathe" mode="chars" lang delay={260} />
            </p>
            <Glass className="motto-glass">
              <figure className="motto">
                <blockquote>
                  <p>
                    <Split text={"«\u00a0Ta deuxième vie commence quand tu comprends que tu n’en as qu’une.\u00a0»"} delay={380} lang />
                  </p>
                </blockquote>
                <figcaption>
                  <Split text="— Raphaëlle Giordano" delay={900} lang />
                </figcaption>
              </figure>
            </Glass>
          </div>
          <Crests />
        </div>
      </section>
      <Chapitres />
      <Bento />
      <SalleEchecs />
    </main>
  );
}
