# CORRECTIONS MANUELLES REQUISES — PHASE 0
> Mis à jour après correction D1 — 14 mars 2026
> Décision D1 (enseignes multi-sites) : ✅ RÉSOLUE — script relancé

---

## STATUT GLOBAL

| # | Correction | Statut | Bloquant |
|---|---|---|---|
| D1 | Enseignes multi-sites → fiches séparées | ✅ Résolu | — |
| C1 | Vincent Fontes — split prénom/nom | ⏳ À faire | Non |
| C2 | Jhan Leroy — split prénom/nom | ⏳ À faire | Non |
| C3 | Syrine Kadi — split prénom/nom | ⏳ À faire | Non |
| C4 | David GBAKATCHELCHE — email invalide | ⏳ À confirmer | Non |
| C5 | Yassamine OUZIAD — double téléphone | ⏳ À faire | Non |
| C6 | Tape à l'œil — téléphone avec "O" | ⏳ À faire | Non |
| C7 | Preti — email avec espace | ⏳ À faire | Non |
| E1 | 18 étudiants sans email | ⏳ En live | Non |
| E2 | 75 leads sans conseiller assigné | ⏳ En live | Non |

---

## CORRECTIONS DANS etudiants_clean.csv

### C1 — Vincent Fontes
**Problème :** nom en minuscules, split automatique impossible.
Actuellement dans le CSV : `prenom=Vincent` / `nom=` (vide)
**Correction :** `prenom=Vincent` / `nom=FONTES`
**Email :** `fontesvincent2@gmail.com` ✅ valide — déjà présent
**Tél :** `07 63 95 86 56` ✅

---

### C2 — Jhan Leroy
**Problème :** nom en minuscules.
Actuellement dans le CSV : `prenom=Jhan` / `nom=` (vide)
**Correction :** `prenom=Jhan` / `nom=LEROY`
**Email :** `j.leroy29@icloud.com` ✅
**Tél :** `07 62 10 70 76` ✅

---

### C3 — Syrine Kadi
**Problème :** nom en minuscules.
Actuellement dans le CSV : `prenom=Syrine` / `nom=` (vide)
**Correction :** `prenom=Syrine` / `nom=KADI`
**Email :** `kkadi@me.com` ✅
**Statut :** ABANDON — peu prioritaire mais cohérence du jeu de données.

---

### C4 — David GBAKATCHELCHE
**Problème :** email invalide — point manquant dans le domaine.
**Email source :** `gbkdavid7@gmailcom`
**Correction probable :** `gbkdavid7@gmail.com`
**Action :** confirmer avec Flavio ou l'étudiant, puis corriger dans le CSV.

---

### C5 — Yassamine OUZIAD
**Problème :** deux numéros dans le champ téléphone.
**Valeur source :** `06 51 94 51 40 ou 07 58 57 17 10`
**Correction :** `telephone=06 51 94 51 40`
**Suggestion :** ajouter `07 58 57 17 10` dans le champ `commentaire`.
**Statut :** RDV0_PLANIFIE / EN_COURS / Flavio CHARTON — actif, donc prioritaire.

---

## CORRECTIONS DANS entreprises_clean.csv

### C6 — Tape à l'œil
**Problème :** lettre "O" à la place du chiffre "0" dans le téléphone.
**Valeur source :** `O1 34 59 44 93`
**Correction :** `01 34 59 44 93`

---

### C7 — Preti
**Problème :** email avec espace parasite.
**Valeur source :** `les clayes@pointp.fr`
**Interprétation :** semble être un identifiant store Point.P pour l'agence de Les Clayes-sous-Bois.
**Action :** vérifier si l'email est `lesclayes@pointp.fr` ou une autre adresse.
**En attendant :** laisser à null dans le CSV — ne pas importer un email invalide.

---

## À COMPLÉTER EN LIVE DANS LE CRM (post-import)

### E1 — 18 étudiants sans email

Compléter par ordre de priorité :

| Priorité | Prénom NOM | Étape | Statut | Conseiller |
|---|---|---|---|---|
| 🔴 Haute | Abrar BOUDERBALA | RDV1_PLANIFIE | EN_COURS | Lylian STURM |
| 🔴 Haute | Iris KOFFI | RDV1_PLANIFIE | EN_COURS | Lylian STURM |
| 🔴 Haute | Aya RAHMANI | INSCRIT | INSCRIT_EN_RECHERCHE | Farid BRINI |
| 🔴 Haute | Rania BELMADHI | INSCRIT | INSCRIT_EN_RECHERCHE | Farid BRINI |
| 🟠 Moyenne | Sanaa MEDJOUDJ | RDV0_FAIT | EN_COURS | Lylian STURM |
| 🟠 Moyenne | Tesnime ESSALAH | RDV0_FAIT | EN_COURS | Lylian STURM |
| 🟠 Moyenne | Halima CISSAKO | RDV0_FAIT | EN_COURS | Lylian STURM |
| 🟠 Moyenne | Inès YAKINE | RDV0_FAIT | EN_COURS | Lylian STURM |
| 🟠 Moyenne | Blanche DORIER | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON |
| 🟠 Moyenne | Manon LEÉME | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON |
| 🟠 Moyenne | Emilie JUBEROT | RDV0_PLANIFIE | EN_COURS | Flavio CHARTON |
| 🟡 Basse | Mathias PREVOST-LHOMMEUN | NOUVEAU | EN_COURS | *(non assigné)* |
| 🟡 Basse | Raphael GARDONE | NOUVEAU | EN_COURS | *(non assigné)* |
| 🟡 Basse | Célian OLLAGNE | NOUVEAU | EN_COURS | *(non assigné)* |
| 🟢 Optionnel | Mohamed AISSE | NOUVEAU | ABANDON | Lylian STURM |
| 🟢 Optionnel | Samy OULEMAS | NOUVEAU | ABANDON | Lylian STURM |
| 🟢 Optionnel | Lyna SARABHI | NOUVEAU | ABANDON | Lylian STURM |
| 🟢 Optionnel | Stephani OMORUYI | NOUVEAU | ABANDON | Lylian STURM |

### E2 — 75 leads sans conseiller référent

À assigner en batch depuis la vue liste étudiants une fois le CRM opérationnel.
Priorité aux leads EN_COURS et INSCRIT.

---

## NOTE — Leonor MOREIRA (téléphone tronqué)

**Téléphone source :** `06 08` — incomplet.
**Statut :** déjà flagué `INVALIDE` dans l'étape process.
**Action :** aucune — le statut reflète déjà la situation. À mettre à jour si le vrai numéro est retrouvé.
