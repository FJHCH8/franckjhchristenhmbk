import { readEtat, readMedia } from "@/lib/etoiles/etat";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const etat = await readEtat();
  const meta = etat.medias[id];
  const published = etat.etoiles.some((etoile) => etoile.medias.some((media) => media.id === id));
  if (!meta || !published) {
    return new Response(null, { status: 404, headers: { "x-content-type-options": "nosniff", "x-robots-tag": "noindex" } });
  }
  const bytes = await readMedia(id);
  if (!bytes) return new Response(null, { status: 404 });
  const headers = new Headers();
  headers.set("content-type", meta.type);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", "public, max-age=3600");
  headers.set("content-disposition", `${meta.kind === "fichier" ? "attachment" : "inline"}; filename="${meta.nom.replace(/["\r\n]/g, "")}"`);
  return new Response(bytes, { headers });
}
