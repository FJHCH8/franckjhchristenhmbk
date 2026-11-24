import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Noto_Sans, Share_Tech_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Intro } from "@/components/Intro";
import { localeInitScript } from "@/lib/locale";
import { copyrightNotice, DEFAULT_SITE_URL, googleSiteVerification, HOME_DESCRIPTION, PERSON_NAME, structuredData } from "@/lib/site";
import "../(site)/parametres-tactique.css";
import "./intro.css";
import "./panorama.css";
import "./nouveau.css";

/* Le site Odyssée : interface « tactique » × Metro, fond noir, police Chakra Petch. */
const titre = Chakra_Petch({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p2" });
const metro = Noto_Sans({ subsets: ["latin", "latin-ext"], weight: ["200", "300", "400", "600"], variable: "--font-noto" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono" });

const googleVerification = googleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(DEFAULT_SITE_URL),
  title: { absolute: PERSON_NAME },
  description: HOME_DESCRIPTION,
  applicationName: PERSON_NAME,
  authors: [{ name: PERSON_NAME }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", url: "/", title: PERSON_NAME, description: HOME_DESCRIPTION, siteName: PERSON_NAME },
  twitter: { card: "summary_large_image", title: PERSON_NAME, description: HOME_DESCRIPTION },
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

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#000000" };

// Le chargement PS2 se joue à chaque ouverture (sauf mouvements réduits).
const introScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var calme=matchMedia("(prefers-reduced-motion: reduce)").matches;d.classList.add(calme?"intro-vue":"intro-joue");if(!calme)setTimeout(function(){d.classList.remove("intro-joue");},9000);}catch(e){d.classList.add("intro-vue");}})();`;

export default function DispositionOdyssee({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={[titre, metro, mono].map((f) => f.variable).join(" ")}>
        <Script id="intro-init" strategy="beforeInteractive">
          {introScript}
        </Script>
        <Script id="locale-init" strategy="beforeInteractive">
          {localeInitScript}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }} />
        <Intro />
        {children}
      </body>
    </html>
  );
}
