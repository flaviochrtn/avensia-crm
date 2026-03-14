/**
 * scripts/import/import_entreprises.ts
 *
 * Importe data/clean/entreprises_clean.csv → table Entreprise.
 *
 * Stratégie d'idempotence :
 *   Clé métier = nom (normalisé) + ville (normalisée).
 *   Si un enregistrement existe déjà avec cette combinaison → skip.
 *   Pas de upsert destructif : on ne met PAS à jour les champs d'une
 *   entreprise déjà présente (protège les éditions manuelles futures).
 *
 * FK résolue :
 *   responsable_nom → User.id  (par prenom + nom, insensible à la casse)
 *
 * Usage :
 *   npx tsx scripts/import/import_entreprises.ts
 *   npx tsx scripts/import/import_entreprises.ts --dry-run
 */

import { PrismaClient, StatutEntreprise } from "@prisma/client"
import { readCsv, parseBool, parseDate, str, int, ImportLogger } from "./_utils"
import path from "path"

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes("--dry-run")
const CSV_PATH = path.resolve("data/clean/entreprises_clean.csv")

// Valeurs CSV → enum StatutEntreprise
const STATUT_MAP: Record<string, StatutEntreprise> = {
  NOUVEAU:          "NOUVEAU",
  A_CONTACTER:      "A_CONTACTER",
  CONTACTE:         "CONTACTE",
  QUALIFIE:         "QUALIFIE",
  BESOIN_OUVERT:    "BESOIN_OUVERT",
  RDV_PLANIFIE:     "RDV_PLANIFIE",
  PARTENAIRE_ACTIF: "PARTENAIRE_ACTIF",
  AUCUN_BESOIN:     "AUCUN_BESOIN",
  PERDU:            "PERDU",
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

async function main() {
  if (DRY_RUN) console.log("⚠  MODE DRY-RUN — aucune écriture en base\n")

  const log = new ImportLogger("Entreprises")
  const rows = readCsv(CSV_PATH)

  // Cache User : "prenom nom" normalisé → id
  const users = await prisma.user.findMany({ select: { id: true, prenom: true, nom: true } })
  const userMap = new Map(
    users.map((u) => [`${normalize(u.prenom)} ${normalize(u.nom)}`, u.id])
  )

  // Cache entreprises existantes : "nom|ville" normalisé
  const existing = await prisma.entreprise.findMany({
    select: { id: true, nom: true, ville: true },
  })
  const existingKeys = new Set(
    existing.map((e) => `${normalize(e.nom)}|${normalize(e.ville ?? "")}`)
  )

  for (const row of rows) {
    const nomVal  = str(row.nom)
    const villeVal = str(row.ville)
    if (!nomVal) {
      log.error("(sans nom)", "Champ nom manquant — ligne ignorée")
      continue
    }

    const key = `${normalize(nomVal)}|${normalize(villeVal ?? "")}`
    if (existingKeys.has(key)) {
      log.skip(`${nomVal} / ${villeVal ?? "?"}`, "déjà présent")
      continue
    }

    // Résolution responsable
    let responsable_id: string | null = null
    if (row.responsable_nom) {
      responsable_id = userMap.get(normalize(row.responsable_nom)) ?? null
      if (!responsable_id) {
        log.warn(`${nomVal}`, `responsable_nom "${row.responsable_nom}" inconnu — champ laissé null`)
      }
    }

    // Statut
    const statut = STATUT_MAP[row.statut?.trim()] ?? "NOUVEAU"
    if (row.statut && !STATUT_MAP[row.statut.trim()]) {
      log.warn(`${nomVal}`, `statut CSV "${row.statut}" non reconnu → NOUVEAU`)
    }

    const data = {
      nom:                   nomVal,
      secteur:               str(row.secteur),
      type_structure:        str(row.type_structure),
      adresse:               str(row.adresse),
      ville:                 villeVal,
      telephone:             str(row.telephone),
      email_general:         str(row.email_general),
      site_web:              null,
      linkedin:              null,
      statut,
      besoin_alternant:      parseBool(row.besoin_alternant),
      nombre_postes:         int(row.nombre_postes, 0),
      formations_recherchees: str(row.formations_recherchees),
      profil_recherche:      str(row.profil_recherche),
      numero_idcc:           str(row.numero_idcc),
      campagne:              str(row.campagne),
      date_premier_contact:  parseDate(row.date_premier_contact),
      date_prochaine_relance: parseDate(row.date_prochaine_relance),
      responsable_id,
      commentaire:           str(row.commentaire),
    }

    if (DRY_RUN) {
      log.ok(`${nomVal} / ${villeVal ?? "?"}`, "dry-run")
      existingKeys.add(key)
      continue
    }

    try {
      await prisma.entreprise.create({ data })
      log.ok(`${nomVal} / ${villeVal ?? "?"}`)
      existingKeys.add(key)
    } catch (e: unknown) {
      log.error(`${nomVal}`, String(e))
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
