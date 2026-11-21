"use client";

import { useEffect, useRef } from "react";

export function Gemme({
  pose = "repos",
  eclat = false,
  onFace,
}: {
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

  const classes = ["gemme", pose === "face" ? "is-face" : "", eclat ? "is-liberant" : ""].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <span className="gemme-trait" />
    </span>
  );
}
