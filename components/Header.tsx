"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { T, useLocale } from "@/components/Locale";
import { Logo } from "@/components/Logo";
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
  const navTimer = useRef(0);

  const stamp = useRef(0);

  const onBrand = (event: { button?: number; preventDefault: () => void }) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    const now = performance.now();
    if (now - stamp.current < 35) return;
    stamp.current = now;
    taps.current = [...taps.current.filter((time) => now - time < 2800), now];
    window.clearTimeout(navTimer.current);
    if (taps.current.length >= 8) {
      taps.current = [];
      window.dispatchEvent(new Event("fjch-edition"));
      return;
    }
    // Hors de l'accueil, le premier appui y ramène tout de suite (il n'y a plus de barre en bas).
    if (pathname !== "/" && taps.current.length === 1) {
      router.push("/");
      return;
    }
    navTimer.current = window.setTimeout(() => {
      taps.current = [];
    }, 2800);
  };

  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    const place = (animate: boolean) => {
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const navBox = nav.getBoundingClientRect();
      const box = current.getBoundingClientRect();
      pill.classList.remove("is-gliding");
      pill.style.transitionProperty = animate ? "" : "none";
      pill.style.width = `${box.width}px`;
      pill.style.transform = `translate3d(${box.left - navBox.left}px, 0, 0)`;
      if (animate) {
        pill.getBoundingClientRect();
        pill.classList.add("is-gliding");
      } else {
        pill.getBoundingClientRect();
        pill.style.transitionProperty = "";
      }
    };

    place(ready.current);
    ready.current = true;
    let lastW = nav.getBoundingClientRect().width;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastW) < 0.5) return;
      lastW = width;
      place(false);
    });
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
          onPointerDown={(event) => {
            if (event.button === 0) event.preventDefault();
          }}
          onPointerUp={onBrand}
          onTouchEnd={onBrand}
          onClick={(event) => event.preventDefault()}
        >
          <span className="seal seal-logo">
            <Logo />
          </span>
          <span className="brand-name" translate="no">
            <T>Franck J.H. CHRISTEN H.M.B.K.</T>
          </span>
        </Link>
        <div className="nav-dock">
          <nav className="nav" aria-label="Navigation principale" ref={navRef}>
            <span className="nav-pill" ref={pillRef} aria-hidden="true">
              <span className="nav-pill-face" />
            </span>
            {LINKS.map((link) => (
              <Link key={link.id} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                <T>{link.label}</T>
              </Link>
            ))}
          </nav>
        </div>
        <div className="header-tools">
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}
