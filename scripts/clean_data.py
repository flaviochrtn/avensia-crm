#!/usr/bin/env python3
"""
clean_data.py — Script de nettoyage des données Notion → CRM Avensia
Phase 0 du projet CRM

Règles fondamentales :
  - Ne JAMAIS modifier les fichiers dans /data/raw
  - Toute anomalie non résoluble → valeur null + log dans le rapport
  - Le script est idempotent (relançable N fois)
  - Chaque transformation est documentée et traçable

Usage :
  python3 scripts/clean_data.py

Sorties :
  data/clean/etudiants_clean.csv
  data/clean/entreprises_clean.csv
  data/clean/contacts_entreprise_clean.csv
  data/clean/rdvs_etudiants_clean.csv
  data/clean/rapport_nettoyage.txt
"""

from __future__ import annotations

import csv
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Union
from urllib.parse import unquote

# ─── CHEMINS ─────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent.parent
RAW_DIR  = BASE_DIR / "data" / "raw"
CLEAN_DIR = BASE_DIR / "data" / "clean"
CLEAN_DIR.mkdir(parents=True, exist_ok=True)

RAW_ETUDIANTS   = RAW_DIR / "etudiants_notion_export.csv"
RAW_ENTREPRISES = RAW_DIR / "entreprises_notion_export.csv"

OUT_ETUDIANTS   = CLEAN_DIR / "etudiants_clean.csv"
OUT_ENTREPRISES = CLEAN_DIR / "entreprises_clean.csv"
OUT_CONTACTS    = CLEAN_DIR / "contacts_entreprise_clean.csv"
OUT_RDVS        = CLEAN_DIR / "rdvs_etudiants_clean.csv"
OUT_RAPPORT     = CLEAN_DIR / "rapport_nettoyage.txt"

# ─── RAPPORT ─────────────────────────────────────────────────────────────────

rapport_lines = []

def log(niveau: str, entite: str, ligne: Union[int, str], champ: str, message: str, valeur_source: str = ""):
    """Ajoute une ligne au rapport de nettoyage."""
    ts = datetime.now().strftime("%H:%M:%S")
    src = f" | source={repr(valeur_source)}" if valeur_source else ""
    line = f"[{ts}] {niveau:7s} | {entite:12s} | ligne {str(ligne):4s} | {champ:35s} | {message}{src}"
    rapport_lines.append(line)

def ecrire_rapport(stats: dict):
    """Écrit le rapport final avec les stats de couverture."""
    with open(OUT_RAPPORT, "w", encoding="utf-8") as f:
        f.write("=" * 100 + "\n")
        f.write("RAPPORT DE NETTOYAGE — CRM AVENSIA\n")
        f.write(f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}\n")
        f.write("=" * 100 + "\n\n")
        f.write("ANOMALIES ET TRANSFORMATIONS\n")
        f.write("-" * 100 + "\n")
        for line in rapport_lines:
            f.write(line + "\n")
        f.write("\n" + "=" * 100 + "\n")
        f.write("STATISTIQUES DE COUVERTURE\n")
        f.write("-" * 100 + "\n")
        for entite, champs in stats.items():
            f.write(f"\n  {entite}\n")
            for champ, (renseignes, total) in champs.items():
                pct = renseignes / total * 100 if total else 0
                barre = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
                f.write(f"    {champ:40s} {barre} {renseignes:3d}/{total} ({pct:5.1f}%)\n")
    print(f"  → Rapport écrit : {OUT_RAPPORT}")

# ─── HELPERS GÉNÉRAUX ────────────────────────────────────────────────────────

MOIS_FR = {
    "janvier": "01", "février": "02", "mars": "03", "avril": "04",
    "mai": "05", "juin": "06", "juillet": "07", "août": "08",
    "septembre": "09", "octobre": "10", "novembre": "11", "décembre": "12"
}

def normaliser_date(valeur: str, entite: str, ligne: Union[int, str], champ: str) -> Union[str, None]:
    """
    Convertit les dates françaises en ISO 8601 (YYYY-MM-DD).
    Exemples sources : '13 février 2026', '13 février 2026 16:54', '19 février 2026 14:00 (UTC+1)'
    """
    if not valeur.strip():
        return None
    v = valeur.strip()
    # Retirer les infos de timezone
    v = re.sub(r'\s*\(UTC[+-]\d+\)', '', v).strip()
    # Format : "13 février 2026 14:00"
    m = re.match(r'(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}):(\d{2}))?', v, re.IGNORECASE)
    if m:
        jour, mois_str, annee = m.group(1), m.group(2).lower(), m.group(3)
        mois = MOIS_FR.get(mois_str)
        if mois:
            return f"{annee}-{mois}-{jour.zfill(2)}"
        else:
            log("WARN", entite, ligne, champ, f"Mois non reconnu : {repr(mois_str)}", valeur)
            return None
    # Format déjà ISO ou numérique
    if re.match(r'\d{4}-\d{2}-\d{2}', v):
        return v[:10]
    log("WARN", entite, ligne, champ, "Format de date non reconnu", valeur)
    return None

def oui_non_bool(valeur: str) -> Union[bool, None]:
    """Convertit Yes/No/Oui/Non/True/False en bool ou None."""
    if not valeur.strip():
        return None
    v = valeur.strip().lower()
    if v in ("yes", "oui", "true", "1"):
        return True
    if v in ("no", "non", "false", "0"):
        return False
    return None

def strip(valeur: str) -> Union[str, None]:
    """Nettoyage simple : strip + None si vide."""
    v = valeur.strip()
    return v if v else None

def normaliser_telephone(valeur: str, entite: str, ligne: Union[int, str], champ: str) -> Union[str, None]:
    """Normalise un numéro de téléphone français. Signale les suspects."""
    if not valeur.strip():
        return None
    # Retirer espaces et tirets
    v = re.sub(r'[\s\-\.]', '', valeur.strip())
    # Format +33...
    if v.startswith('+33'):
        v = '0' + v[3:]
    # Doit faire 10 chiffres et commencer par 0
    if re.match(r'^0[1-9]\d{8}$', v):
        # Reformater en XX XX XX XX XX
        return ' '.join(v[i:i+2] for i in range(0, 10, 2))
    log("WARN", entite, ligne, champ, "Numéro de téléphone suspect (format invalide)", valeur)
    return valeur.strip()  # On garde quand même la valeur brute

def normaliser_email(valeur: str, entite: str, ligne: Union[int, str], champ: str) -> Union[str, None]:
    """Normalise un email en lowercase. Signale les formats douteux."""
    if not valeur.strip():
        return None
    v = valeur.strip().lower()
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v):
        log("WARN", entite, ligne, champ, "Email au format invalide", valeur)
    return v

def slugify(valeur: str) -> str:
    """Normalise un nom pour comparaison (lowercase, sans accents, sans espaces)."""
    v = unicodedata.normalize('NFD', valeur.lower())
    v = ''.join(c for c in v if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', v)

def score_completude(row: dict) -> int:
    """Compte le nombre de champs non vides dans une ligne."""
    return sum(1 for v in row.values() if v and str(v).strip())

# ─── MAPPINGS ────────────────────────────────────────────────────────────────

ETAPE_ETUDIANT_MAP = {
    "Nouveau":               ("NOUVEAU",        "EN_COURS"),
    "RDV 0":                 ("RDV0_PLANIFIE",  "EN_COURS"),
    "M1":                    ("RDV0_FAIT",       "EN_COURS"),
    "RDV 1":                 ("RDV1_PLANIFIE",  "EN_COURS"),
    "M2":                    ("RDV1_FAIT",       "EN_COURS"),
    "RDV 2":                 ("RDV2_PLANIFIE",  "EN_COURS"),
    "Inscrit - Alternance":  ("INSCRIT",        "INSCRIT_ALTERNANCE"),
    "Inscrit - En Recherche":("INSCRIT",        "INSCRIT_EN_RECHERCHE"),
    "Numéro invalide":       ("CONTACTE",       "INVALIDE"),
    "Abandon":               ("NOUVEAU",        "ABANDON"),  # étape = inconnue, on met NOUVEAU
    "":                      ("NOUVEAU",        "EN_COURS"),
}

FORMATION_MAP = {
    "BTS NDRC 1": "BTS_NDRC_1",
    "BTS NDRC 2": "BTS_NDRC_2",
    "BTS SAM 1":  "BTS_SAM_1",
    "BTS SAM 2":  "BTS_SAM_2",  # si présent
    "BTS MCO 1":  "BTS_MCO_1",
    "BTS MCO 2":  "BTS_MCO_2",
    "RDCM 3":     "BACHELOR_RDC",
    "RH 3":       "BACHELOR_RH",
    "BTS COM 1":  "COM",
    "NTC":        "NTC",
    "":           None,
}

ORIGINE_MAP = {
    "Salon l'Étudiant 2026":              "SALON_ETUDIANT",
    "Bouches-à-oreilles":                 "BOUCHE_A_OREILLE",
    "Salon Face Yveline la Verrière":     "SALON_ETUDIANT",
    "Salon Lycée Dumont d'Urville":       "SALON_ETUDIANT",
    "Salon Neauphle-le-Château":          "SALON_ETUDIANT",
    "Salon Coignères":                    "SALON_ETUDIANT",
    "JPO Mercredi 26 Novembre 2025":      "JPO",
    "Marché":                             "AUTRE",
    "PARRAINAGE RANIA":                   "BOUCHE_A_OREILLE",
    "PARRAINAGE":                         "BOUCHE_A_OREILLE",
    "":                                   None,
}

STATUT_ENTREPRISE_MAP = {
    "Nouveau":          "NOUVEAU",
    "À contacter":      "A_CONTACTER",
    "Contacté":         "CONTACTE",
    "Qualifié":         "QUALIFIE",
    "Besoin ouvert":    "BESOIN_OUVERT",
    "RDV planifié":     "RDV_PLANIFIE",
    "Partenaire actif": "PARTENAIRE_ACTIF",
    "Aucun besoin":     "AUCUN_BESOIN",
    "Perdu":            "PERDU",
    "":                 "NOUVEAU",
}

STATUT_RDV_MAP = {
    "Planifié":  "PLANIFIE",
    "Réalisé":   "FAIT",
    "Annulé":    "ANNULE",
    "No show":   "NO_SHOW",
    "":          None,
}

# ─── NETTOYAGE ÉTUDIANTS ─────────────────────────────────────────────────────

def split_prenom_nom(valeur: str, ligne: int) -> "tuple[str, str]":
    """
    Sépare 'Ilayda KOMURCU' en ('Ilayda', 'KOMURCU').
    Règle : les tokens entièrement en MAJUSCULES à la fin = nom de famille.
    Cas ambigus → flagués dans le rapport.
    """
    tokens = valeur.strip().split()
    if not tokens:
        log("ERROR", "ETUDIANT", ligne, "prenom/nom", "Champ Prénom NOM vide", valeur)
        return ("", "")

    # Détecter les tokens en majuscules (= nom)
    # Un token "en majuscules" = au moins 2 lettres et toutes en majuscules (hors tirets/apostrophes)
    def est_majuscule(t):
        lettres = re.sub(r"[^a-zA-Z]", "", t)
        return len(lettres) >= 2 and lettres == lettres.upper()

    # Trouver la frontière prénom/nom : on cherche le premier token majuscule
    frontiere = None
    for i, t in enumerate(tokens):
        if est_majuscule(t):
            frontiere = i
            break

    if frontiere is None:
        # Aucun token en majuscule → on prend le premier token comme prénom, le reste comme nom
        log("WARN", "ETUDIANT", ligne, "prenom/nom",
            "Impossible de détecter la frontière prénom/nom — premier token = prénom", valeur)
        return (tokens[0], " ".join(tokens[1:]) if len(tokens) > 1 else "")

    prenom = " ".join(tokens[:frontiere])
    nom    = " ".join(tokens[frontiere:])

    if not prenom:
        log("WARN", "ETUDIANT", ligne, "prenom/nom",
            "Prénom vide après split — vérification manuelle requise", valeur)

    return (prenom, nom)


def nettoyer_rdvs(row: dict, idx: int) -> list[dict]:
    """
    Extrait les RDVs encodés dans les champs plats M1/M2/M3.
    Retourne une liste de dicts représentant chaque RDV trouvé.
    """
    rdvs = []
    prenom_nom = row.get("Prénom NOM", "")

    # RDV 1
    rdv1_fait    = oui_non_bool(row.get("M1", ""))
    rdv1_date    = normaliser_date(row.get("Date de R1", ""), "ETUDIANT_RDV", idx, "Date de R1")
    rdv1_statut  = STATUT_RDV_MAP.get(row.get("Statut RDV 1", "").strip())

    if rdv1_fait is True or rdv1_date or rdv1_statut:
        statut = rdv1_statut or ("FAIT" if rdv1_fait else "PLANIFIE")
        rdvs.append({
            "etudiant_ref":  prenom_nom,
            "numero_rdv":    1,
            "type":          "ENTRETIEN_ADMISSION",
            "date":          rdv1_date or "",
            "statut":        statut,
            "note":          "",
            "animateur":     "",
        })

    # RDV 2
    rdv2_fait    = oui_non_bool(row.get("M2", ""))
    rdv2_date    = normaliser_date(row.get("Date RDV 2", ""), "ETUDIANT_RDV", idx, "Date RDV 2")
    rdv2_note    = strip(row.get("Note RDV 2", ""))
    rdv2_corr    = strip(row.get("Correcteur RDV 2", ""))
    rdv2_statut  = STATUT_RDV_MAP.get(row.get("Statut RDV 2", "").strip())

    if rdv2_fait is True or rdv2_date or rdv2_statut:
        statut = rdv2_statut or ("FAIT" if rdv2_fait else "PLANIFIE")
        # Normaliser la note (virgule → point)
        note_norm = str(rdv2_note).replace(",", ".") if rdv2_note else ""
        rdvs.append({
            "etudiant_ref":  prenom_nom,
            "numero_rdv":    2,
            "type":          "ENTRETIEN_ADMISSION",
            "date":          rdv2_date or "",
            "statut":        statut,
            "note":          note_norm,
            "animateur":     rdv2_corr or "",
        })

    # RDV 3 (champ M3 seulement = signal qu'un 3ème entretien a eu lieu)
    rdv3_fait = oui_non_bool(row.get("M3", ""))
    if rdv3_fait is True:
        rdvs.append({
            "etudiant_ref":  prenom_nom,
            "numero_rdv":    3,
            "type":          "ENTRETIEN_ADMISSION",
            "date":          "",
            "statut":        "FAIT",
            "note":          "",
            "animateur":     "",
        })

    return rdvs


def nettoyer_etudiants() -> tuple[list[dict], list[dict], dict]:
    """Nettoie le fichier étudiants. Retourne (rows_clean, rows_rdvs, stats)."""
    print("\n[1/4] Nettoyage des étudiants...")

    with open(RAW_ETUDIANTS, encoding="utf-8-sig") as f:
        rows_raw = list(csv.DictReader(f))

    rows_clean = []
    rows_rdvs  = []
    stats_champs = {}

    COLONNES_SORTIE = [
        "prenom", "nom", "email", "telephone", "date_naissance", "ville", "adresse",
        "sexe", "permis", "vehicule", "situation_handicap",
        "etape_process", "statut",
        "formation_code", "type_contrat", "diplome_actuel", "formation_actuelle", "specialisation",
        "origine_contact", "statut_motivation", "campagne",
        "date_premier_contact", "date_prochaine_relance", "note_prochaine_relance",
        "niveau_test", "niveau_motivation", "niveau_cours",
        "conseiller_nom", "apporteur_nom", "entreprise_nom_lie",
        "pack_suivi_alternance", "cv_url_raw", "cerfa_raw",
        "commentaire", "created_at_notion", "updated_at_notion", "cree_par",
    ]

    # Init stats
    for col in COLONNES_SORTIE:
        stats_champs[col] = [0, len(rows_raw)]

    for idx, row in enumerate(rows_raw, start=2):  # start=2 car ligne 1 = headers

        # ── Prénom / Nom ──────────────────────────────────────────────────────
        prenom, nom = split_prenom_nom(row.get("Prénom NOM", ""), idx)

        # ── Étape du process ─────────────────────────────────────────────────
        etape_raw = row.get("Étape du process", "").strip()
        if etape_raw not in ETAPE_ETUDIANT_MAP:
            log("WARN", "ETUDIANT", idx, "etape_process",
                f"Valeur inconnue → mappée sur NOUVEAU/EN_COURS", etape_raw)
            etape_process, statut = "NOUVEAU", "EN_COURS"
        else:
            etape_process, statut = ETAPE_ETUDIANT_MAP[etape_raw]

        # ── Formation ────────────────────────────────────────────────────────
        formation_raw = row.get("Formation visée", "").strip()
        formation_code = FORMATION_MAP.get(formation_raw)
        if formation_raw and formation_code is None:
            log("WARN", "ETUDIANT", idx, "formation_code",
                f"Formation non mappée → null", formation_raw)

        # ── Origine du contact ───────────────────────────────────────────────
        origine_raw = row.get("Origine du contact", "").strip()
        jpo_raw     = row.get("JPO", "").strip()
        if jpo_raw and not origine_raw:
            origine_contact = "JPO"
        else:
            origine_contact = ORIGINE_MAP.get(origine_raw)
            if origine_raw and origine_contact is None:
                log("INFO", "ETUDIANT", idx, "origine_contact",
                    f"Origine non mappée → AUTRE", origine_raw)
                origine_contact = "AUTRE"

        # ── Type de contrat ──────────────────────────────────────────────────
        contrat_raw = row.get("Type de contrat", "").strip().lower()
        if "pro" in contrat_raw:
            type_contrat = "PROFESSIONNALISATION"
        elif "apprent" in contrat_raw or contrat_raw:
            type_contrat = "APPRENTISSAGE"
        else:
            type_contrat = None

        # ── Niveau test (virgule → point) ────────────────────────────────────
        niveau_test_raw = row.get("Niveau test positionnement ", "").strip()
        niveau_test = niveau_test_raw.replace(",", ".") if niveau_test_raw else None

        # ── Niveau motivation (entier) ────────────────────────────────────────
        niv_mot_raw = row.get("Niveau motivation", "").strip()
        try:
            niveau_motivation = int(float(niv_mot_raw.replace(",", "."))) if niv_mot_raw else None
        except (ValueError, TypeError):
            log("WARN", "ETUDIANT", idx, "niveau_motivation",
                "Valeur non convertible en entier → null", niv_mot_raw)
            niveau_motivation = None

        # ── CV URL (décodage URL encodée) ────────────────────────────────────
        cv_raw = row.get("CV", "").strip()
        cv_url = unquote(cv_raw) if cv_raw else None

        # ── RDVs (extraction) ─────────────────────────────────────────────────
        rdvs_extraits = nettoyer_rdvs(row, idx)
        rows_rdvs.extend(rdvs_extraits)

        # ── Assemblage de la ligne clean ─────────────────────────────────────
        clean = {
            "prenom":                  prenom,
            "nom":                     nom,
            "email":                   normaliser_email(row.get("Adresse e-mail", ""), "ETUDIANT", idx, "email"),
            "telephone":               normaliser_telephone(row.get("Téléphone", ""), "ETUDIANT", idx, "telephone"),
            "date_naissance":          normaliser_date(row.get("Date de naissance", ""), "ETUDIANT", idx, "date_naissance"),
            "ville":                   strip(row.get("Ville", "")),
            "adresse":                 strip(row.get("Adresse", "")),
            "sexe":                    strip(row.get("Sexe", "")),
            "permis":                  oui_non_bool(row.get("Permis", "")),
            "vehicule":                oui_non_bool(row.get("Véhiculé ", "")),
            "situation_handicap":      oui_non_bool(row.get("Situation de handicap", "")) or False,
            "etape_process":           etape_process,
            "statut":                  statut,
            "formation_code":          formation_code,
            "type_contrat":            type_contrat,
            "diplome_actuel":          strip(row.get("Diplôme", "")),
            "formation_actuelle":      strip(row.get("Formation Actuelle", "")),
            "specialisation":          strip(row.get("Spécialisation", "")),
            "origine_contact":         origine_contact,
            "statut_motivation":       strip(row.get("Statut commercial", "")),
            "campagne":                strip(row.get("Campagnes", "")),
            "date_premier_contact":    normaliser_date(row.get("Date de 1er contact", ""), "ETUDIANT", idx, "date_premier_contact"),
            "date_prochaine_relance":  normaliser_date(row.get("Date de prochaine relance", ""), "ETUDIANT", idx, "date_prochaine_relance"),
            "note_prochaine_relance":  strip(row.get("Prochaine relance", "")),
            "niveau_test":             niveau_test,
            "niveau_motivation":       niveau_motivation,
            "niveau_cours":            strip(row.get("Niveau cours", "")),
            "conseiller_nom":          strip(row.get("Conseiller référent", "")),
            "apporteur_nom":           strip(row.get("Apporteur d'affaires", "")),
            "entreprise_nom_lie":      strip(row.get("Entreprise liée", "")),
            "pack_suivi_alternance":   strip(row.get("Pack suivis alternance", "")),
            "cv_url_raw":              cv_url,
            "cerfa_raw":               strip(row.get("CERFA", "")),
            "commentaire":             strip(row.get("Commentaire", "")),
            "created_at_notion":       normaliser_date(row.get("Date de création", ""), "ETUDIANT", idx, "created_at"),
            "updated_at_notion":       normaliser_date(row.get("Dernière modification", ""), "ETUDIANT", idx, "updated_at"),
            "cree_par":                strip(row.get("Créée par", "")),
        }

        # Alertes sur champs critiques vides
        if not clean["email"]:
            log("INFO", "ETUDIANT", idx, "email", f"Email manquant — {prenom} {nom}")
        if not clean["prenom"] or not clean["nom"]:
            log("WARN", "ETUDIANT", idx, "prenom/nom", f"Prénom ou nom vide après split", row.get("Prénom NOM", ""))

        # Mise à jour des stats de couverture
        for col in COLONNES_SORTIE:
            if clean.get(col) not in (None, "", False):
                stats_champs[col][0] += 1

        rows_clean.append(clean)

    print(f"  → {len(rows_clean)} étudiants nettoyés")
    print(f"  → {len(rows_rdvs)} RDVs extraits")
    return rows_clean, rows_rdvs, {"ÉTUDIANTS": stats_champs}


# ─── NETTOYAGE ENTREPRISES ────────────────────────────────────────────────────

def deduplicer_entreprises(rows: list[dict]) -> "tuple[list[dict], int]":
    """
    Déduplique les entreprises selon la règle métier validée :

      UNE FICHE = UN ÉTABLISSEMENT PHYSIQUE DISTINCT

    Règle de clé de déduplication (par ordre de priorité) :
      1. nom_slug + ville_slug + adresse_slug (si adresse disponible)
      2. nom_slug + ville_slug               (si adresse absente des deux lignes)
      3. nom_slug seul uniquement si les deux lignes n'ont ni ville ni adresse
         → dans ce cas : merge UNIQUEMENT si même responsable OU mêmes données
           identiques sur au moins 3 autres champs (forte certitude)

    Conséquence : deux magasins d'une même enseigne dans deux villes différentes
    ne sont JAMAIS mergés, quelle que soit la similitude du nom.
    """

    def cle_etablissement(row: dict) -> str:
        """Calcule la clé d'unicité d'un établissement."""
        nom   = slugify(row.get("Nom entreprise", ""))
        ville = slugify(row.get("Ville", ""))
        adr   = slugify(row.get("Adresse", ""))
        if adr:
            return f"{nom}||{ville}||{adr}"
        if ville:
            return f"{nom}||{ville}"
        # Aucun discriminant géographique : clé = nom seul
        # → le merge sera soumis à vérification de certitude (voir ci-dessous)
        return f"{nom}||__novile__"

    def certitude_vrai_doublon(groupe: list[dict]) -> bool:
        """
        Quand deux lignes partagent le même nom mais n'ont ni ville ni adresse,
        on n'accepte le merge que si au moins 3 des champs suivants sont identiques
        (et non vides) entre toutes les lignes du groupe.
        """
        champs_comparaison = [
            "Responsable de la prospection",
            "Téléphone",
            "E-mail",
            "Contact principal",
            "Secteur d'activité ",
        ]
        if len(groupe) < 2:
            return True
        reference = groupe[0]
        score = 0
        for champ in champs_comparaison:
            val_ref = reference.get(champ, "").strip().lower()
            if not val_ref:
                continue
            if all(r.get(champ, "").strip().lower() == val_ref for r in groupe[1:]):
                score += 1
        return score >= 3

    # ── Grouper par clé d'établissement ──────────────────────────────────────
    groupes: dict = {}
    for row in rows:
        cle = cle_etablissement(row)
        if not slugify(row.get("Nom entreprise", "")):
            continue  # ligne sans nom → ignorée
        groupes.setdefault(cle, []).append(row)

    result   = []
    nb_merges = 0

    for cle, groupe in groupes.items():

        # ── Cas simple : une seule ligne ─────────────────────────────────────
        if len(groupe) == 1:
            result.append(groupe[0])
            continue

        # ── Groupe sans discriminant géographique : vérifier la certitude ────
        if "__novile__" in cle and not certitude_vrai_doublon(groupe):
            # Pas assez de certitude → conserver toutes les lignes séparément
            for row in groupe:
                log("INFO", "ENTREPRISE", "—", "deduplication",
                    f"Même nom sans ville, certitude insuffisante → conservées séparément : "
                    f"'{row.get('Nom entreprise', '')}'")
            result.extend(groupe)
            continue

        # ── Vrai doublon confirmé : merger ───────────────────────────────────
        nb_merges += len(groupe) - 1
        meilleure = max(groupe, key=score_completude)

        # Fusionner les commentaires uniques non vides
        commentaires = list(dict.fromkeys(
            r.get("Commentaire", "").strip()
            for r in groupe
            if r.get("Commentaire", "").strip()
        ))
        meilleure = dict(meilleure)  # copie pour ne pas muter le raw
        meilleure["Commentaire"] = " | ".join(commentaires) if commentaires else meilleure.get("Commentaire", "")

        log("INFO", "ENTREPRISE", "—", "deduplication",
            f"MERGE confirmé ({len(groupe)} lignes → 1) : "
            f"'{meilleure.get('Nom entreprise', '')}' — "
            f"ville='{meilleure.get('Ville', '')}' — "
            f"clé='{cle}'")
        result.append(meilleure)

    return result, nb_merges


def extraire_contacts(rows: list[dict]) -> list[dict]:
    """
    Extrait les contacts entreprise (Contact principal + Post + Mails + Tel)
    depuis les fiches entreprises vers une table dédiée.
    """
    contacts = []
    for row in rows:
        nom_contact = strip(row.get("Contact principal", ""))
        if not nom_contact:
            continue

        contacts.append({
            "entreprise_nom":   strip(row.get("Nom entreprise", "")),
            "nom_complet":      nom_contact,
            "poste":            strip(row.get("Post du contact", "")),
            "email":            strip(row.get("Mail contact", "")) or strip(row.get("E-mail", "")),
            "telephone":        strip(row.get("Téléphone contact", "")),
        })
    return contacts


def nettoyer_entreprises() -> tuple[list[dict], list[dict], dict]:
    """Nettoie le fichier entreprises. Retourne (rows_clean, rows_contacts, stats)."""
    print("\n[2/4] Nettoyage des entreprises...")

    with open(RAW_ENTREPRISES, encoding="utf-8-sig") as f:
        rows_raw = list(csv.DictReader(f))

    # Déduplication avant tout traitement
    rows_raw, nb_merges = deduplicer_entreprises(rows_raw)
    print(f"  → {nb_merges} doublons mergés")

    rows_clean   = []
    contacts_raw = extraire_contacts(rows_raw)
    stats_champs = {}

    COLONNES_SORTIE = [
        "nom", "secteur", "type_structure", "adresse", "ville",
        "telephone", "email_general", "besoin_alternant",
        "statut", "date_premier_contact", "date_prochaine_relance",
        "responsable_nom", "commentaire", "nombre_postes",
        "formations_recherchees", "profil_recherche", "numero_idcc",
        "campagne", "created_at_notion",
    ]

    for col in COLONNES_SORTIE:
        stats_champs[col] = [0, len(rows_raw)]

    for idx, row in enumerate(rows_raw, start=2):
        nom = strip(row.get("Nom entreprise", ""))
        if not nom:
            log("WARN", "ENTREPRISE", idx, "nom", "Entreprise sans nom — ignorée")
            continue

        # ── Statut ───────────────────────────────────────────────────────────
        statut_raw = row.get("Étape du process", "").strip()
        statut = STATUT_ENTREPRISE_MAP.get(statut_raw)
        if statut is None:
            log("WARN", "ENTREPRISE", idx, "statut",
                f"Statut inconnu → NOUVEAU", statut_raw)
            statut = "NOUVEAU"

        # ── Nombre de postes ─────────────────────────────────────────────────
        nb_postes_raw = row.get("Nombre de postes", "").strip()
        try:
            nombre_postes = int(float(nb_postes_raw)) if nb_postes_raw else 0
        except (ValueError, TypeError):
            nombre_postes = 0

        # Normalisation casse secteur
        secteur = strip(row.get("Secteur d'activité ", ""))
        if secteur:
            secteur = secteur.strip().capitalize()

        clean = {
            "nom":                  nom,
            "secteur":              secteur,
            "type_structure":       strip(row.get("Type de structure ", "")),
            "adresse":              strip(row.get("Adresse", "")),
            "ville":                strip(row.get("Ville", "")),
            "telephone":            normaliser_telephone(row.get("Téléphone", ""), "ENTREPRISE", idx, "telephone"),
            "email_general":        normaliser_email(row.get("E-mail", ""), "ENTREPRISE", idx, "email"),
            "besoin_alternant":     oui_non_bool(row.get("Besoin en alternant", "")),
            "statut":               statut,
            "date_premier_contact": normaliser_date(row.get("Date de premier contact", ""), "ENTREPRISE", idx, "date_premier_contact"),
            "date_prochaine_relance": normaliser_date(row.get("Date de relance prévue ", ""), "ENTREPRISE", idx, "date_prochaine_relance"),
            "responsable_nom":      strip(row.get("Responsable de la prospection", "")),
            "commentaire":          strip(row.get("Commentaire", "")),
            "nombre_postes":        nombre_postes,
            "formations_recherchees": strip(row.get("Formation recherchée", "")),
            "profil_recherche":     strip(row.get("Profil recherché", "")),
            "numero_idcc":          strip(row.get("Numéro IDCC", "")),
            "campagne":             strip(row.get("Campagne de recrutement", "")),
            "created_at_notion":    None,
        }

        for col in COLONNES_SORTIE:
            if clean.get(col) not in (None, "", False, 0):
                stats_champs[col][0] += 1

        rows_clean.append(clean)

    print(f"  → {len(rows_clean)} entreprises nettoyées")
    print(f"  → {len(contacts_raw)} contacts extraits")
    return rows_clean, contacts_raw, {"ENTREPRISES": stats_champs}


# ─── ÉCRITURE DES FICHIERS CLEAN ─────────────────────────────────────────────

def ecrire_csv(chemin: Path, rows: list[dict], label: str):
    """Écrit une liste de dicts dans un CSV UTF-8."""
    if not rows:
        print(f"  → {label} : aucune donnée à écrire")
        return
    with open(chemin, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"  → {label} écrit : {chemin.name} ({len(rows)} lignes)")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("CLEAN_DATA.PY — CRM Avensia — Phase 0")
    print(f"Démarrage : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    # Vérifications préalables
    for f in [RAW_ETUDIANTS, RAW_ENTREPRISES]:
        if not f.exists():
            print(f"ERREUR : fichier source introuvable : {f}")
            return

    all_stats = {}

    # 1. Étudiants
    etudiants_clean, rdvs_clean, stats_et = nettoyer_etudiants()
    all_stats.update(stats_et)

    # 2. Entreprises + contacts
    entreprises_clean, contacts_clean, stats_en = nettoyer_entreprises()
    all_stats.update(stats_en)

    # 3. Écriture des fichiers clean
    print("\n[3/4] Écriture des fichiers clean...")
    ecrire_csv(OUT_ETUDIANTS,   etudiants_clean,   "etudiants_clean.csv")
    ecrire_csv(OUT_ENTREPRISES, entreprises_clean, "entreprises_clean.csv")
    ecrire_csv(OUT_CONTACTS,    contacts_clean,    "contacts_entreprise_clean.csv")
    ecrire_csv(OUT_RDVS,        rdvs_clean,        "rdvs_etudiants_clean.csv")

    # 4. Rapport
    print("\n[4/4] Écriture du rapport de nettoyage...")
    ecrire_rapport(all_stats)

    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    print(f"  Étudiants nettoyés  : {len(etudiants_clean)}")
    print(f"  Entreprises nettes  : {len(entreprises_clean)}")
    print(f"  Contacts extraits   : {len(contacts_clean)}")
    print(f"  RDVs extraits       : {len(rdvs_clean)}")
    print(f"  Anomalies loggées   : {len(rapport_lines)}")
    print(f"  Fichiers de sortie  : {CLEAN_DIR}/")
    print("=" * 60)
    print("Terminé. Les fichiers sources dans /data/raw sont intacts.")


if __name__ == "__main__":
    main()
