# ARCHITECTURE VALIDÉE — CRM AVENSIA
> Validée le 14 mars 2026

---

## 1. STACK TECHNIQUE

| Couche | Technologie | Version cible |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Base de données | PostgreSQL | 16 |
| ORM | Prisma | 5+ |
| Authentification | Auth.js (NextAuth v5) | 5 |
| UI Components | shadcn/ui | latest |
| CSS | Tailwind CSS | 3 |
| Validation | Zod | 3 |
| Fetching client | TanStack Query | Optionnel — à ajouter si besoin concret |
| Upload fichiers | Uploadthing | Hors scope V1 |
| Hébergement app | Vercel | — |
| Hébergement BDD | Neon (PostgreSQL serverless) | — |

**Principes transverses :**
- Pas d'API REST séparée — Server Actions Next.js pour le CRUD
- Pas de Redux ni de state manager global
- Typage TypeScript bout-en-bout via Prisma Client
- Enums définis au niveau PostgreSQL (pas seulement applicatif)
- Soft delete (`deleted_at`) sur les entités critiques

---

## 2. ENTITÉS RETENUES (12 tables)

| Table | Type | Description |
|---|---|---|
| `users` | Référentiel | Équipe interne, authentification, assignation |
| `formations` | Référentiel | Programmes proposés par Avensia |
| `etudiants` | Entité principale | Prospects et inscrits B2C |
| `entreprises` | Entité principale | Partenaires et prospects B2B |
| `contacts_entreprise` | Entité liée | Interlocuteurs au sein d'une entreprise |
| `offres` | Entité liée | Postes ouverts proposés par une entreprise |
| `candidatures` | Table pivot | Matching étudiant ↔ offre |
| `rendez_vous` | Activité | RDVs liés à un étudiant ou une entreprise |
| `taches` | Activité | Relances et actions assignées à un user |
| `documents` | Administratif | Pièces administratives par étudiant |
| `notes` | Transversal | Commentaires libres sur toute entité |
| `activity_logs` | Transversal | Historique immuable de toutes les modifications |

---

## 3. ENUMS ET STATUTS RETENUS

### EtapeEtudiant (tunnel de conversion)
```
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
```

### StatutEtudiant (état global de la relation)
```
EN_COURS
INSCRIT_EN_RECHERCHE
INSCRIT_ALTERNANCE
ABANDON
NON_RETENU
INVALIDE
```

### StatutEntreprise (pipeline B2B)
```
NOUVEAU
A_CONTACTER
CONTACTE
QUALIFIE
BESOIN_OUVERT
RDV_PLANIFIE
PARTENAIRE_ACTIF
AUCUN_BESOIN
PERDU
```

### StatutCandidature
```
A_ENVOYER
ENVOYEE
EN_ATTENTE
ENTRETIEN_PLANIFIE
ENTRETIEN_FAIT
ACCEPTEE
REFUSEE
ANNULEE
```

### StatutDocument
```
RECU
MANQUANT
NON_APPLICABLE
EXPIRE
```

### TypeDocument
```
CV / LETTRE_MOTIVATION / BULLETINS_SCOLAIRES / DIPLOMES / RELEVES_NOTES
PHOTO_IDENTITE / CARTE_IDENTITE / ATTESTATION_SS / CARTE_SEJOUR
CONTRAT_ALTERNANCE_PRECEDENT / JUSTIFICATIF_HANDICAP / CERFA / AUTRE
```

### TypeRDV
```
APPEL / ENTRETIEN_ADMISSION / TEST_POSITIONNEMENT / RDV_PHYSIQUE / ENTRETIEN_ENTREPRISE / AUTRE
```

### StatutRDV
```
PLANIFIE / FAIT / ANNULE / NO_SHOW
```

### TypeTache
```
RELANCE_TELEPHONE / RELANCE_EMAIL / ENVOI_CV / PREPARATION_RDV / SUIVI_DOSSIER / AUTRE
```

### StatutTache
```
A_FAIRE / EN_COURS / FAIT / ANNULE
```

### UserRole
```
ADMIN / DIRECTION / COMMERCIAL / ADMINISTRATIF
```

### OrigineContact
```
SALON_ETUDIANT / BOUCHE_A_OREILLE / JPO / INSTAGRAM / GOOGLE / LINKEDIN / PARTENAIRE / AUTRE
```

### TypeContrat
```
APPRENTISSAGE / PROFESSIONNALISATION
```

### Priorite
```
BASSE / NORMALE / HAUTE / URGENTE
```

---

## 4. MAPPING STATUTS NOTION → ENUMS CIBLES

### Étudiants — Étape du process

| Valeur Notion | EtapeEtudiant | StatutEtudiant | Nb |
|---|---|---|---|
| `Nouveau` | `NOUVEAU` | `EN_COURS` | 55 |
| `RDV 0` | `RDV0_PLANIFIE` | `EN_COURS` | 47 |
| `M1` | `RDV0_FAIT` | `EN_COURS` | 13 |
| `RDV 1` | `RDV1_PLANIFIE` | `EN_COURS` | 5 |
| `M2` | `RDV1_FAIT` | `EN_COURS` | 3 |
| `RDV 2` | `RDV2_PLANIFIE` | `EN_COURS` | 1 |
| `Inscrit - Alternance` | `INSCRIT` | `INSCRIT_ALTERNANCE` | 20 |
| `Inscrit - En Recherche` | `INSCRIT` | `INSCRIT_EN_RECHERCHE` | 17 |
| `Numéro invalide` | `CONTACTE` | `INVALIDE` | 7 |
| `Abandon` | *(étape conservée)* | `ABANDON` | 34 |
| *(vide)* | `NOUVEAU` | `EN_COURS` | 13 |

### Étudiants — Statut commercial → NiveauMotivation qualitatif

| Valeur Notion | Mapping |
|---|---|
| `Chaud` | label conservé en commentaire, motivation = haute |
| `Tiède` | label conservé en commentaire, motivation = moyenne |
| `Froid` | label conservé en commentaire, motivation = basse |
| *(vide)* | null |

### Entreprises — Étape du process

| Valeur Notion | StatutEntreprise | Nb |
|---|---|---|
| `Nouveau` | `NOUVEAU` | 2 |
| `À contacter` | `A_CONTACTER` | 29 |
| `Contacté` | `CONTACTE` | 10 |
| `Qualifié` | `QUALIFIE` | 3 |
| `Besoin ouvert` | `BESOIN_OUVERT` | 2 |
| `RDV planifié` | `RDV_PLANIFIE` | 3 |
| `Partenaire actif` | `PARTENAIRE_ACTIF` | 13 |
| `Aucun besoin` | `AUCUN_BESOIN` | 54 |
| `Perdu` | `PERDU` | 1 |
| *(vide)* | `NOUVEAU` | 28 |

### Origines de contact étudiants

| Valeur Notion | OrigineContact |
|---|---|
| `Salon l'Étudiant 2026` | `SALON_ETUDIANT` |
| `Bouches-à-oreilles` | `BOUCHE_A_OREILLE` |
| `Salon Face Yveline la Verrière` | `SALON_ETUDIANT` |
| `Salon Lycée Dumont d'Urville` | `SALON_ETUDIANT` |
| `Salon Neauphle-le-Château` | `SALON_ETUDIANT` |
| `Salon Coignères` | `SALON_ETUDIANT` |
| `JPO Mercredi 26 Novembre 2025` | `JPO` |
| `Marché` | `AUTRE` |
| `PARRAINAGE RANIA` | `BOUCHE_A_OREILLE` |
| `PARRAINAGE` | `BOUCHE_A_OREILLE` |
| *(vide)* | null |

---

## 5. ORDRE D'EXÉCUTION DU PROJET

| Phase | Contenu | Prérequis |
|---|---|---|
| **0 — Nettoyage** | Nettoyer les CSV, produire les fichiers clean | — |
| **1 — Fondations** | Init Next.js, Prisma schema, BDD, Auth, import CSV | Phase 0 terminée |
| **2 — CRUD de base** | Listes + fiches étudiants & entreprises, notes, statuts | Phase 1 terminée |
| **3 — Process & suivi** | RDVs, tâches, candidatures, documents, timeline | Phase 2 terminée |
| **4 — Pilotage** | Dashboard, Kanban, KPIs, alertes | Phase 3 terminée |

**Critère de passage Phase 0 → Phase 1 :**
Les 3 fichiers clean existent, le rapport de nettoyage est validé, aucune donnée source n'a été modifiée.

**Critère de succès V1 :**
L'équipe utilise le CRM pour toutes les actions quotidiennes. Notion est en lecture seule pendant 30 jours puis archivé.
