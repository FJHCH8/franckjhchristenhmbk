import type { Metadata, Viewport } from "next";
import {
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Armenian,
  Noto_Sans_Bengali,
  Noto_Sans_Ethiopic,
  Noto_Sans_Georgian,
  Noto_Sans_Hebrew,
  Noto_Sans_Mono,
  Noto_Sans_Tamil,
  Noto_Sans_Thai,
  Orbitron,
  Chakra_Petch,
  Share_Tech_Mono,
} from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Chargement } from "@/components/Chargement";
import { Onde } from "@/components/Onde";
import { Crests } from "@/components/Crests";
import { Experience } from "@/components/Experience";
import { Header } from "@/components/Header";
import { Kinetic } from "@/components/Kinetic";
import { ImageGuard } from "@/components/ImageGuard";
import { Intro } from "@/components/Intro";
import { Tilt } from "@/components/Tilt";
import { LocaleProvider, T } from "@/components/Locale";
import { Lux } from "@/components/Lux";
import { PageSky } from "@/components/PageSky";
import { PowerBoot } from "@/components/PowerBoot";
import { RouteTransition } from "@/components/RouteTransition";
import { SonBouton } from "@/components/SonBouton";
import { Suite } from "@/components/Suite";
import { ThemeBoot } from "@/components/ThemeBoot";
import { localeInitScript } from "@/lib/locale";
import { copyrightNotice, copyrightParts, DEFAULT_SITE_URL, googleSiteVerification, HOME_DESCRIPTION, PERSON_NAME, structuredData } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./metro.css";
import "./metro-plus.css";
import "./animations.css";
import "./parametres-tactique.css";
import { Protection } from "@/components/Protection";

/*
 * Famille Noto : dessinée pour couvrir toutes les écritures du monde.
 * Les polices des autres écritures ne sont téléchargées que si la page en contient.
 */
const texte = Noto_Sans({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese", "devanagari"],
  display: "swap",
  style: ["normal", "italic"],
  weight: "variable",
  // Axe de largeur : les titres se resserrent avec la vitesse du défilement.
  axes: ["wdth"],
  // Sans police de repli Arial intercalée : elle masquerait les polices des autres écritures.
  adjustFontFallback: false,
  variable: "--font-noto",
});

const mono = Noto_Sans_Mono({
  subsets: ["latin", "latin-ext", "cyrillic", "greek", "vietnamese"],
  display: "swap",
  weight: "variable",
  variable: "--font-mono",
});

const arabe = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-ar",
});
const hebreu = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-he",
});
const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-th",
});
const armenien = Noto_Sans_Armenian({
  subsets: ["armenian"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-hy",
});
const georgien = Noto_Sans_Georgian({
  subsets: ["georgian"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-ka",
});
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-bn",
});
const tamoul = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-ta",
});
const ethiopien = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-et",
});

// Polices des paramètres (style Odyssée × tactique), téléchargées seulement à leur ouverture.
const tacTitre = Chakra_Petch({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], display: "swap", preload: false, variable: "--f-titre" });
const tacMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--f-mono" });

const polices = [texte, mono, tacTitre, tacMono, arabe, hebreu, thai, armenien, georgien, bengali, tamoul, ethiopien]
  .map((font) => font.variable)
  .join(" ");

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
      { url: "/favicon.ico?v=ronds", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-32.png?v=ronds", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=ronds", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=ronds", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=ronds", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico?v=ronds", type: "image/x-icon" }],
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
      <body className={`${polices} ${chrono.variable}`}>
        <Protection />
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
          <p className="rail" translate="no">
            © <T>Franck J.H. Christen</T>
          </p>
          <Header />
          <ImageGuard />
          <Kinetic />
          <Experience />
          <Intro />
          <Chargement />
          <Onde />
          <SonBouton />
          <Tilt />
          {children}
          <Suite />
          <footer className="footer">
            <div className="shell footer-inner">
              <Crests place="footer" />
              <p className="footer-note" translate="no">
                {copyrightParts().avant}
                <T>{copyrightParts().nom}</T>
                {copyrightParts().apres}
              </p>
            </div>
          </footer>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </LocaleProvider>
      </body>
    </html>
  );
}
