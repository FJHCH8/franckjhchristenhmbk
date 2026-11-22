"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

const SEUIL = 90;
const POINTS = 5;

/**
 * Tirer vers le bas, tout en haut de la page, pour actualiser — façon Windows Phone.
 * Au lieu de recharger tout le site, on demande au serveur s'il y a une nouvelle version :
 * si oui, la page se recharge ; sinon, seul le contenu est rafraîchi, sans écran blanc.
 * Pendant ce temps, les cinq points de Windows filent de gauche à droite.
 */
export function Actualiser() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<"repos" | "tire" | "charge">("repos");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let depart: number | null = null;
    let tirage = 0;
    let occupe = false;

    const placer = (d: number) => {
      node.style.setProperty("--tirage", String(Math.min(1, d / SEUIL)));
    };

    const debut = (e: TouchEvent) => {
      if (occupe || e.touches.length !== 1 || window.scrollY > 2) return;
      if ((e.target as Element | null)?.closest(".album-zone, .jeu-plateau, .roue, input, textarea, [data-sans-actualiser]")) return;
      if (document.documentElement.classList.contains("jeu-ouvert")) return;
      depart = e.touches[0].clientY;
      tirage = 0;
      // Les points se placent juste sous la barre du haut.
      const barre = document.querySelector(".header");
      node.style.top = `${Math.round((barre?.getBoundingClientRect().bottom ?? 60) + 34)}px`;
    };
    const bouge = (e: TouchEvent) => {
      if (depart === null) return;
      const d = e.touches[0].clientY - depart;
      if (d <= 0 || window.scrollY > 2) {
        tirage = 0;
        placer(0);
        setEtat("repos");
        return;
      }
      // Résistance : plus on tire, plus c'est dur.
      tirage = d * 0.55;
      placer(tirage);
      setEtat("tire");
    };
    const fin = async () => {
      if (depart === null) return;
      depart = null;
      if (tirage < SEUIL) {
        placer(0);
        setEtat("repos");
        return;
      }
      occupe = true;
      placer(1);
      setEtat("charge");
      const minimum = new Promise((r) => window.setTimeout(r, 1400));
      try {
        const rep = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await rep.json()) as { version: string };
        if (version && version !== process.env.NEXT_PUBLIC_VERSION) {
          await minimum;
          window.location.reload();
          return;
        }
        router.refresh();
      } catch {
        /* hors ligne : on garde la page telle quelle */
      }
      await minimum;
      placer(0);
      setEtat("repos");
      occupe = false;
    };

    window.addEventListener("touchstart", debut, { passive: true });
    window.addEventListener("touchmove", bouge, { passive: true });
    window.addEventListener("touchend", fin);
    window.addEventListener("touchcancel", fin);
    return () => {
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", bouge);
      window.removeEventListener("touchend", fin);
      window.removeEventListener("touchcancel", fin);
    };
  }, [router]);

  return (
    <div ref={ref} className={`actualiser is-${etat}`} role="status" aria-live="polite" aria-label={etat === "charge" ? "Vérification des mises à jour" : undefined}>
      <div className="actualiser-points" aria-hidden="true">
        {Array.from({ length: POINTS }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
