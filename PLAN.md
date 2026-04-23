# PLAN.md - Plan de Developpement par Epics

Chaque epic correspond a une branche Git (`feat/nom`). Chaque sous-etape correspond a un commit. Ne pas merger sur `dev` sans validation utilisateur.

---

## Epic 1 : Foundation

**Branche :** `feat/foundation`  
**Objectif :** Mettre en place le squelette du projet avec toutes les configurations de base.

### Sous-etapes

**1.1 - Initialisation Next.js**
- Creer le projet Next.js 15 avec TypeScript, Tailwind CSS, App Router, pnpm
- Configurer `tsconfig.json` avec `strict: true` et alias `@/`
- Configurer ESLint + Prettier avec les regles du projet
- Configurer `.gitignore`, `.env.example`
- **Commit :** `chore(config): init next.js project with typescript and tailwind`

**1.2 - Docker Compose**
- Ecrire `docker-compose.yml` avec services PostgreSQL 16 et Redis 7
- Tester le demarrage des conteneurs
- **Commit :** `chore(config): add docker-compose with postgres and redis`

**1.3 - Prisma Setup**
- Installer Prisma + prisma-client
- Configurer `prisma/schema.prisma` avec le schema complet (User, Account, Session, ConnectedPlatform, Post, PostPlatform, PostAnalytics, enums)
- Creer la premiere migration : `init`
- Creer `src/lib/db.ts` (singleton Prisma)
- Ajouter les scripts `db:migrate`, `db:generate`, `db:studio` dans `package.json`
- **Commit :** `chore(db): setup prisma with full schema and initial migration`

**1.4 - Redis + BullMQ Setup**
- Installer `ioredis` + `bullmq`
- Creer `src/lib/queue.ts` avec l'instance Redis et la definition de la queue `post-scheduler`
- Creer le squelette du worker `src/workers/index.ts` (connection seule, pas encore de logique)
- Ajouter le script `worker:dev` dans `package.json`
- **Commit :** `chore(worker): setup bullmq queue and worker skeleton`

**1.5 - Cloudflare R2 Setup**
- Installer `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Creer `src/lib/storage.ts` avec helpers : `uploadFile`, `deleteFile`, `getPublicUrl`
- **Commit :** `chore(upload): setup cloudflare r2 client and storage helpers`

**1.6 - Layout de Base**
- Creer le layout dashboard `src/app/(dashboard)/layout.tsx` avec sidebar et header (vides mais structures)
- Creer les pages vides pour : `/calendar`, `/posts`, `/analytics`, `/settings`
- Creer `src/components/layout/sidebar.tsx` avec navigation principale (liens seulement)
- Creer `src/components/layout/header.tsx` (structure seule)
- Installer shadcn/ui et ajouter les composants de base : Button, Input, Card, Badge, Dialog, Popover, Select, Separator, Skeleton, Toast, Tooltip
- **Commit :** `feat(layout): add dashboard layout with sidebar and base shadcn components`

**1.7 - Types Globaux**
- Creer `src/types/index.ts` avec les types partages (reprend les enums Prisma cote client)
- Creer `src/types/api.ts` avec les types de reponses API
- Creer `src/lib/constants.ts` (PLATFORM_LABELS, PLATFORM_COLORS, PLATFORM_ICONS)
- Creer `src/lib/utils.ts` (cn helper, formatDate, formatNumber, truncate)
- **Commit :** `chore(config): add global types, constants, and utility functions`

---

### Plan de Test - Epic 1

```markdown
## Plan de Test - Epic 1 : Foundation

### Prerequis
- [ ] Docker Desktop lance
- [ ] pnpm installe (v9+)
- [ ] Node.js 20+ installe

### Scenarios

#### Demarrage de l'environnement
1. `docker-compose up -d` -> les conteneurs postgres et redis demarrent sans erreur
2. `pnpm install` -> pas d'erreur
3. `pnpm db:migrate` -> migration appliquee avec succes
4. `pnpm dev` -> le serveur demarre sur http://localhost:3000
5. http://localhost:3000 -> redirige ou affiche le layout dashboard avec sidebar

#### Verification Prisma
1. `pnpm db:studio` -> Prisma Studio s'ouvre et affiche toutes les tables

#### Verification worker
1. `pnpm worker:dev` dans un second terminal -> le worker demarre sans erreur (message de connexion)

#### Verification TypeScript
1. `pnpm type-check` -> aucune erreur TypeScript
2. `pnpm lint` -> aucune erreur lint

### Points de vigilance
- La DATABASE_URL dans .env.local doit pointer sur le bon port Docker (5432)
- Le sidebar doit etre visible sans JS (SSR)
```

---

## Epic 2 : Authentification & Comptes Connectes

**Branche :** `feat/auth`  
**Depend de :** Epic 1 merge sur `dev`  
**Objectif :** Login utilisateur + connexion des comptes sociaux (OAuth multi-provider).

### Sous-etapes

**2.1 - Auth.js Configuration**
- Installer `next-auth@beta` (v5)
- Creer `src/lib/auth.ts` avec la config de base (adapter Prisma, session strategy JWT)
- Creer `src/app/api/auth/[...nextauth]/route.ts`
- Configurer le provider Email/Magic Link (pour login sans reseaux sociaux)
- Creer la page de login `src/app/(auth)/login/page.tsx`
- **Commit :** `feat(auth): setup auth.js v5 with prisma adapter and email provider`

**2.2 - Protection des Routes**
- Creer `middleware.ts` a la racine pour proteger `/(dashboard)/*`
- Ajouter la redirection vers `/login` si non authentifie
- **Commit :** `feat(auth): add route protection middleware`

**2.3 - Provider Google (YouTube)**
- Ajouter le provider Google dans `src/lib/auth.ts` (scopes YouTube inclus)
- Mettre a jour `.env.example` avec `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Commit :** `feat(auth): add google oauth provider for youtube`

**2.4 - Gestion des Comptes Connectes : API**
- Creer la route `GET /api/platforms` : liste les `ConnectedPlatform` de l'utilisateur
- Creer la route `DELETE /api/platforms/[platform]` : deconnecte un compte
- Creer `src/lib/platforms/index.ts` avec la factory `getPlatformClient(platform)`
- **Commit :** `feat(platforms): add connected platforms api routes`

**2.5 - OAuth Instagram**
- Creer `src/lib/platforms/instagram.ts` avec les helpers OAuth Meta (auth URL, exchange code, refresh token)
- Creer la route `GET /api/platforms/instagram/auth-url`
- Creer la route `GET /api/platforms/instagram/callback`
- Stocker `ConnectedPlatform` en base apres callback
- **Commit :** `feat(instagram): add oauth flow and token storage`

**2.6 - OAuth TikTok**
- Creer `src/lib/platforms/tiktok.ts` avec helpers OAuth TikTok
- Creer les routes `auth-url` et `callback` pour TikTok
- **Commit :** `feat(tiktok): add oauth flow and token storage`

**2.7 - OAuth X (Twitter)**
- Creer `src/lib/platforms/twitter.ts` avec helpers OAuth 2.0 PKCE
- Creer les routes `auth-url` et `callback` pour X
- Stocker le `code_verifier` en session temporaire le temps du flow PKCE
- **Commit :** `feat(twitter): add oauth 2.0 pkce flow and token storage`

**2.8 - Page Parametres : Comptes Connectes**
- Creer `src/app/(dashboard)/settings/platforms/page.tsx`
- Afficher les 4 plateformes avec statut connecte/deconnecte
- Bouton "Connecter" / "Deconnecter" par plateforme
- Afficher l'avatar et le nom d'utilisateur de la plateforme si connecte
- Creer le composant `src/components/platforms/platform-connection-card.tsx`
- **Commit :** `feat(settings): add connected platforms management page`

**2.9 - Header Utilisateur**
- Ajouter dans `header.tsx` : avatar utilisateur + menu deroulant (Parametres, Deconnexion)
- **Commit :** `feat(layout): add user menu to header`

---

### Plan de Test - Epic 2

```markdown
## Plan de Test - Epic 2 : Auth & Comptes

### Prerequis
- [ ] Epic 1 fonctionne
- [ ] Variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET dans .env.local
- [ ] Au moins une variable de plateforme configuree pour tester

### Scenarios

#### Login
1. Aller sur http://localhost:3000 -> redirection vers /login
2. Page /login visible avec formulaire de connexion
3. Se connecter -> redirection vers /calendar

#### Protection des routes
1. Acceder a /calendar sans etre connecte -> redirection vers /login
2. Acceder a /calendar connecte -> page affichee

#### Connexion YouTube (Google)
1. /settings/platforms -> carte YouTube affichee, statut "Non connecte"
2. Cliquer "Connecter" -> redirection vers Google OAuth
3. Autoriser -> redirection vers l'app, carte YouTube passe a "Connecte"
4. Nom de la chaine Google visible sur la carte

#### Deconnexion d'un compte
1. Cliquer "Deconnecter" sur un compte connecte
2. Confirmer -> le compte passe a "Non connecte" sans rechargement de page

#### Securite
1. Appeler GET /api/platforms sans etre connecte -> reponse 401
2. Appeler DELETE /api/platforms/instagram d'un autre utilisateur -> reponse 403 ou 404

### Points de vigilance
- Les tokens OAuth doivent etre visibles dans Prisma Studio (ConnectedPlatform)
- Pas de token visible dans les reponses API ou dans les logs du navigateur
```

---

## Epic 3 : Calendrier & Gestion des Posts

**Branche :** `feat/calendar`  
**Depend de :** Epic 2 merge sur `dev`  
**Objectif :** Calendrier interactif + creation/modification/suppression de posts.

### Sous-etapes

**3.1 - API Posts CRUD**
- Creer les routes `GET /api/posts`, `POST /api/posts`
- Creer les routes `GET /api/posts/[id]`, `PATCH /api/posts/[id]`, `DELETE /api/posts/[id]`
- Valider les bodys avec Zod
- **Commit :** `feat(posts): add post crud api routes with zod validation`

**3.2 - API Upload Media**
- Creer la route `POST /api/upload` : upload un fichier vers R2, retourne l'URL publique
- Valider le type (image/video) et la taille max (500 Mo)
- Creer la route `DELETE /api/upload` : supprimer un fichier de R2 par URL
- **Commit :** `feat(upload): add media upload and delete api routes`

**3.3 - TanStack Query Setup**
- Installer `@tanstack/react-query`
- Creer `src/app/providers.tsx` avec `QueryClientProvider`
- Creer les hooks : `usePosts`, `usePost`, `useCreatePost`, `useUpdatePost`, `useDeletePost`
- **Commit :** `feat(posts): add react query hooks for post management`

**3.4 - Calendrier Principal**
- Installer FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`)
- Creer `src/components/calendar/scheduler-calendar.tsx`
- Afficher les posts schedules comme evenements colores par plateforme
- Vue par defaut : mois. Switcher mois/semaine/jour
- Drag-and-drop pour reprogrammer un post (PATCH scheduledAt)
- **Commit :** `feat(calendar): add interactive fullcalendar with post events`

**3.5 - Formulaire de Creation de Post**
- Creer `src/components/posts/post-form.tsx` avec React Hook Form + Zod
- Champs : titre, caption, hashtags, plateformes selectionnees, date/heure de publication
- Creer `src/components/posts/platform-selector.tsx` (affiche les plateformes connectees seulement)
- Modale de creation accessible depuis le bouton "Nouveau post" et depuis le clic sur le calendrier
- **Commit :** `feat(posts): add post creation form with platform selector`

**3.6 - Upload de Medias dans le Formulaire**
- Creer `src/components/posts/media-uploader.tsx`
- Zone de drag-and-drop ou click pour uploader des fichiers
- Preview des images/videos uploadees
- Suppression d'un media avec nettoyage R2
- **Commit :** `feat(posts): add media uploader with r2 integration`

**3.7 - Evenement Post sur le Calendrier**
- Creer `src/components/calendar/post-event.tsx` : rendu d'un post sur le calendrier
- Afficher icone(s) de plateforme, titre, heure
- Couleur par statut (planifie = bleu, publie = vert, echec = rouge)
- Clic sur un evenement -> ouvrir modale de detail/edition
- **Commit :** `feat(calendar): add post event component with status colors`

**3.8 - Page Liste des Posts**
- Creer `src/app/(dashboard)/posts/page.tsx`
- Tableau ou liste des posts avec filtres : statut, plateforme, periode
- Creer `src/components/posts/post-card.tsx`
- Creer `src/components/posts/post-status-badge.tsx`
- Actions par post : editer, publier maintenant, supprimer
- **Commit :** `feat(posts): add posts list page with filters and actions`

---

### Plan de Test - Epic 3

```markdown
## Plan de Test - Epic 3 : Calendrier & Posts

### Prerequis
- [ ] Epic 2 fonctionne
- [ ] Au moins un compte social connecte
- [ ] Worker demarre

### Scenarios

#### Calendrier
1. /calendar -> le calendrier s'affiche (vue mois par defaut)
2. Boutons de navigation mois precedent/suivant fonctionnent
3. Switcher vers vue semaine et vue jour
4. Cliquer sur un jour vide -> modale de creation de post s'ouvre avec la date pre-remplie

#### Creation d'un post
1. Ouvrir la modale de creation
2. Remplir titre + caption
3. Selectionner une plateforme connectee (non-connectee grisee/absente)
4. Choisir une date dans le futur
5. Sauvegarder -> le post apparait sur le calendrier a la bonne date
6. Dans Prisma Studio : verifier que le post est en base avec statut SCHEDULED

#### Upload de medias
1. Dans la modale, uploader une image
2. Preview visible sous la zone d'upload
3. Supprimer le media -> disparait de la preview
4. Dans Cloudflare R2 (ou logs) : verifier l'upload et la suppression

#### Drag-and-drop
1. Glisser un post sur le calendrier vers une autre date
2. Post mis a jour a la nouvelle date (verifier dans Prisma Studio)

#### Page /posts
1. /posts -> liste des posts visibles
2. Filtre par statut "Planifie" -> seuls les posts schedules affliches
3. Bouton "Supprimer" -> post retire de la liste et du calendrier

### Points de vigilance
- Les plateformes non connectees ne doivent pas apparaitre comme options de selection
- Un post sans date reste en DRAFT, un post avec date future passe a SCHEDULED
```

---

## Epic 4 : Integrations de Publication

**Branche :** `feat/integrations`  
**Depend de :** Epic 2 merge sur `dev`  
**Objectif :** Implementer la publication reelle vers chaque plateforme sociale.

### Sous-etapes

**4.1 - Interface Plateforme (contrat commun)**
- Definir dans `src/lib/platforms/index.ts` l'interface `PlatformPublisher` avec la methode `publish(post, connectedPlatform): Promise<{ platformPostId: string }>`
- Definir les types `PublishPayload` et `PublishResult`
- **Commit :** `feat(platforms): define platform publisher interface and types`

**4.2 - Publication YouTube**
- Installer `googleapis`
- Implementer `src/lib/platforms/youtube.ts` : upload de video via YouTube Data API v3
- Gerer le `resumable upload` pour les grosses videos
- Gerer le refresh de token Google si expire
- **Commit :** `feat(youtube): implement video upload via youtube data api v3`

**4.3 - Publication Instagram**
- Implementer `src/lib/platforms/instagram.ts` : creer un container media puis publier via Instagram Graph API
- Gerer photos et videos (flow different pour chaque type)
- Gerer le refresh du token Meta (tokens 60 jours)
- **Commit :** `feat(instagram): implement content publishing via instagram graph api`

**4.4 - Publication TikTok**
- Implementer `src/lib/platforms/tiktok.ts` : upload video via TikTok Content Posting API
- Gerer le statut asynchrone (polling du statut d'upload TikTok)
- **Commit :** `feat(tiktok): implement video upload via tiktok content posting api`

**4.5 - Publication X (Twitter)**
- Implementer `src/lib/platforms/twitter.ts` : poster un tweet avec media via X API v2
- Upload du media en premier (chunked si video), puis creer le tweet avec `media_ids`
- Gerer le refresh token OAuth 2.0
- **Commit :** `feat(twitter): implement tweet and media posting via x api v2`

**4.6 - Route Publier Maintenant**
- Creer `POST /api/posts/[id]/publish` : publie immediatement sur toutes les plateformes selectionnees
- Mettre a jour le statut `Post` et `PostPlatform` en temps reel
- Retourner les erreurs par plateforme (publication partielle possible)
- **Commit :** `feat(posts): add immediate publish route with per-platform status`

**4.7 - Route Annuler**
- Creer `POST /api/posts/[id]/cancel` : passe le post a `CANCELLED`, retire le job BullMQ si present
- **Commit :** `feat(posts): add post cancellation route`

---

### Plan de Test - Epic 4

```markdown
## Plan de Test - Epic 4 : Integrations de Publication

### Prerequis
- [ ] Comptes sociaux connectes et tokens valides
- [ ] Pour TikTok : sandbox active si pas de vrai compte

### Scenarios

#### Publication YouTube
1. Creer un post avec une video, selectionner YouTube
2. Cliquer "Publier maintenant"
3. Verifier dans YouTube Studio que la video est en ligne
4. Dans Prisma Studio : PostPlatform.status = PUBLISHED, platformPostId rempli

#### Publication Instagram
1. Creer un post avec une image, selectionner Instagram
2. Publier maintenant
3. Verifier sur Instagram que le post est publie

#### Publication X
1. Creer un post texte (ou avec image), selectionner X
2. Publier maintenant
3. Verifier le tweet sur X.com

#### Gestion d'erreur
1. Deconnecter un compte depuis les parametres
2. Tenter de publier sur ce compte
3. L'UI doit afficher une erreur claire (non une erreur generique)
4. Le post sur les autres plateformes doit continuer normalement

#### Annulation
1. Creer un post schedule dans 10 minutes
2. Cliquer "Annuler" -> statut passe a CANCELLED
3. Attendre l'heure de publication -> rien ne se publie

### Points de vigilance
- Les tokens expires doivent declencher un refresh automatique, pas une erreur
- Une erreur sur une plateforme ne doit pas bloquer les autres plateformes du meme post
```

---

## Epic 5 : Moteur de Planification (Worker)

**Branche :** `feat/scheduler`  
**Depend de :** Epic 3 + Epic 4 merges sur `dev`  
**Objectif :** Publier automatiquement les posts a l'heure planifiee.

### Sous-etapes

**5.1 - Worker BullMQ : Logique de Publication**
- Implementer `src/workers/post-scheduler.worker.ts` : consumer BullMQ qui appelle `getPlatformClient(platform).publish(...)`
- Mettre a jour les statuts en base (`PUBLISHING` -> `PUBLISHED` ou `FAILED`)
- Loguer les erreurs par plateforme
- **Commit :** `feat(worker): implement bullmq consumer for scheduled post publishing`

**5.2 - Enqueue au Moment de la Planification**
- Modifier `POST /api/posts` et `PATCH /api/posts/[id]` : si `scheduledAt` est defini et futur, ajouter un job BullMQ avec delay
- Stocker le `jobId` dans `Post.jobId`
- **Commit :** `feat(worker): enqueue bullmq job on post creation and update`

**5.3 - Annulation et Reprogrammation**
- `POST /api/posts/[id]/cancel` : retirer le job BullMQ via `jobId`
- `PATCH /api/posts/[id]` avec nouvelle `scheduledAt` : supprimer l'ancien job, creer un nouveau
- **Commit :** `feat(worker): handle job cancellation and rescheduling`

**5.4 - Retry et Resilience**
- Configurer BullMQ avec 3 tentatives max, backoff exponentiel
- Apres 3 echecs : statut `FAILED`, stocker le message d'erreur dans `PostPlatform.errorMessage`
- Notification UI : afficher les posts en echec dans un badge sur la sidebar
- **Commit :** `feat(worker): add retry logic and failure notification`

**5.5 - Token Refresh dans le Worker**
- Avant chaque publication, verifier si le token expire dans moins d'1 heure
- Si oui : rafraichir via la logique de chaque plateforme avant de publier
- **Commit :** `feat(worker): add proactive token refresh before publishing`

---

### Plan de Test - Epic 5

```markdown
## Plan de Test - Epic 5 : Moteur de Planification

### Prerequis
- [ ] Worker demarre (`pnpm worker:dev`)
- [ ] Comptes sociaux connectes

### Scenarios

#### Publication automatique
1. Creer un post schedule dans 2 minutes
2. Attendre 2 minutes
3. Dans Prisma Studio : Post.status = PUBLISHED, PostPlatform.publishedAt rempli
4. Verifier sur la plateforme que le post est en ligne

#### Reprogrammation
1. Creer un post schedule dans 5 minutes
2. Le modifier pour le planifier dans 10 minutes
3. Attendre 5 minutes -> rien ne se publie
4. Attendre encore 5 minutes -> post publie

#### Annulation
1. Creer un post schedule dans 3 minutes
2. Annuler -> statut CANCELLED
3. Attendre 3 minutes -> rien ne se publie (verifier les logs du worker)

#### Gestion d'echec
1. Simuler un token invalide (modifier manuellement en base)
2. Laisser le post se publier a l'heure prevue
3. Apres 3 tentatives : Post.status = FAILED
4. L'UI affiche un indicateur d'erreur

### Points de vigilance
- Les logs du worker doivent indiquer chaque job traite
- Si le worker redémarre pendant un job, le job doit etre reessaye
```

---

## Epic 6 : Tableau de Bord Analytique

**Branche :** `feat/analytics`  
**Depend de :** Epic 4 + Epic 5 merges sur `dev`  
**Objectif :** Afficher les statistiques de performance des publications par plateforme.

### Sous-etapes

**6.1 - Synchro des Stats depuis les APIs**
- Creer `src/lib/platforms/analytics.ts` : fonctions `fetchYoutubeStats`, `fetchInstagramStats`, `fetchTiktokStats`, `fetchTwitterStats`
- Creer la route `POST /api/analytics/sync` : synchro manuelle des stats pour tous les posts publies
- Stocker les stats dans `PostAnalytics`
- **Commit :** `feat(analytics): add per-platform stats fetching and sync route`

**6.2 - Synchro Automatique**
- Ajouter un job BullMQ recurrent (cron) dans le worker : synchro des stats toutes les 6 heures
- **Commit :** `feat(worker): add recurring analytics sync job`

**6.3 - API Analytics**
- Creer `GET /api/analytics` : stats agregees sur une periode (vues, likes, partages, reach total)
- Creer `GET /api/analytics/[platform]` : stats detaillees par plateforme
- Parametres : `from`, `to` (dates ISO), `platform`
- **Commit :** `feat(analytics): add aggregated and per-platform analytics routes`

**6.4 - Vue d'ensemble (Stats Globales)**
- Creer `src/components/analytics/stats-overview.tsx` : cartes KPI (vues totales, taux d'engagement, posts publies, reach)
- Ajouter sur la page `/analytics`
- **Commit :** `feat(analytics): add global kpi cards to analytics page`

**6.5 - Graphique d'Engagement**
- Creer `src/components/analytics/engagement-chart.tsx` : graphique lineaire vues/likes/partages par jour
- Filtre de periode : 7j, 30j, 90j
- **Commit :** `feat(analytics): add engagement over time line chart`

**6.6 - Stats par Plateforme**
- Creer `src/components/analytics/platform-stats-card.tsx` : carte par plateforme avec stats cles
- Afficher une comparaison visuelle entre plateformes (bar chart)
- **Commit :** `feat(analytics): add per-platform stats cards and comparison chart`

**6.7 - Tableau de Performance des Posts**
- Creer `src/components/analytics/posts-performance-table.tsx` : tableau trié par vues/likes
- Colonnes : titre, plateforme, date, vues, likes, commentaires, taux d'engagement
- **Commit :** `feat(analytics): add posts performance table with sorting`

---

### Plan de Test - Epic 6

```markdown
## Plan de Test - Epic 6 : Analytique

### Prerequis
- [ ] Des posts publies existent (avec platformPostId rempli)
- [ ] Tokens valides pour la lecture des stats

### Scenarios

#### Synchro manuelle
1. /analytics -> cliquer "Synchroniser"
2. Attendre la fin -> les stats se mettent a jour
3. Dans Prisma Studio : des entrees PostAnalytics creees

#### Affichage des KPIs
1. /analytics -> 4 cartes KPI visibles avec des valeurs numeriques
2. Changer le filtre de periode (7j / 30j) -> les valeurs changent

#### Graphique d'engagement
1. Graphique lineaire visible avec des donnees
2. Survol d'un point -> tooltip avec les valeurs du jour

#### Stats par plateforme
1. Une carte par plateforme active visible
2. Les chiffres correspondent a ceux visibles sur les plateformes reelles (approximatif, les APIs ont un delai)

#### Tableau de performance
1. Tableau trié par vues (decroissant) par defaut
2. Cliquer sur une colonne -> tri fonctionne

### Points de vigilance
- Si une plateforme n'a pas de stats, afficher 0 et non une erreur
- Les periodes sans publication doivent afficher 0 sur le graphique, pas de trou
```

---

## Epic 7 : Polish & Production Readiness

**Branche :** `feat/polish`  
**Depend de :** Epic 6 merge sur `dev`  
**Objectif :** Peaufiner l'experience utilisateur et preparer le deploiement.

### Sous-etapes

**7.1 - Etats de Chargement**
- Ajouter des Skeletons sur le calendrier, la liste des posts, et les cards analytiques pendant le fetch
- Ajouter des spinners sur les boutons d'action (publier, sauvegarder)
- **Commit :** `feat(ui): add loading skeletons and button spinners`

**7.2 - Etats Vides**
- Creer des composants "etat vide" pour : calendrier sans post, liste vide, analytics sans donnees
- Textes simples et utiles, suggestion d'action
- **Commit :** `feat(ui): add empty states for calendar, posts, and analytics`

**7.3 - Notifications Toast**
- Brancher le systeme de toast shadcn/ui sur toutes les actions (creation, publication, erreur)
- **Commit :** `feat(ui): add toast notifications for user actions`

**7.4 - Design Responsive**
- Verifier et corriger le layout sur mobile (sidebar en drawer, calendrier scrollable)
- **Commit :** `style(layout): make sidebar and calendar responsive on mobile`

**7.5 - Gestion des Erreurs Globale**
- Creer `src/app/error.tsx` et `src/app/not-found.tsx`
- Ajouter une error boundary sur le dashboard
- **Commit :** `feat(ui): add global error boundary and not found page`

**7.6 - Configuration Production**
- Creer `docker-compose.prod.yml` avec services app + worker + postgres + redis
- Creer `Dockerfile` multi-stage pour Next.js
- Creer `Dockerfile.worker` pour le worker BullMQ
- Ajouter le script `db:migrate:prod` dans `package.json`
- **Commit :** `chore(config): add production docker setup`

**7.7 - Variables d'Environnement : Validation au Demarrage**
- Creer `src/lib/env.ts` avec validation Zod de toutes les variables requises
- Le serveur ne doit pas demarrer si une variable est manquante
- **Commit :** `feat(config): add startup environment variable validation`

**7.8 - README**
- Creer `README.md` avec : description, prerequis, setup local, scripts, deploiement
- **Commit :** `docs(config): add project readme with setup instructions`

---

### Plan de Test - Epic 7

```markdown
## Plan de Test - Epic 7 : Polish & Production

### Scenarios

#### Etats de chargement
1. Recharger /calendar avec une connexion lente (DevTools: throttle 3G)
2. Des skeletons doivent apparaitre avant le contenu
3. Cliquer "Publier" -> le bouton affiche un spinner, puis un toast de succes/erreur

#### Etats vides
1. Supprimer tous les posts
2. /calendar -> message clair, bouton "Creer un post"
3. /analytics sans donnees -> message clair, pas d'erreur

#### Mobile
1. Redimensionner le navigateur a 375px de large
2. La sidebar se replie (ou devient un drawer accessible)
3. Le calendrier est scrollable horizontalement
4. Les formulaires sont utilisables sans zoom

#### Build de production
1. `pnpm build` -> aucune erreur TypeScript ou de build
2. `pnpm start` -> l'app fonctionne comme en dev

#### Validation des variables d'environnement
1. Retirer une variable requise de .env.local
2. `pnpm dev` -> erreur claire au demarrage indiquant la variable manquante

### Points de vigilance
- Verifier que `pnpm build` n'a aucun warning de type "missing key" ou "image optimization"
- Sur mobile, aucun texte ne doit etre tronque involontairement
```

---

## Recapitulatif des Epics

| Epic | Branche | Duree estimee | Depend de |
|---|---|---|---|
| 1 - Foundation | `feat/foundation` | 2-3h | - |
| 2 - Auth | `feat/auth` | 3-4h | 1 |
| 3 - Calendar | `feat/calendar` | 4-5h | 2 |
| 4 - Integrations | `feat/integrations` | 5-6h | 2 |
| 5 - Scheduler | `feat/scheduler` | 3-4h | 3, 4 |
| 6 - Analytics | `feat/analytics` | 3-4h | 4, 5 |
| 7 - Polish | `feat/polish` | 2-3h | 6 |

**Total estime : 22-29h de travail agent**
