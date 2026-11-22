"use client";

import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { useLocale } from "@/components/Locale";
import { texteDavissiv } from "@/lib/davissiv";

type SplitProps = {
  text: string;
  /** "chars" : lettre par lettre (titres). "words" : mot par mot (textes). */
  mode?: "chars" | "words";
  /** Traduit en davissiv quand la langue est choisie, comme <T>. */
  lang?: boolean;
  /**
   * Allume les mots au fil du défilement au lieu de les révéler d'un coup.
   * true : le moteur calcule l'avancée. "css" : un parent fournit --lit.
   */
  lit?: boolean | "css";
  /** Délai de départ, en millisecondes. */
  delay?: number;
  className?: string;
};

const SPACE = /([ \t\n\r]+)/;

/** Petit hasard stable : chaque lettre garde la même vitesse d'un rendu à l'autre. */
function hasard(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Découpe un texte en mots ou en lettres, rendus par React.
 * Le texte lisible reste entier pour les lecteurs d'écran et le copier-coller.
 */
export function Split({ text, mode: modeDemande = "words", lang = false, lit = false, delay = 0, className: classeDemandee }: SplitProps) {
  let mode = modeDemande;
  let className = classeDemandee;
  const { locale } = useLocale();
  const traduit = lang && locale === "davissiv" && texteDavissiv(text) !== text;
  const value = traduit ? texteDavissiv(text) : text;
  // L'écriture Davissis lie ses lettres et pose ses voyelles : on ne coupe pas ses mots en lettres.
  if (traduit) {
    mode = "words";
    className = className ? `${className} davissis` : "davissis";
  }
  const parts = value.split(SPACE).filter(Boolean);
  const classes = ["kt", lit === "css" ? "kt-lit" : "", className ?? ""].filter(Boolean).join(" ");

  if (mode === "chars") {
    const words: { key: number; space: boolean; chars: { char: string; i: number }[] }[] = [];
    let count = 0;
    parts.forEach((part, key) => {
      if (SPACE.test(part)) {
        words.push({ key, space: true, chars: [] });
        return;
      }
      const chars = [...part].map((char, offset) => ({ char, i: count + offset }));
      count += chars.length;
      words.push({ key, space: false, chars });
    });
    return (
      <span
        key={value}
        className={classes}
        data-kt="chars"
        style={{ ["--kt-d" as string]: `${delay}ms`, ["--n" as string]: count } as CSSProperties}
      >
        <span className="kt-sr">{value}</span>
        <span className="kt-vis" aria-hidden="true">
          {words.map((word) =>
            word.space ? (
              <span key={word.key} className="kt-sp">
                {" "}
              </span>
            ) : (
              <span key={word.key} className="kt-w">
                {word.chars.map(({ char, i }) => (
                  <span
                    key={i}
                    className="kt-c"
                    style={{ ["--i" as string]: i, ["--r" as string]: (0.25 + hasard(i) * 0.75).toFixed(3) } as CSSProperties}
                  >
                    {char}
                  </span>
                ))}
              </span>
            ),
          )}
        </span>
      </span>
    );
  }

  const tokens: { key: number; text: string; i: number }[] = [];
  let count = 0;
  parts.forEach((text, key) => {
    if (SPACE.test(text)) tokens.push({ key, text, i: -1 });
    else {
      tokens.push({ key, text, i: count });
      count += 1;
    }
  });
  return (
    <span
      key={value}
      className={classes}
      data-kt="words"
      data-kt-lit={lit === true ? "" : undefined}
      style={{ ["--kt-d" as string]: `${delay}ms`, ["--n" as string]: count } as CSSProperties}
    >
      {tokens.map((token) =>
        token.i < 0 ? (
          token.text
        ) : (
          <span key={token.key} className="kt-w" style={{ ["--i" as string]: token.i } as CSSProperties}>
            {token.text}
          </span>
        ),
      )}
    </span>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Moteur unique : révèle les textes découpés quand ils entrent à l'écran,
 * et allume mot à mot ceux qui suivent le défilement.
 */
export function Kinetic() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    (window as Window & { __kt?: boolean }).__kt = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      root.classList.remove("kt-on");
      return;
    }
    root.classList.add("kt-on");

    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    let lits: HTMLElement[] = [];
    let frame = 0;

    const paintLit = () => {
      frame = 0;
      if (!lits.length) return;
      const view = window.innerHeight;
      const bottom = window.scrollY + view >= document.documentElement.scrollHeight - 4;
      for (const el of lits) {
        const box = el.getBoundingClientRect();
        if (box.bottom < -view || box.top > view * 2) continue;
        const progress = bottom ? 1 : clamp((view * 0.9 - box.top) / (box.height + view * 0.32));
        el.style.setProperty("--lit", progress.toFixed(3));
      }
    };

    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(paintLit);
    };

    const scan = () => {
      document.querySelectorAll("[data-kt]:not(.is-in)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        observer.observe(el);
      });
      lits = [...document.querySelectorAll<HTMLElement>("[data-kt-lit]")];
      wake();
    };

    let pending = 0;
    const later = () => {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        scan();
      });
    };

    // Vitesse du défilement, lissée, posée sur <main> : les titres variables s'y adaptent.
    const host = document.getElementById("contenu");
    let vitesse = 0;
    let dernierY = window.scrollY;
    let dernierT = performance.now();
    let elan = 0;
    const respire = (now: number) => {
      elan = 0;
      const dt = Math.max(1, now - dernierT) / 1000;
      const brute = Math.min(4, Math.abs(window.scrollY - dernierY) / window.innerHeight / dt);
      dernierY = window.scrollY;
      dernierT = now;
      vitesse += (brute - vitesse) * Math.min(1, dt * 7);
      if (vitesse < 0.004) vitesse = 0;
      host?.style.setProperty("--vel", vitesse.toFixed(3));
      if (vitesse > 0 || brute > 0) elan = window.requestAnimationFrame(respire);
    };
    const onVitesse = () => {
      if (!elan) {
        dernierT = performance.now();
        elan = window.requestAnimationFrame(respire);
      }
    };
    window.addEventListener("scroll", onVitesse, { passive: true });

    scan();
    // Ne réagit qu'aux éléments ajoutés : les chiffres du chrono ou de l'altimètre
    // changent sans cesse et ne doivent pas relancer la recherche à chaque image.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && (node.hasAttribute("data-kt") || node.querySelector("[data-kt]"))) {
            later();
            return;
          }
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      if (pending) window.cancelAnimationFrame(pending);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      window.removeEventListener("scroll", onVitesse);
      if (elan) window.cancelAnimationFrame(elan);
    };
  }, [pathname]);

  return null;
}
