/**
 * Canonical identity and public URLs.
 *
 * A new public page is picked up by the sitemap when its `page.tsx` (or `.ts` / `.jsx` / `.js`)
 * exists under `app/`. Example: `app/langues/page.tsx` → `/langues`.
 * Route groups such as `app/(groupe)/…` do not add a URL segment.
 * Dynamic segments (`app/journal/[slug]/page.tsx`) are skipped; list those paths in
 * `extraPublicPaths` below.
 *
 * Google Search Console: set `GOOGLE_SITE_VERIFICATION` to the HTML-tag token only
 * (the `content` value, not the whole meta tag). Nothing is emitted until that variable is set.
 */

export const DEFAULT_SITE_URL = "https://franckjhchristenhmbk.vercel.app";

export const PERSON_NAME = "Franck J.H. CHRISTEN H.M.B.K.";

export const ALTERNATE_NAMES = [
  "Franck J.H. Christen",
  "Franck Christen",
  "Franck J.H. CHRISTEN HEDIN BETHENDORFF KRISTENSEN",
  "Frank Kristen",
  "Franck Kristen",
  "Frank Christen",
  "Polyhymate",
] as const;

export const SAME_AS = ["https://www.instagram.com/fjhchristenhmbk/", "https://github.com/FJHCH8"] as const;

export const EMAIL = "franckjhchristen@gmail.com";

export const SITE_DESCRIPTION =
  "Bienvenue. Site de Franck J.H. CHRISTEN H.M.B.K. (Franck Christen), Polyhymate.";

/** Extra public paths that are not plain files under `app/` (dynamic routes, for example). */
export const extraPublicPaths: string[] = [];

export function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return fromEnv || DEFAULT_SITE_URL;
}

export function googleSiteVerification() {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return token || undefined;
}

export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === "preview";
}

export function structuredData() {
  const origin = siteUrl();
  const pageUrl = `${origin}/`;
  const personId = `${origin}/#person`;
  const websiteId = `${origin}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: PERSON_NAME,
        alternateName: [...ALTERNATE_NAMES],
        url: pageUrl,
        email: EMAIL,
        sameAs: [...SAME_AS],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: pageUrl,
        name: PERSON_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "fr",
        publisher: { "@id": personId },
        about: { "@id": personId },
      },
    ],
  };
}
