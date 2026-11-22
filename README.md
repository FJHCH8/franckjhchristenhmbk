# Bienvenue — Franck J.H. CHRISTEN H.M.B.K.

Site en français, construit avec Next.js (App Router). Il est prévu pour être déployé sur Vercel.

Deux thèmes persistent dans le navigateur :

- **Clair** — ciel bleu et nuages en couches, avec parallaxe au défilement et au pointeur.
- **Sombre** — ciel nocturne et étoiles, avec le même mouvement.

## Développement

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Production en local

```bash
npm run build
npm run start
```

## Déploiement sur Vercel

1. Importer ce dépôt dans Vercel.
2. Laisser le framework détecté : **Next.js**.
3. Aucune variable d’environnement n’est obligatoire.
4. Optionnel : définir `NEXT_PUBLIC_SITE_URL` (par exemple `https://exemple.tld`) si l’adresse publique n’est plus `https://franckjhchristen.com`. Sans cette variable, l’adresse canonique, le sitemap et les balises Open Graph utilisent cette adresse.
5. Optionnel, plus tard : définir `GOOGLE_SITE_VERIFICATION` avec le jeton `content` de la balise HTML fournie par Google Search Console. Aucun code de vérification n’est inscrit tant que la variable est absente.

Aucune configuration supplémentaire n’est requise : Vercel reconnaît le projet Next.js tel quel.

## Référencement

L’adresse publique est [https://franckjhchristen.com](https://franckjhchristen.com). L’ancienne adresse [https://franckjhchristenhmbk.vercel.app](https://franckjhchristenhmbk.vercel.app) redirige vers ce nom. Le fichier `robots.txt` autorise l’exploration et indique `https://franckjhchristen.com/sitemap.xml`.

Les onglets sont des pages : `/`, `/qui-suis-je`, `/a-propos` et `/contact`. Le sitemap les liste. Une nouvelle page publique est ajoutée toute seule au prochain build dès qu’elle a un fichier de page, par exemple `app/langues/page.tsx`. Les dossiers `(groupe)` ne créent pas de segment d’adresse. Une route dynamique (`[slug]`) se déclare dans `extraPublicPaths` (`lib/site.ts`).

Les aperçus Vercel restent non indexés (`VERCEL_ENV=preview`). La production est indexable.

## Animations

- Les titres apparaissent lettre par lettre et les textes mot par mot (`components/Kinetic.tsx`, composant `Split`). Le grand titre de chaque page se disperse au défilement.
- Sur Qui suis-je, le texte s’allume mot à mot au fil du défilement.
- L’accueil se termine par un récit au défilement : quatre chapitres figés à l’écran, avec les photos du site (`components/Chapitres.tsx`).
- Le changement de page fait monter la nouvelle page derrière un rideau au bord flou.
- Le ciel est un rendu WebGL (`lib/galaxie.ts`) : une Voie lactée dont les nuages et la poussière évoluent sans jamais se répéter, des étoiles sur plusieurs plans, une étoile filante de temps en temps, sur un fond noir. Sans WebGL, l’ancien ciel en 2D prend le relais.
- Les grands titres inversent ce qu’il y a derrière eux (`mix-blend-mode: difference`).
- Sur ordinateur : curseur personnalisé et boutons aimantés (`components/Experience.tsx`).
- À la première visite de la session, la signature de Franck (`public/signature.png`) s’écrit en blanc sur le noir sous un anneau de chargement bleu et blanc, puis le noir s’ouvre en cercle sur le site (`components/Intro.tsx`).
- Police : famille Noto, conçue pour toutes les écritures. Les polices des autres alphabets ne se téléchargent que si une page en contient.
- Partie fluide de l’accueil (`components/Chapitres.tsx`, `components/Ficelle.tsx`) : une seule ficelle lumineuse, dessinée en 2D (aucune 3D), trace un bocal ; un appui long le brise, et la ficelle se délace puis se renoue en les contours des images des quatre chapitres, qui glissent à l’horizontale. Elle ondule comme de l’eau. Environ 600 points : légère même sur de vieux appareils.
- Si une page met plus d’un demi-seconde à venir, l’anneau de chargement bleu et blanc apparaît (`components/Chargement.tsx`).
- Défilement lissé avec inertie : Lenis.
- Sous les chapitres, une grille « bento » (`components/Bento.tsx`) mène à chaque page, avec le compte à rebours en direct.
- En passant d’un chapitre, d’une carte ou de « Suivant » à une page, le grand titre se transforme en titre de la page d’arrivée (View Transitions API).
- Sons (`lib/sons.ts`), désactivés par défaut, à activer avec le bouton « Son » : gouttes d’eau au survol et au clic, souffle et basse aux changements de page, verre et eau à l’éclat du bocal, dans une réverbération générée. Musique « Nostalgia » (`public/audio/nostalgia.mp3`) qui démarre et s’arrête comme un vinyle (vitesse, ton, filtre, grésillement).
- Le noir des photos est transparent, en fondu (`public/fond/*-a.*`, et directement dans le shader des chapitres) : les étoiles apparaissent derrière.
- Section « Une partie ? » (`components/Echecs.tsx`, règles par chess.js, bot dans `lib/bot.ts`) : échecs contre un bot avec les pièces dessinées par Franck (`public/echecs/`). Les pièces glissent, et celle qui est prise saigne.
- Police variable : les grands titres s’épaississent près du curseur et se resserrent quand on défile vite.
- Verre dépoli avec une légère dispersion de couleurs sur les bords.
- Si le mouvement est réduit dans le système, tous les textes s’affichent directement, sans animation.

## Écriture Davissis

La police `public/fonts/davissis.woff2` (6 Ko) dessine l’écriture du Davissis, d’après les formes de Franck. Elle se régénère avec `python3 outils/police-davissis.py` (paquets Python : fonttools, skia-pathops, brotli).

On tape le Davissis en lettres latines, la police l’affiche dans son écriture :

- `aa ii oo ee uu` : voyelles longues ; `a i o e u` après une consonne : signe posé au-dessus ;
- `sh`, `ts` ou `c`, `mg`, `x` : lettres propres ; consonne doublée : signe « ∩ » dessous ; `'` : trait haut ;
- `! . , ; ?` : ponctuation du Davissis.

Sur le site, en mode Davissis, tout texte qui a une traduction dans `lib/davissiv.ts` s’écrit dans cette écriture.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — sert le build
- `npm run lint` — ESLint

Le choix Clair / Sombre est mémorisé dans `localStorage` (clé `fjch-theme`). Sans choix enregistré, le thème suit la préférence du système. Les animations décoratives se simplifient lorsque `prefers-reduced-motion` est actif.
