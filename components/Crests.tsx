"use client";

import Image from "next/image";
import { useRef } from "react";

function lightCrest(node: HTMLButtonElement | null) {
  if (!node) return;
  node.classList.add("is-lit");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  node.classList.remove("is-lighting");
  void node.offsetWidth;
  node.classList.add("is-lighting");
}

export function Crests() {
  const blasonRef = useRef<HTMLButtonElement>(null);
  const dropsRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="crests">
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
            priority
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
            priority
            draggable={false}
          />
        </span>
      </button>
    </div>
  );
}
