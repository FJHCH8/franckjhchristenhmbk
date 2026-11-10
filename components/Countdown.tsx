"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/paris";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function Flip({ value }: { value: string }) {
  return (
    <span className="flip" aria-hidden="true">
      <span key={value}>{value}</span>
    </span>
  );
}

function Group({ value }: { value: number }) {
  const text = pad(value);
  return (
    <span className="count-group">
      <Flip value={text[0] ?? "0"} />
      <Flip value={text[1] ?? "0"} />
    </span>
  );
}

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    let timer = 0;
    const frame = window.requestAnimationFrame(() => {
      timer = window.setInterval(tick, 250);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const parts = countdownParts(now ?? 0);
  const shown = now === null ? { days: 0, hours: 0, minutes: 0, seconds: 0, fraction: 0, done: false } : parts;

  return (
    <div
      className={now === null ? "count" : "count is-on"}
      style={{ ["--fraction" as string]: String(shown.done ? 0 : shown.fraction) }}
      aria-label={`${pad(shown.days)} ${pad(shown.hours)} ${pad(shown.minutes)} ${pad(shown.seconds)}`}
    >
      <Group value={shown.days} />
      <span className="count-dot" aria-hidden="true" />
      <Group value={shown.hours} />
      <span className="count-dot" aria-hidden="true" />
      <Group value={shown.minutes} />
      <span className="count-dot count-dot-live" aria-hidden="true" />
      <Group value={shown.seconds} />
    </div>
  );
}
