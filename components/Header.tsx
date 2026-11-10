"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
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
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const ready = useRef(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    const place = (animate: boolean) => {
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const navBox = nav.getBoundingClientRect();
      const box = current.getBoundingClientRect();
      pill.style.transitionProperty = animate ? "" : "none";
      pill.style.width = `${box.width}px`;
      pill.style.transform = `translate3d(${box.left - navBox.left}px, 0, 0)`;
      if (!animate) {
        pill.getBoundingClientRect();
        pill.style.transitionProperty = "";
      }
    };

    place(ready.current);
    ready.current = true;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname]);

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
        <nav className="nav" aria-label="Navigation principale" ref={navRef}>
          <span className="nav-pill" ref={pillRef} aria-hidden="true" />
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
