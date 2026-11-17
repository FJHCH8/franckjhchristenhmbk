"use client";

import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { VentNordique } from "@/components/VentNordique";
import type { GenreEtoile, Media, Police, PublicEtoile, StyleTexte } from "@/lib/etoiles/types";
import { SIGNATURE } from "@/lib/etoiles/semence";

function FermerBouton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="etoile-fermer" onClick={onClick}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      </svg>
      Fermer
    </button>
  );
}

function dateFr(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year!, month! - 1, day)),
  );
}

export function CielProjets({ initial }: { initial: PublicEtoile[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [etoiles, setEtoiles] = useState(initial);
  const [active, setActive] = useState<string | null>(null);
  const [born, setBorn] = useState<string | null>(null);
  const [jeton, setJeton] = useState("");
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState({ id: "", titre: "", texte: "", date: "", police: "fraunces" as Police, style: "italic" as StyleTexte, seuil: 0.35, genre: "projet" as GenreEtoile, medias: [] as Media[] });
  const [section, setSection] = useState<string | null>(null);

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
      credentials: "same-origin",
      headers: { ...(init.headers || {}), "x-edition-jeton": jeton },
    });
    const data = (await response.json()) as { jeton?: string; erreur?: string; etoile?: PublicEtoile; media?: Media };
    if (data.jeton) setJeton(data.jeton);
    if (!response.ok) throw new Error(data.erreur || "refusé");
    return data;
  }

  async function sauver(event: React.FormEvent) {
    event.preventDefault();
    const body = { ...form, ra: 341.6, dec: 19.5 };
    const data = await envoyer(form.id ? "/api/edition/etoiles" : "/api/edition/etoiles", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (data.etoile) setBorn(data.etoile.id);
    const fresh = await fetch("/api/etoiles").then((res) => res.json()) as { etoiles: PublicEtoile[] };
    setEtoiles(fresh.etoiles);
    setForm({ id: "", titre: "", texte: "", date: "", police: "fraunces", style: "italic", seuil: 0.35, genre: "projet", medias: [] });
  }

  const chosen = etoiles.find((item) => item.id === active) ?? null;

  const endur = etoiles.find((etoile) => etoile.id === "endurreisen") ?? null;
  const rang = (etoile: PublicEtoile) => etoile.genre || (etoile.texte && !etoile.titre ? "citation" : "projet");
  const groupes = new Map<string, PublicEtoile[]>();
  for (const etoile of etoiles) {
    if (etoile.id === "endurreisen") continue;
    const cle = rang(etoile);
    groupes.set(cle, [...(groupes.get(cle) ?? []), etoile]);
  }
  const ordre = ["citation", "projet", ...[...groupes.keys()].filter((cle) => cle !== "citation" && cle !== "projet").sort()];
  const nomSection = (cle: string) => (cle === "citation" ? "Citations" : cle === "projet" ? "Projets" : cle.charAt(0).toUpperCase() + cle.slice(1));

  return (
    <div className="sky-stage" ref={stageRef}>
      <div className="voie-boucle" aria-hidden="true">
        <img src="/ciel/voie-lactee.jpg" alt="" />
        <img src="/ciel/voie-lactee.jpg" alt="" />
      </div>
      <section className="endur-haut">
        {endur ? (
          <button type="button" className="etoile-hit is-coeur" aria-label="Endurreisen" onClick={() => setActive(active === endur.id ? null : endur.id)} />
        ) : null}
        <img className="bebe-endur" src="/marks/bebe-endurreisen.png" alt="" draggable={false} />
        <p className="endurreisen" translate="no">Endurreisen</p>
        <Countdown />
      </section>
      <div className="rubriques">
        {ordre.map((cle) => {
          const liste = [...(groupes.get(cle) ?? [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const ouvert = section === cle;
          return (
            <section key={cle} className={ouvert ? "rubrique is-open" : "rubrique"}>
              <h2>
                <button
                  type="button"
                  aria-expanded={ouvert}
                  onClick={() => {
                    setSection(ouvert ? null : cle);
                    setActive(null);
                  }}
                >
                  <span>{nomSection(cle)}</span>
                  <span className="rubrique-meta">
                    <span>{liste.length}</span>
                    <span className="rubrique-chevron" aria-hidden="true" />
                  </span>
                </button>
              </h2>
              <div className="rubrique-corps">
                <div>
                  <ul>
                    {liste.map((etoile, index) => {
                      const montre = active === etoile.id;
                      return (
                        <li key={etoile.id} style={{ ["--i" as string]: index }}>
                          <button
                            type="button"
                            aria-expanded={montre}
                            onClick={(event) => {
                              const next = montre ? null : etoile.id;
                              setActive(next);
                              if (!next) return;
                              const ligne = event.currentTarget.closest("li");
                              const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                              window.setTimeout(() => {
                                ligne?.querySelector(".fiche")?.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
                              }, calme ? 0 : 60);
                            }}
                          >
                            {dateFr(etoile.date) || etoile.titre || "Sans date"}
                          </button>
                          <div className={montre ? "fiche is-open" : "fiche"}>
                            <div>
                              {etoile.titre ? <p className="etoile-titre">{etoile.titre}</p> : null}
                              {etoile.texte ? (
                                <blockquote className="etoile-texte" data-police={etoile.police} data-style={etoile.style}>
                                  {etoile.texte}
                                </blockquote>
                              ) : null}
                              <p className="etoile-signature">
                                <span>{SIGNATURE}</span>
                              </p>
                              <FermerBouton onClick={() => setActive(null)} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>
      {chosen?.id === "endurreisen" ? (
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
              <FermerBouton onClick={() => setActive(null)} />
            </article>
          ) : null}
        <ul className="ciel-index">
          {etoiles.filter((etoile) => etoile.id !== "endurreisen").map((etoile) => (
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
              Type
              <select value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value as GenreEtoile })}>
                <option value="citation">Citation</option>
                <option value="projet">Projet</option>
              </select>
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
            {etoiles.filter((etoile) => etoile.id !== "endurreisen").map((etoile) => (
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
                      genre: etoile.genre ?? "projet",
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
  );
}
