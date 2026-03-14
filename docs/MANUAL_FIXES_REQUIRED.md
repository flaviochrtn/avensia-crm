# CORRECTIONS MANUELLES REQUISES — PHASE 0
> Mis à jour après correction D1 — 14 mars 2026
> Décision D1 (enseignes multi-sites) : ✅ RÉSOLUE — script relancé

---

## STATUT GLOBAL

| # | Correction | Statut | Bloquant |
|---|---|---|---|
| D1 | Enseignes multi-sites → fiches séparées | ✅ Résolu | — |
| C1 | Vincent Fontes — split prénom/nom | ✅ Appliqué | — |
| C2 | Jhan Leroy — split prénom/nom | ✅ Appliqué | — |
| C3 | Syrine Kadi — split prénom/nom | ✅ Appliqué | — |
| C4 | David GBAKATCHELCHE — email invalide | ✅ Nullifié — à confirmer en live | — |
| C5 | Yassamine OUZIAD — double téléphone | ✅ Appliqué | — |
| C6 | Tape à l'œil — téléphone avec "O" | ✅ Appliqué | — |
| C7 | Preti — email avec espace | ✅ Déjà vide — RAS | — |
| E1 | 18 étudiants sans email | ⏳ En live | Non |
| E2 | 75 leads sans conseiller assigné | ⏳ En live | Non |

---

## CORRECTIONS DANS etudiants_clean.csv

### C1 — Vincent Fontes ✅ APPLIQUÉ
`nom: 'Fontes' → 'FONTES'` — script apply_manual_fixes.py du 14/03/2026.

### C2 — Jhan Leroy ✅ APPLIQUÉ
`nom: 'Leroy' → 'LEROY'`

### C3 — Syrine Kadi ✅ APPLIQUÉ
`nom: 'Kadi' → 'KADI'`

### C4 — David GBAKATCHELCHE ✅ NULLIFIÉ — confirmation requise en live
`email: 'gbkdavid7@gmailcom' → ''` (null — email invalide, point manquant dans le domaine)
**Action restante :** retrouver l'étudiant, confirmer si l'email est `gbkdavid7@gmail.com`, puis mettre à jour dans le CRM après import.

### C5 — Yassamine OUZIAD ✅ APPLIQUÉ
`telephone: '06 51 94 51 40 ou 07 58 57 17 10' → '06 51 94 51 40'`
`commentaire: '' → 'Second tél : 07 58 57 17 10'`
**Note :** il existe une deuxième personne nommée `Yasmine OUZIAD` (sans double s) — deux personnes distinctes, non touchée.

---

## CORRECTIONS DANS entreprises_clean.csv

### C6 — Tape à l'œil ✅ APPLIQUÉ
`telephone: 'O1 34 59 44 93' → '01 34 59 44 93'`

### C7 — Preti ✅ RAS — déjà vide
`email_general` était déjà vide dans le CSV clean. Aucune action nécessaire.
L'email source (`les clayes@pointp.fr`) reste dans les fichiers raw uniquement.

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
