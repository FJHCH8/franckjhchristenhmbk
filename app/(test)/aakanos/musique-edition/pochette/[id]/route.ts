import { readMedia } from "@/lib/etoiles/etat";
import { sniff } from "@/lib/edit/securite";
import { lireFiches } from "../../donnees";

export const dynamic = "force-dynamic";

/** Une pochette en service (affichée dans le téléphone, jamais proposée au téléchargement). */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fiches = await lireFiches();
  const enService = Object.values(fiches).some((f) => f.pochette === id);
  const bytes = enService ? await readMedia(id) : null;
  const type = bytes ? sniff(bytes) : null;
  if (!bytes || !type || type.kind !== "photo") return new Response(null, { status: 404, headers: { "x-content-type-options": "nosniff", "x-robots-tag": "noindex" } });
  const headers = new Headers();
  headers.set("content-type", type.type);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-robots-tag", "noindex");
  headers.set("content-disposition", "inline");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(new Uint8Array(bytes), { headers });
}
