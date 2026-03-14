/**
 * scripts/import/import_etudiants.ts
 *
 * Importe data/clean/etudiants_clean.csv → table Etudiant.
 *
 * Dépendances : seed (users + formations) doit être exécuté AVANT.
 *
 * Stratégie d'idempotence :
 *   Clé métier = prenom (normalisé) + nom (normalisé) + email (s'il existe).
 *   Si email présent : unicité sur email.
 *   Si email absent  : unicité sur prenom+nom (risque homonyme → warn).
 *
 * FKs résolues :
 *   formation_code → Formation.id
 *   conseiller_nom → User.id  (prenom + nom normalisés)
 *
 * Colonnes CSV attendues (voir data/clean/etudiants_clean.csv) :
 *   prenom, nom, email, telephone, date_naissance, ville, adresse, sexe,
 *   permis, vehicule, situation_handicap, etape_process, statut,
 *   formation_code, type_contrat, diplome_actuel, formation_actuelle,
 *   specialisation, origine_contact, niveau_motivation, niveau_test,
 *   niveau_cours, conseiller_nom, commentaire, date_premier_contact,
 *   date_prochaine_relance, note_prochaine_relance, campagne
 *
 * Usage :
 *   npx tsx scripts/import/import_etudiants.ts
 *   npx tsx scripts/import/import_etudiants.ts --dry-run
 */

import {
  PrismaClient,
  EtapeEtudiant,
  StatutEtudiant,
  TypeContrat,
  OrigineContact,
  Sexe,
} from "@prisma/client"
import { readCsv, parseBool, parseDate, str, int, ImportLogger } from "./_utils"
import path from "path"

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes("--dry-run")
const CSV_PATH = path.resolve("data/clean/etudiants_clean.csv")

// ─── MAPS CSV → ENUM ──────────────────────────────────────────────────────────

const ETAPE_MAP: Record<string, EtapeEtudiant> = {
  NOUVEAU:           "NOUVEAU",
  CONTACTE:          "CONTACTE",
  RDV0_PLANIFIE:     "RDV0_PLANIFIE",
  RDV0_FAIT:         "RDV0_FAIT",
  RDV1_PLANIFIE:     "RDV1_PLANIFIE",
  RDV1_FAIT:         "RDV1_FAIT",
  RDV2_PLANIFIE:     "RDV2_PLANIFIE",
  RDV2_FAIT:         "RDV2_FAIT",
  DOSSIER_EN_COURS:  "DOSSIER_EN_COURS",
  INSCRIT:           "INSCRIT",
}

const STATUT_MAP: Record<string, StatutEtudiant> = {
  EN_COURS:               "EN_COURS",
  INSCRIT_EN_RECHERCHE:   "INSCRIT_EN_RECHERCHE",
  INSCRIT_ALTERNANCE:     "INSCRIT_ALTERNANCE",
  ABANDON:                "ABANDON",
  NON_RETENU:             "NON_RETENU",
  INVALIDE:               "INVALIDE",
}

const CONTRAT_MAP: Record<string, TypeContrat> = {
  APPRENTISSAGE:       "APPRENTISSAGE",
  PROFESSIONNALISATION: "PROFESSIONNALISATION",
}

const ORIGINE_MAP: Record<string, OrigineContact> = {
  SALON_ETUDIANT:  "SALON_ETUDIANT",
  BOUCHE_A_OREILLE:"BOUCHE_A_OREILLE",
  JPO:             "JPO",
  INSTAGRAM:       "INSTAGRAM",
  GOOGLE:          "GOOGLE",
  LINKEDIN:        "LINKEDIN",
  PARTENAIRE:      "PARTENAIRE",
  AUTRE:           "AUTRE",
}

const SEXE_MAP: Record<string, Sexe> = {
  // CSV peut avoir Homme/Femme ou M/F
  M: "M", HOMME: "M",
  F: "F", FEMME: "F",
  AUTRE: "AUTRE",
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

async function main() {
  if (DRY_RUN) console.log("⚠  MODE DRY-RUN — aucune écriture en base\n")

  const log = new ImportLogger("Étudiants")
  const rows = readCsv(CSV_PATH)

  // Cache Formation : code → id
  const formations = await prisma.formation.findMany({ select: { id: true, code: true } })
  const formationMap = new Map(formations.map((f) => [f.code, f.id]))

  // Cache User : "prenom nom" normalisé → id
  const users = await prisma.user.findMany({ select: { id: true, prenom: true, nom: true } })
  const userMap = new Map(
    users.map((u) => [`${normalize(u.prenom)} ${normalize(u.nom)}`, u.id])
  )

  // Cache étudiants existants : email (si présent) ou "prenom|nom"
  const existingByEmail = new Set<string>()
  const existingByName  = new Set<string>()
  const existing = await prisma.etudiant.findMany({
    select: { email: true, prenom: true, nom: true },
    where: { deleted_at: null },
  })
  for (const e of existing) {
    if (e.email) existingByEmail.add(normalize(e.email))
    existingByName.add(`${normalize(e.prenom)}|${normalize(e.nom)}`)
  }

  for (const row of rows) {
    const prenomVal = str(row.prenom)
    const nomVal    = str(row.nom)
    const emailVal  = str(row.email)

    if (!prenomVal || !nomVal) {
      log.error("(sans identité)", "prenom ou nom manquant — ligne ignorée")
      continue
    }

    // Dédup
    const nameKey = `${normalize(prenomVal)}|${normalize(nomVal)}`
    if (emailVal && existingByEmail.has(normalize(emailVal))) {
      log.skip(`${prenomVal} ${nomVal}`, `email ${emailVal} déjà présent`)
      continue
    }
    if (!emailVal && existingByName.has(nameKey)) {
      log.skip(`${prenomVal} ${nomVal}`, "pas d'email — homonyme détecté, ligne ignorée")
      continue
    }

    // FKs
    const formation_id = row.formation_code
      ? (formationMap.get(row.formation_code.trim()) ?? null)
      : null
    if (row.formation_code && !formation_id) {
      log.warn(`${prenomVal} ${nomVal}`, `formation_code "${row.formation_code}" inconnu`)
    }

    let conseiller_id: string | null = null
    if (row.conseiller_nom) {
      conseiller_id = userMap.get(normalize(row.conseiller_nom)) ?? null
      if (!conseiller_id) {
        log.warn(`${prenomVal} ${nomVal}`, `conseiller "${row.conseiller_nom}" inconnu — laissé null`)
      }
    }

    // Enums avec fallback
    const etape_process = ETAPE_MAP[row.etape_process?.trim()] ?? "NOUVEAU"
    const statut        = STATUT_MAP[row.statut?.trim()] ?? "EN_COURS"
    const type_contrat  = row.type_contrat ? (CONTRAT_MAP[row.type_contrat.trim()] ?? null) : null
    const origine_contact = row.origine_contact ? (ORIGINE_MAP[row.origine_contact.trim()] ?? null) : null
    const sexeCsv = row.sexe?.trim().toUpperCase()
    const sexe: Sexe | null = sexeCsv ? (SEXE_MAP[sexeCsv] ?? null) : null

    const data = {
      prenom:                prenomVal,
      nom:                   nomVal,
      email:                 emailVal,
      telephone:             str(row.telephone),
      date_naissance:        parseDate(row.date_naissance),
      sexe,
      adresse:               str(row.adresse),
      ville:                 str(row.ville),
      permis:                parseBool(row.permis),
      vehicule:              parseBool(row.vehicule),
      situation_handicap:    parseBool(row.situation_handicap),  // null = inconnu
      formation_id,
      type_contrat,
      diplome_actuel:        str(row.diplome_actuel),
      formation_actuelle:    str(row.formation_actuelle),
      specialisation:        str(row.specialisation),
      etape_process,
      statut,
      niveau_motivation:     row.niveau_motivation ? int(row.niveau_motivation) || null : null,
      niveau_test:           str(row.niveau_test),
      niveau_cours:          str(row.niveau_cours),
      origine_contact,
      campagne:              str(row.campagne),
      conseiller_id,
      date_premier_contact:  parseDate(row.date_premier_contact),
      date_prochaine_relance: parseDate(row.date_prochaine_relance),
      note_prochaine_relance: str(row.note_prochaine_relance),
      commentaire:           str(row.commentaire),
    }

    if (DRY_RUN) {
      log.ok(`${prenomVal} ${nomVal}`, "dry-run")
      if (emailVal) existingByEmail.add(normalize(emailVal))
      existingByName.add(nameKey)
      continue
    }

    try {
      await prisma.etudiant.create({ data })
      log.ok(`${prenomVal} ${nomVal}`)
      if (emailVal) existingByEmail.add(normalize(emailVal))
      existingByName.add(nameKey)
    } catch (e: unknown) {
      log.error(`${prenomVal} ${nomVal}`, String(e))
    }
  }

  const { error } = log.summary()
  await prisma.$disconnect()
  process.exit(error > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
