"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

type GlassProps = {
  children: ReactNode;
  className?: string;
};

export function Glass({ children, className }: GlassProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse") return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className={className ? `glass ${className}` : "glass"} onPointerMove={onPointerMove}>
      {children}
    </div>
  );
}
