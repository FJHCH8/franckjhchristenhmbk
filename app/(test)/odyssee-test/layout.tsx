import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import "./os.css";

// Version test d'Odyssée : à part du site, non indexée.
const roboto = Roboto({ subsets: ["latin", "latin-ext"], weight: ["100", "300", "400", "700"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: "Odyssée · version test",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function DispositionTest({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={roboto.variable}>{children}</body>
    </html>
  );
}
