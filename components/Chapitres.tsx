"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Split } from "@/components/Kinetic";
import { createImageGl, type ImageGl } from "@/lib/imageGl";

type Chapitre = {
  id: string;
  titre: string;
  href: string;
  texte: string;
  image: { src: string; srcSet?: string; focus: string };
};

const fond = (name: string) => ({
  src: `/fond/${name}-1280.webp`,
  srcSet: `/fond/${name}-640.webp 640w, /fond/${name}-960.webp 960w, /fond/${name}-1280.webp 1280w, /fond/${name}-1500.webp 1500w`,
});

export const CHAPITRES: Chapitre[] = [
  {
    id: "qui",
    titre: "Qui suis-je",
    href: "/qui-suis-je",
    texte: "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K. Je suis né en 2007 en France.",
    image: { src: "/media/franck.jpg", focus: "50% 38%" },
  },
  {
    id: "apropos",
    titre: "À propos",
    href: "/a-propos",
    texte: "Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.",
    image: { ...fond("judo"), focus: "50% 26%" },
  },
  {
    id: "contact",
    titre: "Contact",
    href: "/contact",
    texte: "franckjhchristen@gmail.com — Instagram : @fjhchristenhmbk",
    image: { ...fond("avion"), focus: "68% 42%" },
  },
  {
    id: "projets",
    titre: "Projets",
    href: "/projets",
    texte: "Citations et projets. Endurreisen.",
    image: { ...fond("rose"), focus: "46% 34%" },
  },
];

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function focusDe(value: string): [number, number] {
  const [x = "50%", y = "50%"] = value.split(/\s+/);
  return [parseFloat(x) / 100, parseFloat(y) / 100];
}

type Scene = {
  track: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement | null;
  img: HTMLImageElement | null;
  focus: [number, number];
  gl: ImageGl | null;
  visible: boolean;
  p: number;
  mouse: { x: number; y: number; tx: number; ty: number; hover: number; target: number };
};

/**
 * Récit au défilement de l'accueil : chaque chapitre se fige à l'écran, la photo
 * s'ouvre de droite à gauche derrière un bord liquide, le mot traverse la page
 * avec sa profondeur de champ, la phrase s'allume, puis le lien arrive.
 */
export function Chapitres() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lite = document.documentElement.dataset.power === "lite";
    const scenes: Scene[] = [...root.querySelectorAll<HTMLElement>("[data-chap]")].map((track) => ({
      track,
      stage: track.querySelector<HTMLElement>(".chap-scene")!,
      canvas: track.querySelector<HTMLCanvasElement>(".chap-gl"),
      img: track.querySelector<HTMLImageElement>(".chap-photo img"),
      focus: focusDe(track.dataset.focus ?? "50% 50%"),
      gl: null,
      visible: false,
      p: 0,
      mouse: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, hover: 0, target: 0 },
    }));

    let frame = 0;
    let last = performance.now();
    let time = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    const sizeGl = (scene: Scene) => {
      if (!scene.gl || !scene.canvas) return;
      const box = scene.stage.getBoundingClientRect();
      scene.gl.resize(box.width, box.height, Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5));
    };

    const startGl = (scene: Scene) => {
      if (scene.gl || !scene.canvas || !scene.img || motion.matches) return;
      const go = () => {
        if (scene.gl || !scene.canvas || !scene.img) return;
        const gl = createImageGl(scene.canvas, scene.img, scene.focus);
        if (!gl) return;
        scene.gl = gl;
        scene.track.classList.add("is-gl");
        sizeGl(scene);
      };
      if (scene.img.complete && scene.img.naturalWidth) go();
      else scene.img.addEventListener("load", go, { once: true });
    };

    const paint = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      const view = window.innerHeight;
      const y = window.scrollY;
      const raw = (y - lastY) / Math.max(1, view) / Math.max(dt, 1 / 120);
      lastY = y;
      velocity += (Math.max(-3, Math.min(3, raw)) - velocity) * Math.min(1, dt * 6);

      let alive = Math.abs(velocity) > 0.002;
      for (const scene of scenes) {
        if (motion.matches) {
          scene.track.style.setProperty("--p", "0.62");
          continue;
        }
        const box = scene.track.getBoundingClientRect();
        scene.visible = box.bottom > -view * 0.2 && box.top < view * 1.2;
        if (!scene.visible) continue;
        const travel = Math.max(1, box.height - view);
        scene.p = clamp(-box.top / travel);
        scene.track.style.setProperty("--p", scene.p.toFixed(4));
        startGl(scene);
        if (scene.gl) {
          const m = scene.mouse;
          m.x += (m.tx - m.x) * Math.min(1, dt * 8);
          m.y += (m.ty - m.y) * Math.min(1, dt * 8);
          m.hover += (m.target - m.hover) * Math.min(1, dt * 4);
          const e = clamp(scene.p * 2.3);
          scene.gl.render({
            reveal: e * (2 - e),
            velocity,
            time,
            zoom: 1 + (1 - e * (2 - e)) * 0.22,
            mouseX: m.x,
            mouseY: m.y,
            hover: m.hover,
          });
          alive = true;
        }
      }
      if (alive && !document.hidden) frame = window.requestAnimationFrame(paint);
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = window.requestAnimationFrame(paint);
    };

    const onPointer = (event: PointerEvent) => {
      for (const scene of scenes) {
        if (!scene.visible || !scene.gl) continue;
        const box = scene.stage.getBoundingClientRect();
        const inside = event.clientY >= box.top && event.clientY <= box.bottom;
        scene.mouse.target = inside ? 1 : 0;
        scene.mouse.tx = (event.clientX - box.left) / Math.max(1, box.width);
        scene.mouse.ty = 1 - (event.clientY - box.top) / Math.max(1, box.height);
      }
      wake();
    };

    const onResize = () => {
      scenes.forEach(sizeGl);
      wake();
    };

    paint(performance.now());
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    motion.addEventListener("change", wake);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      motion.removeEventListener("change", wake);
      scenes.forEach((scene) => scene.gl?.dispose());
    };
  }, []);

  return (
    <div className="chapitres" ref={rootRef} aria-label="Chapitres du site">
      {CHAPITRES.map((chapitre, index) => (
        <section
          key={chapitre.id}
          className={`chap chap-${chapitre.id}`}
          data-chap=""
          data-focus={chapitre.image.focus}
          aria-labelledby={`chap-${chapitre.id}`}
          style={{ ["--sens" as string]: index % 2 ? -1 : 1 } as CSSProperties}
        >
          <div className="chap-scene">
            <figure className="chap-photo">
              {/* Images déjà servies telles quelles depuis /public. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chapitre.image.src}
                srcSet={chapitre.image.srcSet}
                sizes="100vw"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ objectPosition: chapitre.image.focus }}
              />
              <canvas className="chap-gl" aria-hidden="true" />
            </figure>
            <p className="chap-numero" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className="chap-numero-trait" />
              <span>{String(CHAPITRES.length).padStart(2, "0")}</span>
            </p>
            <h2 className="chap-mot" id={`chap-${chapitre.id}`}>
              <Split text={chapitre.titre} mode="chars" lang className="kt-x" />
            </h2>
            <div className="chap-pied">
              <p className="chap-texte">
                <Split text={chapitre.texte} lit="css" />
              </p>
              <Link className="chap-lien" href={chapitre.href} aria-label={`Entrer : ${chapitre.titre}`} data-glow="">
                <span>Entrer</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
