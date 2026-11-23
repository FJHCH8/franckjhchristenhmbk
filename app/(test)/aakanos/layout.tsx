import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import "./os.css";

// AakanOS : le site comme un système de téléphone (lancé depuis Paramètres › apparence), non indexé.
const roboto = Roboto({ subsets: ["latin", "latin-ext"], weight: ["100", "300", "400", "700"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: "AakanOS",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function DispositionAakanOS({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={roboto.variable}>{children}</body>
    </html>
  );
}
