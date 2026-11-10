"use client";

import { useEffect, useRef } from "react";

const formatter = new Intl.NumberFormat("fr-FR");

export function Altimeter() {
  const valueRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const value = valueRef.current;
    const dot = dotRef.current;
    if (!value || !dot) return;

    const render = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const altitude = Math.round(2400 - progress * 2100);
      value.textContent = formatter.format(altitude);
      dot.style.translate = `-50% ${progress * 112}px`;
    };

    render();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", render);
    return () => {
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", render);
    };
  }, []);

  return (
    <div className="altimeter" aria-hidden="true">
      <div className="alt-track">
        <span ref={dotRef} className="alt-dot" />
      </div>
      <div className="alt-readout">
        <span className="alt-kicker">
          Altitude
          <br />
          de la page
        </span>
        <span ref={valueRef} className="alt-value">
          2 400
        </span>
      </div>
    </div>
  );
}
