"use client";

import { useEffect, useRef } from "react";

type Ton = "ame" | "nature";

function Plaque() {
  return (
    <svg className="gemme-plaque" viewBox="0 0 48 58" aria-hidden="true">
      <polygon points="24,2 36,14 40,18 28,5" fill="var(--g4)" />
      <polygon points="36,14 40,18 38,40 32,36" fill="var(--g5)" />
      <polygon points="32,36 38,40 28,54 22,56" fill="var(--g4)" />
      <polygon points="22,2 8,15 22,22" fill="var(--g2)" />
      <polygon points="22,2 36,14 22,22" fill="var(--g1)" />
      <polygon points="8,15 22,22 10,36 22,56" fill="var(--g3)" />
      <polygon points="36,14 22,22 32,36 22,56" fill="var(--g2)" />
      <polygon points="10,36 22,56 32,36" fill="var(--g4)" />
      <polygon points="16,16 26,14 22,30" fill="#fff" opacity="0.72" />
    </svg>
  );
}

export function Gemme({
  tone,
  pose = "repos",
  eclat = false,
  onFace,
}: {
  tone: Ton;
  petit?: boolean;
  pose?: "repos" | "tourne" | "face";
  eclat?: boolean;
  onFace?: () => void;
}) {
  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;

  useEffect(() => {
    if (pose !== "face") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => onFaceRef.current?.(), reduce ? 0 : 720);
    return () => window.clearTimeout(timer);
  }, [pose]);

  const classes = ["gemme", `gemme-${tone}`, pose === "face" ? "is-face" : "", eclat ? "is-liberant" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <span className="gemme-halo" />
      <span className="gemme-face">
        <Plaque />
        <span className="gemme-reflet" />
      </span>
      <span className="gemme-etincelle" />
      <span className="gemme-etincelle gemme-etincelle-b" />
    </span>
  );
}
