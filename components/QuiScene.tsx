"use client";

import { useEffect, useRef } from "react";
import { LifeTree } from "@/components/LifeTree";

type Blade = {
  left: number;
  height: number;
  delay: number;
  duration: number;
  lean: number;
  tone: number;
  width: number;
};

function blades(count: number, seed: number): Blade[] {
  return Array.from({ length: count }, (_, index) => {
    const unit = Math.abs(Math.sin(seed + index * 12.9898) * 43758.5453);
    const roll = unit - Math.floor(unit);
    return {
      left: (index / (count - 1)) * 108 - 4,
      height: 42 + roll * 58,
      delay: -((index * 0.17) % 4.2),
      duration: 2.6 + (index % 6) * 0.38,
      lean: (roll - 0.5) * 10,
      tone: index % 4,
      width: 2 + (index % 3),
    };
  });
}

const MID = blades(42, 2.1);
const FRONT = blades(56, 8.4);

function Grass({ items, className }: { items: Blade[]; className: string }) {
  return (
    <div className={className} aria-hidden="true">
      {items.map((blade, index) => (
        <span
          key={index}
          className={`blade tone-${blade.tone}`}
          style={{
            left: `${blade.left}%`,
            height: `${blade.height}%`,
            width: `${blade.width}px`,
            animationDelay: `${blade.delay}s`,
            animationDuration: `${blade.duration}s`,
            ["--lean" as string]: `${blade.lean}deg`,
          }}
        />
      ))}
    </div>
  );
}

export function QuiScene() {
  const runRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const grassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const run = runRef.current;
    const world = worldRef.current;
    const grass = grassRef.current;
    if (!run || !world || !grass) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let current = 0;
    let last = performance.now();

    const measure = () => {
      const total = run.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      const scrolled = Math.min(Math.max(-run.getBoundingClientRect().top, 0), total);
      return scrolled / total;
    };

    const apply = (progress: number) => {
      const tree = 1.14 - progress * 0.52;
      const field = 0.74 + progress * 1.12;
      world.style.transform = `scale(${tree.toFixed(4)})`;
      grass.style.transform = `scale(${field.toFixed(4)})`;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = measure();
      const blend = reduce.matches ? 1 : 1 - Math.exp(-dt / 0.08);
      current += (target - current) * blend;
      if (Math.abs(target - current) < 0.0008) current = target;
      apply(current);
      frame = window.requestAnimationFrame(tick);
    };

    apply(measure());
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="qui-run" ref={runRef} aria-labelledby="titre-qui">
      <div className="qui-stage">
        <h1 id="titre-qui">Qui suis-je</h1>
        <div className="qui-anchor">
          <div className="qui-world" ref={worldRef}>
            <LifeTree />
          </div>
        </div>
        <Grass items={MID} className="qui-grass mid" />
        <div className="qui-grass-zoom" ref={grassRef}>
          <Grass items={FRONT} className="qui-grass front" />
        </div>
      </div>
    </section>
  );
}
