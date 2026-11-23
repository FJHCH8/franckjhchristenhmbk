import { AnneauPS2 } from "@/components/AnneauPS2";

/** Pendant qu'une page arrive du serveur : le Starload PS2, au milieu du noir. */
export default function Loading() {
  return (
    <div className="chargement chargement-page" role="status" aria-label="Chargement en cours">
      <AnneauPS2 taille={96} className="starload-grand" />
    </div>
  );
}
