# IMPORT STRATEGY — Avensia CRM

> Rédigé le 14 mars 2026
> Données source : Phase 0 (scripts/clean_data.py + scripts/apply_manual_fixes.py)

---

## 1. Ordre d'import

L'ordre est dicté par les dépendances entre FK. **Ne pas inverser.**

```
1. Seed (prisma/seed.ts)         → User  +  Formation
2. import_entreprises.ts         → Entreprise
3. import_contacts.ts            → ContactEntreprise  (FK → Entreprise)
4. import_etudiants.ts           → Etudiant           (FK → Formation, User)
5. import_rdvs.ts                → RendezVous          (FK → Etudiant, User)
```

Entités non importées à ce stade (pas de données source) :
- `Offre`, `Candidature`, `Tache`, `Document`, `Note`, `ActivityLog`
  → Ces tables seront peuplées par usage normal de l'application en Phase 2/3.

---

## 2. Règles de matching FK

### 2.1 Formation (dans import_etudiants)
- Clé : `formation_code` (CSV) → `Formation.code` (exact)
- Si le code est absent ou inconnu : `formation_id = null` + WARNING loggé
- Les codes valides sont ceux du seed (BTS_SAM_1, BTS_SAM_2, BTS_MCO_1, BTS_MCO_2,
  BTS_NDRC_1, BTS_NDRC_2, BACHELOR_RH, BACHELOR_RDC, COM, NTC)

### 2.2 User (conseiller / responsable / animateur)
- Clé : concaténation `prenom nom` normalisée (lowercase + trim)
- Les 5 conseillers présents dans les CSV correspondent aux 5 users du seed
  - "flavio charton", "farid brini", "lylian sturm", "moncef miguel", "soukeina n'diaye"
- Si nom inconnu : champ FK laissé null + WARNING loggé

### 2.3 Entreprise (dans import_contacts)
- Clé : `nom normalisé`
- Ambiguïté : si plusieurs entreprises portent le même nom (noms différentes villes) →
  ligne skippée + WARNING → intervention manuelle requise

---

## 3. Stratégie d'idempotence par script

| Script               | Clé de dédup                        | Comportement si déjà présent |
|----------------------|-------------------------------------|------------------------------|
| import_entreprises   | `nom_normalisé \| ville_normalisée` | skip (pas de mise à jour)    |
| import_contacts      | `entreprise_id \| nom_complet_norm` | skip                         |
| import_etudiants     | `email` OU `prenom\|nom` (sans email) | skip                      |
| import_rdvs          | `etudiant_id \| numero_rdv`         | skip                         |

**Règle générale** : les scripts ne mettent PAS à jour les enregistrements existants.
Cela protège les éditions manuelles faites dans l'application après un premier import.

---

## 4. Cas ambigus identifiés

### CA-1 — Étudiants sans email
- 215 étudiants importés, certains n'ont pas d'email.
- Dédup sur `prenom|nom` uniquement → risque d'homonymes non détectés.
- **Mitigation** : WARNING loggé si un doublon nom+prenom est trouvé lors d'un second import.
- **Recommandation** : saisir les emails manquants dans l'application après l'import.

### CA-2 — Contacts d'entreprises homonymes
- Si deux entreprises ont exactement le même nom (ex : deux agences "Adecco"),
  le script contact ne peut pas résoudre la FK sans ville.
- **Mitigation** : ligne skippée + WARNING → rattachement manuel dans l'UI.
- Nb de cas identifiés dans les données : à vérifier lors du dry-run.

### CA-3 — Animateurs RDV inconnus
- Certains champs `animateur` dans le CSV peuvent contenir des noms hors de
  la liste des 5 users (ex : intervenants externes ponctuels).
- **Mitigation** : `animateur_id = null` + WARNING loggé.

### CA-4 — Dates manquantes sur les RDVs
- Certains RDVs n'ont pas de date (champ optionnel dans le schema).
- Comportement : `date = null` accepté, pas d'erreur.

---

## 5. Procédure recommandée avant import réel

```bash
# 1. Toujours lancer en dry-run d'abord
npx tsx scripts/import/import_entreprises.ts --dry-run
npx tsx scripts/import/import_contacts.ts    --dry-run
npx tsx scripts/import/import_etudiants.ts   --dry-run
npx tsx scripts/import/import_rdvs.ts        --dry-run

# 2. Analyser les WARNINGs et ERRORs
# 3. Corriger les données source si nécessaire (data/clean/*.csv)
# 4. Lancer l'import réel dans l'ordre
npx tsx prisma/seed.ts
npx tsx scripts/import/import_entreprises.ts
npx tsx scripts/import/import_contacts.ts
npx tsx scripts/import/import_etudiants.ts
npx tsx scripts/import/import_rdvs.ts
```

---

## 6. Stratégie de rollback

### Option A — Rollback complet (tables vides)
```sql
-- À exécuter via Neon console ou psql
TRUNCATE "RendezVous", "Etudiant", "ContactEntreprise", "Entreprise",
         "Formation", "User" CASCADE;
```
> ⚠ Destructif. Ne conserver que si l'import a été lancé sur une base fraîche.

### Option B — Rollback sélectif
Chaque import loggue les IDs créés dans la console.
Pour supprimer des enregistrements spécifiques, utiliser la console Neon ou
un script ad hoc basé sur les timestamps `created_at` (horodatage de l'import).

### Option C — Snapshot Neon (recommandé avant le premier import réel)
Neon supporte les branches de base de données.
Créer une branche `main-before-import` dans la console Neon avant d'importer,
puis supprimer la branche si l'import est validé.

---

## 7. Volumes attendus

| Table              | Lignes source | Lignes attendues en base |
|--------------------|---------------|--------------------------|
| Formation          | (seed)        | 10                       |
| User               | (seed)        | 5                        |
| Entreprise         | 144           | ~144                     |
| ContactEntreprise  | 61            | ~59 (2 homonymes probables) |
| Etudiant           | 215           | ~213 (sans email dupliqué) |
| RendezVous         | 153           | ~150                     |
