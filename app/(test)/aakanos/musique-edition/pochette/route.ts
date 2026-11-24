import { avecEcriture, reponse } from "@/lib/edit/http";
import { LIMITS, randomId, sniff } from "@/lib/edit/securite";
import { writeMedia } from "@/lib/etoiles/etat";
import { ecrireFiches, lireFiches, pisteValide } from "../donnees";

export const dynamic = "force-dynamic";

/** Nouvelle pochette d'un titre (JPEG, PNG, WebP ou GIF) : réservé à la session d'édition. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  const k = pisteValide(form.get("piste"));
  if (!k) return reponse({ erreur: "Introuvable." }, 404);
  const file = form.get("fichier");
  if (!(file instanceof File)) return reponse({ erreur: "Fichier manquant." }, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || type.kind !== "photo" || bytes.length === 0 || bytes.length > LIMITS.photo) return reponse({ erreur: "Ce fichier n’est pas accepté." }, 400);
  return avecEcriture(req, async () => {
    const id = `pochette-${randomId(12)}`;
    await writeMedia(id, bytes);
    const fiches = await lireFiches();
    fiches[k] = { ...(fiches[k] ?? {}), pochette: id, maj: Date.now() };
    await ecrireFiches(fiches);
    return { body: { fiches: await lireFiches() } };
  });
}
