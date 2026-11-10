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
4. Optionnel : définir `NEXT_PUBLIC_SITE_URL` (par exemple `https://exemple.tld`) lorsque le domaine définitif n’est plus `https://franckjhchristenhmbk.vercel.app`. Sans cette variable, l’adresse canonique, le sitemap et les balises Open Graph utilisent cette adresse.
5. Optionnel, plus tard : définir `GOOGLE_SITE_VERIFICATION` avec le jeton `content` de la balise HTML fournie par Google Search Console. Aucun code de vérification n’est inscrit tant que la variable est absente.

Aucune configuration supplémentaire n’est requise : Vercel reconnaît le projet Next.js tel quel.

## Référencement

L’adresse publique est [https://franckjhchristenhmbk.vercel.app](https://franckjhchristenhmbk.vercel.app). Le fichier `robots.txt` autorise l’exploration et indique `https://franckjhchristenhmbk.vercel.app/sitemap.xml`.

Le site est une seule page : les ancres `#accueil`, `#a-propos` et `#contact` restent sur `/` dans le sitemap. Une nouvelle page publique est ajoutée toute seule au prochain build dès qu’elle a un fichier de page, par exemple `app/langues/page.tsx`. Les dossiers `(groupe)` ne créent pas de segment d’adresse. Une route dynamique (`[slug]`) se déclare dans `extraPublicPaths` (`lib/site.ts`).

Les aperçus Vercel restent non indexés (`VERCEL_ENV=preview`). La production est indexable.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — sert le build
- `npm run lint` — ESLint

Le choix Clair / Sombre est mémorisé dans `localStorage` (clé `fjch-theme`). Sans choix enregistré, le thème suit la préférence du système. Les animations décoratives se simplifient lorsque `prefers-reduced-motion` est actif.
