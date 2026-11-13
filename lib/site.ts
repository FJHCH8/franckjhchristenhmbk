import type { Metadata } from "next";

/**
 * Public origin used for the sitemap, robots file, canonical URLs and JSON-LD.
 * Google Search Console: set `GOOGLE_SITE_VERIFICATION` to the HTML-tag token only
 * (the `content` value, not the whole meta tag). Nothing is emitted until that variable is set.
 */
export const DEFAULT_SITE_URL = "https://franckjhchristen.com";

export const PERSON_NAME = "Franck J.H. CHRISTEN H.M.B.K.";

export const INSTAGRAM_URL = "https://instagram.com/fjhchristenhmbk";

/** Short lines copied from the pages themselves. */
export const HOME_DESCRIPTION = "Bienvenue. Polymathe.";

export const SITE_DESCRIPTION = HOME_DESCRIPTION;

export function googleSiteVerification() {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return token || undefined;
}

export function pageMetadata(label: string | null, description: string, path: string): Metadata {
  const title = label ? `${PERSON_NAME} — ${label}` : PERSON_NAME;
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: PERSON_NAME };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function copyrightSpan(now = new Date()) {
  const year = now.getFullYear();
  return year > 2026 ? `2026–${year}` : "2026";
}

export function copyrightNotice(now = new Date()) {
  return `© ${copyrightSpan(now)} Franck J.H. Christen — Tous droits réservés. Toute reproduction, totale ou partielle, des textes, images, idées et créations de ce site est interdite sans autorisation.`;
}

export function structuredData(now = new Date()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: PERSON_NAME,
        sameAs: INSTAGRAM_URL,
      },
      {
        "@type": "WebSite",
        name: PERSON_NAME,
        url: DEFAULT_SITE_URL,
        copyrightHolder: { "@type": "Person", name: "Franck J.H. Christen" },
        copyrightYear: now.getFullYear(),
      },
    ],
  };
}
