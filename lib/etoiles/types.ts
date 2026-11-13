export type Police = "fraunces" | "outfit" | "georgia";
export type StyleTexte = "normal" | "italic";
export type MediaKind = "photo" | "video" | "audio" | "fichier";

export type Media = { id: string; kind: MediaKind; nom: string };

export type Etoile = {
  id: string;
  titre: string;
  texte: string;
  auteur: string;
  date: string;
  police: Police;
  style: StyleTexte;
  ra: number;
  dec: number;
  seuil: number;
  medias: Media[];
};

export type PublicEtoile = Etoile & { coeurs: number };
