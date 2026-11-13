"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function themeNight() {
  return document.documentElement.dataset.theme === "sombre";
}

export function SkyFilm() {
  const pathname = usePathname();
  const home = pathname === "/";
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const lite = () => root.dataset.power === "lite";
    const away = () => root.dataset.page || document.hidden || !home;

    const sync = () => {
      const night = themeNight();
      const active = night ? nightRef.current : dayRef.current;
      const idle = night ? dayRef.current : nightRef.current;
      dayRef.current?.classList.toggle("is-on", home && !night && !lite());
      nightRef.current?.classList.toggle("is-on", home && night && !lite());
      idle?.pause();
      if (away() || lite() || !active) {
        active?.pause();
        if (!home) root.dataset.film = "";
        else root.dataset.film = "1";
        return;
      }
      root.dataset.film = "1";
      active.play().catch(() => undefined);
    };

    const day = dayRef.current;
    const night = nightRef.current;
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-page", "data-power"] });
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      day?.pause();
      night?.pause();
      if (!home) delete root.dataset.film;
    };
  }, [home]);

  if (!home) return null;

  return (
    <div className="sky-film" aria-hidden="true">
      <picture>
        <img className="sky-still sky-still-jour" src="/sky/jour.avif" alt="" />
      </picture>
      <picture>
        <img className="sky-still sky-still-nuit" src="/sky/nuit.avif" alt="" />
      </picture>
      <video ref={dayRef} className="sky-reel sky-reel-jour" poster="/sky/jour.avif" muted playsInline loop preload="none">
        <source src="/sky/jour.webm" type="video/webm" />
        <source src="/sky/jour.mp4" type="video/mp4" />
      </video>
      <video ref={nightRef} className="sky-reel sky-reel-nuit" poster="/sky/nuit.avif" muted playsInline loop preload="none">
        <source src="/sky/nuit.webm" type="video/webm" />
        <source src="/sky/nuit.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
