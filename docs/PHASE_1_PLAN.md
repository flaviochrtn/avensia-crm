# PHASE 1 — PLAN DE FONDATIONS
> Rédigé le 14 mars 2026

---

## OBJECTIF

Avoir un projet Next.js qui tourne localement avec :
- authentification fonctionnelle (Auth.js)
- base de données PostgreSQL peuplée avec les données de Phase 0
- schéma Prisma complet et migré
- structure de projet propre et maintenable

---

## PRÉREQUIS SYSTÈME

Avant toute commande, vérifier que l'environnement est prêt :

```bash
node --version    # doit retourner >= 18.x
npm --version     # doit retourner >= 9.x
psql --version    # PostgreSQL local (ou compte Neon prêt)
```

### Installer Node.js (si absent)

**Option recommandée — nvm (Node Version Manager) :**
```bash
# 1. Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. Recharger le shell
source ~/.zshrc

# 3. Installer Node.js LTS
nvm install --lts
nvm use --lts

# 4. Vérifier
node --version   # → v20.x.x
npm --version    # → 10.x.x
```

**Alternative — Homebrew :**
```bash
brew install node
```

### PostgreSQL local (développement)

**Via Homebrew :**
```bash
brew install postgresql@16
brew services start postgresql@16
# Créer la base
createdb avensia_crm
```

**Alternative — Neon (cloud, gratuit) :**
Créer un projet sur https://neon.tech → copier la DATABASE_URL dans `.env`

---

## STRUCTURE DU PROJET CIBLE

```
avensia-crm/
├── app/                          ← Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (crm)/                    ← routes protégées
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── etudiants/
│   │   │   ├── page.tsx          ← liste
│   │   │   └── [id]/
│   │   │       └── page.tsx      ← fiche détail
│   │   └── entreprises/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       ← composants shadcn/ui (copiés, pas importés)
│   ├── etudiants/
│   ├── entreprises/
│   └── shared/
├── lib/
│   ├── prisma.ts                 ← instance Prisma singleton
│   ├── auth.ts                   ← config Auth.js
│   └── validators/               ← schémas Zod
├── prisma/
│   ├── schema.prisma             ← schéma complet
│   └── migrations/
├── scripts/                      ← scripts Python Phase 0 + scripts import TS
│   ├── clean_data.py
│   ├── apply_manual_fixes.py
│   └── import/
│       ├── import_formations.ts
│       ├── import_users.ts
│       ├── import_entreprises.ts
│       ├── import_contacts.ts
│       ├── import_etudiants.ts
│       └── import_rdvs.ts
├── data/                         ← données Phase 0 (inchangé)
├── docs/                         ← documentation (inchangé)
├── .env                          ← variables locales (gitignored)
├── .env.example                  ← template commitable
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## VARIABLES D'ENVIRONNEMENT

Fichier `.env` (jamais commité) :

```bash
# Base de données
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/avensia_crm"
# ou pour Neon :
# DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.eu-west-3.aws.neon.tech/avensia_crm?sslmode=require"

# Auth.js
NEXTAUTH_SECRET="une-chaine-aleatoire-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# Environnement
NODE_ENV="development"
```

Fichier `.env.example` (commité, sans valeurs réelles) :
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/avensia_crm"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

Générer un secret fort :
```bash
openssl rand -base64 32
```

---

## ÉTAPES D'EXÉCUTION

### ÉTAPE 1 — Initialisation Next.js
```bash
cd /Users/flaviocharton/avensia-crm
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git
```

**Point de validation :** `npm run dev` démarre sur http://localhost:3000 ✓

---

### ÉTAPE 2 — Installation des dépendances

```bash
# Prisma
npm install prisma @prisma/client
npx prisma init

# Auth.js
npm install next-auth@beta @auth/prisma-adapter

# Validation
npm install zod

# shadcn/ui
npx shadcn@latest init
```

**Point de validation :** `npm run dev` tourne toujours sans erreur ✓

---

### ÉTAPE 3 — Écriture du schéma Prisma

Écrire `prisma/schema.prisma` avec les 12 tables validées.

⚠️ **PAUSE — validation requise avant migration.**
Présenter le schéma complet pour relecture avant `prisma migrate dev`.

---

### ÉTAPE 4 — Configuration de la base

```bash
# Configurer DATABASE_URL dans .env
# Puis créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Vérifier dans Prisma Studio
npx prisma studio
```

⚠️ **PAUSE — validation requise avant de lancer la migration.**

---

### ÉTAPE 5 — Configuration Auth.js

Créer `lib/auth.ts` et `app/api/auth/[...nextauth]/route.ts`.
Créer les 5 users initiaux via un script seed.

```bash
npx prisma db seed
```

**Point de validation :** page `/login` accessible, connexion fonctionnelle ✓

---

### ÉTAPE 6 — Scripts d'import

Écrire et exécuter les scripts TypeScript dans `scripts/import/` dans l'ordre :

```bash
# Ordre obligatoire
npx tsx scripts/import/import_formations.ts
npx tsx scripts/import/import_users.ts       # si pas déjà seedés
npx tsx scripts/import/import_entreprises.ts
npx tsx scripts/import/import_contacts.ts
npx tsx scripts/import/import_etudiants.ts
npx tsx scripts/import/import_rdvs.ts
```

⚠️ **PAUSE — validation requise avant chaque script d'import.**

**Point de validation final :** Prisma Studio montre les données importées ✓

---

## DÉPENDANCES FINALES (package.json attendu)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "next-auth": "beta",
    "@auth/prisma-adapter": "latest",
    "@prisma/client": "^5.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "prisma": "^5.x",
    "tsx": "^4.x",
    "eslint": "^8.x",
    "tailwindcss": "^3.x"
  }
}
```

---

## AVANCEMENT PHASE 1

### ✅ Étapes terminées

| Étape | Statut | Date |
|-------|--------|------|
| Initialisation Next.js 15 + TypeScript | ✅ | 14/03/2026 |
| Configuration Tailwind v4 | ✅ | 14/03/2026 |
| Schéma Prisma (12 modèles, 14 enums, indexes) | ✅ | 14/03/2026 |
| Configuration Neon (DATABASE_URL + DIRECT_URL) | ✅ | 14/03/2026 |
| Migration initiale `20260314155345_init` | ✅ | 14/03/2026 |
| 16 tables vérifiées en base Neon | ✅ | 14/03/2026 |
| Auth.js v5 (Credentials, JWT, PrismaAdapter) | ✅ | 14/03/2026 |
| Layout CRM avec garde d'auth | ✅ | 14/03/2026 |
| `prisma/seed.ts` (5 users + 10 formations) | ✅ | 14/03/2026 |
| Scripts d'import (entreprises, contacts, étudiants, rdvs) | ✅ | 14/03/2026 |
| `docs/IMPORT_STRATEGY.md` | ✅ | 14/03/2026 |

### ⏳ Étapes restantes

| Étape | Prérequis |
|-------|-----------|
| Exécution seed réel | Validation utilisateur |
| Dry-run imports | Validation utilisateur + seed exécuté |
| Import réel | Dry-run validé |
| Configuration shadcn/ui | - |
| Pages CRUD (Phase 2) | Import validé |

---

## CRITÈRES DE SUCCÈS PHASE 1

- [ ] `npm run dev` démarre sans erreur
- [ ] Page `/login` accessible et fonctionnelle
- [ ] Connexion avec un des 5 comptes utilisateurs
- [ ] Redirection vers `/dashboard` après login
- [ ] Route `/etudiants` accessible et retourne des données depuis la BDD
- [ ] Route `/entreprises` accessible et retourne des données depuis la BDD
- [ ] Prisma Studio montre toutes les données importées
- [ ] Aucun secret ou `.env` dans le repo git

---

## NOTES D'ARCHITECTURE

- **Pas de tRPC** : Server Actions Next.js pour le CRUD (suffisant pour V1 interne)
- **Pas de TanStack Query** : à ajouter si besoin de cache client sophistiqué
- **Pas d'Uploadthing** : hors scope V1
- **shadcn/ui** : les composants sont copiés dans le projet, pas importés comme package — 100% personnalisables
- **Auth.js** : sessions stockées en base (table `sessions` gérée par Prisma Adapter) — plus robuste que JWT seul pour usage équipe
