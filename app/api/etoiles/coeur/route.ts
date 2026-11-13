import { deviceHash, freshBucket, noteFail, blocked } from "@/lib/edit/securite";
import { origineOk, reponse, clientIp } from "@/lib/edit/http";
import { updateEtat } from "@/lib/etoiles/etat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!origineOk(req)) return reponse({ erreur: "Requête refusée." }, 403);
  let body: { id?: unknown; appareil?: unknown };
  try {
    body = (await req.json()) as { id?: unknown; appareil?: unknown };
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  const id = typeof body.id === "string" ? body.id : "";
  const appareil = typeof body.appareil === "string" ? body.appareil : "";
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id) || !/^[A-Za-z0-9_-]{16,80}$/.test(appareil)) {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  const ip = clientIp(req);
  return updateEtat((etat) => {
    const now = Date.now();
    etat.ip[`coeur:${ip}`] ??= freshBucket();
    const bucket = etat.ip[`coeur:${ip}`]!;
    if (blocked(bucket, now)) return reponse({ erreur: "Trop de tentatives. Réessayez plus tard." }, 429);
    const etoile = etat.etoiles.find((item) => item.id === id);
    if (!etoile) return reponse({ erreur: "Introuvable." }, 404);
    etat.coeurs[id] ??= { n: 0, ids: [] };
    const book = etat.coeurs[id]!;
    const hash = deviceHash(appareil, id);
    if (!book.ids.includes(hash)) {
      if (book.ids.length > 20000) {
        noteFail(bucket, now, 30);
        return reponse({ erreur: "Trop de tentatives. Réessayez plus tard." }, 429);
      }
      book.ids.push(hash);
      book.n += 1;
      noteFail(bucket, now, 40);
    }
    return reponse({ coeurs: book.n, mien: true });
  });
}
