/**
 * scripts/import/import_contacts.ts
 *
 * Importe data/clean/contacts_entreprise_clean.csv → table ContactEntreprise.
 *
 * Dépendance : les entreprises doivent être importées AVANT ce script.
 *
 * Stratégie d'idempotence :
 *   Clé métier = entreprise_id + nom_complet (normalisé).
 *   Si le contact existe déjà pour cette entreprise → skip.
 *
 * FK résolue :
 *   entreprise_nom → Entreprise.id
 *   Matching par nom normalisé. Si plusieurs entreprises portent le même
 *   nom (villes différentes), le script logue un AVERTISSEMENT et skip
 *   la ligne — intervention manuelle requise.
 *
 * Usage :
 *   npx tsx scripts/import/import_contacts.ts
 *   npx tsx scripts/import/import_contacts.ts --dry-run
 */

import { PrismaClient } from "@prisma/client"
import { readCsv, str, ImportLogger } from "./_utils"
import path from "path"

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes("--dry-run")
const CSV_PATH = path.resolve("data/clean/contacts_entreprise_clean.csv")

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

async function main() {
  if (DRY_RUN) console.log("⚠  MODE DRY-RUN — aucune écriture en base\n")

  const log = new ImportLogger("Contacts entreprise")
  const rows = readCsv(CSV_PATH)

  // Index Entreprise : nom normalisé → liste d'ids (gère homonymes)
  const entreprises = await prisma.entreprise.findMany({
    select: { id: true, nom: true, ville: true },
  })
  const entrepriseMap = new Map<string, { id: string; ville: string | null }[]>()
  for (const e of entreprises) {
    const key = normalize(e.nom)
    if (!entrepriseMap.has(key)) entrepriseMap.set(key, [])
    entrepriseMap.get(key)!.push({ id: e.id, ville: e.ville })
  }

  // Cache contacts existants : "entreprise_id|nom_complet_normalisé"
  const existingContacts = await prisma.contactEntreprise.findMany({
    select: { entreprise_id: true, nom_complet: true },
  })
  const existingKeys = new Set(
    existingContacts.map(
      (c) => `${c.entreprise_id}|${normalize(c.nom_complet)}`
    )
  )

  for (const row of rows) {
    const entrepriseNom = str(row.entreprise_nom)
    const nomComplet    = str(row.nom_complet)

    if (!entrepriseNom || !nomComplet) {
      log.error("(ligne incomplète)", "entreprise_nom ou nom_complet manquant")
      continue
    }

    // Résolution FK entreprise
    const matches = entrepriseMap.get(normalize(entrepriseNom)) ?? []
    if (matches.length === 0) {
      log.error(
        `${nomComplet} @ ${entrepriseNom}`,
        "Entreprise non trouvée en base — importez d'abord les entreprises"
      )
      continue
    }
    if (matches.length > 1) {
      const villes = matches.map((m) => m.ville ?? "?").join(", ")
      log.warn(
        `${nomComplet} @ ${entrepriseNom}`,
        `Ambiguïté : ${matches.length} entreprises portent ce nom (${villes}) — ligne skippée, intervention manuelle requise`
      )
      continue
    }

    const entreprise_id = matches[0].id
    const key = `${entreprise_id}|${normalize(nomComplet)}`

    if (existingKeys.has(key)) {
      log.skip(`${nomComplet} @ ${entrepriseNom}`, "déjà présent")
      continue
    }

    const data = {
      entreprise_id,
      nom_complet: nomComplet,
      prenom:      str(row.prenom),
      poste:       str(row.poste),
      email:       str(row.email),
      telephone:   str(row.telephone),
    }

    if (DRY_RUN) {
      log.ok(`${nomComplet} @ ${entrepriseNom}`, "dry-run")
      existingKeys.add(key)
      continue
    }

    try {
      await prisma.contactEntreprise.create({ data })
      log.ok(`${nomComplet} @ ${entrepriseNom}`)
      existingKeys.add(key)
    } catch (e: unknown) {
      log.error(`${nomComplet} @ ${entrepriseNom}`, String(e))
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
