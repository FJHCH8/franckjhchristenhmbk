import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Chakra_Petch, Oxanium, Rajdhani, Saira_Semi_Condensed, Share_Tech_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "../../(site)/parametres-tactique.css";
import "./nouveau.css";

// Page test du nouveau site (style des paramètres partout). À part du site, non indexée.
// Les 6 polices proposées sont chargées pour pouvoir les essayer en direct.
const p1 = Rajdhani({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p1" });
const p2 = Chakra_Petch({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p2", preload: false });
const p3 = Oxanium({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p3", preload: false });
const p4 = Barlow_Condensed({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p4", preload: false });
const p5 = Saira_Semi_Condensed({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p5", preload: false });
const p6 = Space_Grotesk({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p6", preload: false });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono" });

export const metadata: Metadata = { title: "Odyssée · nouveau site (test)", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function DispositionNouveau({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={[p1, p2, p3, p4, p5, p6, mono].map((f) => f.variable).join(" ")}>{children}</body>
    </html>
  );
}
