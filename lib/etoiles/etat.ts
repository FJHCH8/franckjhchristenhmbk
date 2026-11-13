import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import type { Bucket } from "@/lib/edit/securite";
import { freshBucket } from "@/lib/edit/securite";
import { semence, SIGNATURE } from "@/lib/etoiles/semence";
import type { Etoile, MediaKind, PublicEtoile } from "@/lib/etoiles/types";

export type SessionRow = { exp: number; iat: number; jeton: string };
export type MediaRow = { kind: MediaKind; type: string; nom: string };

export type Etat = {
  etoiles: Etoile[];
  coeurs: Record<string, { n: number; ids: string[] }>;
  sessions: Record<string, SessionRow>;
  totpStep: number;
  ip: Record<string, Bucket>;
  global: Bucket;
  medias: Record<string, MediaRow>;
};

const FILE = path.join(process.cwd(), ".data", "etat.json");
const MEDIA = path.join(process.cwd(), ".data", "media");
const BLOB_ETAT = "etat.json";

function empty(): Etat {
  return { etoiles: semence(), coeurs: {}, sessions: {}, totpStep: 0, ip: {}, global: freshBucket(), medias: {} };
}

function normalize(value: Etat): Etat {
  return {
    etoiles: Array.isArray(value.etoiles) ? value.etoiles.map((etoile) => ({ ...etoile, auteur: SIGNATURE })) : semence(),
    coeurs: value.coeurs ?? {},
    sessions: value.sessions ?? {},
    totpStep: value.totpStep ?? 0,
    ip: value.ip ?? {},
    global: value.global ?? freshBucket(),
    medias: value.medias ?? {},
  };
}

async function loadBlob(): Promise<Etat | null> {
  const found = await get(BLOB_ETAT, { access: "private", useCache: false });
  if (!found || found.statusCode !== 200 || !found.stream) return null;
  const text = await new Response(found.stream).text();
  return normalize(JSON.parse(text) as Etat);
}

async function saveBlob(etat: Etat) {
  await put(BLOB_ETAT, JSON.stringify(etat), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

async function loadFile(): Promise<Etat> {
  try {
    return normalize(JSON.parse(await readFile(FILE, "utf8")) as Etat);
  } catch {
    return empty();
  }
}

async function saveFile(etat: Etat) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(etat));
}

const remote = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function readEtat(): Promise<Etat> {
  if (remote()) {
    const loaded = await loadBlob();
    return loaded ?? empty();
  }
  return loadFile();
}

let queue: Promise<unknown> = Promise.resolve();

export function updateEtat<T>(fn: (etat: Etat) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const etat = await readEtat();
    const result = await fn(etat);
    if (remote()) await saveBlob(etat);
    else await saveFile(etat);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function vuePublique(etat: Etat): PublicEtoile[] {
  return etat.etoiles.map((etoile) => ({ ...etoile, coeurs: etat.coeurs[etoile.id]?.n ?? 0 }));
}

export async function writeMedia(id: string, bytes: Buffer) {
  if (remote()) {
    await put(`media/${id}`, bytes, { access: "private", addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  await mkdir(MEDIA, { recursive: true });
  await writeFile(path.join(MEDIA, id), bytes);
}

export async function readMedia(id: string) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) return null;
  if (remote()) {
    const found = await get(`media/${id}`, { access: "private", useCache: false });
    if (!found || found.statusCode !== 200 || !found.stream) return null;
    return Buffer.from(await new Response(found.stream).arrayBuffer());
  }
  try {
    return await readFile(path.join(MEDIA, id));
  } catch {
    return null;
  }
}
