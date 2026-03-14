# PHASE 0 — RÉSULTATS FINAUX
> Checkpoint de validation — 14 mars 2026

---

## STATUT

```
Phase 0 : TERMINÉE avec réserves
          → 1 décision de modélisation requise avant Phase 1 (enseignes multi-sites)
          → 8 corrections manuelles recommandées (non bloquantes pour l'import)
          → 18 emails manquants (non bloquants, à compléter en live)
```

---

## 1. FICHIERS PRODUITS DANS /data/clean

| Fichier | Lignes | Colonnes | Rôle dans l'import |
|---|---|---|---|
| `etudiants_clean.csv` | 215 | 37 | Import direct → table `etudiants` |
| `entreprises_clean.csv` | 134 | 19 | Import direct → table `entreprises` ⚠️ voir section 4 |
| `contacts_entreprise_clean.csv` | 60 | 5 | Import → table `contacts_entreprise` |
| `rdvs_etudiants_clean.csv` | 153 | 7 | Import → table `rendez_vous` |
| `rapport_nettoyage.txt` | — | — | Journal des anomalies (36 entrées) |

**Fichiers sources dans /data/raw : intacts, non modifiés.**

---

## 2. COLONNES EXACTES PAR FICHIER

### etudiants_clean.csv (37 colonnes)

**Identité**
```
prenom, nom, email, telephone, date_naissance, ville, adresse, sexe
```

**Profil**
```
permis, vehicule, situation_handicap
```

**Process commercial**
```
etape_process, statut, formation_code, type_contrat,
diplome_actuel, formation_actuelle, specialisation,
origine_contact, statut_motivation, campagne
```

**Dates et relances**
```
date_premier_contact, date_prochaine_relance, note_prochaine_relance
```

**Qualification**
```
niveau_test, niveau_motivation, niveau_cours
```

**Liens (texte, résolution FK à l'import)**
```
conseiller_nom, apporteur_nom, entreprise_nom_lie
```

**Administratif et documents**
```
pack_suivi_alternance, cv_url_raw, cerfa_raw
```

**Métadonnées**
```
commentaire, created_at_notion, updated_at_notion, cree_par
```

---

### entreprises_clean.csv (19 colonnes)

```
nom, secteur, type_structure, adresse, ville,
telephone, email_general, besoin_alternant, statut,
date_premier_contact, date_prochaine_relance,
responsable_nom, commentaire, nombre_postes,
formations_recherchees, profil_recherche, numero_idcc,
campagne, created_at_notion
```

---

### contacts_entreprise_clean.csv (5 colonnes)

```
entreprise_nom, nom_complet, poste, email, telephone
```

Liaison à l'import : `entreprise_nom` → `entreprises.id` par correspondance de nom.

---

### rdvs_etudiants_clean.csv (7 colonnes)

```
etudiant_ref, numero_rdv, type, date, statut, note, animateur
```

Liaison à l'import : `etudiant_ref` (= `Prénom NOM` brut) → `etudiants.id` par correspondance `prenom + nom`.

---

## 3. LOGIQUE DE LIAISON POUR L'IMPORT

Le script d'import de Phase 1 aura des dépendances d'ordre strictes :

```
Ordre d'import obligatoire :
  1. formations          (table référentiel, 9 lignes, saisie manuelle)
  2. users               (5 conseillers, saisie manuelle avec emails/mots de passe)
  3. entreprises         ← depuis entreprises_clean.csv
  4. contacts_entreprise ← depuis contacts_entreprise_clean.csv (FK → entreprises)
  5. etudiants           ← depuis etudiants_clean.csv (FK → users, entreprises)
  6. rendez_vous         ← depuis rdvs_etudiants_clean.csv (FK → etudiants)
```

### Clés de rapprochement utilisées à l'import

| Source | Clé de rapprochement | Résolution |
|---|---|---|
| `etudiants.conseiller_nom` | Nom complet du conseiller | Match exact → `users.id` |
| `etudiants.entreprise_nom_lie` | Nom de l'entreprise | Match exact → `entreprises.id` |
| `contacts_entreprise.entreprise_nom` | Nom de l'entreprise | Match exact → `entreprises.id` |
| `rdvs.etudiant_ref` | `Prénom NOM` brut Notion | Match `prenom + ' ' + nom` → `etudiants.id` |
| `rdvs.animateur` | Nom du correcteur/animateur | Match exact → `users.id` (nullable) |

### Données à saisir manuellement avant l'import (pré-requis Phase 1)

Ces données n'existent pas dans les CSV et doivent être créées directement en base :

**Table `formations` (9 entrées)**
```
BTS_NDRC_1  | BTS NDRC 1ère année   | Bac+2 | 12 mois
BTS_NDRC_2  | BTS NDRC 2ème année   | Bac+2 | 12 mois
BTS_MCO_1   | BTS MCO 1ère année    | Bac+2 | 12 mois
BTS_MCO_2   | BTS MCO 2ème année    | Bac+2 | 12 mois
BTS_SAM_1   | BTS SAM 1ère année    | Bac+2 | 12 mois
BTS_SAM_2   | BTS SAM 2ème année    | Bac+2 | 12 mois
BACHELOR_RH | Bachelor RH 3ème année| Bac+3 | 12 mois
BACHELOR_RDC| Bachelor RDC 3ème année| Bac+3 | 12 mois
COM         | BTS COM 1ère année    | Bac+2 | 12 mois
NTC         | NTC                   | Bac+2 | 12 mois
```

**Table `users` (5 entrées)**
```
Flavio CHARTON    | role: COMMERCIAL (ou ADMIN)
Lylian STURM      | role: COMMERCIAL
Farid BRINI       | role: COMMERCIAL
Moncef MIGUEL     | role: COMMERCIAL
Soukeina N'DIAYE  | role: COMMERCIAL
```
→ Emails et mots de passe à définir lors de la Phase 1.

---

## 4. ⚠️ DÉCISION DE MODÉLISATION REQUISE — ENSEIGNES MULTI-SITES

### Le problème détecté

Le script de déduplication a mergé 9 groupes d'entreprises basés sur leur nom. Après inspection des villes, il s'avère que **la plupart ne sont pas de vrais doublons** mais des **points de vente différents de la même enseigne**.

| Enseigne | Lignes raw | Villes | Vrai doublon ? | Action |
|---|---|---|---|---|
| **AIGLE** | 3 | Le Chesnay / Paris SGP / Les Clayes | ❌ Non | À désmerger |
| **AUCHAN** | 2 | Le Chesnay / Bagnolet | ❌ Non | À désmerger |
| **Etam** | 3 | Plaisir / Les Clayes x2 | ❌ Non | À désmerger |
| **Intersport** | 2 | Plaisir / Montigny | ❌ Non | À désmerger |
| **Castorama** | 2 | Les Clayes / Chambourcy | ❌ Non | À désmerger |
| **Grand Frais** | 2 | Montigny / Guyancourt | ❌ Non | À désmerger |
| **Bleu Libellule** | 2 | Montigny / Plaisir | ❌ Non | À désmerger |
| **Normal** | 2 | Montigny / Plaisir | ❌ Non | À désmerger |
| **Edji** | 2 | Plaisir / Plaisir | ✅ Oui | Merge correct |

**Résultat actuel** : `entreprises_clean.csv` contient 134 lignes. Sans les merges erronés, il devrait en contenir **142** (134 + 8 lignes supprimées à tort).

### La décision à prendre

**Option A — Identifiant = Nom + Ville** (recommandée)
Chaque magasin = une entité distincte dans `entreprises`. L'enseigne est stockée dans un champ `enseigne` ou `groupe`.
- Pro : reflect la réalité terrain (chaque magasin a son propre contact, son propre suivi, son propre statut)
- Pro : aligné avec le modèle CRM standard pour les GSS/GSA
- Con : 8 fiches supplémentaires à gérer

**Option B — Enseigne = entité, magasins = contacts**
Une fiche `AIGLE` unique, avec 3 contacts pour les 3 villes.
- Pro : vue agrégée par enseigne
- Con : perd la granularité du suivi par magasin, complique les relances

**Recommandation : Option A.** La prospection chez Avensia se fait magasin par magasin (un appel = un magasin spécifique). La fiche doit représenter le point de vente, pas l'enseigne.

→ **Action requise avant Phase 1** : relancer le script de nettoyage avec une clé de déduplication `nom + ville` au lieu de `nom` seul, ou désmerger manuellement les 8 cas dans le CSV.

---

## 5. COUVERTURE DES DONNÉES — CHIFFRES CLÉS

### Étudiants (215 lignes)

| Champ | Couverture | Interprétation |
|---|---|---|
| prenom, nom | 100% | Fiable |
| etape_process, statut | 100% | Fiable — tous mappés |
| email | 91.6% (18 manquants) | 18 à compléter |
| telephone | 97.7% (2 suspects) | Bon |
| ville | 94.4% | Bon |
| formation_code | 55.8% | Normal — leads non encore qualifiés |
| date_naissance | 7.9% | Très faible — champ jamais vraiment utilisé |
| conseiller_nom | 65.1% (75 sans) | 75 leads non assignés |
| type_contrat | 17.2% | Peu renseigné |
| situation_handicap | 0% | Champ non utilisé dans Notion |

### Entreprises (134 lignes après merge)

| Champ | Couverture | Interprétation |
|---|---|---|
| nom, statut | 100% | Fiable |
| ville | 97.8% | Très bon |
| responsable_nom | 90.3% | Bon |
| telephone | 81.3% | Bon |
| secteur | 86.6% | Bon |
| date_premier_contact | 82.8% | Bon |
| email_general | 25.4% | Faible — normal pour ce type de prospection |
| besoin_alternant | 11.9% | Peu renseigné |

---

## 6. ANOMALIES RESTANTES (36 loggées, 8 nécessitent action)

Voir `docs/MANUAL_FIXES_REQUIRED.md` pour le détail et plan d'action.

**Résumé :**
- 3 étudiants avec split prénom/nom impossible (noms en minuscules)
- 1 email invalide (point manquant)
- 1 téléphone double (deux numéros dans un champ)
- 1 téléphone tronqué
- 1 téléphone entreprise avec "O" au lieu de "0"
- 1 email entreprise avec espace parasite

---

## 7. RISQUES AVANT PHASE 1

| Risque | Niveau | Bloquant ? | Mitigation |
|---|---|---|---|
| Merges erronés d'enseignes multi-sites | **ÉLEVÉ** | Oui | Décision + relance script avant import |
| 3 étudiants avec nom mal splitté | Faible | Non | Corriger dans le CSV avant import |
| 1 email étudiant invalide | Faible | Non | Corriger avant import |
| 18 emails manquants | Faible | Non | À compléter en live dans le CRM |
| 75 étudiants sans conseiller assigné | Moyen | Non | Assigner en batch dans le CRM après import |
| Résolution FK par nom exact | Moyen | Non | Le script d'import doit gérer les non-correspondances |
| `rdvs.etudiant_ref` = nom brut Notion | Moyen | Non | Match à valider ligne par ligne lors de l'import |

---

## VERDICT PHASE 0

**Les données sont prêtes pour l'import, sous réserve de :**

1. ✅ Valider la décision sur les enseignes multi-sites (Option A recommandée)
2. ✅ Relancer `clean_data.py` avec clé `nom + ville` pour les entreprises
3. ✅ Corriger les 3 splits prénom/nom et l'email invalide dans `etudiants_clean.csv`

Une fois ces 3 points résolus : **feu vert Phase 1**.
