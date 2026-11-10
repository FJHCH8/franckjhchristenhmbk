"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARDS = [
  { id: 0, kind: "video" as const, src: "/media/franck.mp4", poster: "/media/franck-poster.jpg" },
  { id: 1, kind: "photo" as const, src: "/media/franck.jpg" },
];

type Pose = { x: number; y: number; r: number };

const REST: Pose[] = [
  { x: 0, y: 0, r: 0 },
  { x: 34, y: 26, r: 7.5 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function Album() {
  const stageRef = useRef<HTMLDivElement>(null);
  const order = useRef([0, 1]);
  const pose = useRef<Pose[]>([
    { x: 0, y: 0, r: 0 },
    { ...REST[1] },
  ]);
  const vel = useRef<Pose[]>([
    { x: 0, y: 0, r: 0 },
    { x: 0, y: 0, r: 0 },
  ]);
  const mode = useRef<"rest" | "drag" | "fly">("rest");
  const pointer = useRef({ id: -1, x: 0, y: 0, lx: 0, ly: 0, lt: 0, vx: 0, vy: 0 });
  const origin = useRef<Pose>({ x: 0, y: 0, r: 0 });
  const raf = useRef(0);
  const last = useRef(0);
  const hovered = useRef(false);
  const releaseRef = useRef<(passed: boolean, vx: number, vy: number) => void>(() => undefined);

  const paint = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const nodes = stage.querySelectorAll<HTMLElement>("[data-card]");
    nodes.forEach((node) => {
      const id = Number(node.dataset.card);
      const depth = order.current.indexOf(id);
      const current = pose.current[id];
      if (!current || depth < 0) return;
      const front = depth === 0;
      node.dataset.depth = String(depth);
      node.style.zIndex = String(front ? 3 : 1);
      node.style.transform = `translate3d(calc(-50% + ${current.x}px), ${current.y}px, ${front ? 40 : -70}px) rotate(${current.r}deg) scale(${front ? 1 : 0.94})`;
    });
  };

  const stop = () => {
    if (!raf.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  };

  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last.current) / 1000 || 0.016);
    last.current = now;
    let moving = false;
    for (let id = 0; id < pose.current.length; id += 1) {
      const depth = order.current.indexOf(id);
      const target = REST[depth] ?? REST[REST.length - 1];
      const current = pose.current[id];
      const speed = vel.current[id];
      if (!current || !target || !speed) continue;
      if (mode.current === "drag" && depth === 0) continue;
      const stiffness = 62;
      const damping = 14;
      speed.x += ((target.x - current.x) * stiffness - speed.x * damping) * dt;
      speed.y += ((target.y - current.y) * stiffness - speed.y * damping) * dt;
      speed.r += ((target.r - current.r) * stiffness - speed.r * damping) * dt;
      current.x += speed.x * dt;
      current.y += speed.y * dt;
      current.r += speed.r * dt;
      const settled =
        Math.abs(target.x - current.x) < 0.4 &&
        Math.abs(target.y - current.y) < 0.4 &&
        Math.abs(target.r - current.r) < 0.15 &&
        Math.hypot(speed.x, speed.y) < 12;
      if (settled) {
        current.x = target.x;
        current.y = target.y;
        current.r = target.r;
        speed.x = 0;
        speed.y = 0;
        speed.r = 0;
      } else {
        moving = true;
      }
    }
    paint();
    if (moving && mode.current === "fly") {
      raf.current = requestAnimationFrame(step);
      return;
    }
    if (mode.current === "fly") mode.current = "rest";
    raf.current = 0;
  };

  const wake = () => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(step);
  };

  const release = (passed: boolean, vx: number, vy: number) => {
    const front = order.current[0] ?? 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (passed) {
      order.current = [...order.current.slice(1), front];
    }
    if (reduce) {
      order.current.forEach((id, depth) => {
        const target = REST[depth];
        const current = pose.current[id];
        if (!target || !current) return;
        current.x = target.x;
        current.y = target.y;
        current.r = target.r;
      });
      vel.current.forEach((speed) => {
        speed.x = 0;
        speed.y = 0;
        speed.r = 0;
      });
      mode.current = "rest";
      stop();
      paint();
      return;
    }
    const speed = vel.current[front];
    if (speed) {
      speed.x = vx;
      speed.y = vy;
      speed.r = clamp(vx / 80, -40, 40);
    }
    mode.current = "fly";
    wake();
  };

  useEffect(() => {
    releaseRef.current = release;
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
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const front = order.current[0] ?? 0;
      const current = pose.current[front];
      if (current) {
        current.x = dir * 28;
        current.r = dir * 6;
      }
      releaseRef.current(true, dir * 980, 40);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stop();
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (mode.current === "fly") return;
    if (event.button !== 0) return;
    const front = order.current[0] ?? 0;
    const node = event.currentTarget;
    if (Number(node.dataset.card) !== front) return;
    node.setPointerCapture(event.pointerId);
    const now = performance.now();
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lx: event.clientX, ly: event.clientY, lt: now, vx: 0, vy: 0 };
    const current = pose.current[front];
    origin.current = current ? { ...current } : { x: 0, y: 0, r: 0 };
    mode.current = "drag";
    stop();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (pointer.current.id !== event.pointerId || mode.current !== "drag") return;
    const now = performance.now();
    const dt = Math.max(8, now - pointer.current.lt);
    const instX = ((event.clientX - pointer.current.lx) / dt) * 1000;
    const instY = ((event.clientY - pointer.current.ly) / dt) * 1000;
    pointer.current.vx = pointer.current.vx * 0.4 + instX * 0.6;
    pointer.current.vy = pointer.current.vy * 0.4 + instY * 0.6;
    pointer.current.lx = event.clientX;
    pointer.current.ly = event.clientY;
    pointer.current.lt = now;
    const front = order.current[0] ?? 0;
    const current = pose.current[front];
    if (!current) return;
    current.x = origin.current.x + (event.clientX - pointer.current.x);
    current.y = origin.current.y + (event.clientY - pointer.current.y);
    current.r = clamp(current.x / 16 + pointer.current.vx / 1400, -22, 22);
    paint();
  };

  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (pointer.current.id !== event.pointerId) return;
    pointer.current.id = -1;
    if (mode.current !== "drag") return;
    const front = order.current[0] ?? 0;
    const current = pose.current[front];
    const dx = current?.x ?? 0;
    const dy = current?.y ?? 0;
    const speed = Math.hypot(pointer.current.vx, pointer.current.vy);
    const passed = Math.abs(dx) > 92 || Math.abs(dy) > 120 || speed > 680;
    release(passed, pointer.current.vx, pointer.current.vy);
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
              <Image
                src={card.src}
                alt="Franck J.H. CHRISTEN H.M.B.K."
                fill
                sizes="340px"
                draggable={false}
              />
            )}
            <span className="album-bubble" aria-hidden="true" />
          </div>
        </article>
      ))}
      <div className="album-nav">
        <button type="button" aria-label="Carte précédente" onClick={() => release(true, -980, 30)}>
          <Chevron dir="left" />
        </button>
        <button type="button" aria-label="Carte suivante" onClick={() => release(true, 980, 30)}>
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
