import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { plainText } from "@/lib/edit/securite";

/*
 * Les fiches des titres du lecteur Musique d'AakanOS, modifiées par Franck avec le code
 * d'édition du site (le même TOTP, la même session). Rangées à part dans le magasin Blob
 * (« aakanos-musique.json ») : c'est la seule chose du téléphone qui reste pour tout le
 * monde ; le reste du téléphone repart de zéro comme avant.
 */
export type FicheMusique = { titre?: string; artiste?: string; album?: string; annee?: string; genre?: string; pochette?: string; maj?: number };
export type Fiches = Record<string, FicheMusique>;

const BLOB = "aakanos-musique.json";
const FICHIER = path.join(process.cwd(), ".data", "aakanos-musique.json");
const distant = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const NB_PISTES = 2;
export const pisteValide = (v: unknown) => {
  const k = Number(v);
  return Number.isInteger(k) && k >= 0 && k < NB_PISTES ? String(k) : null;
};

function propre(v: unknown): Fiches {
  const r: Fiches = {};
  if (!v || typeof v !== "object") return r;
  for (const [k, f] of Object.entries(v as Record<string, unknown>)) {
    if (!pisteValide(k) || !f || typeof f !== "object") continue;
    const x = f as Record<string, unknown>;
    r[k] = {
      ...(x.titre ? { titre: plainText(x.titre, 120) } : {}),
      ...(x.artiste ? { artiste: plainText(x.artiste, 120) } : {}),
      ...(x.album ? { album: plainText(x.album, 120) } : {}),
      ...(x.annee ? { annee: plainText(x.annee, 12) } : {}),
      ...(x.genre ? { genre: plainText(x.genre, 60) } : {}),
      ...(typeof x.pochette === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(x.pochette) ? { pochette: x.pochette } : {}),
      ...(typeof x.maj === "number" ? { maj: x.maj } : {}),
    };
  }
  return r;
}

export async function lireFiches(): Promise<Fiches> {
  try {
    if (distant()) {
      const t = await get(BLOB, { access: "private", useCache: false });
      if (!t || t.statusCode !== 200 || !t.stream) return {};
      return propre(JSON.parse(await new Response(t.stream).text()));
    }
    return propre(JSON.parse(await readFile(FICHIER, "utf8")));
  } catch {
    return {};
  }
}

export async function ecrireFiches(f: Fiches) {
  const texte = JSON.stringify(propre(f));
  if (distant()) {
    await put(BLOB, texte, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json" });
    return;
  }
  await mkdir(path.dirname(FICHIER), { recursive: true });
  await writeFile(FICHIER, texte);
}

/** Lit un champ du formulaire : chaîne vide = retour à la valeur d'origine du titre. */
export function champ(v: unknown, max: number) {
  return plainText(v, max);
}
