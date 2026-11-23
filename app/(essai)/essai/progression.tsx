"use client";

import { LogoProgression } from "@/components/LogoProgression";
import { useProgression } from "./compte";

export function ProgressionEndurreisen() {
  const p = useProgression();
  return (
    <div className="flex items-center gap-5">
      <LogoProgression id="essai-endur" progress={p} className="h-36 w-36 shrink-0" />
      <div>
        <p className="text-6xl font-light tracking-tight">
          {Math.floor(p * 100)}
          <span className="text-2xl text-doux">%</span>
        </p>
        <p className="mt-1 text-sm text-doux">tracé sur ton logo, depuis le dernier point</p>
      </div>
    </div>
  );
}
