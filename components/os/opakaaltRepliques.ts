/**
 * Les répliques en jeu : le blond (vulgaire, méchant, macho, trash talk) et le femboy
 * (timide mais taquin, sous-entendus coquins, il rougit et répond). Jamais de racisme,
 * jamais d’insulte ethnique / religieuse / nationale, jamais de sexe explicite.
 * Le français suit le ton de Franck.
 */

export type JeuParole = "morpion" | "puissance4" | "echecs" | "quisuisje" | "navale" | "babyfoot";
export type MomentParole =
  | "coup" | "bien" | "mal" | "presque" | "danger" | "prise" | "manque" | "but" | "faux" | "gagne" | "perd";

const B = {
  coup: [
    "allez bouge toi au lieu de te dorer la pilule.",
    "t’es lent comme une merde au soleil.",
    "ferme un peu ta gueule et joue.",
    "c’est tout ce que t’as dans le crâne ?",
    "je t’attends pas toute la nuit petite merde.",
    "regarde moi ça il réfléchit encore… pathétique.",
  ],
  bien: [
    "merde tu es en train de gagner mmmmmh….",
    "putain t’es trop fort là j’en peux plus merde….",
    "arrête de me marcher dessus comme ça c’est dégueulasse mmmh.",
    "je rougis trop merde tu me défonces….",
    "ok ok t’as un cerveau caché sous tes cheveux roses…",
    "t’es une petite merde trop douée va chier.",
    "oh putain encore une fois tu vas me la mettre.",
  ],
  mal: [
    "ahahah comment tu es trop une merde! Apart te faire enculer tu sais rien faire de plus?!",
    "t’es même pas capable de viser un trou de merde ahah.",
    "pfff t’as le QI d’un caca mou.",
    "tu pues la défaite mon pauvre.",
    "rentre chez toi te vider les boyaux t’es nul.",
    "ahah t’es trop une merde visqueuse.",
    "même un pet ferait un meilleur coup que toi.",
    "pleure un peu ça te va bien la loque.",
  ],
  presque: [
    "merde merde merde tu vas me la faire à l’envers là…",
    "bouge pas je… merde tu es trop près de gagner.",
    "putain mon orgueil il saigne.",
    "un de plus et je te jure je pète un câble.",
  ],
  danger: [
    "ahah c’est bientôt fini pour toi mon mignon.",
    "t’as senti le vent du boulet ? encore un et t’es à terre.",
    "prépare tes larmes petite merde.",
    "je te sens trembler d’ici. j’adore.",
  ],
  prise: [
    "bam je t’enlève ça de sous le nez. merci pour le cadeau.",
    "t’avais pas vu venir hein le dur à cuire.",
    "c’est ça que je fais aux faibles.",
  ],
  manque: [
    "merde… ça compte pas je visais à côté exprès.",
    "le vent a poussé. ferme ta gueule.",
    "j’ai glissé ok ? ça arrive même aux dieux.",
  ],
  but: [
    "AU FOND. t’as vu ça ? t’as vu le monstre ?",
    "goal mon gars. va te rhabiller.",
    "je t’ai mis ça dans la cage comme un sac.",
  ],
  faux: [
    "ahah même pas en rêve. t’es aveugle en plus d’être nul.",
    "non. à côté. comme ta vie.",
    "t’as deviné avec tes fesses ou quoi ?",
  ],
  gagne: [
    "c’est moi le plus fort. baisse les yeux.",
    "tu peux toujours t’essuyer les larmes sur mon t-shirt.",
    "victoire. et moi je suis trop beau en plus. tchuss.",
  ],
  perd: [
    "merde tu es en train de gagner mmmmmh….",
    "ok t’as gagné… ferme-la avant que je change d’avis.",
    "je… j’ai juste eu un trou. ça compte pas dans ma tête.",
  ],
};

const F = {
  coup: [
    "à mon tour… j’essaie de pas trop rougir.",
    "attends je… je réfléchis un peu mon blond.",
    "tu parles beaucoup toi. ça me distrait…",
    "chht… laisse-moi juste poser ça.",
  ],
  bien: [
    "hey… tu rougis ou c’est moi qui vois ça ?",
    "tu parles beaucoup pour quelqu’un qui vient de se faire avoir…",
    "t’es moins viril quand tu perds hein…",
    "encore un coup et je te fais rougir pour de vrai.",
    "mmm j’aime bien quand tu t’énerves… continue.",
    "si tu gagnes tu pourras encore m’insulter mon blond.",
  ],
  mal: [
    "aïe… t’es un peu méchant là mais… ça va.",
    "ok ok t’as le droit de pavoiser… un peu.",
    "je… je m’en remettrai mon prince.",
    "tu sens très fort la victoire. ça me va bien au teint ?",
    "arrête de crier je… je me concentre mmmh.",
  ],
  presque: [
    "encore un petit effort et je te tiens… tu le sens ?",
    "je suis tout proche… tu vas pas me laisser faire ?",
    "mon cœur il bat trop vite merde… encore un.",
  ],
  danger: [
    "oh non… tu vas me l’avoir comme ça ? c’est pas juste…",
    "j’ai les joues en feu. tu pourrais être plus doux.",
    "d’accord tu es très très fort… un peu trop même.",
  ],
  prise: [
    "hé ! c’était à moi ça… voleur trop musclé.",
    "tu me prends tout. t’es vraiment un dur toi.",
    "ok tu l’as eue… tu vas encore te la péter n’est-ce pas.",
  ],
  manque: [
    "oh… à côté. je te taquine pas. à peine.",
    "tu visais mon cœur ou la case ? parce que mon cœur il a tremblé.",
    "raté… je te fais un bisou de consolation ?",
  ],
  but: [
    "oui ! je… j’y crois pas j’ai marqué devant toi.",
    "goal ! tu peux crier un peu si tu veux, ça m’amuse.",
    "je t’ai eu… alors ? toujours aussi viril ?",
  ],
  faux: [
    "non non non… tu cherches trop loin mon blond.",
    "presque… mais pas assez. ça te va mal d’être à côté.",
    "ce n’est pas lui. tu veux un indice ? …non. trop facile.",
  ],
  gagne: [
    "j’ai gagné… je peux le dire tout bas ? j’ai gagné.",
    "alors ? tu m’insulte encore ou tu m’offres un verre ?",
    "je rougis trop. mais j’ai gagné. trop bien.",
  ],
  perd: [
    "ok tu gagnes… tu vas pas être trop cruel j’espère.",
    "t’es trop fort. ça me fait un truc bizarre dans le ventre.",
    "bravo mon blond. t’as le droit d’être insupportable.",
  ],
};

const JEU: Record<JeuParole, { blond: Partial<Record<MomentParole, string[]>>; femboy: Partial<Record<MomentParole, string[]>> }> = {
  morpion: {
    blond: {
      coup: ["une croix de plus et je te fais ravaler tes ronds.", "le morpion c’est pour les hommes. regarde et apprends."],
      presque: ["trois en ligne et je te roule par terre. presque."],
    },
    femboy: {
      coup: ["un petit rond pour toi… tu l’aimes bien mon rond ?"],
      bien: ["mes ronds sont plus mignons que tes croix. désolé."],
    },
  },
  puissance4: {
    blond: {
      coup: ["ça tombe tout seul. comme toi tout à l’heure.", "j’empile, tu subis. le principe est simple."],
      presque: ["quatre et c’est fini. t’as intérêt à prier tes jetons."],
    },
    femboy: {
      coup: ["je glisse ça… tout au fond. t’as vu ?", "doucement le jeton… il aime bien tomber chez toi."],
    },
  },
  echecs: {
    blond: {
      coup: ["les échecs c’est sérieux. arrête de sourire comme un gosse.", "mon cavalier il te recale. habitude."],
      prise: ["ta pièce elle est à moi maintenant. dis merci.", "je t’ai chopé le truc. c’était trop tentant."],
    },
    femboy: {
      coup: ["je pousse mon pion tout près de toi… tu vas rien dire ?", "ton roi il transpire. moi aussi un peu."],
      prise: ["pardon j’ai pris ça… je pouvais pas résister."],
    },
  },
  quisuisje: {
    blond: {
      coup: ["réponds. oui ou non. j’ai pas que ça à faire.", "je vais te trouver. t’es pas si compliqué."],
      faux: ["t’as deviné comme un pied. recompte tes visages."],
    },
    femboy: {
      coup: ["je te pose une question… sois honnête mon blond.", "il a peut-être une barbe… comme toi. ça me va."],
      faux: ["non ce n’est pas lui… tu cherches trop le plus viril. typique."],
    },
  },
  navale: {
    blond: {
      coup: ["feu. et toi tu trembles déjà.", "l’eau elle est froide. plonge."],
      prise: ["touché. j’entends le bois qui craque. j’adore.", "il coule. comme tes chances."],
      manque: ["à l’eau… je recalibre et je te rouvre en deux."],
    },
    femboy: {
      coup: ["je tire… j’espère que je te mouille un peu le moral.", "ploof ? ou bien… plus fort ?"],
      prise: ["touché ! ah je… je m’excuse pas du tout en fait."],
      manque: ["à l’eau. je visais autre chose je te jure."],
    },
  },
  babyfoot: {
    blond: {
      coup: ["pousse tes barreaux au lieu de poser pour la galerie.", "c’est du baby-foot pas une danse. frappe."],
      but: ["DANS LA CAGE. mange ça.", "le filet il a pleuré. moi je ris."],
    },
    femboy: {
      coup: ["je caresse la balle un peu et… tiens.", "tes barreaux sont trop sérieux. les miens ils s’amusent."],
      but: ["but ! je saute tout petit pour pas trop le montrer."],
    },
  },
};

function melange<T>(l: T[], eviter?: string): T[] {
  const a = [...l];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  if (eviter && a.length > 1 && a[0] === eviter) a.push(a.shift()!);
  return a;
}

const files: Record<string, string[]> = {};

export function uneReplique(qui: "blond" | "femboy", jeu: JeuParole, moment: MomentParole, eviter?: string): string {
  const base = qui === "blond" ? B[moment] : F[moment];
  const extra = (qui === "blond" ? JEU[jeu].blond[moment] : JEU[jeu].femboy[moment]) ?? [];
  const cle = `${qui}:${jeu}:${moment}`;
  let file = files[cle];
  if (!file || !file.length) file = files[cle] = melange([...base, ...extra], eviter);
  const t = file.shift()!;
  return t;
}
