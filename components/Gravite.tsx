"use client";

import { useEffect, useRef } from "react";
import { Split } from "@/components/Kinetic";
import { clic } from "@/lib/sons";

const MOT = "POLYMATHE";
const MARQUES = ["infini", "sourire", "parchemin", "eclair", "crochet", "logo-eau", "vent", "bebe-endurreisen"];

type Corps = { body: import("matter-js").Body; kind: "lettre" | "marque"; char?: string; img?: HTMLImageElement; size: number };

/**
 * Les lettres de « Polymathe » et les signes du site tombent, rebondissent et se
 * bousculent. On les attrape et on les lance, à la souris comme au doigt.
 */
export function Gravite() {
  const zoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const canvas = canvasRef.current;
    if (!zone || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stop = () => undefined as void;
    let started = false;

    const demarrer = async () => {
      if (started) return;
      started = true;
      const Matter = await import("matter-js");
      const { Engine, Bodies, Composite, Body, Query, Constraint } = Matter;
      const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
      const world = engine.world;
      let width = zone.clientWidth;
      let height = zone.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fontFamily = getComputedStyle(zone).fontFamily;

      const resize = () => {
        width = zone.clientWidth;
        height = zone.clientHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      };
      resize();

      const mur = 200;
      const murs = [
        Bodies.rectangle(width / 2, height + mur / 2, width * 3, mur, { isStatic: true }),
        Bodies.rectangle(-mur / 2, height / 2, mur, height * 4, { isStatic: true }),
        Bodies.rectangle(width + mur / 2, height / 2, mur, height * 4, { isStatic: true }),
      ];
      Composite.add(world, murs);

      const unite = Math.max(44, Math.min(120, width / 10));
      const corps: Corps[] = [];
      [...MOT].forEach((char, index) => {
        const body = Bodies.rectangle(
          unite * 0.8 + ((index * unite * 1.05) % Math.max(unite, width - unite * 1.6)),
          -unite * (1 + index * 0.6),
          unite * 0.78,
          unite * 0.92,
          { restitution: 0.45, friction: 0.25, frictionAir: 0.012, chamfer: { radius: unite * 0.12 }, angle: (Math.random() - 0.5) * 0.8 },
        );
        corps.push({ body, kind: "lettre", char, size: unite });
      });
      MARQUES.forEach((nom, index) => {
        const img = new Image();
        img.src = `/marks/${nom}.png`;
        const size = unite * 0.85;
        const body = Bodies.circle(
          Math.random() * (width - size * 2) + size,
          -unite * (2 + index * 0.9),
          size / 2,
          { restitution: 0.6, friction: 0.12, frictionAir: 0.01 },
        );
        corps.push({ body, kind: "marque", img, size });
      });
      Composite.add(world, corps.map((item) => item.body));

      // Attraper et lancer, sans bloquer le défilement quand on ne touche rien.
      let prise: import("matter-js").Constraint | null = null;
      const point = (event: PointerEvent) => {
        const box = canvas.getBoundingClientRect();
        return { x: event.clientX - box.left, y: event.clientY - box.top };
      };
      const onDown = (event: PointerEvent) => {
        const p = point(event);
        const hit = Query.point(corps.map((item) => item.body), p)[0];
        if (!hit) return;
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        prise = Constraint.create({ pointA: p, bodyB: hit, pointB: { x: p.x - hit.position.x, y: p.y - hit.position.y }, stiffness: 0.18, damping: 0.08 });
        Composite.add(world, prise);
        zone.classList.add("is-prise");
        clic();
      };
      const onMove = (event: PointerEvent) => {
        if (!prise) {
          const p = point(event);
          const over = Query.point(corps.map((item) => item.body), p).length > 0;
          zone.classList.toggle("is-survol", over);
          return;
        }
        prise.pointA = point(event);
      };
      const onUp = () => {
        if (!prise) return;
        Composite.remove(world, prise);
        prise = null;
        zone.classList.remove("is-prise");
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      // Une secousse quand on clique dans le vide : tout s'envole un peu.
      const onClickVide = (event: MouseEvent) => {
        const box = canvas.getBoundingClientRect();
        const p = { x: event.clientX - box.left, y: event.clientY - box.top };
        if (Query.point(corps.map((item) => item.body), p).length) return;
        for (const item of corps) {
          const dx = item.body.position.x - p.x;
          const dy = item.body.position.y - p.y;
          const d = Math.max(40, Math.hypot(dx, dy));
          const force = (0.06 * item.body.mass) / (d / 120);
          Body.applyForce(item.body, item.body.position, { x: (dx / d) * force, y: (dy / d) * force - 0.02 * item.body.mass });
        }
      };
      canvas.addEventListener("click", onClickVide);

      let frame = 0;
      let last = performance.now();
      let visible = true;
      const draw = (now: number) => {
        frame = 0;
        const dt = Math.min(32, now - last);
        last = now;
        Engine.update(engine, dt);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        for (const item of corps) {
          const { position, angle } = item.body;
          ctx.save();
          ctx.translate(position.x, position.y);
          ctx.rotate(angle);
          if (item.kind === "lettre") {
            ctx.fillStyle = "#f4f7ff";
            ctx.font = `650 ${item.size * 0.92}px ${fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.char ?? "", 0, item.size * 0.04);
          } else if (item.img?.complete && item.img.naturalWidth) {
            const s = item.size;
            const ratio = item.img.naturalWidth / item.img.naturalHeight;
            const w = ratio > 1 ? s : s * ratio;
            const h = ratio > 1 ? s / ratio : s;
            ctx.drawImage(item.img, -w / 2, -h / 2, w, h);
          }
          ctx.restore();
        }
        if (visible && !document.hidden) frame = window.requestAnimationFrame(draw);
      };

      const io = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !frame) {
          last = performance.now();
          frame = window.requestAnimationFrame(draw);
        }
      });
      io.observe(zone);

      const onResize = () => {
        const oldW = width;
        resize();
        Body.setPosition(murs[0]!, { x: width / 2, y: height + mur / 2 });
        Body.setPosition(murs[2]!, { x: width + mur / 2, y: height / 2 });
        if (Math.abs(oldW - width) > 40) {
          for (const item of corps) Body.setPosition(item.body, { x: Math.min(item.body.position.x, width - 40), y: item.body.position.y - 40 });
        }
      };
      window.addEventListener("resize", onResize);

      stop = () => {
        if (frame) window.cancelAnimationFrame(frame);
        io.disconnect();
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("click", onClickVide);
        Engine.clear(engine);
      };
    };

    const veille = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        veille.disconnect();
        if (!reduce) void demarrer();
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    veille.observe(zone);
    return () => {
      veille.disconnect();
      stop();
    };
  }, []);

  return (
    <section className="gravite shell" aria-labelledby="titre-gravite">
      <p className="kicker">
        <Split text="Gravité" mode="chars" />
      </p>
      <h2 className="gravite-titre" id="titre-gravite">
        <Split text="Attrape. Lance." mode="chars" className="kt-x" />
      </h2>
      <div className="gravite-zone" ref={zoneRef}>
        <canvas ref={canvasRef} aria-label="Les lettres de Polymathe et les signes du site, qui tombent et rebondissent." role="img" />
      </div>
    </section>
  );
}
