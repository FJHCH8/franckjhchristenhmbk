"use client";

import { useEffect, useRef } from "react";
import { Block } from "@/components/Locale";

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

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        render();
      });
    };
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="altimeter" aria-hidden="true">
      <div className="alt-track">
        <span ref={dotRef} className="alt-dot" />
      </div>
      <div className="alt-readout">
        <span className="alt-kicker">
          <Block lines={["6.2em", "5.4em"]}>
            <>
              Altitude
              <br />
              de la page
            </>
          </Block>
        </span>
        <span ref={valueRef} className="alt-value">
          2 400
        </span>
      </div>
    </div>
  );
}
