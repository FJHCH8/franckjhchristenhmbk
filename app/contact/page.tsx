import type { Metadata } from "next";
import { Glass } from "@/components/Glass";
import { T } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { ParchmentMark } from "@/components/TitleMarks";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-contact" icon={<ParchmentMark />}>
        <T>Contact</T>
      </ScrollTitle>
      <section className="section shell page-solo scroll-reveal" aria-labelledby="titre-contact">
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
      </section>
    </main>
  );
}
