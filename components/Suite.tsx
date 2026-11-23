"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Split } from "@/components/Kinetic";

const ORDRE = [
  { href: "/qui-suis-je", titre: "Qui suis-je" },
  { href: "/projets", titre: "Projets" },
  { href: "/", titre: "Accueil" },
];

/** En bas de chaque page : la suivante, en grand, pour continuer le récit sans menu. */
export function Suite() {
  const pathname = usePathname();
  const index = ORDRE.findIndex((item) => item.href === pathname);
  if (pathname === "/" || index < 0) return null;
  const suivante = ORDRE[(index + 1) % ORDRE.length]!;

  return (
    <nav className="suite" aria-label="Page suivante">
      <Link className="suite-lien" href={suivante.href}>
        <span className="suite-etiquette">Suivant</span>
        <span className="suite-titre">
          <Split key={suivante.href} text={suivante.titre} mode="chars" lang className="kt-x" />
        </span>
        <svg className="suite-fleche" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </nav>
  );
}
