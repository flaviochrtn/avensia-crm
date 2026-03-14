/**
 * scripts/import/import_rdvs.ts
 *
 * Importe data/clean/rdvs_etudiants_clean.csv → table RendezVous.
 *
 * Dépendances : import_etudiants doit être exécuté AVANT.
 *
 * Stratégie d'idempotence :
 *   Clé métier = etudiant_id + numero_rdv.
 *   Si un RDV existe déjà pour cet étudiant avec ce numéro → skip.
 *   (On ne vérifie pas sur la date car elle peut être null dans le CSV.)
 *
 * FKs résolues :
 *   etudiant_ref (= "prenom NOM") → Etudiant.id
 *   animateur (nom) → User.id (optionnel)
 *
 * Format CSV attendu :
 *   etudiant_ref, numero_rdv, type, date, statut, note, animateur
 *
 * Types RDV acceptés :
 *   APPEL, ENTRETIEN_ADMISSION, TEST_POSITIONNEMENT,
 *   RDV_PHYSIQUE, ENTRETIEN_ENTREPRISE, AUTRE
 *
 * Usage :
 *   npx tsx scripts/import/import_rdvs.ts
 *   npx tsx scripts/import/import_rdvs.ts --dry-run
 */

import { PrismaClient, TypeRDV, StatutRDV } from "@prisma/client"
import { readCsv, parseDate, str, int, ImportLogger } from "./_utils"
import path from "path"

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes("--dry-run")
const CSV_PATH = path.resolve("data/clean/rdvs_etudiants_clean.csv")

const TYPE_MAP: Record<string, TypeRDV> = {
  APPEL:                 "APPEL",
  ENTRETIEN_ADMISSION:   "ENTRETIEN_ADMISSION",
  TEST_POSITIONNEMENT:   "TEST_POSITIONNEMENT",
  RDV_PHYSIQUE:          "RDV_PHYSIQUE",
  ENTRETIEN_ENTREPRISE:  "ENTRETIEN_ENTREPRISE",
  AUTRE:                 "AUTRE",
  // Alias courants venant du CSV Notion
  ENTRETIEN:             "ENTRETIEN_ADMISSION",
  TEST:                  "TEST_POSITIONNEMENT",
}

const STATUT_MAP: Record<string, StatutRDV> = {
  PLANIFIE: "PLANIFIE",
  FAIT:     "FAIT",
  ANNULE:   "ANNULE",
  NO_SHOW:  "NO_SHOW",
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

async function main() {
  if (DRY_RUN) console.log("⚠  MODE DRY-RUN — aucune écriture en base\n")

  const log = new ImportLogger("RDVs étudiants")
  const rows = readCsv(CSV_PATH)

  // Cache Etudiant : "prenom nom" normalisé → id (peut avoir homonymes)
  const etudiants = await prisma.etudiant.findMany({
    select: { id: true, prenom: true, nom: true },
    where: { deleted_at: null },
  })
  const etudiantMap = new Map<string, string[]>()
  for (const e of etudiants) {
    const key = `${normalize(e.prenom)} ${normalize(e.nom)}`
    if (!etudiantMap.has(key)) etudiantMap.set(key, [])
    etudiantMap.get(key)!.push(e.id)
  }

  // Cache User (animateurs) : "prenom nom" → id
  const users = await prisma.user.findMany({ select: { id: true, prenom: true, nom: true } })
  const userMap = new Map(
    users.map((u) => [`${normalize(u.prenom)} ${normalize(u.nom)}`, u.id])
  )

  // Cache RDVs existants : "etudiant_id|numero_rdv"
  const existingRdvs = await prisma.rendezVous.findMany({
    select: { etudiant_id: true, numero_rdv: true },
    where: { etudiant_id: { not: null }, numero_rdv: { not: null } },
  })
  const existingKeys = new Set(
    existingRdvs.map((r) => `${r.etudiant_id}|${r.numero_rdv}`)
  )

  for (const row of rows) {
    const etudiantRef = str(row.etudiant_ref)
    const numeroRdvRaw = row.numero_rdv?.trim()

    if (!etudiantRef || !numeroRdvRaw) {
      log.error("(ligne incomplète)", "etudiant_ref ou numero_rdv manquant")
      continue
    }

    const numero_rdv = int(numeroRdvRaw)

    // Résolution Etudiant
    const matches = etudiantMap.get(normalize(etudiantRef)) ?? []
    if (matches.length === 0) {
      log.error(etudiantRef, "Étudiant non trouvé en base")
      continue
    }
    if (matches.length > 1) {
      log.warn(
        etudiantRef,
        `${matches.length} étudiants portent ce nom — RDV skippé, intervention manuelle requise`
      )
      continue
    }

    const etudiant_id = matches[0]
    const key = `${etudiant_id}|${numero_rdv}`

    if (existingKeys.has(key)) {
      log.skip(`${etudiantRef} RDV#${numero_rdv}`, "déjà présent")
      continue
    }

    // Type RDV
    const typeCsv = row.type?.trim().toUpperCase()
    const type: TypeRDV = TYPE_MAP[typeCsv] ?? "AUTRE"
    if (typeCsv && !TYPE_MAP[typeCsv]) {
      log.warn(`${etudiantRef} RDV#${numero_rdv}`, `type "${row.type}" non reconnu → AUTRE`)
    }

    // Statut RDV
    const statutCsv = row.statut?.trim().toUpperCase()
    const statut: StatutRDV = STATUT_MAP[statutCsv] ?? "PLANIFIE"
    if (statutCsv && !STATUT_MAP[statutCsv]) {
      log.warn(`${etudiantRef} RDV#${numero_rdv}`, `statut "${row.statut}" non reconnu → PLANIFIE`)
    }

    // Animateur (optionnel)
    let animateur_id: string | null = null
    if (row.animateur) {
      animateur_id = userMap.get(normalize(row.animateur)) ?? null
      if (!animateur_id) {
        log.warn(`${etudiantRef} RDV#${numero_rdv}`, `animateur "${row.animateur}" inconnu — laissé null`)
      }
    }

    const data = {
      type,
      statut,
      numero_rdv,
      date:     parseDate(row.date),
      notes:    str(row.note),
      etudiant_id,
      animateur_id,
    }

    if (DRY_RUN) {
      log.ok(`${etudiantRef} RDV#${numero_rdv}`, "dry-run")
      existingKeys.add(key)
      continue
    }

    try {
      await prisma.rendezVous.create({ data })
      log.ok(`${etudiantRef} RDV#${numero_rdv}`)
      existingKeys.add(key)
    } catch (e: unknown) {
      log.error(`${etudiantRef} RDV#${numero_rdv}`, String(e))
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
