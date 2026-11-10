"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopBlur } from "@/components/TopBlur";

const LINKS = [
  { href: "/", id: "accueil", label: "Accueil" },
  { href: "/qui-suis-je", id: "qui-suis-je", label: "Qui suis-je" },
  { href: "/a-propos", id: "a-propos", label: "À propos" },
  { href: "/contact", id: "contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <>
      <TopBlur />
      <header className="header">
        <Link className="brand" href="/" aria-label="Franck J.H. CHRISTEN H.M.B.K.">
          <span className="seal">
            <Image
              src="/portrait-enfance.jpg"
              alt=""
              fill
              priority
              sizes="48px"
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </span>
          <span className="brand-name" translate="no">
            Franck J.H. CHRISTEN H.M.B.K.
          </span>
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <Link key={link.id} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </header>
    </>
  );
}
