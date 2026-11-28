import { NextResponse, type NextRequest } from "next/server";
import { MAINTENANCE } from "@/lib/maintenance";

/**
 * Pendant la maintenance, toutes les pages du site renvoient vers l'accueil (Teodor).
 * Les adresses qui n'existent pas gardent leur page 404.
 */
export function proxy(request: NextRequest) {
  if (!MAINTENANCE) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url), 307);
}

export const config = {
  matcher: ["/projets/:path*", "/qui-suis-je/:path*", "/edition/:path*", "/tactique/:path*", "/aakanos/:path*", "/odyssee-test/:path*"],
};
