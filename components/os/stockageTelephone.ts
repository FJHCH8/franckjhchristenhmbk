/** Le stockage interne du téléphone (les mêmes chiffres que Fichiers). */
export const CAPACITE_TELEPHONE = 12_884_901_888;
export const SYSTEME_TELEPHONE = 1_932_735_283;
/** Photos, vidéo, musiques préchargées : les mêmes tailles que dans Fichiers. */
const FICHIERS = 139_401 + 324_684 + 9_251_520 + 4_462_549;
export const occupeTelephone = () => SYSTEME_TELEPHONE + FICHIERS;
export const tailleOctets = (o: number) =>
  o >= 1_073_741_824
    ? `${(o / 1_073_741_824).toFixed(2).replace(".", ",")} Go`
    : o >= 1_000_000
      ? `${(o / 1_048_576).toFixed(2).replace(".", ",")} Mo`
      : o >= 1000
        ? `${(o / 1024).toFixed(2).replace(".", ",")} Ko`
        : `${o} o`;
