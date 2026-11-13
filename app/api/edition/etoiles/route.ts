import { avecEcriture, reponse } from "@/lib/edit/http";
import { clampNumber, fontOf, plainText, randomId, styleOf } from "@/lib/edit/securite";
import { SIGNATURE, placerDansPegase } from "@/lib/etoiles/semence";
import type { Etoile, Media } from "@/lib/etoiles/types";

export const dynamic = "force-dynamic";

function mediasOf(value: unknown, known: Set<string>): Media[] {
  if (!Array.isArray(value)) return [];
  const list: Media[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; kind?: unknown; nom?: unknown };
    const id = typeof row.id === "string" ? row.id : "";
    if (!known.has(id)) continue;
    const kind = row.kind === "photo" || row.kind === "video" || row.kind === "audio" || row.kind === "fichier" ? row.kind : "fichier";
    list.push({ id, kind, nom: plainText(row.nom, 80) || "fichier" });
    if (list.length >= 8) break;
  }
  return list;
}

function lireChamps(body: Record<string, unknown>, known: Set<string>, previous?: Etoile): Omit<Etoile, "id"> | null {
  const titre = plainText(body.titre, 120);
  const texte = plainText(body.texte, 2000);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || "")) ? String(body.date) : previous?.date || "";
  if (!titre && !texte) return null;
  return {
    titre,
    texte,
    auteur: SIGNATURE,
    date,
    police: fontOf(body.police ?? previous?.police),
    style: styleOf(body.style ?? previous?.style),
    ra: clampNumber(body.ra, 0, 360, previous?.ra ?? 15),
    dec: clampNumber(body.dec, -90, 90, previous?.dec ?? 40),
    seuil: clampNumber(body.seuil, 0, 1, previous?.seuil ?? 0.35),
    medias: mediasOf(body.medias, known),
  };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  return avecEcriture(req, (etat) => {
    if (etat.etoiles.length >= 200) return { body: { erreur: "Limite atteinte." }, status: 400 };
    const known = new Set(Object.keys(etat.medias));
    const champs = lireChamps(body, known);
    if (!champs) return { body: { erreur: "Le texte manque." }, status: 400 };
    const place = placerDansPegase(champs.ra, champs.dec);
    const etoile: Etoile = { id: randomId(9), ...champs, ...place };
    etat.etoiles.push(etoile);
    return { body: { etoile } };
  });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  return avecEcriture(req, (etat) => {
    const id = plainText(body.id, 40);
    const index = etat.etoiles.findIndex((item) => item.id === id);
    if (index < 0) return { body: { erreur: "Introuvable." }, status: 404 };
    const known = new Set(Object.keys(etat.medias));
    const champs = lireChamps(body, known, etat.etoiles[index]);
    if (!champs) return { body: { erreur: "Le texte manque." }, status: 400 };
    etat.etoiles[index] = { ...etat.etoiles[index]!, ...champs };
    return { body: { etoile: etat.etoiles[index] } };
  });
}

export async function DELETE(req: Request) {
  let body: { id?: unknown };
  try {
    body = (await req.json()) as { id?: unknown };
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  return avecEcriture(req, (etat) => {
    const id = plainText(body.id, 40);
    const before = etat.etoiles.length;
    etat.etoiles = etat.etoiles.filter((item) => item.id !== id);
    if (etat.etoiles.length === before) return { body: { erreur: "Introuvable." }, status: 404 };
    delete etat.coeurs[id];
    return { body: { ok: true } };
  });
}
