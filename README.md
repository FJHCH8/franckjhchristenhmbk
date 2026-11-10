# Site personnel — Franck J.H. Christen H.M.B.K.

Site personnel en français, construit avec Next.js (App Router). Il est prévu pour être déployé sur Vercel.

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
4. Optionnel : définir `NEXT_PUBLIC_SITE_URL` (par exemple `https://exemple.tld`) pour que l’adresse canonique et les balises Open Graph pointent vers le domaine définitif.

Aucune configuration supplémentaire n’est requise : Vercel reconnaît le projet Next.js tel quel.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — sert le build
- `npm run lint` — ESLint

Le choix Clair / Sombre est mémorisé dans `localStorage` (clé `fjch-theme`). Sans choix enregistré, le thème suit la préférence du système. Les animations décoratives se simplifient lorsque `prefers-reduced-motion` est actif.
