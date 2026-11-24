import { avecEcriture, reponse } from "@/lib/edit/http";
import { champ, ecrireFiches, lireFiches, pisteValide } from "./donnees";

export const dynamic = "force-dynamic";

/** Les fiches modifiées des titres, pour tous les visiteurs. */
export async function GET() {
  return reponse({ fiches: await lireFiches() });
}

/** Modifier la fiche d'un titre : réservé à la session d'édition (code TOTP du site). */
export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  const k = pisteValide(body.piste);
  if (!k) return reponse({ erreur: "Introuvable." }, 404);
  return avecEcriture(req, async () => {
    const fiches = await lireFiches();
    const avant = fiches[k] ?? {};
    const f = { ...avant, maj: Date.now() } as Record<string, unknown>;
    for (const [nom, max] of [["titre", 120], ["artiste", 120], ["album", 120], ["annee", 12], ["genre", 60]] as const) {
      if (!(nom in body)) continue;
      const v = champ(body[nom], max);
      if (v) f[nom] = v;
      else delete f[nom];
    }
    if (body.pochette === null) delete f.pochette;
    fiches[k] = f;
    await ecrireFiches(fiches);
    return { body: { fiches: await lireFiches() } };
  });
}
