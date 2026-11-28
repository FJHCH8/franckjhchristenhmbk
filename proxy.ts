import { NextResponse, type NextRequest } from "next/server";
import { MAINTENANCE } from "@/lib/maintenance";

/** Les pages fermées pendant la maintenance (elles renvoient vers l'accueil, où est Teodor). */
const FERMEES = ["/projets", "/qui-suis-je", "/edition", "/tactique", "/aakanos", "/odyssee-test"];

/** Un téléphone ou une tablette Android ? (le navigateur le dit dans son « user-agent » et ses indices) */
function android(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  const plateforme = request.headers.get("sec-ch-ua-platform") ?? "";
  // les robots des moteurs de recherche se font passer pour un Android : on les laisse passer,
  // sinon Google indexerait la page « Dommage. » à la place du site
  if (/bot|crawler|spider|google|bing|yandex|duckduck|facebookexternalhit|embedly|preview/i.test(ua)) return false;
  return /android/i.test(ua) || /android/i.test(plateforme);
}

/**
 * 1. Les visiteurs sur Android sont bannis : quelle que soit l'adresse, ils voient la page « Dommage. ».
 * 2. Pendant la maintenance, les pages du site renvoient vers l'accueil (Teodor).
 * Les adresses qui n'existent pas gardent leur page d'erreur.
 */
export function proxy(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  if (android(request)) {
    if (chemin === "/banni") return NextResponse.next();
    return NextResponse.rewrite(new URL("/banni", request.url));
  }
  if (chemin === "/banni" || chemin.startsWith("/banni/")) return NextResponse.redirect(new URL("/", request.url), 307);
  if (MAINTENANCE && FERMEES.some((f) => chemin === f || chemin.startsWith(`${f}/`))) return NextResponse.redirect(new URL("/", request.url), 307);
  return NextResponse.next();
}

export const config = {
  // toutes les pages, sauf les fichiers du site (scripts, images, polices…) et l'API
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
