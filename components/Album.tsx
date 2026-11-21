"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARDS = [
  { id: 0, kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg" },
  { id: 1, kind: "photo" as const, src: "/media/franck.jpg" },
];

type Pose = { x: number; y: number; r: number };

const FRONT: Pose = { x: 0, y: 0, r: 0 };
const RIGHT: Pose = { x: 34, y: 26, r: 7.5 };
const LEFT: Pose = { x: -34, y: 26, r: -7.5 };
const SWAP_AT = 64;
const DURATION = 460;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function ease(t: number) {
  const u = clamp(t, 0, 1);
  return 1 - (1 - u) ** 3;
}

export function Album() {
  const stageRef = useRef<HTMLDivElement>(null);
  const order = useRef([0, 1]);
  const pose = useRef<Pose[]>([{ ...FRONT }, { ...RIGHT }]);
  const side = useRef<1 | -1>(1);
  const mode = useRef<"rest" | "drag" | "settle">("rest");
  const leaving = useRef(-1);
  const pending = useRef<number[] | null>(null);
  const anim = useRef<{ start: number; from: Pose[]; to: Pose[] } | null>(null);
  const pointer = useRef({ id: -1, x: 0, y: 0 });
  const origin = useRef<Pose>({ ...FRONT });
  const intent = useRef<"pending" | "drag" | "scroll">("scroll");
  const raf = useRef(0);
  const hovered = useRef(false);
  const goRef = useRef<(dir: -1 | 1) => void>(() => undefined);

  const paint = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const nodes = stage.querySelectorAll<HTMLElement>("[data-card]");
    nodes.forEach((node) => {
      const id = Number(node.dataset.card);
      const depth = order.current.indexOf(id);
      const current = pose.current[id];
      if (!current || depth < 0) return;
      const top = leaving.current === id || (leaving.current < 0 && depth === 0);
      node.dataset.depth = top ? "0" : "1";
      node.style.zIndex = top ? "4" : "1";
      node.style.transition = "none";
      node.style.transform = `translate3d(calc(-50% + ${current.x}px), ${current.y}px, ${top ? 40 : -70}px) rotate(${current.r}deg) scale(${top ? 1 : 0.94})`;
    });
  };

  const stop = () => {
    if (!raf.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  };

  const step = (now: number) => {
    const job = anim.current;
    if (!job || mode.current !== "settle") {
      raf.current = 0;
      return;
    }
    const t = Math.min(1, (now - job.start) / DURATION);
    const e = ease(t);
    job.from.forEach((from, id) => {
      const target = job.to[id];
      const current = pose.current[id];
      if (!target || !current) return;
      current.x = from.x + (target.x - from.x) * e;
      current.y = from.y + (target.y - from.y) * e;
      current.r = from.r + (target.r - from.r) * e;
    });
    paint();
    if (t < 1) {
      raf.current = requestAnimationFrame(step);
      return;
    }
    if (pending.current) order.current = pending.current;
    pending.current = null;
    leaving.current = -1;
    anim.current = null;
    mode.current = "rest";
    raf.current = 0;
    paint();
  };

  const wake = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(step);
  };

  const restBack = (): Pose => (side.current < 0 ? { ...LEFT } : { ...RIGHT });

  const begin = (dir: -1 | 0 | 1) => {
    const front = order.current[0] ?? 0;
    const back = order.current[1] ?? 1;
    const from = pose.current.map((item) => ({ ...item }));
    const to = pose.current.map((item) => ({ ...item }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dir !== 0) {
      side.current = dir < 0 ? -1 : 1;
      to[front] = restBack();
      to[back] = { ...FRONT };
      pending.current = [back, front];
      leaving.current = front;
    } else {
      to[front] = { ...FRONT };
      to[back] = restBack();
      pending.current = null;
      leaving.current = -1;
    }
    if (reduce) {
      to.forEach((item, id) => {
        const current = pose.current[id];
        if (current && item) {
          current.x = item.x;
          current.y = item.y;
          current.r = item.r;
        }
      });
      if (pending.current) order.current = pending.current;
      pending.current = null;
      leaving.current = -1;
      anim.current = null;
      mode.current = "rest";
      stop();
      paint();
      return;
    }
    anim.current = { start: performance.now(), from, to };
    mode.current = "settle";
    wake();
  };

  useEffect(() => {
    goRef.current = (dir) => {
      if (mode.current === "drag") return;
      begin(dir);
    };
  });

  useEffect(() => {
    paint();
    const stage = stageRef.current;
    const videos = stage?.querySelectorAll("video") ?? [];
    videos.forEach((video) => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target;
      if (target instanceof Element && target.closest(".lang, .toggle, input, textarea, select, a")) return;
      const activeHere = stage?.contains(document.activeElement) || hovered.current;
      if (!activeHere || mode.current === "drag") return;
      event.preventDefault();
      goRef.current(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stop();
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const front = order.current[0] ?? 0;
    if (Number(event.currentTarget.dataset.card) !== front) return;
    const current = pose.current[front];
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    origin.current = current ? { ...current } : { ...FRONT };
    intent.current = "pending";
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (pointer.current.id !== event.pointerId) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    if (intent.current === "pending") {
      if (Math.hypot(dx, dy) < 12) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        intent.current = "scroll";
        pointer.current.id = -1;
        return;
      }
      intent.current = "drag";
      mode.current = "drag";
      anim.current = null;
      pending.current = null;
      leaving.current = -1;
      stop();
      const held = order.current[0] ?? 0;
      const heldPose = pose.current[held];
      origin.current = heldPose ? { ...heldPose } : { ...FRONT };
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (intent.current !== "drag") return;
    event.preventDefault();
    const front = order.current[0] ?? 0;
    const current = pose.current[front];
    if (!current) return;
    current.x = origin.current.x + dx;
    current.y = origin.current.y + dy * 0.22;
    current.r = clamp(dx / 26, -8, 8);
    paint();
  };

  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (pointer.current.id !== event.pointerId) return;
    const front = order.current[0] ?? 0;
    const current = pose.current[front];
    pointer.current.id = -1;
    if (intent.current !== "drag" || !current) {
      intent.current = "scroll";
      return;
    }
    intent.current = "scroll";
    const dx = current.x - origin.current.x;
    begin(Math.abs(dx) >= SWAP_AT ? (dx < 0 ? -1 : 1) : 0);
  };

  return (
    <div
      className="album"
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-label="Franck J.H. CHRISTEN H.M.B.K."
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      {CARDS.map((card) => (
        <article
          key={card.id}
          className="album-card"
          data-card={card.id}
          data-depth={card.id === 0 ? 0 : 1}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <div className="album-glass">
            {card.kind === "video" ? (
              <video src={card.src} poster={card.poster} autoPlay muted loop playsInline preload="metadata" />
            ) : (
              <Image src={card.src} alt="Franck J.H. CHRISTEN H.M.B.K." fill sizes="340px" draggable={false} />
            )}
            <span className="album-bubble" aria-hidden="true" />
          </div>
        </article>
      ))}
      <div className="album-nav">
        <button type="button" aria-label="Carte précédente" onClick={() => goRef.current(-1)}>
          <Chevron dir="left" />
        </button>
        <button type="button" aria-label="Carte suivante" onClick={() => goRef.current(1)}>
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
