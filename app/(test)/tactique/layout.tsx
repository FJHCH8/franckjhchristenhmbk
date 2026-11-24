import type { Metadata, Viewport } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./tactique.css";

// Page test : le site en interface « tactique » × animations Metro. À part du site, non indexée.
const rajdhani = Rajdhani({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--f-titre" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono" });

export const metadata: Metadata = { title: "Odyssée · test tactique", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function DispositionTactique({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${rajdhani.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
