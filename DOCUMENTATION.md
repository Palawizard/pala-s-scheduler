# Pala's Scheduler - Documentation Technique

## Vue d'ensemble

Pala's Scheduler est une application web personnelle de planification et publication automatique sur les reseaux sociaux (YouTube, Instagram, TikTok, X). Elle offre un calendrier interactif pour organiser les publications, une gestion des medias, et un tableau de bord analytique par plateforme, en s'inspirant de l'experience utilisateur de Metricool.

**Cible :** usage personnel / equipe reduite (pas de multi-tenancy).

---

## Tech Stack

### Frontend
| Outil | Version | Role |
|---|---|---|
| Next.js | 15.x (App Router) | Framework full-stack |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.x | Styles utilitaires |
| shadcn/ui | latest | Composants UI (Radix UI) |
| TanStack Query | v5 | Fetching & cache cote client |
| Zustand | 5.x | Etat global leger |
| FullCalendar | 6.x | Calendrier interactif drag-and-drop |
| Recharts | 2.x | Graphiques analytiques |
| React Hook Form | 7.x | Gestion de formulaires |
| Zod | 3.x | Validation schemas |
| date-fns | 4.x | Manipulation de dates |

### Backend (Next.js Route Handlers)
| Outil | Version | Role |
|---|---|---|
| Prisma ORM | 6.x | Acces base de donnees |
| PostgreSQL | 16.x | Base de donnees principale |
| Redis | 7.x | Cache + file d'attente |
| BullMQ | 5.x | Worker de publication planifiee |
| Auth.js | v5 (beta) | Authentification OAuth |
| Filesystem local | Node.js | Stockage medias sur l'infra personnelle |
| Sharp | latest | Traitement/compression d'images |

### Infrastructure
| Outil | Role |
|---|---|
| Docker Compose | Environnement de dev local |
| Stockage local | Medias sur volume disque ou NAS personnel |
| Vercel | Deploiement frontend + API routes |
| Railway / Render | PostgreSQL + Redis en prod |

### APIs Sociales
| Plateforme | API |
|---|---|
| YouTube | YouTube Data API v3 |
| Instagram | Instagram Graph API (via Meta) |
| TikTok | TikTok Content Posting API |
| X (Twitter) | X API v2 |

---

## Architecture

```
Browser
  |
  v
Next.js (App Router)
  |-- /app/(dashboard)/*     => Pages UI
  |-- /app/api/*             => Route Handlers (REST)
  |-- /workers/              => BullMQ worker process (Node subprocess)
  |
  v                    v
PostgreSQL           Redis
(Prisma ORM)         (BullMQ queue + cache)
                       |
                       v
                   Worker Process
                   (publier les posts schedules)
                       |
          -------------------------
          |       |       |      |
       YouTube  Insta  TikTok   X API
          |
          v
     Stockage local (medias stockes)
```

Le worker BullMQ tourne en parallele du serveur Next.js (via `npm run worker` ou processus separe en prod). Il consomme des jobs de la queue Redis et appelle les APIs sociales au moment prevu.

---

## Structure du Projet

```
pala-s-scheduler/
|
|-- src/
|   |-- app/
|   |   |-- (auth)/
|   |   |   |-- login/page.tsx
|   |   |   |-- error/page.tsx
|   |   |-- (dashboard)/
|   |   |   |-- layout.tsx
|   |   |   |-- page.tsx                 # redirect vers /calendar
|   |   |   |-- calendar/page.tsx
|   |   |   |-- posts/
|   |   |   |   |-- page.tsx             # liste des posts
|   |   |   |   |-- [id]/page.tsx
|   |   |   |-- analytics/page.tsx
|   |   |   |-- settings/
|   |   |       |-- page.tsx
|   |   |       |-- platforms/page.tsx   # connexion comptes sociaux
|   |   |-- api/
|   |       |-- auth/[...nextauth]/route.ts
|   |       |-- posts/route.ts
|   |       |-- posts/[id]/route.ts
|   |       |-- posts/[id]/publish/route.ts
|   |       |-- platforms/route.ts
|   |       |-- platforms/[platform]/callback/route.ts
|   |       |-- analytics/route.ts
|   |       |-- upload/route.ts
|   |
|   |-- components/
|   |   |-- ui/                          # shadcn/ui auto-genere
|   |   |-- layout/
|   |   |   |-- sidebar.tsx
|   |   |   |-- header.tsx
|   |   |-- calendar/
|   |   |   |-- scheduler-calendar.tsx
|   |   |   |-- post-event.tsx
|   |   |   |-- create-post-popover.tsx
|   |   |-- posts/
|   |   |   |-- post-form.tsx
|   |   |   |-- post-card.tsx
|   |   |   |-- media-uploader.tsx
|   |   |   |-- platform-selector.tsx
|   |   |   |-- post-status-badge.tsx
|   |   |-- analytics/
|   |       |-- stats-overview.tsx
|   |       |-- platform-stats-card.tsx
|   |       |-- engagement-chart.tsx
|   |       |-- posts-performance-table.tsx
|   |
|   |-- lib/
|   |   |-- auth.ts                      # config Auth.js
|   |   |-- db.ts                        # instance Prisma singleton
|   |   |-- queue.ts                     # instance BullMQ + helpers
|   |   |-- storage.ts                   # helpers stockage local
|   |   |-- platforms/
|   |   |   |-- youtube.ts
|   |   |   |-- instagram.ts
|   |   |   |-- tiktok.ts
|   |   |   |-- twitter.ts
|   |   |   |-- index.ts                 # factory: getPlatformClient(platform)
|   |   |-- utils.ts
|   |   |-- constants.ts
|   |
|   |-- workers/
|   |   |-- post-scheduler.worker.ts     # BullMQ consumer
|   |   |-- index.ts                     # entrypoint worker
|   |
|   |-- types/
|       |-- index.ts
|       |-- api.ts
|       |-- platform.ts
|
|-- prisma/
|   |-- schema.prisma
|   |-- migrations/
|
|-- public/
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- .env.example
|-- .env.local                           # gitignore
|-- package.json
|-- tsconfig.json
|-- next.config.ts
|-- tailwind.config.ts
```

---

## Schema de Base de Donnees (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---- Auth.js required models ----

model User {
  id                  String              @id @default(cuid())
  email               String              @unique
  name                String?
  image               String?
  emailVerified       DateTime?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  accounts            Account[]
  sessions            Session[]
  posts               Post[]
  connectedPlatforms  ConnectedPlatform[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ---- App models ----

model ConnectedPlatform {
  id               String    @id @default(cuid())
  userId           String
  platform         Platform
  accessToken      String    @db.Text
  refreshToken     String?   @db.Text
  tokenExpiry      DateTime?
  platformUserId   String
  platformUsername String?
  platformAvatar   String?
  isActive         Boolean   @default(true)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  postPlatforms    PostPlatform[]

  @@unique([userId, platform])
}

model Post {
  id            String         @id @default(cuid())
  userId        String
  title         String?
  caption       String?        @db.Text
  hashtags      String[]
  mediaUrls     String[]
  thumbnailUrl  String?
  scheduledAt   DateTime?
  publishedAt   DateTime?
  status        PostStatus     @default(DRAFT)
  jobId         String?        // BullMQ job ID
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  platforms     PostPlatform[]
}

model PostPlatform {
  id                  String             @id @default(cuid())
  postId              String
  platform            Platform
  connectedPlatformId String
  status              PostPlatformStatus @default(PENDING)
  platformPostId      String?
  errorMessage        String?            @db.Text
  publishedAt         DateTime?
  post                Post               @relation(fields: [postId], references: [id], onDelete: Cascade)
  connectedPlatform   ConnectedPlatform  @relation(fields: [connectedPlatformId], references: [id])
  analytics           PostAnalytics[]

  @@unique([postId, platform])
}

model PostAnalytics {
  id             String       @id @default(cuid())
  postPlatformId String
  views          Int          @default(0)
  likes          Int          @default(0)
  comments       Int          @default(0)
  shares         Int          @default(0)
  saves          Int          @default(0)
  reach          Int          @default(0)
  impressions    Int          @default(0)
  fetchedAt      DateTime     @default(now())
  postPlatform   PostPlatform @relation(fields: [postPlatformId], references: [id], onDelete: Cascade)

  @@index([postPlatformId])
  @@index([fetchedAt])
}

enum Platform {
  YOUTUBE
  INSTAGRAM
  TIKTOK
  TWITTER
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
  CANCELLED
}

enum PostPlatformStatus {
  PENDING
  PUBLISHING
  PUBLISHED
  FAILED
}
```

---

## API Routes

### Posts
| Methode | Route | Description |
|---|---|---|
| GET | `/api/posts` | Liste des posts (filtres: status, platform, dateRange) |
| POST | `/api/posts` | Creer un post (draft ou schedule) |
| GET | `/api/posts/[id]` | Detail d'un post |
| PATCH | `/api/posts/[id]` | Modifier un post |
| DELETE | `/api/posts/[id]` | Supprimer un post |
| POST | `/api/posts/[id]/publish` | Publier immediatement |
| POST | `/api/posts/[id]/cancel` | Annuler un post schedule |

### Platforms
| Methode | Route | Description |
|---|---|---|
| GET | `/api/platforms` | Liste des comptes connectes |
| GET | `/api/platforms/[platform]/auth-url` | Generer l'URL OAuth |
| GET | `/api/platforms/[platform]/callback` | Handler callback OAuth |
| DELETE | `/api/platforms/[platform]` | Deconnecter un compte |
| POST | `/api/platforms/[platform]/refresh` | Rafraichir les tokens |

### Analytics
| Methode | Route | Description |
|---|---|---|
| GET | `/api/analytics` | Stats globales (periode configurable) |
| GET | `/api/analytics/[platform]` | Stats par plateforme |
| POST | `/api/analytics/sync` | Forcer la synchro des stats depuis les APIs |

### Upload
| Methode | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload media vers le stockage local, retourne URL |
| DELETE | `/api/upload` | Supprimer un media du stockage local |

---

## Integrations Sociales

### Prerequis par Plateforme

#### YouTube
- Creer un projet Google Cloud Console
- Activer YouTube Data API v3
- Configurer OAuth 2.0 (scopes: `https://www.googleapis.com/auth/youtube.upload`, `https://www.googleapis.com/auth/youtube.readonly`)
- Redirect URI: `{APP_URL}/api/auth/callback/google`
- La carte compte affiche la chaine YouTube recuperee via `channels.list?mine=true`
- Limite: 10 000 credits/jour (upload = 1600 credits)

#### Instagram
- Compte Meta Developer
- Produit "Instagram API with Instagram Login"
- Compte Instagram professionnel ou createur
- Scopes: `instagram_business_basic`, `instagram_business_content_publish`
- Redirect URI: `{APP_URL}/api/platforms/instagram/callback`
- Note: Les tokens durent 60 jours (refresh automatique via worker)

#### TikTok
- Compte TikTok for Developers
- App avec "Content Posting API" active
- Scopes: `video.upload`, `video.publish`
- Redirect URI: `{APP_URL}/api/platforms/tiktok/callback`
- Note: Sandbox disponible pour dev sans vrai upload

#### X (Twitter)
- Compte X Developer Portal
- App avec "Read and Write" permissions
- OAuth 2.0 avec PKCE
- Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
- Redirect URI: `{APP_URL}/api/platforms/twitter/callback`

---

## Variables d'Environnement

```bash
# .env.example

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Email (magic link) — en dev, le lien apparait dans les logs du serveur
EMAIL_SERVER=
EMAIL_FROM=noreply@localhost

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pala_scheduler

# Redis
REDIS_URL=redis://localhost:6379

# Local media storage
LOCAL_STORAGE_ROOT=./storage          # Dossier local ou volume monte
LOCAL_STORAGE_PUBLIC_URL=http://localhost:3000/api/media
NEXT_PUBLIC_LOCAL_STORAGE_PUBLIC_URL=http://localhost:3000/api/media

# YouTube
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Instagram / Meta
META_APP_ID=
META_APP_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# X (Twitter)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
```

---

## Setup Local (Dev)

### Prerequis
- Node.js 20+
- Docker Desktop
- pnpm 9+
- cloudflared (pour tester les OAuth qui exigent HTTPS)

### Installation

```bash
# 1. Cloner le repo
git clone <repo-url> pala-s-scheduler
cd pala-s-scheduler

# 2. Installer les dependances
pnpm install

# 3. Copier les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 4. Demarrer PostgreSQL + Redis via Docker
docker-compose up -d

# 5. Appliquer les migrations Prisma
pnpm db:migrate

# 6. Seeder la base (optionnel, pour dev)
pnpm db:seed

# 7. Demarrer le serveur de dev
pnpm dev

# 8. Demarrer le tunnel HTTPS (terminal separe, si OAuth social)
pnpm run dev:tunnel

# 9. Demarrer le worker (terminal separe)
pnpm worker:dev
```

### Tunnel HTTPS OAuth

Les providers Instagram, TikTok et X exigent des URLs de callback HTTPS. En dev, le projet utilise un tunnel Cloudflare vers le serveur local.

```bash
pnpm dev
pnpm run dev:tunnel
```

Avec le tunnel configure, ouvrir l'application via :

```txt
https://dev-scheduler.palawi.fr
```

Callbacks a configurer dans les dashboards OAuth :

```txt
https://dev-scheduler.palawi.fr/api/auth/callback/google
https://dev-scheduler.palawi.fr/api/platforms/instagram/callback
https://dev-scheduler.palawi.fr/api/platforms/tiktok/callback
https://dev-scheduler.palawi.fr/api/platforms/twitter/callback
```

### Scripts disponibles

```json
{
  "dev": "next dev --turbopack",
  "dev:tunnel": "cloudflared tunnel run pala-s-scheduler-dev",
  "build": "next build",
  "start": "next start",
  "worker:dev": "tsx watch --env-file .env.local src/workers/index.ts",
  "worker:start": "node --env-file=.env.local dist/workers/index.js",
  "db:migrate": "dotenv -e .env.local -- prisma migrate dev",
  "db:migrate:prod": "prisma migrate deploy",
  "db:generate": "dotenv -e .env.local -- prisma generate",
  "db:studio": "dotenv -e .env.local -- prisma studio",
  "db:seed": "dotenv -e .env.local -- tsx prisma/seed.ts",
  "lint": "eslint src",
  "type-check": "tsc --noEmit"
}
```

---

## Docker Compose (Dev)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pala_scheduler
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Deploiement Production

### Option A: Vercel + Railway

1. **Vercel** : deployer le repo Next.js (auto-detects Next.js)
2. **Railway** : creer deux services — PostgreSQL et Redis
3. Configurer les variables d'environnement dans Vercel
4. Le worker BullMQ doit tourner en tant que service separe (Railway worker ou Render background worker)

### Option B: VPS avec Docker

```yaml
# docker-compose.prod.yml
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: node dist/workers/index.js
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Decisions Architecturales Cles

| Decision | Choix | Raison |
|---|---|---|
| Full-stack framework | Next.js App Router | Simplifie le deploiement, API routes incluses |
| Queue de jobs | BullMQ + Redis | Fiable, retry automatique, UI de monitoring disponible (Bull Board) |
| Auth | Auth.js v5 | Support natif OAuth multi-provider |
| ORM | Prisma | Type-safety, migrations, studio visuel |
| Stockage medias | Stockage local | Compatible infra personnelle, volume disque ou NAS |
| Calendrier | FullCalendar | Drag-and-drop, vues multiples, tres complet |
| State management | Zustand | Leger, pas de boilerplate Redux |
| Composants UI | shadcn/ui | Non-opinionated, copiable dans le projet, accessible |
