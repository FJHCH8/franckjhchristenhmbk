"use client";

import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { Planetarium } from "@/components/Planetarium";
import { VentNordique } from "@/components/VentNordique";
import type { Media, Police, PublicEtoile, StyleTexte } from "@/lib/etoiles/types";
import { SIGNATURE } from "@/lib/etoiles/semence";

function dateFr(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year!, month! - 1, day)),
  );
}

function appareil() {
  const key = "fjch-appareil";
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[A-Za-z0-9_-]{16,80}$/.test(existing)) return existing;
    const next = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(key, next);
    return next;
  } catch {
    return "appareil-navigateur";
  }
}

export function CielProjets({ initial }: { initial: PublicEtoile[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const view = useRef({ ra: 341.6, dec: 19.5 });
  const [open] = useState(1);
  const [etoiles, setEtoiles] = useState(initial);
  const [spots, setSpots] = useState<{ id: string; x: number; y: number }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [born, setBorn] = useState<string | null>(null);
  const [jeton, setJeton] = useState("");
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState({ id: "", titre: "", texte: "", date: "", police: "fraunces" as Police, style: "italic" as StyleTexte, seuil: 0.35, medias: [] as Media[] });

  useEffect(() => {
    const load = () => {
      void fetch("/api/etoiles")
        .then((res) => res.json())
        .then((data: { etoiles?: PublicEtoile[] }) => {
          if (data.etoiles) setEtoiles(data.etoiles);
        })
        .catch(() => undefined);
      void fetch("/api/edition/session")
        .then((res) => res.json())
        .then((data: { ok?: boolean; jeton?: string }) => {
          if (data.ok && data.jeton) setJeton(data.jeton);
        })
        .catch(() => undefined);
    };
    load();
    const onReady = (event: Event) => {
      setJeton((event as CustomEvent<string>).detail);
      setMenu(true);
      load();
    };
    window.addEventListener("fjch-edition-ok", onReady);
    return () => window.removeEventListener("fjch-edition-ok", onReady);
  }, []);

  async function envoyer(path: string, init: RequestInit) {
    const response = await fetch(path, {
      ...init,
      headers: { ...(init.headers || {}), "x-edition-jeton": jeton },
    });
    const data = (await response.json()) as { jeton?: string; erreur?: string; etoile?: PublicEtoile; media?: Media };
    if (data.jeton) setJeton(data.jeton);
    if (!response.ok) throw new Error(data.erreur || "refusé");
    return data;
  }

  async function sauver(event: React.FormEvent) {
    event.preventDefault();
    const body = { ...form, ra: view.current.ra, dec: view.current.dec };
    const data = await envoyer(form.id ? "/api/edition/etoiles" : "/api/edition/etoiles", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (data.etoile) setBorn(data.etoile.id);
    const fresh = await fetch("/api/etoiles").then((res) => res.json()) as { etoiles: PublicEtoile[] };
    setEtoiles(fresh.etoiles);
    setForm({ id: "", titre: "", texte: "", date: "", police: "fraunces", style: "italic", seuil: 0.35, medias: [] });
  }

  const chosen = etoiles.find((item) => item.id === active) ?? null;

  return (
    <div className="sky-stage" ref={stageRef} style={{ ["--open" as string]: String(open) }}>
      <div className="sky-sticky">
        <div className={open > 0.92 ? "sky-frame is-open" : "sky-frame"} data-open={open > 0.92 ? "1" : "0"}>
          <Planetarium etoiles={etoiles} open={open} view={view} onSpots={setSpots} />
          {spots.map((spot) => {
            const etoile = etoiles.find((item) => item.id === spot.id);
            if (!etoile) return null;
            return (
              <button
                key={spot.id}
                type="button"
                className={born === spot.id ? "etoile-hit is-born" : "etoile-hit"}
                style={{ transform: `translate3d(${spot.x}px, ${spot.y}px, 0)` }}
                aria-label={etoile.titre || "Étoile"}
                onClick={() => setActive(spot.id)}
              />
            );
          })}
          {chosen ? (
            <article className="etoile-bulle" role="dialog" aria-label={chosen.titre || "Étoile"}>
              {chosen.texte ? (
                <blockquote className="etoile-texte" data-police={chosen.police} data-style={chosen.style}>
                  {chosen.texte}
                </blockquote>
              ) : null}
              {chosen.id === "endurreisen" ? (
                <>
                  <p className="etoile-titre">Endurreisen</p>
                  <Countdown />
                </>
              ) : chosen.titre ? (
                <p className="etoile-titre">{chosen.titre}</p>
              ) : null}
              {chosen.medias.map((media) =>
                media.kind === "photo" ? (
                  // The file is served by our own checked route.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={media.id} src={`/api/media/${media.id}`} alt="" />
                ) : media.kind === "video" ? (
                  <video key={media.id} src={`/api/media/${media.id}`} controls />
                ) : media.kind === "audio" ? (
                  <audio key={media.id} src={`/api/media/${media.id}`} controls />
                ) : (
                  <a key={media.id} href={`/api/media/${media.id}`}>
                    {media.nom}
                  </a>
                ),
              )}
              <p className="etoile-signature">
                <span>{SIGNATURE}</span>
                {chosen.date ? <time dateTime={chosen.date}>{dateFr(chosen.date)}</time> : null}
              </p>
              <button
                type="button"
                className="coeur"
                onClick={() => {
                  void fetch("/api/etoiles/coeur", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ id: chosen.id, appareil: appareil() }),
                  })
                    .then((res) => res.json())
                    .then((data: { coeurs?: number }) => {
                      if (typeof data.coeurs === "number") {
                        setEtoiles((list) => list.map((item) => (item.id === chosen.id ? { ...item, coeurs: data.coeurs! } : item)));
                      }
                    })
                    .catch(() => undefined);
                }}
              >
                ♥ {chosen.coeurs}
              </button>
              <button type="button" className="etoile-fermer" onClick={() => setActive(null)} aria-label="Fermer">
                Fermer
              </button>
            </article>
          ) : null}
          <p className="sky-credit">
            Étoiles : catalogue HYG. Voie lactée : tuiles Gaia DR3, ESA/Gaia/DPAC, CC BY-NC 3.0 IGO. Figures : d3-celestial, Olaf Frohn. Chevaux : Johannes Hevelius, 1690, domaine public.
          </p>
        </div>
        <ul className="ciel-index">
          {etoiles.map((etoile) => (
            <li key={etoile.id}>
              {etoile.texte ? <blockquote>{etoile.texte}</blockquote> : null}
              {etoile.titre ? <span>{etoile.titre}</span> : null}
              <span>{SIGNATURE}</span>
              {etoile.date ? <time dateTime={etoile.date}>{dateFr(etoile.date)}</time> : null}
            </li>
          ))}
        </ul>
        <VentNordique />
        {jeton && menu ? (
          <form className="edition-menu" onSubmit={(event) => void sauver(event)}>
            <p>Étoiles des projets</p>
            <blockquote className="etoile-texte edition-apercu" data-police={form.police} data-style={form.style}>
              {form.texte || form.titre || "Aperçu"}
            </blockquote>
            <p className="etoile-signature">
              <span>Franck J.H. Christen</span>
            </p>
            <div className="police-choix" role="group" aria-label="Police">
              {(["fraunces", "outfit", "georgia"] as Police[]).map((police) => (
                <button key={police} type="button" data-police={police} aria-pressed={form.police === police} onClick={() => setForm({ ...form, police })}>
                  {police === "fraunces" ? "Fraunces" : police === "outfit" ? "Outfit" : "Georgia"}
                </button>
              ))}
            </div>
            <label>
              Titre
              <input value={form.titre} onChange={(event) => setForm({ ...form, titre: event.target.value })} />
            </label>
            <label>
              Texte
              <textarea value={form.texte} onChange={(event) => setForm({ ...form, texte: event.target.value })} />
            </label>
            <label>
              Date
              <input value={form.date} placeholder="2026-05-26" onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label>
              Style
              <select value={form.style} onChange={(event) => setForm({ ...form, style: event.target.value as StyleTexte })}>
                <option value="italic">Italique</option>
                <option value="normal">Droit</option>
              </select>
            </label>
            <label>
              Apparition au zoom
              <input type="range" min="0" max="1" step="0.05" value={form.seuil} onChange={(event) => setForm({ ...form, seuil: Number(event.target.value) })} />
            </label>
            <label className="fichier-bouton">
              Ajouter un fichier
              <input
                type="file"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const data = new FormData();
                  data.set("fichier", file);
                  void envoyer("/api/edition/fichier", { method: "POST", body: data }).then((result) => {
                    if (result.media) setForm((current) => ({ ...current, medias: [...current.medias, result.media!] }));
                  });
                }}
              />
            </label>
            <button type="submit">Enregistrer</button>
            {etoiles.map((etoile) => (
              <span key={etoile.id} className="edition-ligne">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      id: etoile.id,
                      titre: etoile.titre,
                      texte: etoile.texte,
                      date: etoile.date,
                      police: etoile.police,
                      style: etoile.style,
                      seuil: etoile.seuil,
                      medias: etoile.medias,
                    })
                  }
                >
                  {etoile.titre || "Étoile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void envoyer("/api/edition/etoiles", {
                      method: "DELETE",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ id: etoile.id }),
                    }).then(async () => {
                      const fresh = (await fetch("/api/etoiles").then((res) => res.json())) as { etoiles: PublicEtoile[] };
                      setEtoiles(fresh.etoiles);
                    });
                  }}
                >
                  Supprimer
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                void fetch("/api/edition/sortie", { method: "POST", headers: { "x-edition-jeton": jeton } }).then(() => {
                  setJeton("");
                  setMenu(false);
                });
              }}
            >
              Fermer la session
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
