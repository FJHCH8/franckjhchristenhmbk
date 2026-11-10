"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopBlur } from "@/components/TopBlur";

const LINKS = [
  { href: "#accueil", id: "accueil", label: "Accueil" },
  { href: "#a-propos", id: "a-propos", label: "À propos" },
  { href: "#contact", id: "contact", label: "Contact" },
];

export function Header() {
  const [active, setActive] = useState("accueil");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = window.scrollY + 140;
      let current = "accueil";
      for (const link of LINKS) {
        const section = document.getElementById(link.id);
        if (section && section.offsetTop <= marker) current = link.id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <TopBlur />
      <header className="header">
      <a className="brand" href="#accueil" aria-label="Franck J.H. CHRISTEN H.M.B.K.">
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
      </a>
      <nav className="nav" aria-label="Navigation principale">
        {LINKS.map((link) => (
          <a key={link.id} href={link.href} aria-current={active === link.id ? "true" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
      <ThemeToggle />
      </header>
    </>
  );
}
