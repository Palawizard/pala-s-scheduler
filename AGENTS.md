# AGENTS.md - Instructions pour les Agents de Code

Ce fichier contient les regles de travail que tout agent de code doit respecter sur ce projet. Lire et appliquer avant toute action.

---

## 1. Principes Generaux

- Coder en **anglais** (noms de variables, fonctions, commentaires, types, tests).
- L'interface utilisateur est en **francais** : tous les textes visibles a l'ecran (labels, boutons, messages, placeholders) sont en francais.
- Pas d'emoji dans le code ni dans les fichiers de documentation.
- Ne pas ajouter de fonctionnalites non demandees dans l'epic courante.
- Ne pas introduire d'abstraction prematuree : trois lignes similaires valent mieux qu'une abstraction inutile.
- Pas de commentaires qui expliquent CE QUE fait le code. Commenter uniquement le POURQUOI quand c'est non-evident.
- Ne pas ecrire de docstrings multi-lignes.
- Valider les entrees uniquement aux frontieres systeme (input utilisateur, reponses API externes). Faire confiance aux garanties internes du framework.

---

## 2. Git Workflow

### Schema general

```
main          <- production stable
  |
  dev         <- integration, base de toutes les branches d'epic
    |
    feat/foundation
    feat/auth
    feat/calendar
    ...
```

### Regles strictes

1. **Une branche par epic** : creer `feat/nom-de-l-epic` a partir de `dev` en debut d'epic.
2. **Ne jamais merger sur `dev` directement** : ouvrir une Pull Request depuis la branche epic vers `dev` en fin d'epic, puis attendre la validation de l'utilisateur.
3. **Un commit par sous-etape** : chaque sous-etape du plan correspond a exactement un commit sur la branche epic en cours.
4. **Ne jamais squasher les commits** sans instruction explicite de l'utilisateur.
5. **Ne jamais force-pusher** sans accord explicite.
6. **Ne jamais skipper les hooks** (`--no-verify`) sauf instruction explicite.

### Creer une branche d'epic

```bash
git checkout dev
git pull origin dev
git checkout -b feat/nom-court
```

### Ouvrir la PR en fin d'epic

```bash
gh pr create \
  --base dev \
  --title "feat(scope): nom de l-epic" \
  --body "$(cat <<'EOF'
## Contenu

- Liste des sous-etapes implementees

## A verifier par l'utilisateur

Voir le plan de test fourni dans la conversation.
EOF
)"
```

---

## 3. Conventions de Commits

### Format obligatoire

```
type(scope): chose accomplie
```

- **Pas de body**.
- **Pas de co-auteurs** dans le message.
- **Pas de majuscule** apres le `:`.
- **Pas de point** en fin de message.
- Toujours en **anglais**.
- Imperatif present : "add", "fix", "remove", pas "added", "fixing".

### Types valides

| Type | Quand l'utiliser |
|---|---|
| `feat` | Nouvelle fonctionnalite visible |
| `fix` | Correction de bug |
| `chore` | Config, setup, dependances, scripts |
| `refactor` | Restructuration sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `style` | Formatage, lint, pas de logique |
| `ci` | Pipelines CI/CD |
| `perf` | Optimisation de performance |

### Scopes valides

Les scopes correspondent aux grandes zones du projet :

`auth`, `calendar`, `posts`, `platforms`, `analytics`, `upload`, `worker`, `db`, `ui`, `config`, `layout`, `youtube`, `instagram`, `tiktok`, `twitter`

### Exemples corrects

```
feat(calendar): add drag-and-drop rescheduling
fix(worker): handle expired token on instagram publish
chore(db): add PostAnalytics migration
refactor(platforms): extract token refresh to shared helper
feat(posts): add media uploader with R2 integration
docs(auth): document oauth callback flow
```

### Exemples incorrects (a ne pas faire)

```
feat: add stuff                          # scope manquant
Fix(calendar): Fixed the bug.            # majuscule + point
feat(calendar): added drag-and-drop      # passe compose
update things                            # pas de type
```

---

## 4. Noms de Branches

### Format

```
type/description-courte
```

Exemples :
- `feat/foundation`
- `feat/auth`
- `feat/calendar`
- `feat/integrations`
- `feat/scheduler`
- `feat/analytics`
- `feat/polish`
- `fix/instagram-token-refresh`
- `chore/update-dependencies`

---

## 5. Standards de Code

### TypeScript

- `strict: true` dans `tsconfig.json`.
- Pas de `any` explicite. Utiliser `unknown` si le type est vraiment inconnu, puis affiner.
- Typer les retours de fonctions publiques explicitement.
- Preferer les `type` aux `interface` sauf pour les objets extensibles.
- Pas d'`enum` TypeScript : utiliser des `const` objects ou des union types.

```typescript
// Bien
const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER'] as const
type Platform = typeof PLATFORMS[number]

// A eviter
enum Platform { YOUTUBE, INSTAGRAM, TIKTOK, TWITTER }
```

### Imports

- Utiliser les alias `@/` pour les imports internes (configure dans `tsconfig.json`).
- Grouper les imports : externe > interne > relatif.

```typescript
import { z } from 'zod'
import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { PostStatus } from '@/types'

import { formatDate } from '../utils'
```

### API Routes (Route Handlers Next.js)

- Toujours retourner un `NextResponse.json(...)` typee.
- Valider le body avec Zod avant tout traitement.
- Gerer les erreurs avec des codes HTTP semantiques.
- Verifier la session en debut de chaque handler protege.

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await request.json()
  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // ... logique
}
```

### Composants React

- Nommer les composants en PascalCase.
- Extraire les composants quand ils depassent ~100 lignes ou ont une responsabilite independante.
- Pas de logique metier dans les composants de page. Deleguer aux hooks ou aux route handlers.
- Pas de `useEffect` pour fetcher des donnees : utiliser TanStack Query.

### Textes UI en Francais

- Tous les textes visibles a l'ecran doivent etre en francais.
- Garder les textes simples, directs, utiles.
- Pas d'explication technique dans les placeholders ou labels.
- Pas de repetition : si un titre dit "Calendrier", le sous-titre ne doit pas redire "Votre calendrier de publications".
- Eviter le jargon marketing.

```tsx
// Bien
<Button>Planifier</Button>
<Input placeholder="Titre de la publication" />
<p>Aucune publication cette semaine.</p>

// A eviter
<Button>Planifier votre contenu</Button>
<Input placeholder="Entrez le titre de votre publication ici..." />
<p>Vous n'avez pas encore de publications planifiees pour cette semaine.</p>
```

---

## 6. Gestion des Fichiers d'Environnement

- Ne jamais commiter `.env.local` ou tout fichier contenant des secrets.
- Toujours maintenir `.env.example` a jour avec toutes les variables necessaires (sans valeurs reelles).
- Si une nouvelle variable d'environnement est ajoutee, l'ajouter aussi dans `.env.example` avec un commentaire explicatif.

---

## 7. Prisma

- Toujours generer le client apres une modification du schema : `pnpm db:generate`.
- Pour creer une migration : `pnpm db:migrate` (interactif, Prisma demande un nom) ou passer le nom directement : `DATABASE_URL=... pnpm exec prisma migrate dev --name description-courte`.
- Ne jamais modifier manuellement les fichiers dans `prisma/migrations/`.
- Le schema de reference est dans `DOCUMENTATION.md`.
- Les scripts `db:*` utilisent `dotenv-cli` pour charger `.env.local` — Prisma ne le lit pas nativement. Si un script echoue avec "Environment variable not found", verifier que `.env.local` existe et que `dotenv-cli` est installe.

---

## 8. Securite

- Ne jamais exposer de tokens ou secrets dans les reponses API ou dans le code source.
- Toujours verifier la session et l'ownership de la ressource dans les route handlers (`userId` correspond a l'utilisateur authentifie).
- Valider et sanitiser tous les inputs utilisateur.
- Les tokens OAuth des plateformes doivent etre stockes chiffres en base (voir `lib/platforms/`).
- Pas de `dangerouslySetInnerHTML` sauf justification explicite.

---

## 9. Apres Chaque Epic : Livraison

A la fin de chaque epic, l'agent doit :

1. S'assurer que tous les commits de l'epic sont pousses sur la branche `feat/nom-de-l-epic`.
2. Verifier qu'il n'y a pas d'erreur TypeScript : `pnpm type-check`.
3. Verifier qu'il n'y a pas d'erreur lint : `pnpm lint`.
4. Ouvrir une Pull Request vers `dev` avec le recap de l'epic.
5. Fournir a l'utilisateur un **plan de test** detaille (voir format ci-dessous).
6. Attendre le feu vert de l'utilisateur avant de merger ou de passer a l'epic suivante.

### Format du Plan de Test

```markdown
## Plan de Test - Epic N : [Nom]

### Prerequis
- [ ] Serveur de dev lance (`pnpm dev`)
- [ ] Worker lance (`pnpm worker:dev`) [si applicable]
- [ ] Variables d'environnement configurees

### Scenarios a tester

#### [Nom du scenario]
1. Action precise a effectuer
2. Resultat attendu

#### [Autre scenario]
1. ...

### Points de vigilance
- Element specifique a surveiller
```

---

## 10. Ordre des Epics

Ne pas commencer une epic avant que la precedente soit mergee sur `dev` et validee par l'utilisateur.

| Epic | Branche | Depend de |
|---|---|---|
| 1 - Foundation | `feat/foundation` | - |
| 2 - Auth | `feat/auth` | Epic 1 |
| 3 - Calendar | `feat/calendar` | Epic 2 |
| 4 - Integrations | `feat/integrations` | Epic 2 |
| 5 - Scheduler | `feat/scheduler` | Epic 3 + 4 |
| 6 - Analytics | `feat/analytics` | Epic 4 + 5 |
| 7 - Polish | `feat/polish` | Epic 6 |
