/** Points clés de la gravure, en pourcentages de l’image. Le premier est le poitrail, réservé à Endurreisen. */
export const POINTS_PEGASE = [
  { x: 52, y: 48 },
  { x: 43, y: 40 },
  { x: 62, y: 36 },
  { x: 78, y: 42 },
  { x: 72, y: 32 },
  { x: 46, y: 60 },
  { x: 28, y: 36 },
  { x: 38, y: 30 },
  { x: 50, y: 66 },
  { x: 58, y: 58 },
  { x: 66, y: 50 },
  { x: 54, y: 32 },
];

export function emplacements(ids: string[]) {
  const places = new Map<string, { x: number; y: number }>();
  const rest = POINTS_PEGASE.slice(1);
  places.set("endurreisen", POINTS_PEGASE[0]!);
  let index = 0;
  for (const id of ids) {
    if (id === "endurreisen") continue;
    const slot = rest[Math.min(index, rest.length - 1)]!;
    const extra = Math.max(0, index - (rest.length - 1));
    places.set(id, { x: slot.x + (extra % 3) * 3, y: slot.y + Math.floor(extra / 3) * 3 });
    index += 1;
  }
  return places;
}
