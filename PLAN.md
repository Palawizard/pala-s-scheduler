# PLAN.md - Plan de Developpement par Epics

Chaque epic correspond a une branche Git (`feat/nom`). Chaque sous-etape correspond a un commit. Ne pas merger sur `dev` sans validation utilisateur.

---

## Progression

| Epic | Statut | Branche | Depend de |
|---|---|---|---|
| 1 - Foundation | TERMINE | `feat/foundation` | - |
| 2 - Auth | TERMINE | `feat/auth` | 1 |
| 3 - Calendar | A FAIRE | `feat/calendar` | 2 |
| 4 - Integrations | A FAIRE | `feat/integrations` | 2 |
| 5 - Scheduler | A FAIRE | `feat/scheduler` | 3, 4 |
| 6 - Analytics | A FAIRE | `feat/analytics` | 4, 5 |
| 7 - Polish | A FAIRE | `feat/polish` | 6 |

---

## Epic 1 : Foundation — TERMINE

**Branche :** `feat/foundation` (merge sur `dev` le 23/04/2026)
**Objectif :** Mettre en place le squelette du projet avec toutes les configurations de base.

### Sous-etapes

- [x] **1.1** Init Next.js 15 + TypeScript + Tailwind v4 + ESLint + Prettier + shadcn/ui
  - `chore(config): init next.js project with typescript and tailwind`
- [x] **1.2** Docker Compose (PostgreSQL 16 + Redis 7)
  - `chore(config): add docker-compose with postgres and redis`
- [x] **1.3** Prisma schema complet + migration `init` + `src/lib/db.ts`
  - `chore(db): setup prisma with full schema and initial migration`
- [x] **1.4** BullMQ queue (`src/lib/queue.ts`) + worker skeleton (`src/workers/index.ts`)
  - `chore(worker): setup bullmq queue and worker skeleton`
- [x] **1.5** Cloudflare R2 helpers (`src/lib/storage.ts`)
  - `chore(upload): setup cloudflare r2 client and storage helpers`
- [x] **1.6** Layout dashboard + sidebar + header + pages vides + composants shadcn/ui
  - `feat(layout): add dashboard layout with sidebar and base shadcn components`
- [x] **1.7** Types globaux + constantes + utils
  - `chore(config): add global types, constants, and utility functions`
- [x] Fix ESLint (`@eslint/eslintrc` manquant)
  - `fix(config): add missing eslint eslintrc package`
- [x] Fix Prisma scripts (ajout `dotenv-cli` pour charger `.env.local`) + migration appliquee
  - `fix(db): add dotenv-cli to prisma scripts and apply initial migration`

### Notes post-implementation

- Les scripts `db:*` utilisent `dotenv -e .env.local --` pour charger les variables (Prisma ne lit pas `.env.local` nativement).
- `pnpm db:migrate` est interactif : Prisma demande un nom de migration. Passer `--name <nom>` directement : `DATABASE_URL=... pnpm exec prisma migrate dev --name <nom>`.
- shadcn installe automatiquement les dependances Radix UI manquantes dans `package.json`.

---

## Epic 2 : Authentification & Comptes Connectes — TERMINE

**Branche :** `feat/auth` (merge sur `dev` le 24/04/2026)
**Depend de :** Epic 1 (merge sur `dev`)
**Objectif :** Login utilisateur + connexion des comptes sociaux (OAuth multi-provider).

### Sous-etapes

- [x] **2.1** Auth.js v5 + adapter Prisma + provider Email/Magic Link + page login
  - `feat(auth): setup auth.js v5 with prisma adapter and email provider`
- [x] **2.2** Middleware de protection des routes (`/(dashboard)/*`)
  - `feat(auth): add route protection middleware`
- [x] **2.3** Provider Google OAuth (scopes YouTube)
  - `feat(auth): add google oauth provider for youtube`
- [x] **2.4** API `GET /api/platforms` + `DELETE /api/platforms/[platform]` + factory `getPlatformClient`
  - `feat(platforms): add connected platforms api routes`
- [x] **2.5** OAuth Instagram (Meta Graph API) : auth-url + callback + stockage token
  - `feat(instagram): add oauth flow and token storage`
- [x] **2.6** OAuth TikTok : auth-url + callback + stockage token
  - `feat(tiktok): add oauth flow and token storage`
- [x] **2.7** OAuth X (Twitter) : OAuth 2.0 PKCE + auth-url + callback + stockage token
  - `feat(twitter): add oauth pkce flow and token storage`
- [x] **2.8** Page `/settings/platforms` : cartes de connexion par plateforme
  - `feat(settings): add platforms page with connection cards`
- [x] **2.9** Menu utilisateur dans le header (avatar + deconnexion)
  - `feat(header): add user avatar and dropdown menu`

### Plan de Test - Epic 2

```markdown
## Plan de Test - Epic 2 : Auth & Comptes

### Prerequis
- [ ] Epic 1 fonctionne
- [ ] Serveur de dev lance (`pnpm dev`)
- [ ] Tunnel HTTPS lance (`pnpm run dev:tunnel`)
- [ ] Application ouverte via `https://dev-scheduler.palawi.fr`
- [ ] Variables OAuth configurees dans `.env.local`

### Scenarios

#### Login
1. Aller sur `https://dev-scheduler.palawi.fr` sans session -> redirection vers `/login`
2. Page /login visible avec formulaire de connexion
3. Se connecter -> redirection vers /calendar

#### Protection des routes
1. Acceder a /calendar sans etre connecte -> redirection vers /login
2. Acceder a /calendar connecte -> page affichee

#### Connexion YouTube (Google)
1. /settings/platforms -> carte YouTube affichee, statut "Non connecte"
2. Cliquer "Connecter" -> redirection vers Google OAuth
3. Autoriser -> redirection vers l'app, carte YouTube passe a "Connecte"
4. Nom et avatar de la chaine YouTube visibles sur la carte

#### Connexion Instagram, TikTok et X
1. /settings/platforms -> cartes visibles, statut "Non connecte"
2. Cliquer "Connecter" sur chaque plateforme
3. Autoriser -> retour sur l'app, carte de la plateforme passe a "Connecte"
4. Nom/avatar du compte plateforme visibles quand l'API les renvoie

#### Deconnexion d'un compte
1. Cliquer "Deconnecter" sur un compte connecte
2. Le compte passe a "Non connecte" sans rechargement de page

#### Securite
1. Appeler GET /api/platforms sans etre connecte -> reponse 401
2. Appeler DELETE /api/platforms/instagram d'un autre utilisateur -> reponse 403 ou 404

### Points de vigilance
- Les tokens OAuth doivent etre visibles dans Prisma Studio (ConnectedPlatform)
- Pas de token visible dans les reponses API ou dans les logs du navigateur
- Les callbacks OAuth doivent utiliser le domaine HTTPS tunnel, pas `localhost`
```

---

## Epic 3 : Calendrier & Gestion des Posts — A FAIRE

**Branche :** `feat/calendar`
**Depend de :** Epic 2 (merge sur `dev`)
**Objectif :** Calendrier interactif + creation/modification/suppression de posts.

### Sous-etapes

- [ ] **3.1** API CRUD posts (`GET`, `POST`, `PATCH`, `DELETE`) avec validation Zod
  - `feat(posts): add post crud api routes with zod validation`
- [ ] **3.2** API upload media vers R2 + suppression
  - `feat(upload): add media upload and delete api routes`
- [ ] **3.3** TanStack Query setup + hooks posts (`usePosts`, `useCreatePost`, etc.)
  - `feat(posts): add react query hooks for post management`
- [ ] **3.4** Calendrier FullCalendar interactif (drag-and-drop, vues mois/semaine/jour)
  - `feat(calendar): add interactive fullcalendar with post events`
- [ ] **3.5** Formulaire de creation de post (React Hook Form + Zod + modale)
  - `feat(posts): add post creation form with platform selector`
- [ ] **3.6** Upload de medias dans le formulaire (drag-and-drop + preview + R2)
  - `feat(posts): add media uploader with r2 integration`
- [ ] **3.7** Composant evenement post sur le calendrier (icones + couleurs par statut)
  - `feat(calendar): add post event component with status colors`
- [ ] **3.8** Page `/posts` : liste avec filtres + actions (editer, publier, supprimer)
  - `feat(posts): add posts list page with filters and actions`

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
2. Filtre par statut "Planifie" -> seuls les posts schedules affiches
3. Bouton "Supprimer" -> post retire de la liste et du calendrier

### Points de vigilance
- Les plateformes non connectees ne doivent pas apparaitre comme options de selection
- Un post sans date reste en DRAFT, un post avec date future passe a SCHEDULED
```

---

## Epic 4 : Integrations de Publication — A FAIRE

**Branche :** `feat/integrations`
**Depend de :** Epic 2 (merge sur `dev`)
**Objectif :** Implementer la publication reelle vers chaque plateforme sociale.

### Sous-etapes

- [ ] **4.1** Interface `PlatformPublisher` + types `PublishPayload` et `PublishResult`
  - `feat(platforms): define platform publisher interface and types`
- [ ] **4.2** Publication YouTube (resumable upload + refresh token)
  - `feat(youtube): implement video upload via youtube data api v3`
- [ ] **4.3** Publication Instagram (container media + refresh token 60j)
  - `feat(instagram): implement content publishing via instagram graph api`
- [ ] **4.4** Publication TikTok (polling statut upload asynchrone)
  - `feat(tiktok): implement video upload via tiktok content posting api`
- [ ] **4.5** Publication X/Twitter (chunked media + tweet + refresh token)
  - `feat(twitter): implement tweet and media posting via x api v2`
- [ ] **4.6** Route `POST /api/posts/[id]/publish` (publication immediate multi-plateforme)
  - `feat(posts): add immediate publish route with per-platform status`
- [ ] **4.7** Route `POST /api/posts/[id]/cancel`
  - `feat(posts): add post cancellation route`

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

## Epic 5 : Moteur de Planification (Worker) — A FAIRE

**Branche :** `feat/scheduler`
**Depend de :** Epic 3 + Epic 4 (merges sur `dev`)
**Objectif :** Publier automatiquement les posts a l'heure planifiee.

### Sous-etapes

- [ ] **5.1** Worker BullMQ : consumer qui appelle `getPlatformClient(platform).publish(...)`
  - `feat(worker): implement bullmq consumer for scheduled post publishing`
- [ ] **5.2** Enqueue job BullMQ a la creation/modification d'un post schedule
  - `feat(worker): enqueue bullmq job on post creation and update`
- [ ] **5.3** Annulation et reprogrammation des jobs
  - `feat(worker): handle job cancellation and rescheduling`
- [ ] **5.4** Retry (3 tentatives, backoff exponentiel) + badge echec dans la sidebar
  - `feat(worker): add retry logic and failure notification`
- [ ] **5.5** Refresh proactif des tokens avant publication
  - `feat(worker): add proactive token refresh before publishing`

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

## Epic 6 : Tableau de Bord Analytique — A FAIRE

**Branche :** `feat/analytics`
**Depend de :** Epic 4 + Epic 5 (merges sur `dev`)
**Objectif :** Afficher les statistiques de performance des publications par plateforme.

### Sous-etapes

- [ ] **6.1** Fonctions de fetch stats par plateforme + route `POST /api/analytics/sync`
  - `feat(analytics): add per-platform stats fetching and sync route`
- [ ] **6.2** Job BullMQ recurrent : synchro des stats toutes les 6 heures
  - `feat(worker): add recurring analytics sync job`
- [ ] **6.3** Routes `GET /api/analytics` et `GET /api/analytics/[platform]`
  - `feat(analytics): add aggregated and per-platform analytics routes`
- [ ] **6.4** Cartes KPI globales (vues, engagement, reach, posts publies)
  - `feat(analytics): add global kpi cards to analytics page`
- [ ] **6.5** Graphique d'engagement dans le temps (Recharts, filtres 7j/30j/90j)
  - `feat(analytics): add engagement over time line chart`
- [ ] **6.6** Cartes stats par plateforme + bar chart comparatif
  - `feat(analytics): add per-platform stats cards and comparison chart`
- [ ] **6.7** Tableau de performance des posts (tri par vues/likes)
  - `feat(analytics): add posts performance table with sorting`

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

## Epic 7 : Polish & Production Readiness — A FAIRE

**Branche :** `feat/polish`
**Depend de :** Epic 6 (merge sur `dev`)
**Objectif :** Peaufiner l'experience utilisateur et preparer le deploiement.

### Sous-etapes

- [ ] **7.1** Skeletons de chargement + spinners sur les boutons d'action
  - `feat(ui): add loading skeletons and button spinners`
- [ ] **7.2** Etats vides (calendrier, liste posts, analytics)
  - `feat(ui): add empty states for calendar, posts, and analytics`
- [ ] **7.3** Notifications toast (sonner) sur toutes les actions
  - `feat(ui): add toast notifications for user actions`
- [ ] **7.4** Responsive mobile (sidebar en drawer, calendrier scrollable)
  - `style(layout): make sidebar and calendar responsive on mobile`
- [ ] **7.5** Error boundary globale + page 404
  - `feat(ui): add global error boundary and not found page`
- [ ] **7.6** Docker Compose prod + Dockerfile multi-stage (app + worker)
  - `chore(config): add production docker setup`
- [ ] **7.7** Validation des variables d'environnement au demarrage (`src/lib/env.ts`)
  - `feat(config): add startup environment variable validation`
- [ ] **7.8** README
  - `docs(config): add project readme with setup instructions`

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
