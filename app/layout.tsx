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
const title = "Bienvenue — Franck J.H. CHRISTEN H.M.B.K.";
const description = "Bienvenue. Franck J.H. CHRISTEN H.M.B.K. Polyhymate.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://localhost:3000"),
  title: {
    default: title,
    template: "%s — Franck J.H. CHRISTEN H.M.B.K.",
  },
  description,
  applicationName: "Franck J.H. CHRISTEN H.M.B.K.",
  authors: [{ name: "Franck J.H. CHRISTEN H.M.B.K." }],
  keywords: ["Franck J.H. CHRISTEN H.M.B.K.", "Polyhymate", "Bienvenue"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title,
    description,
    siteName: "Franck J.H. CHRISTEN H.M.B.K.",
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
  name: "Franck J.H. CHRISTEN H.M.B.K.",
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
        <style>{`
          /* Chrome ignores the prefixed backdrop-filter that the CSS compiler emits alone. */
          .glass { backdrop-filter: blur(28px) saturate(1.85); }
          .nav, .toggle { backdrop-filter: blur(22px) saturate(1.75); }
          .top-frost-layer { backdrop-filter: blur(var(--blur)) saturate(1.45); }
          @media (prefers-reduced-transparency: reduce) {
            .glass, .nav, .toggle, .top-frost-layer { backdrop-filter: none; }
          }
        `}</style>
        <ThemeBoot />
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        <Sky />
        <p className="rail">Bienvenue</p>
        <Altimeter />
        <Header />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
