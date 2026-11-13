import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Altimeter } from "@/components/Altimeter";
import { Header } from "@/components/Header";
import { LocaleProvider, T } from "@/components/Locale";
import { PageSky } from "@/components/PageSky";
import { ProjetsSky } from "@/components/ProjetsSky";
import { RouteTransition } from "@/components/RouteTransition";
import { Sky } from "@/components/Sky";
import { ThemeBoot } from "@/components/ThemeBoot";
import { localeInitScript } from "@/lib/locale";
import { googleSiteVerification, isPreviewDeployment, PERSON_NAME, SITE_DESCRIPTION, siteUrl, structuredData } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const origin = siteUrl();
const title = `Bienvenue — ${PERSON_NAME}`;
const description = SITE_DESCRIPTION;
const googleVerification = googleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: title,
    template: `%s — ${PERSON_NAME}`,
  },
  description,
  applicationName: PERSON_NAME,
  authors: [{ name: PERSON_NAME }],
  keywords: [PERSON_NAME, "Polyhymate", "Bienvenue"],
  alternates: { canonical: origin },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: origin,
    title,
    description,
    siteName: PERSON_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: isPreviewDeployment()
    ? { index: false, follow: false }
    : { index: true, follow: true },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8ebfe6",
};

const jsonLd = structuredData();

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Script id="locale-init" strategy="beforeInteractive">
          {localeInitScript}
        </Script>
        <style>{`
          /* Chrome ignores the prefixed backdrop-filter that the CSS compiler emits alone. */
          .glass { backdrop-filter: blur(28px) saturate(1.85); }
          .nav, .toggle, .lang { backdrop-filter: blur(22px) saturate(1.75); }
          .top-frost-layer { backdrop-filter: blur(var(--blur)) saturate(1.45); }
          @media (prefers-reduced-transparency: reduce) {
            .glass, .nav, .toggle, .lang, .top-frost-layer { backdrop-filter: none; }
          }
        `}</style>
        <LocaleProvider>
          <RouteTransition />
          <ThemeBoot />
          <a className="skip" href="#contenu">
            <T width="9em">Aller au contenu</T>
          </a>
          <PageSky />
          <Sky />
          <ProjetsSky />
          <p className="rail">
            <T width="8em">Bienvenue</T>
          </p>
          <Altimeter />
          <Header />
          {children}
          <footer className="footer">
            <div className="shell footer-inner">
              <p translate="no">© {new Date().getFullYear()} Franck J.H. CHRISTEN H.M.B.K.</p>
              <p>
                <T width="7em">Bienvenue</T>
              </p>
              <Link href="/">
                <T>Accueil</T>
              </Link>
            </div>
          </footer>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LocaleProvider>
      </body>
    </html>
  );
}
