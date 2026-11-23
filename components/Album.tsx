"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

type Element = { kind: "video" | "photo"; src: string; poster?: string; etiquette: string; cadre?: string };

const ELEMENTS: Element[] = [
  { kind: "video", src: "/media/franck.mp4", poster: "/media/franck-poster.jpg", etiquette: "vidéo" },
  { kind: "photo", src: "/media/franck.jpg", etiquette: "photo", cadre: "50% 30%" },
];

/** Durée d'une photo à l'écran ; une vidéo, elle, dure sa propre longueur. */
const DUREE_PHOTO = 5;

/**
 * L'album comme des « stories » : une photo ou la vidéo en grand, des barres en haut qui se remplissent.
 * Toucher à droite avance, à gauche recule ; laisser le doigt appuyé met en pause ; glisser change aussi.
 */
export function Album() {
  const [index, setIndex] = useState(0);
  const [pause, setPause] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dureeVideo, setDureeVideo] = useState(8);
  const racine = useRef<HTMLDivElement>(null);
  const videos = useRef<Array<HTMLVideoElement | null>>([]);
  const appui = useRef<{ x: number; t: number; long: number } | null>(null);

  const aller = useCallback((pas: number) => {
    setIndex((i) => (i + pas + ELEMENTS.length) % ELEMENTS.length);
  }, []);

  // L'album ne défile que lorsqu'il est à l'écran.
  useEffect(() => {
    const node = racine.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e && e.intersectionRatio > 0.45), { threshold: [0, 0.45, 1] });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // La vidéo en cours joue depuis le début ; les autres attendent.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      v.muted = true;
      if (i === index) {
        if (v.currentTime > 0.2 && !pause) v.currentTime = 0;
        if (visible && !pause) void v.play().catch(() => undefined);
        else v.pause();
      } else v.pause();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, visible]);

  useEffect(() => {
    const v = videos.current[index];
    if (!v) return;
    if (pause || !visible) v.pause();
    else void v.play().catch(() => undefined);
  }, [pause, visible, index]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    appui.current = { x: e.clientX, t: performance.now(), long: window.setTimeout(() => setPause(true), 260) };
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const a = appui.current;
    appui.current = null;
    if (!a) return;
    window.clearTimeout(a.long);
    const dx = e.clientX - a.x;
    const long = performance.now() - a.t > 260;
    setPause(false);
    if (Math.abs(dx) > 40) return aller(dx < 0 ? 1 : -1);
    if (long) return;
    const r = e.currentTarget.getBoundingClientRect();
    aller(e.clientX - r.left > r.width * 0.35 ? 1 : -1);
  };

  const enCours = visible && !pause;
  const duree = ELEMENTS[index]!.kind === "video" ? dureeVideo : DUREE_PHOTO;

  return (
    <div className="stories" ref={racine} role="group" aria-roledescription="album" aria-label="Album de Franck">
      <div className="stories-barres" aria-hidden="true">
        {ELEMENTS.map((_, i) => (
          <span key={i} className="stories-barre">
            <span
              key={i === index ? `actif-${index}` : `b-${i}`}
              className={i < index ? "is-fait" : i === index ? (enCours ? "is-actif" : "is-actif is-pause") : ""}
              style={{ ["--duree" as string]: `${duree}s` } as CSSProperties}
              onAnimationEnd={i === index ? () => aller(1) : undefined}
            />
          </span>
        ))}
      </div>

      <div
        className="stories-scene"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => {
          if (appui.current) window.clearTimeout(appui.current.long);
          appui.current = null;
          setPause(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {ELEMENTS.map((el, i) => (
          <figure key={el.src} className={i === index ? "stories-el is-actif" : "stories-el"} aria-hidden={i !== index}>
            {el.kind === "video" ? (
              <video
                ref={(v) => {
                  videos.current[i] = v;
                }}
                src={el.src}
                poster={el.poster}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  if (Number.isFinite(e.currentTarget.duration)) setDureeVideo(Math.max(3, e.currentTarget.duration));
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={el.src} alt="Franck" style={{ objectPosition: el.cadre }} draggable={false} />
            )}
          </figure>
        ))}
        <div className="stories-voile" aria-hidden="true" />
        <div className="stories-legende">
          <span>{ELEMENTS[index]!.etiquette}</span>
          <span>
            {index + 1} / {ELEMENTS.length}
          </span>
        </div>
        {pause ? <span className="stories-pause" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
