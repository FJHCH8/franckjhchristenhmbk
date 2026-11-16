import { Glass } from "@/components/Glass";
import { T } from "@/components/Locale";
import { PhotoField } from "@/components/PhotoField";
import { QuiBlend } from "@/components/QuiBlend";
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
    <main id="contenu" className="photo-page">
      <PhotoField name="avion" width={1500} height={2000} focus="68% 42%" />
      <QuiBlend />
      <ScrollTitle id="titre-contact" text="Contact" icon={<ParchmentMark />} />
      <section className="section shell page-solo scroll-reveal" aria-labelledby="titre-contact">
        <Glass>
          <div className="contact-links">
            <a href="mailto:franckjhchristen@gmail.com" translate="no">
              <svg className="contact-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.2" y="5.2" width="17.6" height="13.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.15" />
                <path d="M4.2 7.1 12 12.4l7.8-5.3" fill="none" stroke="currentColor" strokeWidth="1.15" />
              </svg>
              <span>franckjhchristen@gmail.com</span>
            </a>
            <a href="https://instagram.com/fjhchristenhmbk" rel="noopener noreferrer" target="_blank">
              <svg className="contact-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" fill="none" stroke="currentColor" strokeWidth="1.15" />
                <circle cx="12" cy="12" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.15" />
                <circle cx="17.15" cy="6.85" r="0.85" fill="currentColor" />
              </svg>
              <span>
                <T width="8em">Instagram :</T> <span translate="no">@fjhchristenhmbk</span>
              </span>
            </a>
          </div>
        </Glass>
      </section>
    </main>
  );
}
