"use client";

import { useEffect, useState } from "react";

const KEY = "fjch-vent";
const LEVEL = 0.07;

function noise(ctx: AudioContext, seconds: number, brown: boolean) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.4;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
  }
  return buffer;
}

function ramp(gain: GainNode, ctx: AudioContext, value: number, seconds: number) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, value), now + seconds);
}

export function VentNordique() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    let want = true;
    try {
      want = localStorage.getItem(KEY) !== "0";
    } catch {
      want = true;
    }
    const paint = requestAnimationFrame(() => setOn(want));
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const gust = ctx.createGain();
    gust.gain.value = 0.35;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 320;
    const lowPan = ctx.createStereoPanner();
    const brown = ctx.createBufferSource();
    brown.buffer = noise(ctx, 4, true);
    brown.loop = true;
    brown.connect(low);
    low.connect(gust);
    gust.connect(lowPan);
    lowPan.connect(master);
    brown.start();

    const breath = ctx.createGain();
    breath.gain.value = 0.22;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.7;
    const highPan = ctx.createStereoPanner();
    const pink = ctx.createBufferSource();
    pink.buffer = noise(ctx, 5, false);
    pink.loop = true;
    pink.connect(band);
    band.connect(breath);
    breath.connect(highPan);
    highPan.connect(master);
    pink.start();

    let alive = true;
    let started = false;
    const timers: number[] = [];
    const modulate = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      band.frequency.setTargetAtTime(700 + Math.random() * 1400, now, 1.4);
      low.frequency.setTargetAtTime(180 + Math.random() * 280, now, 1.8);
      lowPan.pan.setTargetAtTime(Math.random() * 1.2 - 0.6, now, 2);
      highPan.pan.setTargetAtTime(Math.random() * 1.2 - 0.6, now, 2.2);
      const gustPeak = 0.18 + Math.random() * 0.55;
      gust.gain.setTargetAtTime(gustPeak, now, 0.8);
      timers.push(window.setTimeout(() => gust.gain.setTargetAtTime(0.16 + Math.random() * 0.2, ctx.currentTime, 1.4), 1600 + Math.random() * 2200));
      timers.push(window.setTimeout(modulate, 2800 + Math.random() * 3400));
    };
    const whistle = () => {
      if (!alive) return;
      timers.push(window.setTimeout(whistle, 9000 + Math.random() * 11000));
      if (!want || ctx.state !== "running") return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.frequency.value = 2600 + Math.random() * 1600;
      filter.type = "bandpass";
      filter.frequency.value = osc.frequency.value;
      filter.Q.value = 8;
      gain.gain.value = 0.0001;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      const now = ctx.currentTime;
      gain.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.01, now + 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, now + 1.1 + Math.random());
      osc.start(now);
      osc.stop(now + 1.6);
    };
    modulate();
    whistle();

    const begin = () => {
      if (!want || started) return;
      started = true;
      void ctx.resume().then(() => {
        if (want) ramp(master, ctx, LEVEL, 4);
      });
    };
    void ctx.resume().then(() => {
      if (ctx.state === "running") begin();
    });
    const types = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"] as const;
    const gesture = () => begin();
    if (want) {
      for (const type of types) window.addEventListener(type, gesture, { capture: true, passive: true });
    }
    const onHide = () => {
      if (document.hidden) {
        ramp(master, ctx, 0.0001, 0.8);
        timers.push(window.setTimeout(() => {
          if (document.hidden) void ctx.suspend();
        }, 900));
      } else if (want) {
        started = true;
        void ctx.resume().then(() => ramp(master, ctx, LEVEL, 2.5));
      }
    };
    document.addEventListener("visibilitychange", onHide);
    const onToggle = (event: Event) => {
      want = (event as CustomEvent<boolean>).detail;
      setOn(want);
      if (want) {
        started = true;
        void ctx.resume().then(() => ramp(master, ctx, LEVEL, 2.5));
      } else ramp(master, ctx, 0.0001, 0.8);
    };
    window.addEventListener("fjch-vent", onToggle);

    return () => {
      alive = false;
      cancelAnimationFrame(paint);
      for (const type of types) window.removeEventListener(type, gesture, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("fjch-vent", onToggle);
      for (const timer of timers) window.clearTimeout(timer);
      ramp(master, ctx, 0.0001, 0.6);
      window.setTimeout(() => void ctx.close(), 700);
    };
  }, []);

  return (
    <button
      type="button"
      className="vent-toggle"
      aria-pressed={!on}
      aria-label={on ? "Couper le vent" : "Activer le vent"}
      onClick={() => {
        const next = !on;
        try {
          localStorage.setItem(KEY, next ? "1" : "0");
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("fjch-vent", { detail: next }));
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h7a2 2 0 1 0-2-2M4 12h11a2 2 0 1 1-2 2M4 15h6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {on ? null : <path d="M5 5l14 14" fill="none" stroke="currentColor" strokeWidth="1.2" />}
      </svg>
    </button>
  );
}
