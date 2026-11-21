"use client";

import Image from "next/image";
import { useRef } from "react";

function lightCrest(node: HTMLButtonElement | null) {
  if (!node) return;
  node.classList.add("is-lit");
  const glow = node.querySelector(".crest-glow");
  if (!(glow instanceof HTMLElement)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  glow.classList.remove("is-lighting");
  void glow.offsetWidth;
  glow.classList.add("is-lighting");
  const done = (event: AnimationEvent) => {
    if (event.target !== glow || event.animationName !== "crest-light" && event.animationName !== "crest-light-night") return;
    glow.classList.remove("is-lighting");
    glow.removeEventListener("animationend", done);
  };
  glow.addEventListener("animationend", done);
}

export function Crests({ place = "hero" }: { place?: "hero" | "footer" }) {
  const blasonRef = useRef<HTMLButtonElement>(null);
  const dropsRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={place === "footer" ? "crests crests-footer" : "crests"}>
      <button
        ref={blasonRef}
        type="button"
        className="crest crest-blason"
        aria-label="Blason Christen"
        onClick={() => lightCrest(blasonRef.current)}
      >
        <span className="crest-glow">
          <Image
            className="crest-art"
            src="/blason-line.png"
            alt=""
            width={1500}
            height={1721}
            sizes="120px"
            unoptimized
            priority={place === "hero"}
            draggable={false}
          />
        </span>
      </button>
      <button
        ref={dropsRef}
        type="button"
        className="crest crest-drops"
        aria-label="Logo"
        onClick={() => lightCrest(dropsRef.current)}
      >
        <span className="crest-glow">
          <Image
            className="crest-art"
            src="/logo-gouttes.png"
            alt=""
            width={1428}
            height={1573}
            sizes="150px"
            unoptimized
            priority={place === "hero"}
            draggable={false}
          />
        </span>
      </button>
    </div>
  );
}
