/**
 * Le compte Sharkobank de Casto, cohérent avec le reste du téléphone :
 * chaque solde annoncé dans les courriels Sharkobank (−9,18 €, −14,08 €, −27,98 €, −52,37 €, −88,80 €, −131,13 €, −137,02 €)
 * tombe juste ; le paiement Peeporn de la commande 43-454535-86729 (16,99 € + 5 € de livraison) est rejeté,
 * les frais d'annulation de 2,99 € sont prélevés ; le forfait Connard de Sam-Telecom (2,99 €/mois) aussi.
 * Les opérations « en direct » n'apparaissent qu'une fois leur courriel arrivé (réseau prioritaire Sharkobank).
 */
export type Operation = {
  id: string;
  date: string;
  libelle: string;
  tiers: string;
  montant: number; // en centimes, négatif = débit
  statut?: "rejete" | "attente";
  courriel?: string; // n'apparaît qu'après l'arrivée de ce courriel (sk6, sk7)
};

export const SOLDE_INITIAL = 371; // 31 octobre : +3,71 €

export const OPERATIONS: Operation[] = [
  { id: "o1", date: "01/11", libelle: "Prélèvement forfait Connard · novembre", tiers: "SAM-TELECOM", montant: -299 },
  { id: "o2", date: "03/11", libelle: "Paiement carte · courses", tiers: "PULPÜS MARKET", montant: -990 },
  { id: "o3", date: "07/11", libelle: "Frais de rappel", tiers: "SHARKOBANK", montant: -490 },
  { id: "o4", date: "12/11", libelle: "Frais de découvert", tiers: "SHARKOBANK", montant: -490 },
  { id: "o5", date: "12/11", libelle: "Frais d’envoi du courriel annonçant les frais", tiers: "SHARKOBANK", montant: -490 },
  { id: "o6", date: "12/11", libelle: "Commission d’intervention", tiers: "SHARKOBANK", montant: -410 },
  { id: "o7", date: "14/11", libelle: "Agios débiteurs", tiers: "SHARKOBANK", montant: -749 },
  { id: "o8", date: "16/11", libelle: "Frais de tenue de découvert", tiers: "SHARKOBANK", montant: -1200 },
  { id: "o9", date: "18/11", libelle: "Frais de lecture du courriel", tiers: "SHARKOBANK", montant: -490 },
  { id: "o10", date: "19/11", libelle: "Frais de non-régularisation sous 48 heures", tiers: "SHARKOBANK", montant: -2173 },
  { id: "o11", date: "20/11", libelle: "Appel du conseiller (non reçu, forfait sans appels)", tiers: "SHARKOBANK", montant: -490 },
  { id: "o12", date: "21/11", libelle: "Frais d’avertissement", tiers: "SHARKOBANK", montant: -980 },
  { id: "o13", date: "23/11", libelle: "Paiement refusé · commande 43-454535-86729", tiers: "PEEPORN SEX-SHOP", montant: -2199, statut: "rejete" },
  { id: "o14", date: "23/11", libelle: "Frais d’annulation · commande 43-454535-86729", tiers: "PEEPORN SEX-SHOP", montant: -299 },
  { id: "o15", date: "24/11", libelle: "Commission sur paiement refusé", tiers: "SHARKOBANK", montant: -800 },
  { id: "o16", date: "24/11", libelle: "Frais de relance par SMS (non reçu)", tiers: "SHARKOBANK", montant: -980 },
  { id: "o17", date: "24/11", libelle: "Frais de surveillance par requin", tiers: "SHARKOBANK", montant: -1664 },
  { id: "o18", date: "", libelle: "Frais de réseau prioritaire", tiers: "SHARKOBANK", montant: -490, courriel: "sk6" },
  { id: "o19", date: "", libelle: "Frais de notification", tiers: "SHARKOBANK", montant: -490, courriel: "sk7" },
  { id: "o20", date: "", libelle: "Frais de vibration", tiers: "SHARKOBANK", montant: -99, courriel: "sk7" },
];

/** Les opérations visibles (selon les courriels arrivés), les plus récentes en haut, avec le solde après chacune. */
export function releve(arrives: Record<string, string>) {
  let solde = SOLDE_INITIAL;
  const l: (Operation & { apres: number; heure?: string })[] = [];
  for (const o of OPERATIONS) {
    if (o.courriel && !arrives[o.courriel]) continue;
    if (o.statut !== "rejete" && o.statut !== "attente") solde += o.montant;
    l.push({ ...o, apres: solde, heure: o.courriel ? arrives[o.courriel] : undefined });
  }
  return { solde, operations: l.reverse() };
}

export const eurosCentimes = (c: number, signe = true) => `${c < 0 ? "−" : signe && c > 0 ? "+" : ""}${(Math.abs(c) / 100).toFixed(2).replace(".", ",")} €`;

/** La notification bancaire qui suit un courriel Sharkobank arrivé en direct. */
export function annonceBanque(courriel: string, arrives: Record<string, string>) {
  const ops = OPERATIONS.filter((o) => o.courriel === courriel);
  if (!ops.length) return null;
  const total = ops.reduce((s, o) => s + o.montant, 0);
  const { solde } = releve(arrives);
  return { titre: "Sharkobank", texte: `Prélèvement ${eurosCentimes(total)} · Solde ${eurosCentimes(solde)}` };
}
