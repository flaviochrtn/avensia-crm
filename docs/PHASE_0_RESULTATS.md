# PHASE 0 — RÉSULTATS FINAUX
> Checkpoint de validation — 14 mars 2026 (mis à jour après correction D1)

---

## STATUT

```
Phase 0 : TERMINÉE ✅
          → Décision D1 validée et appliquée (enseignes multi-sites conservées séparément)
          → Script relancé avec nouvelle règle de déduplication (nom + ville + adresse)
          → 7 corrections manuelles restantes (non bloquantes pour l'import)
          → 18 emails manquants (non bloquants, à compléter en live)
          → FEUX VERTS pour la Phase 1
```

---

## 1. FICHIERS PRODUITS DANS /data/clean

| Fichier | Lignes | Colonnes | Rôle dans l'import |
|---|---|---|---|
| `etudiants_clean.csv` | 215 | 37 | Import direct → table `etudiants` |
| `entreprises_clean.csv` | **144** | 19 | Import direct → table `entreprises` |
| `contacts_entreprise_clean.csv` | 61 | 5 | Import → table `contacts_entreprise` |
| `rdvs_etudiants_clean.csv` | 153 | 7 | Import → table `rendez_vous` |
| `rapport_nettoyage.txt` | — | — | Journal des anomalies (28 entrées) |

**Fichiers sources dans /data/raw : intacts, non modifiés.**

> Évolution vs run précédent : 134 → **144 entreprises** (+10 magasins restaurés),
> 60 → **61 contacts** (+1 contact récupéré), **28 anomalies** (vs 36 précédemment).

---

## 2. COLONNES EXACTES PAR FICHIER

### etudiants_clean.csv (37 colonnes)

**Identité** : `prenom, nom, email, telephone, date_naissance, ville, adresse, sexe`

**Profil** : `permis, vehicule, situation_handicap`

**Process commercial** : `etape_process, statut, formation_code, type_contrat, diplome_actuel, formation_actuelle, specialisation, origine_contact, statut_motivation, campagne`

**Dates et relances** : `date_premier_contact, date_prochaine_relance, note_prochaine_relance`

**Qualification** : `niveau_test, niveau_motivation, niveau_cours`

**Liens (résolution FK à l'import)** : `conseiller_nom, apporteur_nom, entreprise_nom_lie`

**Administratif** : `pack_suivi_alternance, cv_url_raw, cerfa_raw`

**Métadonnées** : `commentaire, created_at_notion, updated_at_notion, cree_par`

---

### entreprises_clean.csv (19 colonnes)

`nom, secteur, type_structure, adresse, ville, telephone, email_general, besoin_alternant, statut, date_premier_contact, date_prochaine_relance, responsable_nom, commentaire, nombre_postes, formations_recherchees, profil_recherche, numero_idcc, campagne, created_at_notion`

---

### contacts_entreprise_clean.csv (5 colonnes)

`entreprise_nom, nom_complet, poste, email, telephone`

---

### rdvs_etudiants_clean.csv (7 colonnes)

`etudiant_ref, numero_rdv, type, date, statut, note, animateur`

---

## 3. RÈGLE DE DÉDUPLICATION VALIDÉE ET APPLIQUÉE

**Règle métier** : une fiche entreprise = un établissement physique distinct.

**Clé d'unicité** (par priorité) :
1. `nom_slug + ville_slug + adresse_slug` — si adresse disponible
2. `nom_slug + ville_slug` — si pas d'adresse mais ville présente
3. `nom_slug` seul — uniquement si ni ville ni adresse, et seulement si ≥ 3 champs identiques entre les lignes (responsable, téléphone, email, contact, secteur)

---

## 4. RÉSULTAT DE LA DÉDUPLICATION

### Seul vrai doublon mergé

| Enseigne | Ville | Lignes raw → clean | Raison du merge |
|---|---|---|---|
| **Edji** | Plaisir | 2 → 1 | Même nom, même ville, même responsable (Soukeina), informations complémentaires |

### Enseignes multi-sites conservées séparément (8 enseignes, 19 fiches)

| Enseigne | Fiches conservées | Villes |
|---|---|---|
| **AIGLE** | 3 | Le Chesnay-Rocquencourt / Paris Saint-Germain des Prés / Les Clayes-sous-Bois |
| **AUCHAN** | 2 | Le Chesnay-Rocquencourt / Bagnolet |
| **Etam** | 3 | Plaisir / Les Clayes-sous-Bois (rue) / Les Clayes-sous-Bois (One Nation Paris) |
| **Intersport** | 2 | Plaisir / Montigny-le-Bretonneux |
| **Castorama** | 2 | Les Clayes-sous-Bois / Chambourcy |
| **Grand Frais** | 2 | Montigny-le-Bretonneux / Guyancourt |
| **Bleu Libellule** | 2 | Montigny-le-Bretonneux / Plaisir |
| **Normal** | 2 | Montigny-le-Bretonneux / Plaisir |

**Note Etam** : les 3 fiches sont légitimement distinctes. La 3ème (Flavio / Les Clayes) a l'adresse `One Nation Paris` — c'est le centre commercial distinct du magasin de rue Soukeina. Les 3 numéros de téléphone sont différents, confirmant 3 établissements réels.

---

## 5. LOGIQUE DE LIAISON POUR L'IMPORT

**Ordre d'import obligatoire :**

```
1. formations          ← 10 lignes, saisie manuelle
2. users               ← 5 conseillers, saisie manuelle (emails + mots de passe)
3. entreprises         ← entreprises_clean.csv
4. contacts_entreprise ← contacts_entreprise_clean.csv (FK → entreprises par nom)
5. etudiants           ← etudiants_clean.csv (FK → users par nom, entreprises par nom)
6. rendez_vous         ← rdvs_etudiants_clean.csv (FK → etudiants par prenom+nom)
```

**Clés de rapprochement à l'import :**

| Source CSV | Champ de liaison | Résolution |
|---|---|---|
| `etudiants.conseiller_nom` | Nom complet du conseiller | → `users.id` par match exact |
| `etudiants.entreprise_nom_lie` | Nom de l'entreprise | → `entreprises.id` par match exact (+ ville si ambigu) |
| `contacts.entreprise_nom` | Nom de l'entreprise | → `entreprises.id` par match exact (+ ville si ambigu) |
| `rdvs.etudiant_ref` | `Prénom NOM` brut Notion | → `etudiants.id` par `prenom + ' ' + nom` |
| `rdvs.animateur` | Nom du correcteur | → `users.id` nullable |

**Attention liaison entreprise ↔ étudiant** : le champ `entreprise_nom_lie` dans les étudiants ne contient que le nom, sans ville. Pour les enseignes multi-sites (AIGLE, AUCHAN...), la résolution FK devra être vérifiée manuellement lors de l'import si plusieurs fiches portent le même nom.

---

## 6. COUVERTURE DES DONNÉES

### Étudiants (215 lignes)

| Champ | Couverture | Note |
|---|---|---|
| prenom, nom | 100% | ✅ |
| etape_process, statut | 100% | ✅ tous mappés |
| telephone | 97.7% | ✅ |
| ville | 94.4% | ✅ |
| email | 91.6% | 18 manquants — à compléter en live |
| formation_code | 55.8% | Normal — leads non encore qualifiés |
| conseiller_nom | 65.1% | 75 leads non assignés |
| date_naissance | 7.9% | Champ peu utilisé — ne pas rendre obligatoire |
| situation_handicap | 0% | Non utilisé dans Notion |

### Entreprises (144 lignes)

| Champ | Couverture | Note |
|---|---|---|
| nom, statut, ville | ~99% | ✅ |
| responsable_nom | 90.3% | ✅ |
| telephone | 81.3% | ✅ |
| secteur | 86.6% | ✅ |
| date_premier_contact | 82.8% | ✅ |
| email_general | 25.4% | Normal pour ce type de prospection terrain |

---

## 7. CORRECTIONS MANUELLES RESTANTES

Voir `docs/MANUAL_FIXES_REQUIRED.md`.

**Synthèse :**
- 3 étudiants avec split prénom/nom impossible (noms en minuscules) — corrections triviales
- 1 email étudiant invalide (point manquant dans le domaine)
- 1 téléphone étudiant double (deux numéros dans un champ)
- 1 téléphone entreprise avec "O" au lieu de "0"
- 1 email entreprise avec espace parasite

Toutes ces corrections sont **non bloquantes** pour l'import.

---

## 8. RISQUES RESTANTS AVANT PHASE 1

| Risque | Niveau | Bloquant | Mitigation |
|---|---|---|---|
| `entreprise_nom_lie` ambiguë pour enseignes multi-sites | Moyen | Non | Le script d'import traite les non-correspondances et log les cas à résoudre manuellement |
| 3 splits prénom/nom erronés | Faible | Non | Corrections dans le CSV avant import |
| 18 emails manquants | Faible | Non | Champ nullable en BDD, à compléter en live |
| 75 leads sans conseiller | Faible | Non | Assignation en batch post-import |
| Résolution FK par nom exact (sensible à la casse) | Faible | Non | Le script d'import normalisera les noms avant match |

---

## VERDICT FINAL PHASE 0

**Feux verts pour la Phase 1. ✅**

Les données sont propres, normalisées, correctement structurées et fidèles à la réalité métier.
La règle des enseignes multi-sites est appliquée. Les 7 corrections manuelles restantes
peuvent être faites avant ou pendant l'import sans risque.
