import { fermerSession } from "@/lib/edit/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return fermerSession(req);
}
