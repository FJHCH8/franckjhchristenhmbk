import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./essai.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Franck J.H. Christen — essai",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#07070a", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** La page d'essai a sa propre mise en page, sans rien de l'ancien site. */
export default function EssaiLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body className="grain min-h-svh bg-fond font-sans text-white selection:bg-accent/40">{children}</body>
    </html>
  );
}
