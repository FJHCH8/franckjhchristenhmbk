/** Points clés de la gravure, en pourcentages de l’image. Le premier est le poitrail, réservé à Endurreisen. */
export const POINTS_PEGASE = [
  { x: 57, y: 46 },
  { x: 48, y: 34 },
  { x: 68, y: 36 },
  { x: 82, y: 43 },
  { x: 75, y: 33 },
  { x: 42, y: 52 },
  { x: 22, y: 34 },
  { x: 33, y: 26 },
  { x: 51, y: 64 },
  { x: 45, y: 80 },
  { x: 34, y: 86 },
  { x: 64, y: 56 },
  { x: 70, y: 50 },
  { x: 56, y: 28 },
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
