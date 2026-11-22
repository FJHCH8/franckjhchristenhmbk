export const dynamic = "force-dynamic";

/** La version du site actuellement en ligne. */
export function GET() {
  return Response.json({ version: process.env.NEXT_PUBLIC_VERSION ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
