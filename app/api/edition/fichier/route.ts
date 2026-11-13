import { avecEcriture, reponse } from "@/lib/edit/http";
import { LIMITS, plainText, randomId, sniff } from "@/lib/edit/securite";
import { writeMedia } from "@/lib/etoiles/etat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  const file = form.get("fichier");
  if (!(file instanceof File)) return reponse({ erreur: "Fichier manquant." }, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind || bytes.length === 0 || bytes.length > LIMITS[kind.kind]) {
    return reponse({ erreur: "Ce fichier n’est pas accepté." }, 400);
  }
  const asked = plainText(form.get("genre"), 20);
  if (asked && asked !== kind.kind) return reponse({ erreur: "Ce fichier n’est pas accepté." }, 400);
  return avecEcriture(req, async (etat) => {
    const id = randomId(18);
    await writeMedia(id, bytes);
    etat.medias[id] = { kind: kind.kind, type: kind.type, nom: plainText(file.name, 80) || `fichier.${kind.ext}` };
    return { body: { media: { id, kind: kind.kind, nom: etat.medias[id]!.nom } } };
  });
}
