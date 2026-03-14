# PHASE 0 — PLAN DE NETTOYAGE DES DONNÉES
> Rédigé le 14 mars 2026

---

## FICHIERS SOURCES (dans /data/raw)

| Fichier | Lignes | Colonnes | Usage |
|---|---|---|---|
| `etudiants_notion_export.csv` | 215 | 49 | Source principale B2C |
| `entreprises_notion_export.csv` | 145 | 35 | Source principale B2B |
| `objectifs_notion_export.csv` | — | — | Référence uniquement, pas à importer en BDD |

---

## FICHIER 1 — ÉTUDIANTS

### Problèmes détectés

| # | Problème | Colonne | Impact | Nb lignes affectées |
|---|---|---|---|---|
| E1 | Prénom et Nom dans une seule colonne | `Prénom NOM` | Critique | 215 |
| E2 | Colonne `Âge` avec espaces, calculée manuellement | `Âge ` | Faible | 215 |
| E3 | Statuts non normalisés (`Étape du process`) | `Étape du process` | Critique | 215 |
| E4 | Statut commercial (`Chaud/Tiède/Froid`) non structuré | `Statut commercial` | Moyen | 54 renseignés |
| E5 | 13 lignes sans étape du process | `Étape du process` | Moyen | 13 |
| E6 | 75 étudiants sans conseiller référent | `Conseiller référent` | Moyen | 75 |
| E7 | Formation visée vide pour 95 étudiants | `Formation visée` | Moyen | 95 |
| E8 | Origine contact : valeurs libres (noms de salon) | `Origine du contact` | Moyen | 215 |
| E9 | RDVs encodés en champs plats (M1/M2/RDV1/RDV2) | col 25-33 | Fort | À extraire |
| E10 | Noms de colonnes avec espaces parasites | `Âge `, `Véhiculé `, etc. | Faible | — |
| E11 | URLs encodées dans le champ CV | `CV` | Faible | Décodage URL |
| E12 | Dates dans plusieurs formats | Dates | Moyen | Variable |
| E13 | Valeurs booléennes en `Yes/No` | Permis, Véhiculé, etc. | Faible | 215 |
| E14 | Note RDV 2 : valeur numérique avec virgule (`8,2`) | `Note RDV 2` | Faible | Quelques lignes |

### Transformations prévues

**Colonnes créées / renommées**

| Colonne Notion | Colonne(s) cible(s) | Transformation |
|---|---|---|
| `Prénom NOM` | `prenom` + `nom` | Split sur le premier espace, le reste = nom |
| `Âge ` | *(supprimée)* | Calculé depuis date_naissance en BDD |
| `Date de naissance` | `date_naissance` | Normalisation ISO 8601 (YYYY-MM-DD) |
| `Ville` | `ville` | Strip whitespace |
| `Téléphone` | `telephone` | Strip, normalisation |
| `Adresse e-mail` | `email` | Lowercase + strip |
| `Étape du process` | `etape_process` | Mapping vers enum (voir tableau) |
| `Formation visée` | `formation_code` | Mapping vers code court |
| `Adresse` | `adresse` | Strip |
| `Photo Étudiant` | *(ignorée)* | Hors scope V1 |
| `Situation de handicap` | `situation_handicap` | Yes/No → true/false |
| `Permis` | `permis` | Yes/No → true/false |
| `Véhiculé ` | `vehicule` | Yes/No → true/false |
| `Diplôme` | `diplome_actuel` | Strip |
| `Formation Actuelle` | `formation_actuelle` | Strip |
| `Type de contrat` | `type_contrat` | Mapping vers enum |
| `Spécialisation` | `specialisation` | Strip |
| `Origine du contact` | `origine_contact` | Mapping vers enum |
| `Campagnes` | `campagne` | Strip, garder comme texte |
| `JPO` | *(fusionnée dans origine_contact)* | Si renseignée → `JPO` |
| `Statut commercial` | `statut_motivation` | Garder comme label texte |
| `Date de 1er contact` | `date_premier_contact` | Normalisation date |
| `Date de prochaine relance` | `date_prochaine_relance` | Normalisation date |
| `Prochaine relance` | `note_prochaine_relance` | Texte libre, garder |
| `M1` | → `rdvs_extraits` JSON | Extraction RDV 1 |
| `Date de R1` | → `rdvs_extraits` JSON | Extraction RDV 1 |
| `Statut RDV 1` | → `rdvs_extraits` JSON | Extraction RDV 1 |
| `M2` | → `rdvs_extraits` JSON | Extraction RDV 2 |
| `Date RDV 2` | → `rdvs_extraits` JSON | Extraction RDV 2 |
| `Note RDV 2` | → `rdvs_extraits` JSON | Extraction RDV 2 |
| `Correcteur RDV 2` | → `rdvs_extraits` JSON | Extraction RDV 2 |
| `Statut RDV 2` | → `rdvs_extraits` JSON | Extraction RDV 2 |
| `M3` | → `rdvs_extraits` JSON | Signal RDV 3 fait |
| `Pack suivis alternance` | `pack_suivi_alternance` | Strip |
| `CV` | `cv_url_raw` | URL décodée, garder pour référence |
| `CERFA` | `cerfa_raw` | Garder pour référence |
| `Conseiller référent` | `conseiller_nom` | Strip — sera résolu en FK à l'import |
| `Apporteur d'affaires` | `apporteur_nom` | Strip |
| `Entreprise liée` | `entreprise_nom_lie` | Strip — sera résolu en FK à l'import |
| `Opportunité liée` | `opportunite_raw` | Garder pour référence |
| `Niveau test positionnement ` | `niveau_test` | Strip, remplacer virgule par point |
| `Niveau motivation` | `niveau_motivation` | Entier ou null |
| `Niveau cours` | `niveau_cours` | Strip |
| `Commentaire` | `commentaire` | Strip |
| `Date de création` | `created_at_notion` | Normalisation date |
| `Dernière modification` | `updated_at_notion` | Normalisation date |
| `Créée par` | `cree_par` | Strip |
| `Dernière modification par` | `modifie_par` | Strip |

**Règles de split Prénom / Nom**
- Format observé : `Prénom NOM` (prénom en minuscule, nom en MAJUSCULES)
- Règle : tout ce qui est en MAJUSCULES à la fin = nom de famille
- Cas dégénérés (ex: prénom composé) → flagués dans le rapport pour vérification manuelle

**Règles de normalisation des dates**
- Format source observé : `13 février 2026`, `13 février 2026 16:54`
- Cible : `YYYY-MM-DD` pour les dates, `YYYY-MM-DD HH:MM` pour les datetimes
- Mois en français mappés : janvier→01, février→02, mars→03, etc.

---

## FICHIER 2 — ENTREPRISES

### Problèmes détectés

| # | Problème | Colonne | Impact | Nb lignes |
|---|---|---|---|---|
| E1 | 5 noms dupliqués (11 lignes) | `Nom entreprise` | Critique | 11 |
| E2 | 28 entreprises sans étape du process | `Étape du process` | Moyen | 28 |
| E3 | Statuts non normalisés | `Étape du process` | Critique | 145 |
| E4 | 13 entreprises sans responsable | `Responsable de la prospection` | Moyen | 13 |
| E5 | Secteurs en texte libre, casse incohérente | `Secteur d'activité ` | Faible | — |
| E6 | Contact principal mélangé dans un champ texte | `Contact principal` | Fort | Variable |
| E7 | Noms de colonnes avec espaces parasites | `Date de relance prévue `, etc. | Faible | — |
| E8 | Colonnes `Nombre de post *` : données partielles | 8 colonnes | Moyen | — |

### Doublons identifiés

| Nom | Occurrences | Stratégie |
|---|---|---|
| AIGLE | 3 | Conserver la fiche la plus complète, merger commentaires |
| Edji | 2 | Merger |
| Grand Frais | 2 | Merger |
| Etam | 2 | Merger |
| AUCHAN | 2 | Merger |

**Règle de déduplication :**
1. Grouper par nom normalisé (lowercase, strip, sans accents)
2. Conserver la ligne avec le plus de champs renseignés
3. Merger les commentaires des doublons dans un champ `commentaire_merge`
4. Logger chaque merge dans le rapport

### Transformations prévues

| Colonne Notion | Colonne cible | Transformation |
|---|---|---|
| `Nom entreprise` | `nom` | Strip, normalisation casse (Title Case) |
| `Adresse` | `adresse` | Strip |
| `Besoin en alternant` | `besoin_alternant` | Yes/No → true/false/null |
| `Commentaire` | `commentaire` | Strip |
| `Contact principal` | `contact_nom` | Strip — sera extrait dans contacts_entreprise |
| `Date de RDV` | `date_rdv_raw` | Garder pour extraction RDV |
| `Date de premier contact` | `date_premier_contact` | Normalisation date |
| `Date de relance prévue ` | `date_prochaine_relance` | Normalisation date |
| `E-mail` | `email_general` | Lowercase + strip |
| `Mail contact` | `contact_email` | Lowercase + strip |
| `Post du contact` | `contact_poste` | Strip |
| `Téléphone contact` | `contact_telephone` | Strip |
| `Formation recherchée` | `formations_recherchees` | Garder comme texte |
| `Nombre de postes` | `nombre_postes` | Int ou 0 |
| `Responsable de la prospection` | `responsable_nom` | Strip |
| `Secteur d'activité ` | `secteur` | Strip, normalisation casse |
| `Type de structure ` | `type_structure` | Strip |
| `Téléphone` | `telephone` | Strip |
| `Ville` | `ville` | Strip |
| `Étape du process` | `statut` | Mapping vers enum |
| `Étudiants liés` | *(ignoré pour l'instant)* | Relation inversée gérée côté étudiant |
| `Campagne de recrutement` | `campagne` | Strip |
| Colonnes `Nombre de post *` | *(ignorées)* | Redondant avec `Nombre de postes` |
| `Numéro IDCC` | `numero_idcc` | Strip |
| `Opportunités liées` | *(ignoré)* | Hors scope V1 |
| `Fiche de post` | *(ignorée)* | Hors scope V1 |
| `Profil recherché` | `profil_recherche` | Strip |
| `Niveau d'étude` | `niveau_etude` | Strip |

---

## FICHIERS DE SORTIE ATTENDUS

| Fichier | Description |
|---|---|
| `data/clean/etudiants_clean.csv` | 215 étudiants normalisés, colonnes renommées, statuts mappés |
| `data/clean/entreprises_clean.csv` | ~136 entreprises dédupliquées et normalisées |
| `data/clean/contacts_entreprise_clean.csv` | Contacts extraits des fiches entreprises |
| `data/clean/rdvs_etudiants_clean.csv` | RDVs extraits des champs plats M1/M2/M3 |
| `data/clean/rapport_nettoyage.txt` | Journal complet de toutes les anomalies et transformations |

---

## RÈGLES GÉNÉRALES DU SCRIPT

1. **Jamais de modification des fichiers dans /data/raw**
2. Toute anomalie non résolvable automatiquement → flagué dans le rapport, valeur mise à null
3. Chaque ligne du rapport est horodatée
4. Le script est idempotent : peut être relancé N fois sans effet de bord
5. En fin de script : statistiques de couverture (% champs renseignés par colonne)
