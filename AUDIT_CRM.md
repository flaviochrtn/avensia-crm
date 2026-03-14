# AUDIT CRM AVENSIA — RAPPORT COMPLET

> Généré le 14 mars 2026
> Basé sur l'analyse de l'export Notion complet (CSV + Markdown + CONTEXTE_CRM.txt)

---

## SOMMAIRE

1. [Synthèse exécutive](#1-synthèse-exécutive)
2. [Inventaire des fichiers](#2-inventaire-des-fichiers)
3. [Cartographie des entités actuelles](#3-cartographie-des-entités-actuelles)
4. [Analyse des champs par entité](#4-analyse-des-champs-par-entité)
5. [Relations entre entités](#5-relations-entre-entités)
6. [Incohérences et points à nettoyer](#6-incohérences-et-points-à-nettoyer)
7. [Ce qu'il ne faut surtout pas reproduire depuis Notion](#7-ce-quil-ne-faut-surtout-pas-reproduire-depuis-notion)
8. [Schéma cible de base de données](#8-schéma-cible-de-base-de-données)
9. [Stack technique recommandée](#9-stack-technique-recommandée)
10. [Plan de migration progressif](#10-plan-de-migration-progressif)
11. [Proposition de V1 réaliste](#11-proposition-de-v1-réaliste)

---

## 1. SYNTHÈSE EXÉCUTIVE

### Ce que le CRM Notion fait bien
- La structure de base est là : étudiants, entreprises, statuts, conseillers
- Les process B2C (tunnel étudiant) et B2B (prospection entreprises) sont esquissés
- 214 étudiants et 144 entreprises sont déjà enregistrés — c'est une vraie base exploitable
- Les étapes de process existent et sont globalement cohérentes

### Ce qui bloque aujourd'hui
- **Pas de vraie relation entre entités** : les liens sont des noms texte, pas des clés étrangères
- **Pas de table Candidatures** : le matching étudiant ↔ entreprise n'est pas traçable
- **Pas d'historique des actions** : aucune timeline, aucun audit trail par fiche
- **Pas de gestion des tâches/relances** : les relances sont des champs date, pas des objets métier
- **Doublons sur les entreprises** (AIGLE x4, AUCHAN x2, ETAM x2...)
- **Statuts non standardisés** : des variantes textuelles coexistent sans enum fixe
- **L'administratif et le commercial sont mélangés** dans la même fiche étudiant, rendant les deux illisibles
- **Pas de permissions** : tout le monde voit tout, personne ne sait qui est responsable de quoi

### Verdict global
Le CRM Notion est un **prototype artisanal fonctionnel**, pas un outil d'équipe. Il faut en extraire la logique métier, nettoyer les données, et construire un vrai système relationnel sur une stack propre.

---

## 2. INVENTAIRE DES FICHIERS

### Fichiers CSV (données structurées, prioritaires pour la migration)

| Fichier | Enregistrements | Description |
|---|---|---|
| `Étudiants - Base CRM (...).csv` | 214 | Données complètes étudiants |
| `Étudiants - Base CRM (...)_all.csv` | 214 | Idem avec relations développées |
| `Entreprises – Base CRM (...).csv` | 144 | Données entreprises (condensé) |
| `Entreprises – Base CRM (...)_all.csv` | 144 | Idem avec champs étendus |
| `Objectifs Avensia 2025-2026 (...).csv` | 11 | Objectifs par formation |
| `Objectifs Avensia 2025-2026 (...)_all.csv` | 11 | Idem avec liens étudiants |
| `Évènements (...).csv` | 0 | Structure vide, non utilisée |
| `Sans titre (...).csv` | — | Doublon des objectifs, à ignorer |

### Fichiers Markdown (fiches individuelles Notion)
- **216 fiches étudiants** (1 fichier par étudiant)
- **90+ fiches entreprises** (1 fichier par entreprise)
- **5 fiches conseillers** (Flavio, Lylian, Farid, Moncef, Soukeina)

> Les fichiers markdown sont redondants avec les CSV. Les CSV sont la source de vérité pour la migration.

---

## 3. CARTOGRAPHIE DES ENTITÉS ACTUELLES

### Entités présentes dans le CRM Notion

```
ÉTUDIANTS (214 enregistrements)
  └── liés à : Conseiller référent, Entreprise liée, Opportunité liée

ENTREPRISES (144 enregistrements, ~10% doublons)
  └── liées à : Responsable prospection

COMMERCIAUX / CONSEILLERS (5 personnes)
  └── Flavio CHARTON, Lylian STURM, Farid BRINI, Moncef MIGUEL, Soukeina N'DIAYE

OBJECTIFS (11 lignes, par formation)
  └── cibles numériques, pas une vraie entité CRM

ÉVÉNEMENTS (table vide)
```

### Entités manquantes (présentes dans la logique métier, absentes du Notion)

```
CANDIDATURES          ← absent, pourtant central au matching
CONTACTS ENTREPRISE   ← absent, les interlocuteurs ne sont pas dans une table dédiée
TÂCHES / RELANCES     ← absent en tant qu'objet, remplacé par des champs date
HISTORIQUE / TIMELINE ← absent, aucune trace des actions passées
OFFRES / BESOINS      ← absent, les postes ouverts en entreprise ne sont pas modélisés
DOCUMENTS             ← absent en tant que table, juste des champs texte dans l'étudiant
FORMATIONS / PROGRAMMES ← absent, les formations sont des valeurs texte libres
```

---

## 4. ANALYSE DES CHAMPS PAR ENTITÉ

### 4.1. Étudiants (46 colonnes dans le CSV)

**Identité / Contact**
| Champ Notion | Qualité | Action |
|---|---|---|
| Prénom NOM | Champ unique, format libre | Séparer en `prenom` + `nom` |
| Sexe | Peu renseigné | Garder, rendre optionnel |
| Âge | Calculé ou saisi manuellement | Supprimer → calculer depuis `date_naissance` |
| Date de naissance | Présente, format variable | Normaliser en `DATE` |
| Téléphone | Nombreux numéros invalides | Valider format à l'import |
| Adresse e-mail | ~30 manquants | Rendre obligatoire pour leads qualifiés |
| Adresse | Peu précis | Garder |
| Ville | Bien renseigné | Garder |

**Profil / Formation**
| Champ Notion | Qualité | Action |
|---|---|---|
| Diplôme | Valeur texte libre | Normaliser via liste fermée |
| Formation Actuelle | Texte libre | Normaliser |
| Formation visée | Texte libre | Lier à table `formations` |
| Spécialisation | Souvent vide | Lier à table `formations` |
| Type de contrat | Apprentissage / Pro | Enum fixe |
| Permis | Oui/Non | Bool |
| Véhiculé | Oui/Non | Bool |
| Situation de handicap | Sensible | Bool + champ document lié |

**Process commercial**
| Champ Notion | Qualité | Action |
|---|---|---|
| Étape du process | Central, mais ~15 valeurs différentes | Enum strict, voir ci-dessous |
| Statut commercial | Redondant avec Étape | Fusionner ou clarifier le rôle |
| Niveau motivation | 1-5, souvent vide | Garder, rendre numérique |
| Niveau test positionnement | Texte libre | Normaliser |
| Niveau cours | Texte libre | Normaliser |
| Conseiller référent | Nom texte → pas de FK | FK vers table `users` |
| Apporteur d'affaires | Nom texte | FK ou champ texte selon besoin |
| Origine du contact | Texte libre | Enum (JPO, Insta, Google...) |
| Campagnes | Texte libre | À traiter en V2 |

**Rendez-vous (encodés dans des champs plats)**
| Champ Notion | Problème | Action |
|---|---|---|
| M1, Date RDV 1, Statut RDV 1 | 3 champs pour 1 RDV | Table `rendez_vous` séparée |
| M2, Date RDV 2, Note RDV 2, Correcteur RDV 2, Statut RDV 2 | 5 champs pour 1 RDV | Table `rendez_vous` séparée |
| M3 | Champ seul sans date ni statut | Table `rendez_vous` séparée |

**Relances (encodées comme champs date)**
| Champ Notion | Problème | Action |
|---|---|---|
| Date de prochaine relance | Date statique | Table `taches` avec assignation et statut |
| Prochaine relance | Texte libre redondant | Supprimer → remplacer par tâche |

**Liens**
| Champ Notion | Problème | Action |
|---|---|---|
| Entreprise liée | Nom texte | FK vers table `entreprises` |
| Opportunité liée | Nom texte | FK vers table `offres` |

**Administratif**
| Champ Notion | Problème | Action |
|---|---|---|
| CV | URL ou nom de fichier | Table `documents` avec `type` + `statut` |
| CERFA | Pareil | Idem |
| Pack suivis alternance | Champ texte libre | À modéliser proprement |

---

### 4.2. Entreprises (7 colonnes dans le CSV condensé)

| Champ Notion | Qualité | Action |
|---|---|---|
| Nom entreprise | Doublons | Dédupliquer, normaliser |
| Étape du process | 9 statuts, bien définis | Enum strict |
| Date de RDV | Champ date unique | Table `rendez_vous` liée |
| Date de premier contact | Bien renseigné | Garder |
| Date de relance prévue | Date statique | Table `taches` |
| Responsable de la prospection | Nom texte | FK vers `users` |
| Commentaire | Texte libre | Note initiale dans timeline |

**Champs présents dans les fichiers markdown mais absents du CSV principal**
- Secteur d'activité → à ajouter
- Site web → à ajouter
- LinkedIn → à ajouter
- Adresse complète → à ajouter
- Contact principal + poste → table `contacts_entreprise`
- Besoin en alternant (Oui/Non) → FK vers table `offres`
- Nombre de postes → dans table `offres`

---

### 4.3. Commerciaux (5 personnes)

Actuellement stockés uniquement comme valeurs texte dans les champs d'assignation. Ils doivent devenir des **utilisateurs authentifiés** dans le système avec un rôle assigné.

---

### 4.4. Statuts du process étudiant (actuels)

Valeurs trouvées dans les données — désordonnées et parfois incohérentes :

```
Nouveau
RDV 0
M1
RDV 1
M2
RDV 2
M3
Inscrit - Alternance
Inscrit - En Recherche
Numéro invalide
Abandon
Non retenu
[vide]
```

**Problème** : M1/M2/M3 et RDV 1/RDV 2 sont entremêlés. La logique réelle semble être :

```
Nouveau → Contacté → RDV 0 planifié → RDV 0 fait → RDV 1 planifié → RDV 1 fait
→ RDV 2 planifié → RDV 2 fait → Inscrit (En Recherche) → Inscrit (Alternance trouvée)

Sorties : Abandon / Numéro invalide / Non retenu / Perdu
```

---

### 4.5. Statuts du process entreprise (actuels)

Plus propres que les étudiants :
```
Nouveau → À contacter → Contacté → Qualifié → Besoin ouvert → RDV planifié → Partenaire actif
Sorties : Aucun besoin / Perdu
```

---

## 5. RELATIONS ENTRE ENTITÉS

### Relations actuelles (implicites, non formalisées)

```
Étudiant ──► Conseiller référent   (texte → devrait être FK user)
Étudiant ──► Entreprise liée       (texte → devrait être FK entreprise)
Entreprise ──► Responsable         (texte → devrait être FK user)
```

### Relations manquantes (à créer dans le nouveau CRM)

```
Étudiant ──[1..N]──► Rendez-vous
Étudiant ──[1..N]──► Tâches/Relances
Étudiant ──[1..N]──► Documents
Étudiant ──[1..N]──► Candidatures ──[N..1]──► Entreprise
Étudiant ──[1..N]──► Candidatures ──[N..1]──► Offre
Entreprise ──[1..N]──► Contacts
Entreprise ──[1..N]──► Offres/Besoins
Entreprise ──[1..N]──► Rendez-vous
Entreprise ──[1..N]──► Tâches/Relances
Toutes entités ──[1..N]──► Notes/Timeline
Formation ──[1..N]──► Étudiants
User ──[1..N]──► Étudiants (assigned)
User ──[1..N]──► Entreprises (assigned)
```

---

## 6. INCOHÉRENCES ET POINTS À NETTOYER

### Problèmes de données

| # | Problème | Localisation | Impact | Action |
|---|---|---|---|---|
| 1 | Doublons entreprises | Entreprises CSV | Moyen | Dédupliquer avant import |
| 2 | Prénom+Nom dans un seul champ | Étudiants CSV | Fort | Split à l'import |
| 3 | Âge calculé manuellement | Étudiants CSV | Faible | Supprimer, calculer dynamiquement |
| 4 | ~30 emails manquants | Étudiants CSV | Moyen | Signaler dans le dashboard post-import |
| 5 | Numéros de téléphone invalides | Étudiants CSV | Moyen | Valider à l'import, flaguer |
| 6 | Statuts étudiants non normalisés | Étudiants CSV | Fort | Mapper vers enum cible à l'import |
| 7 | RDV encodés en champs plats (M1/M2/M3) | Étudiants CSV | Fort | Migrer vers table rendez_vous |
| 8 | Relances encodées comme date simple | Étudiants CSV | Fort | Migrer vers table taches |
| 9 | Entreprises liées par nom texte | Étudiants CSV | Fort | Résoudre FK à l'import |
| 10 | Champs vides non distingués de "non applicable" | Partout | Moyen | Définir des valeurs nullables vs enum |
| 11 | Formations en texte libre | Étudiants CSV | Moyen | Créer table formations |
| 12 | Contacts entreprise dans les MD mais pas en CSV | Entreprises | Fort | Extraire et créer table contacts |
| 13 | Pas d'historique des modifications | Partout | Fort | Créer audit log dès le départ |
| 14 | Table Événements vide | Événements CSV | Faible | Modéliser mais ne pas migrer |

### Problèmes de modélisation à ne pas reproduire

| Mauvaise pratique Notion | Pourquoi c'est un problème | Ce qu'il faut faire |
|---|---|---|
| RDV modélisés en champs plats | Impossible d'en ajouter sans recoder | Table `rendez_vous` avec FK |
| Relances = champ date | Pas assignable, pas suivable, pas multi | Table `taches` avec statut + owner |
| Lien entreprise = texte | Pas de FK, pas d'intégrité | FK réelle vers `entreprises.id` |
| Commercial = texte | Pas de login possible | Table `users` avec rôle |
| Administratif dans la fiche étudiant | Illisible, incomplet | Table `documents` dédiée |
| Statuts libres | Incohérence garantie avec le temps | Enums stricts dans le schéma |

---

## 7. CE QU'IL NE FAUT SURTOUT PAS REPRODUIRE DEPUIS NOTION

1. **Ne pas encoder les événements répétables en champs plats**
   Notion pousse à faire `Date RDV 1`, `Date RDV 2`, `Date RDV 3`... C'est une impasse. Une table `rendez_vous` avec une FK vers l'entité concernée est la seule bonne réponse.

2. **Ne pas mélanger le commercial et l'administratif dans la même vue**
   Deux process distincts, deux équipes, deux rythmes. La fiche doit avoir des onglets ou des sections séparées.

3. **Ne pas utiliser le texte libre comme seul moyen de lier deux entités**
   Notion gère les "relations" visuellement mais sans intégrité référentielle. Dans un vrai CRM, les FK sont non-négociables.

4. **Ne pas laisser les statuts en champ texte libre**
   Notion permet de saisir n'importe quel statut. Résultat : "Inscrit", "inscrit", "INSCRIT", "inscrit alternance", "Inscrit - alternance", "alternance inscrit" coexistent. Un enum strict dans la BDD empêche ça dès le départ.

5. **Ne pas ignorer l'historique des actions**
   Dans Notion, si quelqu'un change un statut, on ne sait pas qui, quand, ni depuis quoi. Un audit log horodaté est indispensable pour une équipe.

6. **Ne pas créer une table "Objectifs" dans le CRM**
   Les objectifs numériques (140 inscrits, etc.) sont du reporting, pas du CRM. Ils doivent être calculés dynamiquement depuis les données, pas saisis manuellement.

7. **Ne pas reproduire la structure de pages imbriquées**
   Notion invite à créer des sous-pages dans des pages. Dans un CRM web, tout doit être une entité de premier niveau accessible par URL directe.

---

## 8. SCHÉMA CIBLE DE BASE DE DONNÉES

### Principes
- PostgreSQL, normalisé (3NF minimum)
- Toutes les entités ont `id` (UUID), `created_at`, `updated_at`
- Les statuts sont des enums PostgreSQL stricts
- Un `activity_log` universel trace toutes les modifications importantes
- Soft delete (`deleted_at`) plutôt que suppression physique sur les entités critiques

---

### Schéma simplifié (Prisma-compatible)

```prisma
// ─── UTILISATEURS / ÉQUIPE ───────────────────────────────────────────────────

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  nom         String
  prenom      String
  role        UserRole @default(COMMERCIAL)
  actif       Boolean  @default(true)
  created_at  DateTime @default(now())

  etudiants   Etudiant[]   @relation("ConseillerRef")
  entreprises Entreprise[] @relation("ResponsableProspection")
  taches      Tache[]      @relation("AssigneA")
  rdvs        RendezVous[] @relation("AnimePar")
}

enum UserRole {
  ADMIN
  DIRECTION
  COMMERCIAL
  ADMINISTRATIF
}

// ─── FORMATIONS ──────────────────────────────────────────────────────────────

model Formation {
  id          String     @id @default(uuid())
  code        String     @unique  // ex: BTS_MCO_1
  nom         String               // ex: BTS MCO 1ère année
  niveau      String               // ex: Bac+2
  duree_mois  Int
  actif       Boolean    @default(true)

  etudiants   Etudiant[]
}

// ─── ÉTUDIANTS ───────────────────────────────────────────────────────────────

model Etudiant {
  id                    String          @id @default(uuid())
  prenom                String
  nom                   String
  email                 String?
  telephone             String?
  date_naissance        DateTime?
  sexe                  Sexe?
  adresse               String?
  ville                 String?
  permis                Boolean?
  vehicule              Boolean?
  situation_handicap    Boolean         @default(false)

  // Formation
  formation_id          String?
  formation             Formation?      @relation(fields: [formation_id], references: [id])
  type_contrat          TypeContrat?
  diplome_actuel        String?
  formation_actuelle    String?
  niveau_cours          String?

  // Qualification commerciale
  statut                StatutEtudiant  @default(NOUVEAU)
  etape_process         EtapeEtudiant   @default(NOUVEAU)
  niveau_motivation     Int?            // 1-5
  niveau_test           String?
  origine_contact       OrigineContact?
  apporteur_affaires    String?

  // Assignation
  conseiller_id         String?
  conseiller            User?           @relation("ConseillerRef", fields: [conseiller_id], references: [id])

  // Dates clés
  date_premier_contact  DateTime?
  date_prochaine_relance DateTime?

  // Relations
  rdvs                  RendezVous[]
  taches                Tache[]
  documents             Document[]
  candidatures          Candidature[]
  notes                 Note[]
  activity_logs         ActivityLog[]

  created_at            DateTime        @default(now())
  updated_at            DateTime        @updatedAt
  deleted_at            DateTime?
}

enum StatutEtudiant {
  NOUVEAU
  EN_COURS
  INSCRIT_EN_RECHERCHE
  INSCRIT_ALTERNANCE
  ABANDON
  NON_RETENU
  INVALIDE
}

enum EtapeEtudiant {
  NOUVEAU
  CONTACTE
  RDV0_PLANIFIE
  RDV0_FAIT
  RDV1_PLANIFIE
  RDV1_FAIT
  RDV2_PLANIFIE
  RDV2_FAIT
  DOSSIER_EN_COURS
  INSCRIT
}

enum TypeContrat {
  APPRENTISSAGE
  PROFESSIONNALISATION
}

enum OrigineContact {
  JPO
  INSTAGRAM
  GOOGLE
  LINKEDIN
  BOUCHE_A_OREILLE
  PARTENAIRE
  AUTRE
}

enum Sexe {
  M
  F
  AUTRE
}

// ─── ENTREPRISES ─────────────────────────────────────────────────────────────

model Entreprise {
  id                    String            @id @default(uuid())
  nom                   String
  secteur               String?
  taille                TailleEntreprise?
  adresse               String?
  ville                 String?
  code_postal           String?
  site_web              String?
  linkedin              String?
  telephone             String?
  email_general         String?

  statut                StatutEntreprise  @default(NOUVEAU)
  besoin_alternant      Boolean?
  date_premier_contact  DateTime?
  date_prochaine_relance DateTime?

  responsable_id        String?
  responsable           User?             @relation("ResponsableProspection", fields: [responsable_id], references: [id])

  contacts              ContactEntreprise[]
  offres                Offre[]
  rdvs                  RendezVous[]
  taches                Tache[]
  candidatures          Candidature[]
  notes                 Note[]
  activity_logs         ActivityLog[]

  created_at            DateTime          @default(now())
  updated_at            DateTime          @updatedAt
  deleted_at            DateTime?
}

enum StatutEntreprise {
  NOUVEAU
  A_CONTACTER
  CONTACTE
  QUALIFIE
  BESOIN_OUVERT
  RDV_PLANIFIE
  PARTENAIRE_ACTIF
  AUCUN_BESOIN
  PERDU
}

enum TailleEntreprise {
  TPE
  PME
  ETI
  GRANDE
}

// ─── CONTACTS ENTREPRISE ─────────────────────────────────────────────────────

model ContactEntreprise {
  id            String     @id @default(uuid())
  prenom        String
  nom           String
  poste         String?
  email         String?
  telephone     String?
  decideur      Boolean    @default(false)
  notes         String?

  entreprise_id String
  entreprise    Entreprise @relation(fields: [entreprise_id], references: [id])

  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
}

// ─── OFFRES / BESOINS ENTREPRISE ─────────────────────────────────────────────

model Offre {
  id                String       @id @default(uuid())
  titre             String
  description       String?
  type_contrat      TypeContrat?
  nombre_postes     Int          @default(1)
  statut            StatutOffre  @default(OUVERTE)
  date_debut        DateTime?
  date_fin          DateTime?

  formation_ciblee  String?

  entreprise_id     String
  entreprise        Entreprise   @relation(fields: [entreprise_id], references: [id])

  candidatures      Candidature[]

  created_at        DateTime     @default(now())
  updated_at        DateTime     @updatedAt
}

enum StatutOffre {
  OUVERTE
  POURVUE
  ANNULEE
}

// ─── CANDIDATURES ────────────────────────────────────────────────────────────

model Candidature {
  id              String             @id @default(uuid())
  etudiant_id     String
  etudiant        Etudiant           @relation(fields: [etudiant_id], references: [id])
  entreprise_id   String
  entreprise      Entreprise         @relation(fields: [entreprise_id], references: [id])
  offre_id        String?
  offre           Offre?             @relation(fields: [offre_id], references: [id])

  statut          StatutCandidature  @default(ENVOYEE)
  date_envoi      DateTime?
  canal_envoi     String?
  date_retour     DateTime?
  resultat        ResultatCandidature?
  commentaire     String?
  prochaine_etape String?

  notes           Note[]
  activity_logs   ActivityLog[]

  created_at      DateTime           @default(now())
  updated_at      DateTime           @updatedAt
}

enum StatutCandidature {
  A_ENVOYER
  ENVOYEE
  EN_ATTENTE
  ENTRETIEN_PLANIFIE
  ENTRETIEN_FAIT
  ACCEPTEE
  REFUSEE
  ANNULEE
}

enum ResultatCandidature {
  ACCEPTEE
  REFUSEE
  EN_COURS
  ABANDON
}

// ─── RENDEZ-VOUS ─────────────────────────────────────────────────────────────

model RendezVous {
  id              String       @id @default(uuid())
  type            TypeRDV
  date            DateTime
  duree_minutes   Int?
  statut          StatutRDV    @default(PLANIFIE)
  lieu            String?
  notes           String?

  // Peut être lié à un étudiant OU une entreprise
  etudiant_id     String?
  etudiant        Etudiant?    @relation(fields: [etudiant_id], references: [id])
  entreprise_id   String?
  entreprise      Entreprise?  @relation(fields: [entreprise_id], references: [id])

  animateur_id    String?
  animateur       User?        @relation("AnimePar", fields: [animateur_id], references: [id])

  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
}

enum TypeRDV {
  APPEL
  ENTRETIEN_ADMISSION
  ENTRETIEN_ENTREPRISE
  TEST_POSITIONNEMENT
  RDV_PHYSIQUE
  AUTRE
}

enum StatutRDV {
  PLANIFIE
  FAIT
  ANNULE
  NO_SHOW
}

// ─── TÂCHES / RELANCES ───────────────────────────────────────────────────────

model Tache {
  id              String      @id @default(uuid())
  titre           String
  type            TypeTache
  priorite        Priorite    @default(NORMALE)
  statut          StatutTache @default(A_FAIRE)
  date_echeance   DateTime?
  date_completion DateTime?
  commentaire     String?

  assigne_id      String?
  assigne         User?       @relation("AssigneA", fields: [assigne_id], references: [id])

  // Liée à un étudiant OU une entreprise
  etudiant_id     String?
  etudiant        Etudiant?   @relation(fields: [etudiant_id], references: [id])
  entreprise_id   String?
  entreprise      Entreprise? @relation(fields: [entreprise_id], references: [id])

  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}

enum TypeTache {
  RELANCE_TELEPHONE
  RELANCE_EMAIL
  ENVOI_CV
  PREPARATION_RDV
  SUIVI_DOSSIER
  AUTRE
}

enum StatutTache {
  A_FAIRE
  EN_COURS
  FAIT
  ANNULE
}

enum Priorite {
  BASSE
  NORMALE
  HAUTE
  URGENTE
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

model Document {
  id              String          @id @default(uuid())
  type            TypeDocument
  statut          StatutDocument  @default(MANQUANT)
  nom_fichier     String?
  url             String?
  commentaire     String?

  etudiant_id     String
  etudiant        Etudiant        @relation(fields: [etudiant_id], references: [id])

  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt
}

enum TypeDocument {
  CV
  LETTRE_MOTIVATION
  BULLETINS_SCOLAIRES
  DIPLOMES
  RELEVES_NOTES
  PHOTO_IDENTITE
  CARTE_IDENTITE
  ATTESTATION_SS
  CARTE_SEJOUR
  CONTRAT_ALTERNANCE_PRECEDENT
  JUSTIFICATIF_HANDICAP
  CERFA
  AUTRE
}

enum StatutDocument {
  RECU
  MANQUANT
  NON_APPLICABLE
  EXPIRE
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

model Note {
  id              String      @id @default(uuid())
  contenu         String
  auteur_id       String?

  etudiant_id     String?
  etudiant        Etudiant?   @relation(fields: [etudiant_id], references: [id])
  entreprise_id   String?
  entreprise      Entreprise? @relation(fields: [entreprise_id], references: [id])
  candidature_id  String?
  candidature     Candidature? @relation(fields: [candidature_id], references: [id])

  created_at      DateTime    @default(now())
}

// ─── AUDIT LOG / TIMELINE ────────────────────────────────────────────────────

model ActivityLog {
  id              String      @id @default(uuid())
  action          String      // ex: "statut_change", "rdv_created", "document_recu"
  champ           String?     // ex: "statut"
  ancienne_valeur String?
  nouvelle_valeur String?
  auteur_id       String?
  auteur_nom      String?     // Dénormalisé pour survie si user supprimé

  etudiant_id     String?
  etudiant        Etudiant?   @relation(fields: [etudiant_id], references: [id])
  entreprise_id   String?
  entreprise      Entreprise? @relation(fields: [entreprise_id], references: [id])
  candidature_id  String?
  candidature     Candidature? @relation(fields: [candidature_id], references: [id])

  created_at      DateTime    @default(now())
}
```

---

## 9. STACK TECHNIQUE RECOMMANDÉE

### Stack principale (conforme à l'envisagé, avec précisions)

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR natif, routing simple, excellent DX |
| **Base de données** | PostgreSQL 16 | Robustesse, JSON natif, full-text search, enums |
| **ORM** | Prisma 5+ | Typage fort, migrations propres, Studio inclus |
| **Authentification** | NextAuth.js (Auth.js) | Simple, secure, sessions DB, prêt prod en 1h |
| **UI Components** | shadcn/ui + Tailwind | Sobre, pro, pas d'opinionated design, rapide |
| **State / Fetching** | TanStack Query (React Query) | Cache, optimistic updates, loading states |
| **Formulaires** | React Hook Form + Zod | Validation côté client + serveur, DX excellent |
| **Hébergement BDD** | Neon (PostgreSQL serverless) ou Supabase | Gratuit pour commencer, scalable |
| **Hébergement App** | Vercel | Déploiement Next.js trivial, preview par PR |
| **Stockage fichiers** | Uploadthing ou Supabase Storage | Pour les documents PDF/images |

### Ce qu'on n'utilise pas et pourquoi
- **Pas de tRPC** : surcharge pour un projet de cette taille, les Server Actions Next.js suffisent
- **Pas de GraphQL** : inutile pour un CRM interne avec des endpoints bien définis
- **Pas de Redis** : pas nécessaire en V1, à ajouter si performance devient un enjeu
- **Pas d'ORM maison** : Prisma couvre 100% des besoins ici

### Architecture des dossiers (Next.js App Router)

```
avensia-crm/
├── app/
│   ├── (auth)/login/
│   ├── (crm)/
│   │   ├── dashboard/
│   │   ├── etudiants/
│   │   │   ├── page.tsx          (liste + filtres)
│   │   │   └── [id]/page.tsx     (fiche détail)
│   │   ├── entreprises/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── candidatures/
│   │   ├── taches/
│   │   └── pipeline/             (vue Kanban)
├── components/
│   ├── ui/                       (shadcn)
│   ├── etudiants/
│   ├── entreprises/
│   └── shared/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── validators/               (Zod schemas)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── scripts/
    └── import/                   (scripts migration Notion)
```

---

## 10. PLAN DE MIGRATION PROGRESSIF

### Phase 0 — Nettoyage des données (avant tout développement) ← **À faire maintenant**

**Durée estimée : 2-3 jours**

| Tâche | Détail |
|---|---|
| 0.1 Dédupliquer les entreprises | AIGLE x4 → 1. Règle : conserver la fiche la plus complète |
| 0.2 Séparer Prénom / Nom étudiants | Script Python ou Excel sur le CSV |
| 0.3 Normaliser les statuts étudiants | Mapper chaque valeur vers l'enum cible |
| 0.4 Valider les numéros de téléphone | Regex + flag "invalide" sur les suspects |
| 0.5 Identifier les emails manquants | Générer une liste à compléter manuellement |
| 0.6 Documenter le mapping des statuts | Tableau `statut_notion → statut_cible` |
| 0.7 Extraire les contacts entreprise | Depuis les fichiers markdown vers un CSV dédié |

**Livrable** : 3 CSV propres et normalisés (etudiants_clean.csv, entreprises_clean.csv, contacts_entreprise_clean.csv)

---

### Phase 1 — Fondations techniques (semaine 1-2)

| Tâche | Détail |
|---|---|
| 1.1 Init projet Next.js | `create-next-app` + TypeScript + Tailwind |
| 1.2 Setup PostgreSQL | Neon ou Supabase, variable d'env |
| 1.3 Setup Prisma | Schema complet, première migration |
| 1.4 Setup NextAuth | Login email/password, sessions en BDD |
| 1.5 Créer les utilisateurs initiaux | Les 5 commerciaux existants |
| 1.6 Script d'import étudiants | CSV clean → BDD, avec logs d'erreur |
| 1.7 Script d'import entreprises | CSV clean → BDD, déduplication |
| 1.8 Script d'import contacts | CSV contacts_entreprise_clean → BDD |

**Livrable** : BDD peuplée, login fonctionnel, données importées et vérifiées

---

### Phase 2 — CRUD de base (semaine 3-4)

| Tâche | Détail |
|---|---|
| 2.1 Liste étudiants | Tableau avec recherche, filtres statut/conseiller/formation |
| 2.2 Fiche étudiant | Affichage toutes infos + onglets Commercial / Administratif |
| 2.3 Création / édition étudiant | Formulaire validé avec Zod |
| 2.4 Liste entreprises | Tableau avec recherche, filtres statut/responsable |
| 2.5 Fiche entreprise | Infos + contacts + offres + RDVs |
| 2.6 Création / édition entreprise | Formulaire |
| 2.7 Changement de statut | Depuis la fiche, avec log automatique |
| 2.8 Ajout de notes | Sur toutes les fiches |

**Livrable** : CRUD complet sur les deux entités principales, utilisable en équipe

---

### Phase 3 — Process et suivi (semaine 5-6)

| Tâche | Détail |
|---|---|
| 3.1 Rendez-vous | Création, modification, statut, lien fiche |
| 3.2 Tâches / Relances | Création, assignation, date, statut |
| 3.3 Timeline par fiche | Historique horodaté des actions |
| 3.4 Vue "Mes tâches du jour" | Dashboard personnel par user |
| 3.5 Candidatures | Création, statut, lien étudiant+entreprise+offre |
| 3.6 Suivi documents administratifs | Checklist par étudiant, statut par doc |

**Livrable** : Process complet traçable de bout en bout

---

### Phase 4 — Dashboard et pilotage (semaine 7-8)

| Tâche | Détail |
|---|---|
| 4.1 Vue pipeline étudiants (Kanban) | Colonnes par étape, drag & drop optionnel |
| 4.2 Vue pipeline entreprises (Kanban) | Idem |
| 4.3 Dashboard direction | KPIs : nb inscrits, taux conv., RDVs semaine |
| 4.4 Reporting par formation | Comparaison objectifs vs réel |
| 4.5 Alertes | Leads sans relance depuis X jours |

**Livrable** : Outil de pilotage opérationnel pour la direction

---

## 11. PROPOSITION DE V1 RÉALISTE

### Périmètre V1 (ce qui doit être livré pour que l'outil remplace Notion au quotidien)

**Obligatoire**
- [x] Authentification (login/logout, 5 users minimum)
- [x] Liste + fiche + CRUD Étudiants
- [x] Liste + fiche + CRUD Entreprises
- [x] Changement de statut sur les fiches (avec log)
- [x] Ajout de notes sur les fiches
- [x] Création de RDVs (liés à une fiche)
- [x] Création de tâches/relances (assignables)
- [x] Suivi des documents administratifs (checklist)
- [x] Import initial des données Notion
- [x] Recherche rapide (barre globale)

**Optionnel V1 (nice to have)**
- [ ] Vue Kanban pipeline étudiants
- [ ] Candidatures basiques
- [ ] Dashboard avec 3-4 KPIs clés
- [ ] Filtres avancés sur les listes

**Hors scope V1 (explicitement)**
- Emails automatiques
- SMS / notifications push
- Portail candidat / entreprise
- Scoring IA
- Multi-campus
- Reporting avancé exportable

### Critère de succès V1
> L'équipe utilise le nouveau CRM pour **toutes les actions du quotidien** et ne rouvre Notion que pour consultation ponctuelle pendant la période de transition.

---

## ANNEXE — Mapping des statuts étudiants Notion → CRM cible

| Valeur Notion | Valeur cible (`EtapeEtudiant`) | Notes |
|---|---|---|
| Nouveau | `NOUVEAU` | |
| RDV 0 | `RDV0_PLANIFIE` | Vérifier si fait ou planifié |
| M1 | `RDV0_FAIT` | M1 = étape après RDV0 |
| RDV 1 | `RDV1_PLANIFIE` | |
| M2 | `RDV1_FAIT` | M2 = étape après RDV1 |
| RDV 2 | `RDV2_PLANIFIE` | |
| M3 | `RDV2_FAIT` | M3 = étape après RDV2 |
| Inscrit - Alternance | `INSCRIT` + `StatutEtudiant.INSCRIT_ALTERNANCE` | |
| Inscrit - En Recherche | `INSCRIT` + `StatutEtudiant.INSCRIT_EN_RECHERCHE` | |
| Numéro invalide | `CONTACTE` + `StatutEtudiant.INVALIDE` | |
| Abandon | `StatutEtudiant.ABANDON` | Conserver l'étape atteinte |
| Non retenu | `StatutEtudiant.NON_RETENU` | |
| [vide] | `NOUVEAU` | Par défaut |

---

*Audit réalisé sur la base de 214 étudiants, 144 entreprises, 5 conseillers et 400 lignes de contexte métier.*
*Prochaine étape recommandée : Phase 0 — nettoyage des données.*
