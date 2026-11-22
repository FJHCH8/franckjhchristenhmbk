/**
 * Anciens libellés du menu, qui n’étaient pas de Franck. Ils ne sont pas repris.
 */
export const LASSAVI_DE_FRANCK: Record<string, string> = {};

/**
 * Traductions tirées uniquement du dictionnaire de Franck.
 * Une chaîne reste vide dès qu’un mot n’y figure pas : le site affiche alors le français.
 */
export const DAVISSIV: Record<string, string> = {
  "Franck J.H. CHRISTEN H.M.B.K.": "frank j.h christen h.m.b.k",
  "Franck J.H. Christen": "frank j.h christen h.m.b.k",
  Accueil: "Oveksa",
  "Qui suis-je": "Maa eebit",
  "À propos": "Laab",
  Contact: "Abam",
  Projets: "Vayak",
  Bienvenue: "Hantaamis",
  Polymathe: "",
  "02 — Le site": "",
  Présentation: "",
  Horizon: "",
  "Instagram :": "",
  "Retour à l’accueil": "",
  "Cette page n’existe pas.": "",
  "Le lien ne mène nulle part. Le ciel d’accueil, lui, est toujours là.": "",
  "Des projets paraîtront ici.": "",
  "L’attente n’est pas un vide : c’est le noir où les choses prennent forme.": "",
  "Altitude de la page": "",
  "« Ta deuxième vie commence quand tu comprends que tu n’en as qu’une. »": "Lannabtammive alban ash obayes e apashes paa.",
  "— Raphaëlle Giordano": "",
  "Ce site est conçu pour la publication de la vie, des projets et des annonces de Franck.": "",
  "La vie, les projets et les annonces de Franck y prennent place.": "",
  "Le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les 7 jours.": "",
  "Bonjour, je m’appelle Franck J. H. Christen H. M. B. K.": "",
  "Je suis né en 2007 en France.": "",
  "Je suis né différent : TTHPI, profondément et exceptionnellement surdoué, et TDAH.": "",
  "Depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder.": "",
  "Depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment.": "",
  "Ce site, il sert à quoi ?": "",
  "À publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymath au quotidien.": "",
  "Ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. Suivez le compte Instagram de Franck et peut-être serez-vous averti des nouveautés.": "",
};

export function texteDavissiv(francais: string) {
  // Les espaces insécables comptent comme des espaces ordinaires.
  francais = francais.replace(/\u00a0/g, " ");
  const propre = DAVISSIV[francais]?.trim();
  if (propre) return propre;
  const ancien = LASSAVI_DE_FRANCK[francais]?.trim();
  if (ancien) return ancien;
  return francais;
}
