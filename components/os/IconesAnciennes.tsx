/**
 * Icônes « à l'ancienne » d'Odyssée (version test) : de petits objets en relief,
 * avec dégradés, reflets et ombres portées, comme sur les téléphones de 2008-2012.
 * Tout est dessiné ici à la main en SVG (aucune image reprise d'un autre système).
 */
import type { ReactElement } from "react";

export type NomAppli =
  | "qui"
  | "projets"
  | "album"
  | "citations"
  | "aaka"
  | "contact"
  | "instagram"
  | "reglages"
  | "recherche"
  | "endurreisen"
  | "langue"
  | "odyssee";

const DESSINS: Record<NomAppli, (p: string) => ReactElement> = {
  // Carte d'identité
  qui: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#e4dcc6" />
        </linearGradient>
        <linearGradient id={`${p}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d8fd6" />
          <stop offset="1" stopColor="#24589f" />
        </linearGradient>
        <linearGradient id={`${p}ph`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6e4" />
          <stop offset="1" stopColor="#8396ab" />
        </linearGradient>
      </defs>
      <rect x="5" y="12" width="54" height="40" rx="5" fill={`url(#${p}c)`} stroke="#9c9278" strokeWidth="1" />
      <path d="M5 17a5 5 0 0 1 5-5h44a5 5 0 0 1 5 5v5H5z" fill={`url(#${p}b)`} />
      <rect x="11" y="27" width="17" height="20" rx="2" fill={`url(#${p}ph)`} stroke="#6e7f92" strokeWidth=".8" />
      <circle cx="19.5" cy="34" r="4" fill="#4b5d73" />
      <path d="M12.5 46.5c1-5 4-7 7-7s6 2 7 7z" fill="#4b5d73" />
      <rect x="32" y="29" width="21" height="3" rx="1.5" fill="#8a826c" />
      <rect x="32" y="35" width="17" height="2.4" rx="1.2" fill="#b3aa92" />
      <rect x="32" y="40" width="19" height="2.4" rx="1.2" fill="#b3aa92" />
      <circle cx="10" cy="17" r="1.6" fill="#fff" opacity=".8" />
      <path d="M8 13h48a3 3 0 0 1 3 3v2c-10-3-35-4-51-1z" fill="#fff" opacity=".35" />
    </>
  ),
  // Étoile dorée sur médaillon bleu
  projets: (p) => (
    <>
      <defs>
        <radialGradient id={`${p}m`} cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#6cc8ff" />
          <stop offset=".55" stopColor="#1a6fc1" />
          <stop offset="1" stopColor="#0b2f63" />
        </radialGradient>
        <linearGradient id={`${p}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset=".5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#d98a00" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill={`url(#${p}m)`} stroke="#0a2a55" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="#9fdcff" strokeOpacity=".5" />
      <path
        d="M32 12l5.6 12.4 13.4 1.4-10 9 2.9 13.2L32 41.4l-11.9 6.6 2.9-13.2-10-9 13.4-1.4z"
        fill={`url(#${p}e)`}
        stroke="#a86400"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <ellipse cx="32" cy="18" rx="20" ry="10" fill="#fff" opacity=".28" />
    </>
  ),
  // Pile de photos instantanées
  album: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}ciel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f8fe0" />
          <stop offset="1" stopColor="#b9e2ff" />
        </linearGradient>
      </defs>
      <g transform="rotate(-12 32 34)">
        <rect x="12" y="10" width="40" height="46" rx="1.5" fill="#f2efe6" stroke="#b9b3a3" />
      </g>
      <g transform="rotate(7 32 34)">
        <rect x="12" y="10" width="40" height="46" rx="1.5" fill="#fbfaf6" stroke="#b9b3a3" />
        <rect x="16" y="14" width="32" height="30" fill={`url(#${p}ciel)`} />
        <circle cx="41" cy="21" r="3.5" fill="#ffe680" />
        <path d="M16 44V35c6-5 10-3 14 0s9-6 18-2v11z" fill="#4c9b2f" />
        <path d="M16 44v-4c8-4 16 0 32-3v7z" fill="#2f7520" />
        <path d="M16 14h32v9c-12-4-22-2-32 1z" fill="#fff" opacity=".25" />
      </g>
    </>
  ),
  // Post-it jaune avec guillemets
  citations: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}n`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff79a" />
          <stop offset="1" stopColor="#f3d23c" />
        </linearGradient>
      </defs>
      <path d="M9 9h46v34L42 56H9z" fill={`url(#${p}n)`} stroke="#c8a51a" />
      <path d="M42 56V45a2 2 0 0 1 2-2h11z" fill="#d6b52a" />
      <path d="M42 56V45a2 2 0 0 1 2-2h11" fill="none" stroke="#a8890f" />
      <path
        d="M17 37c0-8 3-13 9-15l1 3c-3 1.5-4.5 3.5-4.5 6H27v8h-10zm16 0c0-8 3-13 9-15l1 3c-3 1.5-4.5 3.5-4.5 6H43v8H33z"
        fill="#7a5b0c"
      />
      <rect x="25" y="5" width="14" height="7" rx="1" fill="#ffffff" opacity=".55" transform="rotate(-4 32 8)" />
    </>
  ),
  // Livre relié en cuir
  aaka: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}cu`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a2a12" />
          <stop offset=".18" stopColor="#8b4a22" />
          <stop offset="1" stopColor="#a65c2c" />
        </linearGradient>
        <linearGradient id={`${p}pa`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f6efdc" />
          <stop offset="1" stopColor="#d9cdb0" />
        </linearGradient>
        <linearGradient id={`${p}or`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="1" stopColor="#c08a1e" />
        </linearGradient>
      </defs>
      <path d="M14 8h38v46H14z" fill={`url(#${p}pa)`} />
      <path d="M12 6h37a3 3 0 0 1 3 3v42a3 3 0 0 1-3 3H12z" fill={`url(#${p}cu)`} stroke="#3e1b08" />
      <path d="M12 54h38v3H14a2 2 0 0 1-2-2z" fill={`url(#${p}pa)`} stroke="#a89a7a" strokeWidth=".6" />
      <rect x="12" y="6" width="5" height="48" fill="#3e1b08" opacity=".5" />
      <rect x="22" y="14" width="24" height="26" rx="2" fill="none" stroke={`url(#${p}or)`} strokeWidth="1.6" />
      <path d="M34 18v18M28 22l6 4 6-4M29 32h10" stroke={`url(#${p}or)`} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M40 54v8l3-2.5 3 2.5v-8z" fill="#b51c1c" />
      <path d="M17 7h32a2 2 0 0 1 2 2v6c-12-3-24-3-34 0z" fill="#fff" opacity=".18" />
    </>
  ),
  // Enveloppe par avion
  contact: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe3e8" />
        </linearGradient>
        <pattern id={`${p}av`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="8" fill="#d32f2f" />
          <rect x="4" width="4" height="8" fill="#1f4fa8" />
        </pattern>
      </defs>
      <rect x="5" y="14" width="54" height="37" rx="3" fill={`url(#${p}av)`} />
      <rect x="8" y="17" width="48" height="31" rx="1.5" fill={`url(#${p}e)`} />
      <path d="M8 18l24 17 24-17" fill="none" stroke="#9aa3ad" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 48l18-15M56 48L38 33" stroke="#b7bec6" strokeWidth="1.2" />
      <rect x="44" y="20" width="9" height="10" fill="#fff" stroke="#c44" strokeDasharray="1.5 1" />
      <rect x="45.5" y="21.5" width="6" height="7" fill="#3b7dd8" />
    </>
  ),
  // Appareil photo argentique
  instagram: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}cr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f4" />
          <stop offset="1" stopColor="#a9a9a9" />
        </linearGradient>
        <linearGradient id={`${p}cu`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4630" />
          <stop offset="1" stopColor="#3a2314" />
        </linearGradient>
        <radialGradient id={`${p}l`} cx=".38" cy=".35" r=".7">
          <stop offset="0" stopColor="#7fb3ff" />
          <stop offset=".35" stopColor="#1e3a6e" />
          <stop offset="1" stopColor="#05070c" />
        </radialGradient>
      </defs>
      <rect x="20" y="10" width="14" height="7" rx="1.5" fill={`url(#${p}cr)`} stroke="#777" />
      <rect x="5" y="16" width="54" height="38" rx="5" fill={`url(#${p}cr)`} stroke="#6f6f6f" />
      <rect x="5" y="26" width="54" height="22" fill={`url(#${p}cu)`} />
      <circle cx="32" cy="36" r="14" fill="#2a2a2a" stroke={`url(#${p}cr)`} strokeWidth="3" />
      <circle cx="32" cy="36" r="9.5" fill={`url(#${p}l)`} />
      <circle cx="28.5" cy="32.5" r="2.5" fill="#fff" opacity=".7" />
      <rect x="47" y="19" width="8" height="5" rx="1" fill="#e8f3ff" stroke="#777" />
      <circle cx="12" cy="21" r="2.2" fill="#d33" />
      <path d="M6 18a4 4 0 0 1 4-1h44a4 4 0 0 1 4 1v3H6z" fill="#fff" opacity=".5" />
    </>
  ),
  // Engrenage en métal
  reglages: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f4f6" />
          <stop offset=".5" stopColor="#9aa3ad" />
          <stop offset="1" stopColor="#5b636c" />
        </linearGradient>
        <radialGradient id={`${p}t`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#3b4148" />
          <stop offset="1" stopColor="#1b1f24" />
        </radialGradient>
      </defs>
      <path
        d="M27.5 4h9l1.4 7.2a21 21 0 0 1 5.4 2.2l6-4.1 6.4 6.4-4.1 6a21 21 0 0 1 2.2 5.4L61 28.5v9l-7.2 1.4a21 21 0 0 1-2.2 5.4l4.1 6-6.4 6.4-6-4.1a21 21 0 0 1-5.4 2.2L36.5 62h-9l-1.4-7.2a21 21 0 0 1-5.4-2.2l-6 4.1-6.4-6.4 4.1-6a21 21 0 0 1-2.2-5.4L3 37.5v-9l7.2-1.4a21 21 0 0 1 2.2-5.4l-4.1-6 6.4-6.4 6 4.1a21 21 0 0 1 5.4-2.2z"
        fill={`url(#${p}m)`}
        stroke="#4a5058"
        strokeWidth="1"
        transform="translate(0 -1)"
      />
      <circle cx="32" cy="32" r="14" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="8" fill={`url(#${p}t)`} stroke="#6d757e" />
      <path d="M14 18c8-8 28-8 36 0-10-4-26-4-36 0z" fill="#fff" opacity=".5" />
    </>
  ),
  // Loupe à manche en bois
  recherche: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c47a3c" />
          <stop offset="1" stopColor="#6b3610" />
        </linearGradient>
        <radialGradient id={`${p}v`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".4" stopColor="#bfe6ff" stopOpacity=".6" />
          <stop offset="1" stopColor="#5aa7d8" stopOpacity=".5" />
        </radialGradient>
        <linearGradient id={`${p}cr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfdfd" />
          <stop offset="1" stopColor="#8d949c" />
        </linearGradient>
      </defs>
      <path d="M39 41l17 17a4 4 0 0 0 5-5L44 36z" fill={`url(#${p}b)`} stroke="#4a2408" />
      <path d="M36 38l4 4 4-4-4-4z" fill={`url(#${p}cr)`} stroke="#666" />
      <circle cx="26" cy="26" r="20" fill={`url(#${p}cr)`} stroke="#5c636b" />
      <circle cx="26" cy="26" r="16" fill={`url(#${p}v)`} stroke="#7d868f" />
      <path d="M15 22a12 12 0 0 1 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  // Réveil rouge à deux cloches
  endurreisen: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b5b" />
          <stop offset="1" stopColor="#a8160c" />
        </linearGradient>
        <radialGradient id={`${p}c`} cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dcdcd2" />
        </radialGradient>
      </defs>
      <path d="M8 18a9 9 0 0 1 14-9z" fill={`url(#${p}r)`} stroke="#6d0c05" />
      <path d="M56 18a9 9 0 0 0-14-9z" fill={`url(#${p}r)`} stroke="#6d0c05" />
      <path d="M16 54l-4 6M48 54l4 6" stroke="#5b0a04" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="35" r="23" fill={`url(#${p}r)`} stroke="#6d0c05" />
      <circle cx="32" cy="35" r="17.5" fill={`url(#${p}c)`} stroke="#8d8d80" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <rect key={a} x="31.4" y="19.5" width="1.2" height={a % 90 ? 2 : 3.4} fill="#555" transform={`rotate(${a} 32 35)`} />
      ))}
      <path d="M32 35V24.5M32 35l7 4" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="35" r="1.8" fill="#c00" />
      <path d="M14 30a19 19 0 0 1 36 0c-12-5-24-5-36 0z" fill="#fff" opacity=".4" />
    </>
  ),
  // Globe terrestre sur pied
  langue: (p) => (
    <>
      <defs>
        <radialGradient id={`${p}g`} cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#9fe0ff" />
          <stop offset=".55" stopColor="#2c86d4" />
          <stop offset="1" stopColor="#0c3a7a" />
        </radialGradient>
        <linearGradient id={`${p}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe99a" />
          <stop offset="1" stopColor="#b9831e" />
        </linearGradient>
      </defs>
      <path d="M22 58h20l-3-5H25z" fill={`url(#${p}o)`} stroke="#7a5510" />
      <path d="M32 53v-4" stroke="#7a5510" strokeWidth="3" />
      <circle cx="32" cy="28" r="20" fill={`url(#${p}g)`} stroke="#0a3168" />
      <path
        d="M20 17c4-3 9-2 10 2s-4 4-3 8 6 3 5 8-7 4-9 0-2-6-5-7-3-8 2-11zM38 14c4 0 9 3 10 8s-4 3-6 6 1 8-3 9-4-5-3-9-4-5-2-9 1-5 4-5z"
        fill="#3fae3a"
        stroke="#1f6e1c"
        strokeWidth=".8"
      />
      <path d="M8 28a24 24 0 0 0 48 0" fill="none" stroke={`url(#${p}o)`} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="26" cy="18" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 26 18)" />
    </>
  ),
  // Le téléphone Odyssée, cheval à l'écran
  odyssee: (p) => (
    <>
      <defs>
        <linearGradient id={`${p}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b5f66" />
          <stop offset="1" stopColor="#111316" />
        </linearGradient>
        <linearGradient id={`${p}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a6fb4" />
          <stop offset="1" stopColor="#071a33" />
        </linearGradient>
      </defs>
      <rect x="15" y="3" width="34" height="58" rx="6" fill={`url(#${p}b)`} stroke="#000" />
      <rect x="18.5" y="10" width="27" height="42" rx="1" fill={`url(#${p}e)`} />
      <path
        d="M29 18l1.5 4 4-1 4 4 3 7-2 1-4-3-2 4 1 6-5 1-1-8-2-5-1-6z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <rect x="28" y="5.5" width="8" height="1.6" rx=".8" fill="#222" />
      <circle cx="32" cy="56.5" r="2.4" fill="#222" stroke="#666" strokeWidth=".6" />
      <path d="M18.5 10h27v15c-10-4-18 6-27 4z" fill="#fff" opacity=".14" />
    </>
  ),
};

export function IconeAncienne({ nom, taille = 56 }: { nom: NomAppli; taille?: number }) {
  return (
    <svg className="os-icone" viewBox="0 0 64 64" width={taille} height={taille} aria-hidden="true">
      {DESSINS[nom](`ia-${nom}-`)}
    </svg>
  );
}
