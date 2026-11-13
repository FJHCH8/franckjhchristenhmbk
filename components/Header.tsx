"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { T, useLocale } from "@/components/Locale";
import { TopBlur } from "@/components/TopBlur";

const LINKS = [
  { href: "/", id: "accueil", label: "Accueil" },
  { href: "/qui-suis-je", id: "qui-suis-je", label: "Qui suis-je" },
  { href: "/a-propos", id: "a-propos", label: "À propos" },
  { href: "/contact", id: "contact", label: "Contact" },
  { href: "/projets", id: "projets", label: "Projets" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const ready = useRef(false);
  const taps = useRef<number[]>([]);

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
  }, [pathname, locale]);

  return (
    <>
      <TopBlur />
      <header className="header">
        <Link
          className="brand"
          href="/"
          aria-label="Franck J.H. CHRISTEN H.M.B.K."
          onClick={(event) => {
            const now = performance.now();
            taps.current = [...taps.current.filter((time) => now - time < 2800), now];
            if (taps.current.length >= 8) {
              event.preventDefault();
              taps.current = [];
              window.dispatchEvent(new Event("fjch-edition"));
              return;
            }
            if (pathname === "/") {
              event.preventDefault();
              return;
            }
            event.preventDefault();
            router.push("/");
          }}
        >
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
              <T>{link.label}</T>
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}
