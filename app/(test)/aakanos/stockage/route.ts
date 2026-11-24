import { CAPACITE_TELEPHONE, occupeTelephone } from "@/components/os/stockageTelephone";

/*
 * Réglages › Stockage : le stockage du téléphone (les mêmes chiffres que Fichiers).
 * Plus aucune mesure du magasin du site.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    mesure: true,
    octets: occupeTelephone(),
    capacite: CAPACITE_TELEPHONE,
    libelle: "Le stockage du téléphone",
  });
}
