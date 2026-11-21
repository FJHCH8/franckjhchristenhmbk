import { lireSession, ouvrirSession, reponse } from "@/lib/edit/http";
import { plainText } from "@/lib/edit/securite";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return lireSession(req);
}

export async function POST(req: Request) {
  let body: { code?: unknown };
  try {
    body = (await req.json()) as { code?: unknown };
  } catch {
    return reponse({ erreur: "Requête refusée." }, 400);
  }
  return ouvrirSession(req, plainText(body.code, 12));
}
