"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icone, type NomIcone } from "@/components/Icone";
import { clic } from "@/lib/sons";

type Resultat = { titre: string; sous: string; icone: NomIcone; aller: string; mots: string };

/** Ce que la recherche connaît sans rien demander au serveur : les pages, les réglages et les textes du site. */
const FIXES: Resultat[] = [
  { titre: "accueil", sous: "page", icone: "home", aller: "/", mots: "accueil bienvenue polymathe franck christen" },
  { titre: "qui suis-je", sous: "page", icone: "person", aller: "/qui-suis-je", mots: "qui suis-je présentation né 2007 france tthpi surdoué tdah différent album photo vidéo" },
  { titre: "projets", sous: "page", icone: "star", aller: "/projets", mots: "projets citations événements endurreisen l'aube cadran" },
  { titre: "endurreisen", sous: "compte à rebours · projets", icone: "schedule", aller: "/projets", mots: "endurreisen ouverture 1er décembre compte à rebours chrono" },
  { titre: "l'aube", sous: "du 3 décembre au 3 juin · projets", icone: "schedule", aller: "/projets", mots: "aube étapes six mois décembre juin" },
  { titre: "langue", sous: "paramètres", icone: "language", aller: "/?parametres=langue", mots: "langue français bretagne tavissiv aaka traduction" },
  { titre: "contact", sous: "paramètres", icone: "mail", aller: "/?parametres=contact", mots: "contact e-mail mail instagram écrire" },
  { titre: "à propos", sous: "paramètres", icone: "info", aller: "/?parametres=apropos", mots: "à propos site présentation horizon mises à jour" },
  { titre: "système", sous: "Odyssée · paramètres", icone: "phone_iphone", aller: "/?parametres=systeme", mots: "système odyssée version mise à jour interface" },
  { titre: "easter egg", sous: "écrire en Aaka · paramètres", icone: "egg_alt", aller: "/?parametres=oeuf", mots: "easter egg transcripteur aaka tavissiv écriture" },
  { titre: "instagram", sous: "@fjhchristenhmbk", icone: "photo_camera", aller: "https://instagram.com/fjhchristenhmbk", mots: "instagram réseaux suivre" },
];

/** Minuscules et sans accents, pour que « reve » trouve « rêve ». */
function plat(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * La recherche d'Odyssée : une loupe dans la barre du haut ouvre un écran plein, comme les réglages.
 * On tape, les résultats (pages, réglages, citations, projets) arrivent ligne par ligne.
 */
export function Recherche() {
  const [ouvert, setOuvert] = useState(false);
  const [fermant, setFermant] = useState(false);
  const [texte, setTexte] = useState("");
  const [etoiles, setEtoiles] = useState<Resultat[]>([]);
  const champ = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ouvert) return;
    const f = window.setTimeout(() => champ.current?.focus(), 350);
    // Les citations et projets publiés.
    void fetch("/api/etoiles")
      .then((r) => r.json())
      .then((d: { etoiles?: { id: string; titre?: string; texte?: string; genre?: string; date?: string }[] }) => {
        setEtoiles(
          (d.etoiles ?? [])
            .filter((e) => e.id !== "endurreisen")
            .map((e) => {
              const citation = e.genre === "citation" || (!!e.texte && !e.titre);
              return {
                titre: e.titre || `« ${(e.texte ?? "").slice(0, 48)}${(e.texte ?? "").length > 48 ? "…" : ""} »`,
                sous: citation ? "citation" : "projet",
                icone: citation ? "format_quote" : "lightbulb",
                aller: "/projets",
                mots: `${e.titre ?? ""} ${e.texte ?? ""} ${citation ? "citation" : "projet"}`,
              } satisfies Resultat;
            }),
        );
      })
      .catch(() => undefined);
    const lenis = (window as Window & { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", echap);
    return () => {
      window.clearTimeout(f);
      window.removeEventListener("keydown", echap);
      document.documentElement.style.overflow = avant;
      lenis?.start();
    };
  }, [ouvert]);

  const resultats = useMemo(() => {
    const q = plat(texte.trim());
    const tout = [...FIXES, ...etoiles];
    if (!q) return tout.slice(0, 6);
    const mots = q.split(/\s+/);
    return tout.filter((r) => {
      const h = plat(`${r.titre} ${r.sous} ${r.mots}`);
      return mots.every((m) => h.includes(m));
    });
  }, [texte, etoiles]);

  function fermer() {
    setFermant(true);
    window.setTimeout(() => {
      setFermant(false);
      setOuvert(false);
      setTexte("");
    }, 240);
  }

  const aller = (r: Resultat) => {
    clic();
    if (r.aller.startsWith("http")) {
      window.open(r.aller, "_blank", "noopener,noreferrer");
      return;
    }
    fermer();
    window.setTimeout(() => router.push(r.aller), 200);
  };

  return (
    <>
      <button
        type="button"
        className="recherche-ouvrir"
        aria-label="Rechercher"
        onClick={() => {
          clic();
          setOuvert(true);
        }}
      >
        <Icone nom="search" />
      </button>
      {ouvert
        ? createPortal(
            <div className={fermant ? "recherche is-fermant" : "recherche"} role="dialog" aria-modal="true" aria-label="Recherche">
              <div className="recherche-haut">
                <label className="recherche-champ">
                  <Icone nom="search" />
                  <input
                    ref={champ}
                    type="search"
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    placeholder="rechercher"
                    autoComplete="off"
                    enterKeyHint="search"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && resultats[0]) aller(resultats[0]);
                    }}
                  />
                  {texte ? (
                    <button type="button" className="recherche-effacer" aria-label="Effacer" onClick={() => setTexte("")}>
                      <Icone nom="close" />
                    </button>
                  ) : null}
                </label>
                <button type="button" className="recherche-annuler" onClick={fermer}>
                  annuler
                </button>
              </div>
              <div className="recherche-liste" data-lenis-prevent="">
                <p className="recherche-titre">{texte.trim() ? `${resultats.length} résultat${resultats.length > 1 ? "s" : ""}` : "suggestions"}</p>
                {resultats.length ? (
                  <ul key={texte}>
                    {resultats.map((r, i) => (
                      <li key={`${r.titre}-${i}`} style={{ ["--i" as string]: i } as React.CSSProperties}>
                        <button type="button" onClick={() => aller(r)}>
                          <Icone nom={r.icone} />
                          <span>
                            <strong>{r.titre}</strong>
                            <small>{r.sous}</small>
                          </span>
                          <Icone nom="north_west" className="recherche-fleche" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="recherche-rien">Aucun résultat pour « {texte.trim()} ».</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
