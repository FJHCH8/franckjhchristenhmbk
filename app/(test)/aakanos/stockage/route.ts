import { list } from "@vercel/blob";

/*
 * Réglages › Stockage du téléphone AakanOS : le vrai stockage Vercel Blob du site
 * (la somme des fichiers du magasin Blob relié au projet), mesurée côté serveur.
 * Le jeton reste sur le serveur ; la mesure est gardée un jour en cache pour ne
 * consommer qu'une poignée d'opérations « list » par mois (offre gratuite Hobby).
 */
export const revalidate = 86400;

// Stockage Blob inclus dans l'offre gratuite Vercel (Hobby) : 1 Go.
const CAPACITE = 1_000_000_000;

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ mesure: false, capacite: CAPACITE });
  try {
    let octets = 0;
    let fichiers = 0;
    let cursor: string | undefined;
    do {
      const page = await list({ cursor, limit: 1000 });
      for (const b of page.blobs) {
        octets += b.size;
        fichiers += 1;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return Response.json({ mesure: true, octets, fichiers, capacite: CAPACITE, le: new Date().toISOString() });
  } catch {
    return Response.json({ mesure: false, capacite: CAPACITE });
  }
}
