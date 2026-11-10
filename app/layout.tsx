import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Altimeter } from "@/components/Altimeter";
import { Header } from "@/components/Header";
import { Sky } from "@/components/Sky";
import { ThemeBoot } from "@/components/ThemeBoot";
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

function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();
const title = "Franck J.H. Christen H.M.B.K. — Site personnel";
const description =
  "Site personnel de Franck J.H. Christen H.M.B.K. Un espace en français — accueil, à propos et contact — à compléter.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://localhost:3000"),
  title: {
    default: title,
    template: "%s — Franck J.H. Christen H.M.B.K.",
  },
  description,
  applicationName: "Franck J.H. Christen H.M.B.K.",
  authors: [{ name: "Franck J.H. Christen H.M.B.K." }],
  keywords: ["Franck J.H. Christen H.M.B.K.", "site personnel"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title,
    description,
    siteName: "Franck J.H. Christen H.M.B.K.",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8ebfe6",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Franck J.H. Christen H.M.B.K.",
  description,
  inLanguage: "fr",
  ...(siteUrl ? { url: siteUrl } : {}),
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeBoot />
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        <Sky />
        <p className="rail">Site personnel</p>
        <Altimeter />
        <Header />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
