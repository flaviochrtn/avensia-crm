# IMPORT RESULTS — Avensia CRM

> Import réalisé le 14 mars 2026
> Base : Neon PostgreSQL — `ep-snowy-sea-anvarnc1.c-6.us-east-1.aws.neon.tech`

---

## Volumes finaux en base

| Table              | Lignes source | En base | Ignorées | Écart |
|--------------------|---------------|---------|----------|-------|
| `User`             | (seed)        | **4**   | —        | —     |
| `Formation`        | (seed)        | **10**  | —        | —     |
| `Entreprise`       | 144           | **143** | 1        | 1 doublon CSV (Etam / Les Clayes) |
| `ContactEntreprise`| 61            | **56**  | 5        | 5 ambiguïtés multi-sites |
| `Etudiant`         | 215           | **214** | 1        | 1 doublon email (Clément LESAGE) |
| `RendezVous`       | 153           | **153** | 0        | — |
| **Total importé**  | **573**       | **566** | **7**    | |

Tables non peuplées (usage applicatif à venir) :
`Offre`, `Candidature`, `Tache`, `Document`, `Note`, `ActivityLog`

---

## Qualité des données

| Indicateur | Valeur | Signification |
|------------|--------|---------------|
| Entreprises sans responsable | **59 / 143** | Anciens portefeuilles Soukeina N'DIAYE (38) et Moncef MIGUEL (8) + entreprises sans responsable dans le CSV source (13) |
| Étudiants sans conseiller | **75 / 214** | Fiches sans conseiller_nom dans le CSV source |
| Étudiants sans email | **19 / 214** | Email absent dans le Notion source |
| RDVs sans date | **85 / 153** | Champ date non renseigné dans le Notion source |

---

## Warnings connus (non bloquants)

### W1 — 46 entreprises importées avec `responsable_id = null`
- **38** appartenaient à **Soukeina N'DIAYE** (plus chez Avensia)
- **8** appartenaient à **Moncef MIGUEL** (plus chez Avensia)
- Action : réassigner dans l'UI (Phase 2) vers Lylian STURM ou Flavio CHARTON

### W2 — 5 contacts non rattachés (ambiguïté multi-sites)

| Contact | Entreprise | Ambiguïté |
|---------|-----------|-----------|
| Cecile De Alegria / Mr Zorakino | Intersport | Plaisir ou Montigny-le-Bretonneux ? |
| Eva LAVEDRINE | Castorama | Les Clayes-sous-Bois ou Chambourcy ? |
| Juliette Capoulade | Castorama | Les Clayes-sous-Bois ou Chambourcy ? |
| Jennifer GALOPPIN | AIGLE | 3 sites (Le Chesnay, Paris SGP, Les Clayes) |
| Gwendoline DEVILLE | AUCHAN | Le Chesnay-Rocquencourt ou Bagnolet ? |

Action : rattachement manuel dans l'UI (Phase 2)

---

## Éléments à corriger manuellement

### C1 — Clément LESAGE (étudiant non importé)
- **Motif** : email `marie_lesage22@yahoo.fr` déjà présent sur une autre fiche
- **Action** : vérifier si doublon réel ou erreur de saisie. Si deux personnes distinctes, corriger l'email dans le Notion source puis relancer `npx tsx scripts/import/import_etudiants.ts`

### C2 — Réassignation des portefeuilles Soukeina / Moncef
- **Concerné** : 46 entreprises sans responsable
- **Action** : dans l'UI Phase 2, filtrer `responsable_id IS NULL` et réassigner

### C3 — Contacts ambigus (5 lignes)
- **Action** : après Phase 2, accéder à la fiche entreprise correcte et créer le contact manuellement

### C4 — RDVs sans date (85 / 153)
- **Motif** : données manquantes dans le Notion source
- **Action** : compléter au fur et à mesure via l'UI, pas de correction en masse nécessaire

### C5 — Étudiants sans email (19 / 214)
- **Motif** : email non collecté à l'époque
- **Action** : enrichir au fil des relances via l'UI Phase 2

---

## Commandes de vérification

```bash
# Relancer les scripts d'import sans risque (idempotents)
npx tsx prisma/seed.ts
npx tsx scripts/import/import_entreprises.ts
npx tsx scripts/import/import_contacts.ts
npx tsx scripts/import/import_etudiants.ts
npx tsx scripts/import/import_rdvs.ts

# Vérifier les volumes en base
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.user.count(), p.formation.count(), p.entreprise.count(),
  p.contactEntreprise.count(), p.etudiant.count(), p.rendezVous.count()
]).then(([u,f,e,c,et,r]) => console.log({users:u,formations:f,entreprises:e,contacts:c,etudiants:et,rdvs:r}))
  .finally(() => p.\$disconnect());
"
```

---

## Statut Phase 1

| Étape | Statut |
|-------|--------|
| Schéma Prisma + migration | ✅ |
| Authentification Auth.js v5 | ✅ |
| Seed (users + formations) | ✅ |
| Import entreprises | ✅ |
| Import contacts entreprise | ✅ |
| Import étudiants | ✅ |
| Import RDVs | ✅ |
| **Phase 1 complète** | ✅ |
