import { Glass } from "@/components/Glass";
import { T } from "@/components/Locale";
import { ScrollTitle } from "@/components/ScrollTitle";
import { ParchmentMark } from "@/components/TitleMarks";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Contact",
  "franckjhchristen@gmail.com. Instagram : @fjhchristenhmbk.",
  "/contact",
);

export default function ContactPage() {
  return (
    <main id="contenu">
      <ScrollTitle id="titre-contact" text="Contact" icon={<ParchmentMark />} />
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
