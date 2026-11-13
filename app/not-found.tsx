import type { Metadata } from "next";
import Link from "next/link";
import { Block, T } from "@/components/Locale";

export const metadata: Metadata = {
  title: { absolute: "Page introuvable" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="contenu" className="missing shell">
      <p className="kicker">404</p>
      <h1>
        <Block lines={["min(14em, 92%)"]}>
          <>Cette page n’existe pas.</>
        </Block>
      </h1>
      <p className="sub">
        <Block lines={["100%", "70%"]}>
          <>Le lien ne mène nulle part. Le ciel d’accueil, lui, est toujours là.</>
        </Block>
      </p>
      <Link className="return-link" href="/">
        <T width="12em">Retour à l’accueil</T>
      </Link>
    </main>
  );
}
