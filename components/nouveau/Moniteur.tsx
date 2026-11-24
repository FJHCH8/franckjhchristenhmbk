"use client";

/**
 * Le lecteur d'Explorer : un « cardiogramosciloscope ».
 * L'aiguille reste au centre ; dessous défilent l'onde et la réglette graduée.
 * L'onde mêle un cardiogramme (battements qui ne s'arrêtent jamais) et un oscilloscope :
 * la voix de l'enregistrement fait grandir les battements et vibrer la trace lumineuse.
 * Les 9 étoiles de la constellation de Franck sont posées sur la réglette et s'allument
 * en passant sous l'aiguille ; la petite constellation à côté du bouton se trace au même rythme.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as PE } from "react";
import { LIGNE, RONDS } from "@/components/Logo";
import { PAR_SECONDE } from "@/lib/ondes";

const FENETRE = 6; // secondes visibles sur l'écran
const PX_REGLE = 14; // pixels par seconde sur la réglette
const BATTEMENT = 0.82; // secondes entre deux battements

const g = (p: number, c: number, l: number) => Math.exp(-(((p - c) / l) ** 2));
/** Un battement de cœur : onde P, complexe QRS, onde T. */
const ecg = (p: number) => 0.14 * g(p, 0.12, 0.05) - 0.18 * g(p, 0.26, 0.025) + g(p, 0.3, 0.03) - 0.3 * g(p, 0.34, 0.025) + 0.32 * g(p, 0.55, 0.07);

function niveau(onde: Float32Array, tau: number) {
  const i = tau * PAR_SECONDE;
  const a = Math.floor(i);
  if (a < 0 || a >= onde.length - 1) return 0;
  const f = i - a;
  return onde[a]! * (1 - f) + onde[a + 1]! * f;
}

export const minutes = (s: number, dixiemes = false) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return dixiemes ? `${m}.${Math.floor((s * 10) % 10)}` : m;
};

export function Moniteur({
  onde,
  t,
  duree,
  lit,
  basculer,
  aller,
}: {
  onde: Float32Array;
  t: number;
  duree: number;
  lit: boolean;
  basculer: () => void;
  aller: (s: number) => void;
}) {
  const ecran = useRef<HTMLCanvasElement>(null);
  const [largeur, setLargeur] = useState(0);
  const glisse = useRef<{ x: number; t: number; pps: number } | null>(null);
  const d = duree || onde.length / PAR_SECONDE;
  const p = d ? Math.min(1, t / d) : 0;
  const allumees = RONDS.filter(([, , r]) => r <= p + 1e-6).length;

  useEffect(() => {
    const c = ecran.current;
    if (!c) return;
    const ro = new ResizeObserver(([e]) => setLargeur(Math.round(e!.contentRect.width)));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = ecran.current;
    if (!c || !largeur) return;
    const H = 96;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== largeur * dpr) {
      c.width = largeur * dpr;
      c.height = H * dpr;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largeur, H);
    const pps = largeur / FENETRE;
    const mid = largeur / 2;
    const y0 = H / 2 + 8;
    const pts: number[] = [];
    for (let x = 0; x <= largeur; x += 1) {
      const tau = t + (x - mid) / pps;
      const dedans = tau >= 0 && tau <= d;
      const a = dedans ? niveau(onde, tau) : 0;
      const amp = dedans ? 0.08 + 0.92 * a : 0.03;
      const porteuse = Math.sin(2 * Math.PI * 7.3 * tau) * 0.35 + Math.sin(2 * Math.PI * 13.1 * tau) * 0.15;
      const ph = (((tau / BATTEMENT) % 1) + 1) % 1;
      pts.push(y0 - (ecg(ph) * 0.85 + porteuse * a) * amp * H * 0.44);
    }
    const trait = (de: number, a: number) => {
      ctx.beginPath();
      for (let x = de; x <= a; x++) (x === de ? ctx.moveTo : ctx.lineTo).call(ctx, x, pts[x]!);
    };
    const m = Math.round(mid);
    // à venir : sombre
    trait(m, largeur);
    ctx.strokeStyle = "#24465c";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    // passé : phosphore (traînée large et douce, puis trace vive)
    trait(0, m);
    const fondu = ctx.createLinearGradient(0, 0, mid, 0);
    fondu.addColorStop(0, "rgba(111,189,245,0.05)");
    fondu.addColorStop(1, "rgba(111,189,245,0.35)");
    ctx.strokeStyle = fondu;
    ctx.lineWidth = 5;
    ctx.stroke();
    const vif = ctx.createLinearGradient(0, 0, mid, 0);
    vif.addColorStop(0, "rgba(143,208,255,0.25)");
    vif.addColorStop(1, "#e8f6ff");
    ctx.strokeStyle = vif;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#6fbdf5";
    ctx.shadowBlur = 8;
    ctx.stroke();
    // le point qui écrit
    ctx.beginPath();
    ctx.arc(mid, pts[m]!, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [t, largeur, onde, d]);

  const debut = (e: PE<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { x: e.clientX, t, pps: Number(e.currentTarget.dataset.pps) || 50 };
  };
  const bouge = (e: PE<HTMLElement>) => {
    const g0 = glisse.current;
    if (!g0) return;
    aller(Math.max(0, Math.min(d, g0.t - (e.clientX - g0.x) / g0.pps)));
  };
  const fin = () => (glisse.current = null);

  const ticks = [];
  for (let s = 0; s <= Math.floor(d); s++) {
    const cls = s % 10 === 0 ? "dix" : s % 5 === 0 ? "cinq" : "";
    ticks.push(
      <i key={s} className={`${cls}${s <= t ? " passe" : ""}`} style={{ left: s * PX_REGLE }}>
        {s % 10 === 0 ? <b>{minutes(s)}</b> : null}
      </i>,
    );
  }

  return (
    <div className={`n-moniteur${lit ? " lit" : ""}`}>
      <div className="n-moniteur-ecran" data-pps={largeur / FENETRE || 50} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin}>
        <canvas ref={ecran} aria-hidden="true" />
        <span className="n-moniteur-aiguille" />
        <span className="n-moniteur-hud">
          <small>
            <i className="rec" /> REC · {minutes(t, true)}
          </small>
          <small>{minutes(d)}</small>
        </span>
      </div>
      <div
        className="n-moniteur-regle"
        role="slider"
        tabIndex={0}
        aria-label="Avancer dans l’enregistrement"
        aria-valuemin={0}
        aria-valuemax={Math.round(d)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={`${minutes(t)} / ${minutes(d)}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") aller(Math.min(d, t + 5));
          else if (e.key === "ArrowLeft") aller(Math.max(0, t - 5));
        }}
        data-pps={PX_REGLE}
        onPointerDown={debut}
        onPointerMove={bouge}
        onPointerUp={fin}
        onPointerCancel={fin}
      >
        <div className="n-moniteur-piste" style={{ transform: `translateX(${-t * PX_REGLE}px)`, width: d * PX_REGLE } as CSSProperties}>
          {ticks}
          {RONDS.map(([, , r], k) => (
            <em key={k} className={r <= p + 1e-6 ? "on" : ""} style={{ left: r * d * PX_REGLE }} />
          ))}
        </div>
        <span className="n-moniteur-aig2" />
      </div>
      <div className="n-moniteur-bas">
        <button type="button" className="n-lecteur-btn" onClick={basculer} aria-label={lit ? "Pause" : "Écouter"}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            {lit ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4.5v15l12.5-7.5z" />}
          </svg>
        </button>
        <svg className="n-moniteur-constel" viewBox="0 0 200 200" aria-hidden="true">
          <path d={LIGNE} pathLength={1} className="fond" />
          <path d={LIGNE} pathLength={1} className="trace" style={{ strokeDashoffset: 1 - p }} />
          {RONDS.map(([x, y, r], k) => (
            <circle key={k} cx={x} cy={y} r={r <= p + 1e-6 ? 9 : 7} className={r <= p + 1e-6 ? "on" : ""} />
          ))}
        </svg>
        <span className="n-moniteur-etoile">
          <span>ÉTOILE</span> {String(allumees).padStart(2, "0")} / 09
        </span>
      </div>
    </div>
  );
}
