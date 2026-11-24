import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Libre_Baskerville, Pacifico, Press_Start_2P, Roboto, Share_Tech_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./os.css";

// AakanOS : le site comme un système de téléphone (lancé depuis Paramètres › apparence), non indexé.
const roboto = Roboto({ subsets: ["latin", "latin-ext"], weight: ["100", "300", "400", "700"], variable: "--font-roboto" });
// Les polices du site (Odyssée), pour l'appli Sam-Telecom
const chakra = Chakra_Petch({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--p2" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono" });
// En-tête des courriers Sharkobank (police de banque, licence OFL)
const banque = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-banque" });
// En-tête des courriels Peeporn (police script, licence OFL)
const glam = Pacifico({ subsets: ["latin"], weight: "400", variable: "--f-glam" });
// Opakaalt, le jeu 8 bits (police pixel, licence OFL)
const pixel = Press_Start_2P({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--f-pixel" });

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
      <body className={`${roboto.variable} ${chakra.variable} ${mono.variable} ${banque.variable} ${glam.variable} ${pixel.variable}`}>{children}</body>
    </html>
  );
}
