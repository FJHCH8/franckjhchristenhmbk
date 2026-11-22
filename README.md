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
- À la première visite de la session, une courte ouverture compose le nom (`components/Intro.tsx`).
- Police : famille Noto, conçue pour toutes les écritures. Les polices des autres alphabets ne se téléchargent que si une page en contient.
- Partie fluide de l’accueil (`components/Chapitres.tsx`, `components/ParticulesScene.tsx`) : sous la citation, un bocal dessiné par une ficelle lumineuse. Un appui long le brise ; les particules jaillissent et deviennent les images des quatre chapitres, qui glissent à l’horizontale, collés les uns aux autres. React Three Fiber, shaders GLSL, simulation GPGPU, vortex de bruit curl, répulsion au curseur, bloom. Les particules couvrent l’écran dans cette partie, puis se raréfient en fondu. Sans WebGL ou avec le mouvement réduit, les chapitres s’affichent avec leurs photos.
- Défilement lissé avec inertie : Lenis.
- Sous les chapitres, une grille « bento » (`components/Bento.tsx`) mène à chaque page, avec le compte à rebours en direct.
- En passant d’un chapitre, d’une carte ou de « Suivant » à une page, le grand titre se transforme en titre de la page d’arrivée (View Transitions API).
- Sons (`lib/sons.ts`), désactivés par défaut, à activer avec le bouton « Son » : gouttes d’eau au survol et au clic, souffle et basse aux changements de page, verre et eau à l’éclat du bocal, dans une réverbération générée. Musique « Nostalgia » (`public/audio/nostalgia.mp3`) qui démarre et s’arrête comme un vinyle (vitesse, ton, filtre, grésillement).
- Le noir des photos est transparent, en fondu (`public/fond/*-a.*`, et directement dans le shader des chapitres) : les étoiles apparaissent derrière.
- Section « Une partie ? » (`components/Echecs.tsx`, règles par chess.js, bot dans `lib/bot.ts`) : échecs contre un bot avec les pièces dessinées par Franck (`public/echecs/`). Les pièces glissent, et celle qui est prise saigne.
- Police variable : les grands titres s’épaississent près du curseur et se resserrent quand on défile vite.
- Verre dépoli avec une légère dispersion de couleurs sur les bords.
- Si le mouvement est réduit dans le système, tous les textes s’affichent directement, sans animation.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — sert le build
- `npm run lint` — ESLint

Le choix Clair / Sombre est mémorisé dans `localStorage` (clé `fjch-theme`). Sans choix enregistré, le thème suit la préférence du système. Les animations décoratives se simplifient lorsque `prefers-reduced-motion` est actif.
