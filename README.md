# Pala's Scheduler

Personal scheduling, publishing, and analytics app for YouTube, Instagram, TikTok, and X.

## Requirements

- Node.js 20+
- pnpm 9+
- Docker
- cloudflared for testing HTTPS OAuth callbacks

## Setup

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm db:generate
```

Then fill in the required values in `.env.local`.

## Development

```bash
pnpm dev
pnpm worker:dev
```

To test OAuth providers that require HTTPS:

```bash
pnpm run dev:tunnel
```

Open the app with the URL configured in `NEXTAUTH_URL`.

## Scripts

```bash
pnpm dev              # Next.js dev server
pnpm worker:dev       # local BullMQ worker
pnpm type-check       # TypeScript check
pnpm lint             # ESLint
pnpm build            # production build
pnpm db:migrate       # local Prisma migrations
pnpm db:generate      # generate Prisma client
pnpm db:studio        # Prisma Studio
```

## Environment Variables

Expected variables are listed in `.env.example`.

In production, `EMAIL_SERVER` must be set to send login links. Environment variables are validated at server startup and missing required values produce an explicit error.

## OAuth

Configure these callbacks in the provider dashboards:

```txt
https://dev-scheduler.palawi.fr/api/auth/callback/google
https://dev-scheduler.palawi.fr/api/platforms/instagram/callback
https://dev-scheduler.palawi.fr/api/platforms/tiktok/callback
https://dev-scheduler.palawi.fr/api/platforms/twitter/callback
```

## Media Storage

Media files are stored on Cloudflare R2. In development, `R2_PUBLIC_URL` can point to the local proxy route:

```txt
http://localhost:3000/api/media
```

To test publishing through the HTTPS tunnel, use a public URL that social platforms can access.

## Production Docker

Build and run the app, worker, PostgreSQL, and Redis:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Apply production migrations:

```bash
docker compose -f docker-compose.prod.yml run --rm app pnpm db:migrate:prod
```

## Pre-Delivery Checks

```bash
pnpm type-check
pnpm lint
pnpm build
```

## Main Structure

```txt
src/app                 Next.js pages and route handlers
src/components          UI components
src/hooks               TanStack Query hooks
src/lib                 Auth, DB, queue, storage, platforms, analytics
src/workers             BullMQ worker
prisma                  Schema and migrations
```
