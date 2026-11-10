import type { Metadata } from "next";
import { Glass } from "@/components/Glass";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main id="contenu">
      <section className="section shell page-solo" id="contact" aria-labelledby="titre-contact">
        <Reveal>
          <p className="kicker">03 — Seuil</p>
          <h1 id="titre-contact">Contact</h1>
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
  );
}
