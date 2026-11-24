"use client";

/**
 * Fichiers : le gestionnaire de fichiers du téléphone, façon CyanogenMod File Manager (cm-10.1, Android 4.2,
 * Holo clair, licence Apache 2.0 ; AOSP Jelly Bean n'a pas de gestionnaire de fichiers).
 * Le stockage est factice mais cohérent avec le reste du téléphone : la photo et la vidéo de l'Album
 * dans DCIM/Camera, le seul titre de l'appli Musique dans Music, aucun enregistrement dans Recordings.
 * Ouvrir le .mp3 lance Musique ; ouvrir une photo ou la vidéo ouvre l'Album.
 * Sons : uniquement les effets AOSP du téléphone (Effect_Tick, KeypressDelete via data-son).
 */
import { useState } from "react";
import { useRetour } from "./OdysseeOS";
import { creerStore } from "./session";
import { Dlg, toast } from "./Systeme";
import { ouvrirAppli } from "./Memoire";
import { POCHETTE_MINI, TITRE } from "./Musique";

const A = "/aakanos/aosp";

export function IconeFichiers({ taille = 56 }: { taille?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="os-icone" src={`${A}/cmfm-ic_launcher.svg`} width={taille} height={taille} alt="" draggable={false} style={{ objectFit: "contain" }} />;
}

type Element_ = { nom: string; type: "dossier" | "audio" | "image" | "video"; date: string; octets?: number; enfants?: Element_[]; ouvrir?: () => void };

const D = (nom: string, date: string, enfants: Element_[] = []): Element_ => ({ nom, type: "dossier", date, enfants });
const RACINE: Element_ = D("sdcard0", "24/11/2026 09:12", [
  D("Alarms", "12/07/2012 10:00"),
  D("Android", "12/07/2012 10:00", [D("data", "24/11/2026 09:12")]),
  D("DCIM", "24/11/2026 09:41", [
    D("Camera", "24/11/2026 09:45", [
      { nom: "IMG_20261124_094112.jpg", type: "image", date: "24/11/2026 09:41", octets: 139_401, ouvrir: () => ouvrirAppli("album") },
      { nom: "VID_20261124_094530.mp4", type: "video", date: "24/11/2026 09:45", octets: 324_684, ouvrir: () => ouvrirAppli("album") },
    ]),
  ]),
  D("Download", "12/07/2012 10:00"),
  D("Movies", "12/07/2012 10:00"),
  D("Music", "24/11/2026 19:03", [
    D("Belyyeloshadi Orchestra", "24/11/2026 19:03", [
      { nom: `${TITRE.titre}.mp3`, type: "audio", date: "24/11/2026 19:03", octets: TITRE.octets, ouvrir: () => ouvrirAppli("musique", "jouer") },
    ]),
  ]),
  D("Notifications", "12/07/2012 10:00"),
  D("Pictures", "12/07/2012 10:00", [D("Screenshots", "12/07/2012 10:00")]),
  D("Podcasts", "12/07/2012 10:00"),
  D("Recordings", "12/07/2012 10:00"),
  D("Ringtones", "12/07/2012 10:00"),
]);
const RAC = "/storage/sdcard0";

const memoireFichiers = creerStore<{ chemin: string[]; historique: string[] }>("fichiers", { chemin: [], historique: [] });

function trouver(chemin: string[]): Element_ {
  let e = RACINE;
  for (const n of chemin) e = e.enfants?.find((x) => x.nom === n) ?? e;
  return e;
}
function total(e: Element_): number {
  return e.octets ?? (e.enfants ?? []).reduce((s, x) => s + total(x), 0);
}
const taille = (o: number) => (o >= 1_000_000 ? `${(o / 1_048_576).toFixed(2).replace(".", ",")} Mo` : o >= 1000 ? `${(o / 1024).toFixed(2).replace(".", ",")} Ko` : `${o} o`);

// la capacité du stockage interne d'un téléphone de 2012 (« 16 Go »), presque vide
const CAPACITE = 12_884_901_888;
const SYSTEME = 1_932_735_283;

function Ic({ n, t = 48 }: { n: string; t?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${A}/${n}.svg`} width={t} height={t} alt="" draggable={false} />;
}

export function AppFichiers() {
  const { chemin, historique } = memoireFichiers.useValeur();
  const [dlg, setDlg] = useState<null | "historique" | "favoris" | "infos">(null);
  const aller = (c: string[]) =>
    memoireFichiers.ecrire((m) => ({ chemin: c, historique: [RAC + (c.length ? "/" + c.join("/") : ""), ...m.historique.filter((h) => h !== RAC + (c.length ? "/" + c.join("/") : ""))].slice(0, 12) }));
  useRetour(chemin.length > 0 || dlg !== null, () => (dlg ? setDlg(null) : aller(chemin.slice(0, -1))));
  const dossier = trouver(chemin);
  const liste = [...(dossier.enfants ?? [])].sort((a, b) => (a.type === "dossier") === (b.type === "dossier") ? a.nom.localeCompare(b.nom) : a.type === "dossier" ? -1 : 1);
  const occupe = SYSTEME + total(RACINE);
  const versChemin = (p: string) => p.replace(RAC, "").split("/").filter(Boolean);
  return (
    <div className="fi">
      <div className="fi-titre">
        <div className="fi-fil" role="navigation" aria-label="Chemin">
          <button type="button" onClick={() => aller([])} aria-label="Stockage interne">
            <Ic n="cmfm-ic_holo_light_sdcard" t={32} />
          </button>
          {["storage", "sdcard0", ...chemin].map((n, i) => (
            <span key={i} className="fi-fil-bout">
              <Ic n="cmfm-ic_holo_light_breadcrumb_divider" t={16} />
              <button type="button" translate="no" onClick={() => (i >= 1 ? aller(chemin.slice(0, i - 1)) : aller([]))}>
                {n}
              </button>
            </span>
          ))}
        </div>
        <div className="fi-disque" aria-hidden="true">
          <i style={{ width: `${(occupe / CAPACITE) * 100}%` }} />
        </div>
      </div>
      <div className="fi-liste">
        {liste.length === 0 ? <p className="fi-vide">Ce dossier est vide</p> : null}
        {liste.map((e) => (
          <button
            key={e.nom}
            type="button"
            className="fi-ligne"
            onClick={() => (e.type === "dossier" ? aller([...chemin, e.nom]) : e.ouvrir ? e.ouvrir() : toast("Aucune application ne peut ouvrir ce fichier."))}
          >
            <span className="fi-ic">
              {e.type === "audio" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="fi-vignette" src={POCHETTE_MINI} width={40} height={40} alt="" draggable={false} />
              ) : e.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="fi-vignette" src="/media/franck.jpg" width={40} height={40} alt="" draggable={false} />
              ) : (
                <Ic n={e.type === "dossier" ? "cmfm-ic_fso_folder" : e.type === "video" ? "cmfm-ic_fso_type_video" : "cmfm-ic_fso_default"} />
              )}
            </span>
            <span className="fi-t">
              <b translate="no">{e.nom}</b>
              <span>
                <span translate="no">{e.date}</span>
                <span className="fi-droits" translate="no">{e.type === "dossier" ? "drwxrwx---" : "-rw-rw----"}</span>
                {e.octets !== undefined ? <em translate="no">{taille(e.octets)}</em> : null}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="fi-barre">
        <span />
        <button type="button" aria-label="Historique" onClick={() => setDlg("historique")}>
          <Ic n="cmfm-ic_holo_light_history" t={32} />
        </button>
        <button type="button" aria-label="Favoris" onClick={() => setDlg("favoris")}>
          <Ic n="cmfm-ic_holo_light_bookmarks" t={32} />
        </button>
        <button type="button" aria-label="Infos du système de fichiers" onClick={() => setDlg("infos")}>
          <Ic n="cmfm-ic_holo_light_overflow" t={32} />
        </button>
      </div>
      {dlg === "historique" ? (
        <Dlg titre="Historique" fermer={() => setDlg(null)}>
          {historique.length === 0 ? <p className="fi-dlg-vide">Aucun historique</p> : null}
          {historique.map((h) => (
            <button key={h} type="button" className="dlg-choix" translate="no" onClick={() => (aller(versChemin(h)), setDlg(null))}>
              {h}
            </button>
          ))}
        </Dlg>
      ) : dlg === "favoris" ? (
        <Dlg titre="Favoris" fermer={() => setDlg(null)}>
          {[
            ["Stockage interne", []],
            ["Musique", ["Music"]],
            ["Photos", ["DCIM", "Camera"]],
            ["Téléchargements", ["Download"]],
            ["Enregistrements", ["Recordings"]],
          ].map(([n, c]) => (
            <button key={n as string} type="button" className="dlg-choix" onClick={() => (aller(c as string[]), setDlg(null))}>
              {n as string}
            </button>
          ))}
        </Dlg>
      ) : dlg === "infos" ? (
        <Dlg titre="Infos du système de fichiers" fermer={() => setDlg(null)}>
          <div className="dlg-corps fi-infos">
            <span>
              Point de montage : <b translate="no">{RAC}</b>
            </span>
            <span>
              Total : <b translate="no">{taille(CAPACITE)}</b>
            </span>
            <span>
              Utilisé : <b translate="no">{taille(occupe)}</b>
            </span>
            <span>
              Libre : <b translate="no">{taille(CAPACITE - occupe)}</b>
            </span>
            <span className="fi-disque grand" aria-hidden="true">
              <i style={{ width: `${(occupe / CAPACITE) * 100}%` }} />
            </span>
          </div>
          <button type="button" className="dlg-annuler" onClick={() => setDlg(null)}>
            OK
          </button>
        </Dlg>
      ) : null}
    </div>
  );
}
