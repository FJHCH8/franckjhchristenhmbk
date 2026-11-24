import type { Metadata } from "next";
import { Chakra_Petch, Share_Tech_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/Locale";
import { Page404 } from "@/components/introuvable/Page404";

// La page 404 de tout le site (le site a plusieurs mises en page racines).
const chakra = Chakra_Petch({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], variable: "--p2" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono" });

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="de">
      <body className={`${chakra.variable} ${mono.variable}`}>
        <LocaleProvider>
          <Page404 />
        </LocaleProvider>
      </body>
    </html>
  );
}
