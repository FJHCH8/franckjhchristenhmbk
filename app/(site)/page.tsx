import { Crests } from "@/components/Crests";
import { Bento } from "@/components/Bento";
import { Chapitres } from "@/components/Chapitres";
import { Split } from "@/components/Kinetic";
import { ScrollTitle } from "@/components/ScrollTitle";
import { HOME_DESCRIPTION, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(null, HOME_DESCRIPTION, "/");

export default function HomePage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-accueil" text="Franck J.H. CHRISTEN H.M.B.K." max={3.5} fond="/media/franck-enfant" sous={<Split text="Polymathe" mode="chars" lang delay={260} />} />
      <section className="hero shell scroll-reveal" id="accueil" aria-labelledby="titre-accueil">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="welcome">
              <Split text="Bienvenue" mode="chars" lang />
            </p>
          </div>
          <Crests />
        </div>
      </section>
      <Chapitres />
      <Bento />
    </main>
  );
}
