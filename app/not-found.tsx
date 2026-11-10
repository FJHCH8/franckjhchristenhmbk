import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="contenu" className="missing shell">
      <p className="kicker">404</p>
      <h1>Cette page n’existe pas.</h1>
      <p className="sub">Le lien ne mène nulle part. Le ciel d’accueil, lui, est toujours là.</p>
      <Link className="return-link" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
