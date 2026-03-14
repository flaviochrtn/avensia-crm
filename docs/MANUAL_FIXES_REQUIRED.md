# CORRECTIONS MANUELLES REQUISES — PHASE 0
> À traiter avant le lancement de la Phase 1

---

## PRIORITÉ 1 — DÉCISION BLOQUANTE (toi seul peux trancher)

### D1 — Enseignes multi-sites : doublon ou magasins distincts ?

Le script a mergé 9 groupes d'entreprises sur la base du nom. Après vérification, 8 d'entre eux sont en réalité des **magasins distincts dans des villes différentes**, pas de vrais doublons.

**Décision requise :** chaque magasin = une fiche entreprise séparée ? (recommandé)

Si oui → je relance le script avec clé `nom + ville` pour corriger les merges.
Si non → on garde 1 fiche par enseigne avec les contacts comme points de vente distincts.

**Détail des cas concernés :**

| Enseigne | Magasins mergés (villes) | Responsable(s) | Données perdues lors du merge |
|---|---|---|---|
| **AIGLE** | Le Chesnay-Rocquencourt / Paris SGP / Les Clayes | Flavio CHARTON | 2 fiches magasin + leurs statuts distincts |
| **AUCHAN** | Le Chesnay-Rocquencourt / Bagnolet | Flavio CHARTON | 1 fiche magasin (statut Nouveau) |
| **Etam** | Plaisir / Les Clayes / Les Clayes | Soukeina + Flavio | 2 fiches magasin + commentaires |
| **Intersport** | Plaisir / Montigny-le-Bretonneux | Lylian + Soukeina | 1 fiche (statut Aucun besoin + "fermer définitivement") |
| **Castorama** | Les Clayes / Chambourcy | Soukeina + Lylian | 1 fiche magasin + responsable Lylian perdu |
| **Grand Frais** | Montigny / Guyancourt | Moncef MIGUEL | 1 fiche magasin + commentaire |
| **Bleu Libellule** | Montigny / Plaisir | Soukeina + Lylian | 1 fiche + responsable Soukeina perdu |
| **Normal** | Montigny / Plaisir | Soukeina + Lylian | 1 fiche + responsable Lylian perdu |

**Seul vrai doublon :** Edji (2 fiches, même ville Plaisir, même responsable) → merge correct, rien à faire.

**Recommandation :** Option A — conserver 1 fiche par magasin (nom + ville). La prospection se fait magasin par magasin. Prévoir un champ `enseigne` pour regrouper si besoin de vue agrégée.

---

## PRIORITÉ 2 — CORRECTIONS DANS etudiants_clean.csv (5 corrections)

À faire directement dans `data/clean/etudiants_clean.csv` avec un éditeur de texte ou Excel.

### C1 — Vincent Fontes (ligne 160 du raw → chercher par nom dans le CSV clean)
**Problème :** nom en minuscules, split automatique impossible.
**Données brutes :** `Vincent Fontes` | email: `fontesvincent2@gmail.com` | tél: `07 63 95 86 56`
**Correction :** `prenom = Vincent` / `nom = FONTES`
**Statut dans le CRM :** Nouveau, EN_COURS, sans conseiller assigné.

---

### C2 — Jhan Leroy (ligne 183 du raw)
**Problème :** nom en minuscules, split automatique impossible.
**Données brutes :** `Jhan Leroy` | email: `j.leroy29@icloud.com` | tél: `07 62 10 70 76`
**Correction :** `prenom = Jhan` / `nom = LEROY`
**Statut :** Nouveau, EN_COURS.

---

### C3 — Syrine Kadi (ligne 187 du raw)
**Problème :** nom en minuscules, split automatique impossible.
**Données brutes :** `Syrine Kadi` | email: `kkadi@me.com` | tél: vide
**Correction :** `prenom = Syrine` / `nom = KADI`
**Statut :** Abandon — peu prioritaire mais à corriger quand même pour la cohérence.

---

### C4 — David GBAKATCHELCHE (ligne 178 du raw)
**Problème :** email invalide — point manquant dans le domaine.
**Email source :** `gbkdavid7@gmailcom`
**Correction probable :** `gbkdavid7@gmail.com`
**Vérification recommandée :** confirmer avec l'intéressé ou Flavio.

---

### C5 — Yassamine OUZIAD (ligne 13 du raw)
**Problème :** deux numéros de téléphone dans un seul champ.
**Valeur source :** `06 51 94 51 40 ou 07 58 57 17 10`
**Correction :** choisir le numéro principal (probablement le premier).
**Proposition :** `telephone = 06 51 94 51 40`, mettre l'autre en commentaire.
**Statut :** RDV0_PLANIFIE, EN_COURS, Flavio CHARTON.

---

## PRIORITÉ 3 — CORRECTIONS DANS entreprises_clean.csv (2 corrections)

### C6 — Tape à l'œil (Auchan Buchelay ou similaire)
**Problème :** téléphone avec lettre "O" à la place du chiffre "0".
**Valeur source :** `O1 34 59 44 93`
**Correction :** `01 34 59 44 93`
**À corriger dans :** `data/clean/entreprises_clean.csv`, ligne contenant "Tape a l'oeil".

---

### C7 — Preti (Les Clayes-sous-Bois)
**Problème :** email avec espace parasite.
**Valeur source :** `les clayes@pointp.fr`
**Correction probable :** l'email semble être un identifiant store de Point.P — vérifier si `lesclayes@pointp.fr` est valide ou si c'est une autre adresse.
**En attendant :** supprimer la valeur (null) pour éviter d'importer un email invalide.

---

## PRIORITÉ 4 — À COMPLÉTER EN LIVE DANS LE CRM (non bloquant)

Ces éléments ne bloquent pas l'import mais devront être complétés dès que le CRM est opérationnel.

### E1 — 18 étudiants sans email

À compléter en priorité pour les leads EN_COURS et INSCRIT :

| Prénom NOM | Étape | Statut | Conseiller | Urgence |
|---|---|---|---|---|
| Abrar BOUDERBALA | RDV1_PLANIFIE | EN_COURS | Lylian STURM | 🔴 Haute |
| Iris KOFFI | RDV1_PLANIFIE | EN_COURS | Lylian STURM | 🔴 Haute |
| Aya RAHMANI | INSCRIT | INSCRIT_EN_RECHERCHE | Farid BRINI | 🔴 Haute |
| Rania BELMADHI | INSCRIT | INSCRIT_EN_RECHERCHE | Farid BRINI | 🔴 Haute |
| Sanaa MEDJOUDJ | RDV0_FAIT | EN_COURS | Lylian STURM | 🟠 Moyenne |
| Tesnime ESSALAH | RDV0_FAIT | EN_COURS | Lylian STURM | 🟠 Moyenne |
| Halima CISSAKO | RDV0_FAIT | EN_COURS | Lylian STURM | 🟠 Moyenne |
| Inès YAKINE | RDV0_FAIT | EN_COURS | Lylian STURM | 🟠 Moyenne |
| Blanche DORIER | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON | 🟠 Moyenne |
| Manon LEÉME | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON | 🟠 Moyenne |
| Emilie JUBEROT | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON | 🟠 Moyenne |
| Mathias PREVOST-LHOMMEUN | NOUVEAU | EN_COURS | *(non assigné)* | 🟡 Basse |
| Raphael GARDONE | NOUVEAU | EN_COURS | *(non assigné)* | 🟡 Basse |
| Célian OLLAGNE | NOUVEAU | EN_COURS | *(non assigné)* | 🟡 Basse |
| Mohamed AISSE | NOUVEAU | ABANDON | Lylian STURM | 🟢 Optionnel |
| Samy OULEMAS | NOUVEAU | ABANDON | Lylian STURM | 🟢 Optionnel |
| Lyna SARABHI | NOUVEAU | ABANDON | Lylian STURM | 🟢 Optionnel |
| Stephani OMORUYI | NOUVEAU | ABANDON | Lylian STURM | 🟢 Optionnel |

### E2 — 75 étudiants sans conseiller référent

À assigner en batch dans le CRM après import. Priorité aux leads EN_COURS et INSCRIT.

### E3 — Leonor MOREIRA (ligne 192 du raw)
Téléphone tronqué `06 08` — statut déjà "Numéro invalide". Non prioritaire.

---

## RÉCAPITULATIF DES ACTIONS

| # | Action | Qui | Quand | Bloquant |
|---|---|---|---|---|
| D1 | Décider : magasins distincts ou enseigne unique | Flavio | Avant Phase 1 | **OUI** |
| D1b | Relancer le script si Option A choisie | Claude | Après D1 | **OUI** |
| C1 | Corriger Vincent Fontes (prenom/nom) | Flavio ou Claude | Avant import | Non |
| C2 | Corriger Jhan Leroy (prenom/nom) | Flavio ou Claude | Avant import | Non |
| C3 | Corriger Syrine Kadi (prenom/nom) | Flavio ou Claude | Avant import | Non |
| C4 | Vérifier/corriger email David GBAKATCHELCHE | Flavio | Avant import | Non |
| C5 | Choisir le téléphone principal de Yassamine OUZIAD | Flavio | Avant import | Non |
| C6 | Corriger téléphone Tape à l'œil | Flavio ou Claude | Avant import | Non |
| C7 | Vérifier/supprimer email Preti | Flavio | Avant import | Non |
| E1 | Compléter les 18 emails manquants (prioritaires) | Conseillers | Après import | Non |
| E2 | Assigner 75 leads sans conseiller | Direction | Après import | Non |
