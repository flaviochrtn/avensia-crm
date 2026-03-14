#!/usr/bin/env python3
"""
apply_manual_fixes.py — Corrections manuelles de clôture Phase 0

Corrections appliquées :
  C1 : Vincent Fontes     → nom = FONTES
  C2 : Jhan Leroy         → nom = LEROY
  C3 : Syrine Kadi        → nom = KADI
  C4 : David GBAKATCHELCHE → email = null (invalide non confirmé)
  C5 : Yassamine OUZIAD   → telephone = 06 51 94 51 40 | commentaire += second numéro
  C6 : Tape à l'œil       → telephone = 01 34 59 44 93
  C7 : Preti              → email_general = null (déjà vide — vérification)

Non modifié : etudiants raw, entreprises raw (jamais touchés).
Ce script est idempotent.
"""

from __future__ import annotations

import csv
import shutil
from datetime import datetime
from pathlib import Path

BASE_DIR   = Path(__file__).parent.parent
CLEAN_DIR  = BASE_DIR / "data" / "clean"
BACKUP_DIR = CLEAN_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

ET_FILE = CLEAN_DIR / "etudiants_clean.csv"
EN_FILE = CLEAN_DIR / "entreprises_clean.csv"

log_lines: list[str] = []

def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    log_lines.append(line)
    print(f"  {line}")

def backup(path: Path):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"{path.stem}_before_fixes_{ts}{path.suffix}"
    shutil.copy2(path, dest)
    log(f"Backup créé : {dest.name}")

def read_csv(path: Path) -> tuple[list[str], list[dict]]:
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)
    return list(fieldnames), rows

def write_csv(path: Path, fieldnames: list[str], rows: list[dict]):
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# ─── CORRECTIONS ÉTUDIANTS ────────────────────────────────────────────────────

def corriger_etudiants():
    log("─── Corrections etudiants_clean.csv ───")
    fieldnames, rows = read_csv(ET_FILE)
    nb_modifs = 0

    for row in rows:
        p, n = row["prenom"].strip(), row["nom"].strip()

        # C1 — Vincent Fontes
        if p == "Vincent" and n == "Fontes":
            row["nom"] = "FONTES"
            log(f"C1 ✓ Vincent {n} → nom corrigé en FONTES")
            nb_modifs += 1

        # C2 — Jhan Leroy
        elif p == "Jhan" and n == "Leroy":
            row["nom"] = "LEROY"
            log(f"C2 ✓ Jhan {n} → nom corrigé en LEROY")
            nb_modifs += 1

        # C3 — Syrine Kadi
        elif p == "Syrine" and n == "Kadi":
            row["nom"] = "KADI"
            log(f"C3 ✓ Syrine {n} → nom corrigé en KADI")
            nb_modifs += 1

        # C4 — David GBAKATCHELCHE (email invalide → null)
        elif p == "David" and n == "GBAKATCHELCHE":
            old_email = row["email"]
            row["email"] = ""
            log(f"C4 ✓ David GBAKATCHELCHE → email mis à null (était : {repr(old_email)}) — à confirmer avec l'étudiant")
            nb_modifs += 1

        # C5 — Yassamine OUZIAD (double téléphone — ne pas toucher Yasmine)
        elif p == "Yassamine" and n == "OUZIAD":
            tel = row["telephone"].strip()
            if "ou" in tel:
                parties = [t.strip() for t in tel.split("ou")]
                tel_principal = parties[0]
                tel_secondaire = parties[1]
                row["telephone"] = tel_principal
                commentaire_existant = row.get("commentaire", "").strip()
                ajout = f"Second tél : {tel_secondaire}"
                row["commentaire"] = f"{commentaire_existant} | {ajout}".strip(" |") if commentaire_existant else ajout
                log(f"C5 ✓ Yassamine OUZIAD → tél principal : {tel_principal} | second numéro déplacé en commentaire : {tel_secondaire}")
                nb_modifs += 1
            else:
                log(f"C5 — Yassamine OUZIAD : téléphone déjà corrigé ({repr(tel)}), rien à faire")

    log(f"Étudiants : {nb_modifs} correction(s) appliquée(s)")
    write_csv(ET_FILE, fieldnames, rows)

# ─── CORRECTIONS ENTREPRISES ─────────────────────────────────────────────────

def corriger_entreprises():
    log("─── Corrections entreprises_clean.csv ───")
    fieldnames, rows = read_csv(EN_FILE)
    nb_modifs = 0

    for row in rows:
        nom = row["nom"].strip()

        # C6 — Tape à l'œil : téléphone avec "O" → "0"
        if "tape" in nom.lower() and "oeil" in nom.lower().replace("'", "").replace("œ", "oe"):
            old_tel = row["telephone"].strip()
            if old_tel.startswith("O") or old_tel.startswith("o"):
                row["telephone"] = "0" + old_tel[1:]
                log(f"C6 ✓ {nom} → téléphone corrigé : {repr(old_tel)} → {repr(row['telephone'])}")
                nb_modifs += 1
            else:
                log(f"C6 — {nom} : téléphone déjà correct ({repr(old_tel)}), rien à faire")

        # C7 — Preti : email_general → null (vérification)
        if nom.lower().strip() == "preti":
            email = row.get("email_general", "").strip()
            if email:
                row["email_general"] = ""
                log(f"C7 ✓ preti → email_general mis à null (était : {repr(email)})")
                nb_modifs += 1
            else:
                log(f"C7 — preti : email_general déjà vide, rien à faire")

    log(f"Entreprises : {nb_modifs} correction(s) appliquée(s)")
    write_csv(EN_FILE, fieldnames, rows)

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("APPLY_MANUAL_FIXES.PY — Corrections Phase 0")
    print(f"Démarrage : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    # Backups avant toute modification
    backup(ET_FILE)
    backup(EN_FILE)

    corriger_etudiants()
    corriger_entreprises()

    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    for line in log_lines:
        print(f"  {line}")
    print("=" * 60)
    print("Fichiers sources /data/raw : intacts.")
    print(f"Backups disponibles dans : {BACKUP_DIR}")

if __name__ == "__main__":
    main()
