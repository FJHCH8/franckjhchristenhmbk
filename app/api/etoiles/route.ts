import { vuePublique, readEtat } from "@/lib/etoiles/etat";
import { reponse } from "@/lib/edit/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const etat = await readEtat();
  return reponse({ etoiles: vuePublique(etat) });
}
