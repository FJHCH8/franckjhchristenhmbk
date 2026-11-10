import type { Metadata } from "next";
import { Glass } from "@/components/Glass";
import { T } from "@/components/Locale";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main id="contenu">
      <section className="section shell page-solo" id="contact" aria-labelledby="titre-contact">
        <Reveal>
          <p className="kicker">
            <T width="9em">03 — Seuil</T>
          </p>
          <h1 id="titre-contact">
            <T>Contact</T>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <Glass>
            <div className="contact-links">
              <a href="mailto:franckjhchristen@gmail.com" translate="no">
                franckjhchristen@gmail.com
              </a>
              <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank">
                <T width="8em">Instagram :</T> <span translate="no">@fjhchristenhmbk</span>
              </a>
            </div>
          </Glass>
        </Reveal>
      </section>
    </main>
  );
}
