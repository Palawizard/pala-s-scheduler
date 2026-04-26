# Pala's Scheduler

Application personnelle de planification, publication et suivi analytique pour YouTube, Instagram, TikTok et X.

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker
- cloudflared pour tester les callbacks OAuth en HTTPS

## Installation

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm db:generate
```

Renseigner ensuite les variables dans `.env.local`.

## Développement

```bash
pnpm dev
pnpm worker:dev
```

Pour tester les OAuth qui exigent HTTPS :

```bash
pnpm run dev:tunnel
```

Ouvrir l’application avec l’URL configurée dans `NEXTAUTH_URL`.

## Scripts

```bash
pnpm dev              # serveur Next.js
pnpm worker:dev       # worker BullMQ local
pnpm type-check       # vérification TypeScript
pnpm lint             # lint ESLint
pnpm build            # build production
pnpm db:migrate       # migrations Prisma en local
pnpm db:generate      # génération du client Prisma
pnpm db:studio        # Prisma Studio
```

## Variables d’environnement

Les variables attendues sont listées dans `.env.example`.

En production, `EMAIL_SERVER` doit être renseigné pour envoyer les liens de connexion. La validation des variables est faite au démarrage serveur et renvoie une erreur explicite si une valeur requise manque.

## OAuth

Configurer ces callbacks dans les consoles des plateformes :

```txt
https://dev-scheduler.palawi.fr/api/auth/callback/google
https://dev-scheduler.palawi.fr/api/platforms/instagram/callback
https://dev-scheduler.palawi.fr/api/platforms/tiktok/callback
https://dev-scheduler.palawi.fr/api/platforms/twitter/callback
```

## Stockage médias

Les médias sont stockés sur Cloudflare R2. En développement, `R2_PUBLIC_URL` peut pointer vers la route proxy locale :

```txt
http://localhost:3000/api/media
```

Pour tester la publication via le tunnel HTTPS, utiliser une URL publique accessible par les plateformes.

## Docker production

Construire et lancer l’application, le worker, PostgreSQL et Redis :

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Appliquer les migrations en production :

```bash
docker compose -f docker-compose.prod.yml run --rm app pnpm db:migrate:prod
```

## Vérifications avant livraison

```bash
pnpm type-check
pnpm lint
pnpm build
```

## Structure principale

```txt
src/app                 Pages et route handlers Next.js
src/components          Interface utilisateur
src/hooks               Hooks TanStack Query
src/lib                 Auth, DB, queue, stockage, plateformes, analytics
src/workers             Worker BullMQ
prisma                  Schéma et migrations
```
