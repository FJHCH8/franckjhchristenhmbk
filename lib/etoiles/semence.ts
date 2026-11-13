import type { Etoile } from "@/lib/etoiles/types";

export const SIGNATURE = "Franck J.H. Christen";

export const CITATION =
  "Une seconde ne détruit pas la minute, une minute ne détruit pas l’heure, une heure ne détruit pas la journée. Le point noir au milieu d’une grande page blanche n’est qu’une toute petite partie de votre journée et de votre vie, concentrez-vous sur cette blancheur.";

export function placerDansPegase(ra: number, dec: number) {
  const tour = ((ra % 360) + 360) % 360;
  if (tour >= 326 && tour <= 357 && dec >= 8 && dec <= 32) return { ra: tour, dec };
  return { ra: 345.2, dec: 23.5 };
}

export function semence(): Etoile[] {
  return [
    {
      id: "citation-2026-05-26",
      titre: "",
      texte: CITATION,
      auteur: SIGNATURE,
      date: "2026-05-26",
      police: "fraunces",
      style: "italic",
      ra: 349,
      dec: 26,
      seuil: 0,
      medias: [],
    },
    {
      id: "endurreisen",
      titre: "Endurreisen",
      texte: "",
      auteur: SIGNATURE,
      date: "",
      police: "fraunces",
      style: "normal",
      ra: 341.6,
      dec: 18,
      seuil: 0,
      medias: [],
    },
  ];
}
