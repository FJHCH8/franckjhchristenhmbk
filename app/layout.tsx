import type { Metadata, Viewport } from "next";
import { Fraunces, Orbitron, Outfit } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Altimeter } from "@/components/Altimeter";
import { Crests } from "@/components/Crests";
import { EditionPorte } from "@/components/EditionPorte";
import { Header } from "@/components/Header";
import { ImageGuard } from "@/components/ImageGuard";
import { Tilt } from "@/components/Tilt";
import { LocaleProvider, T } from "@/components/Locale";
import { Lux } from "@/components/Lux";
import { PageSky } from "@/components/PageSky";
import { PowerBoot } from "@/components/PowerBoot";
import { ProjetsSky } from "@/components/ProjetsSky";
import { Recit } from "@/components/Recit";
import { RouteTransition } from "@/components/RouteTransition";
import { Sky } from "@/components/Sky";
import { ThemeBoot } from "@/components/ThemeBoot";
import { localeInitScript } from "@/lib/locale";
import { copyrightNotice, DEFAULT_SITE_URL, googleSiteVerification, HOME_DESCRIPTION, PERSON_NAME, structuredData } from "@/lib/site";
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

const chrono = Orbitron({
  subsets: ["latin"],
  display: "swap",
  weight: "500",
  variable: "--font-chrono",
});

const googleVerification = googleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(DEFAULT_SITE_URL),
  title: {
    absolute: PERSON_NAME,
  },
  description: HOME_DESCRIPTION,
  applicationName: PERSON_NAME,
  authors: [{ name: PERSON_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: PERSON_NAME,
    description: HOME_DESCRIPTION,
    siteName: PERSON_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: PERSON_NAME,
    description: HOME_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=champs", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-32.png?v=champs", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=champs", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=champs", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=champs", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico?v=champs", type: "image/x-icon" }],
  },
  robots: { index: true, follow: true },
  other: { copyright: copyrightNotice() },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

const jsonLd = structuredData();

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${chrono.variable}`}>
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
          <PowerBoot />
          <Lux />
          <PageSky />
          <ProjetsSky />
          <Sky />
          <p className="rail" translate="no">
            © Franck J.H. Christen
          </p>
          <Altimeter />
          <Header />
          <ImageGuard />
          <Recit />
          <Tilt />
          <EditionPorte />
          {children}
          <footer className="footer">
            <div className="shell footer-inner">
              <Crests place="footer" />
              <p className="footer-note" translate="no">
                {copyrightNotice()}
              </p>
            </div>
          </footer>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LocaleProvider>
      </body>
    </html>
  );
}
