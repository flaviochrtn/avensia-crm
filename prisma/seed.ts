/**
 * prisma/seed.ts
 *
 * Seed minimal de référence — idempotent (upsert par clé métier).
 * Lance avec : npx tsx prisma/seed.ts
 */

import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ─── UTILISATEURS ────────────────────────────────────────────────────────────

const DEFAULT_PASSWORD = "Avensia2026!"

const USERS: {
  email: string
  prenom: string
  nom: string
  role: UserRole
}[] = [
  { email: "flavio.charton@avensiabusinessschool.com",  prenom: "Flavio", nom: "CHARTON",  role: "COMMERCIAL"    },
  { email: "farid.brini@avensiabusinessschool.com",     prenom: "Farid",  nom: "BRINI",    role: "DIRECTION"     },
  { email: "pedagogie78@avensiabusinessschool.com",     prenom: "Rayene", nom: "BENAISSA", role: "ADMINISTRATIF" },
  { email: "lylian.sturm@avensiabusinessschool.com",    prenom: "Lylian", nom: "STURM",    role: "COMMERCIAL"    },
]

// ─── FORMATIONS ──────────────────────────────────────────────────────────────

const FORMATIONS: {
  code: string
  nom: string
  niveau: string
  duree_mois: number
}[] = [
  { code: "BTS_SAM_1",    nom: "BTS SAM — 1ère année",   niveau: "BTS",      duree_mois: 12 },
  { code: "BTS_SAM_2",    nom: "BTS SAM — 2ème année",   niveau: "BTS",      duree_mois: 12 },
  { code: "BTS_MCO_1",    nom: "BTS MCO — 1ère année",   niveau: "BTS",      duree_mois: 12 },
  { code: "BTS_MCO_2",    nom: "BTS MCO — 2ème année",   niveau: "BTS",      duree_mois: 12 },
  { code: "BTS_NDRC_1",   nom: "BTS NDRC — 1ère année",  niveau: "BTS",      duree_mois: 12 },
  { code: "BTS_NDRC_2",   nom: "BTS NDRC — 2ème année",  niveau: "BTS",      duree_mois: 12 },
  { code: "BACHELOR_RH",  nom: "Bachelor RH",             niveau: "Bachelor", duree_mois: 12 },
  { code: "BACHELOR_RDC", nom: "Bachelor RDC",            niveau: "Bachelor", duree_mois: 12 },
  { code: "COM",          nom: "BTS Communication",       niveau: "BTS",      duree_mois: 12 },
  { code: "NTC",          nom: "BTS NTC",                 niveau: "BTS",      duree_mois: 12 },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("▶ Seed démarré\n")

  // -- Formations
  console.log("── Formations")
  for (const f of FORMATIONS) {
    await prisma.formation.upsert({
      where: { code: f.code },
      update: { nom: f.nom, niveau: f.niveau, duree_mois: f.duree_mois },
      create: f,
    })
    console.log(`  ✓ ${f.code}  ${f.nom}`)
  }

  // -- Users
  console.log("\n── Utilisateurs")
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })

    if (existing) {
      // Met à jour tout sauf le mot de passe (évite d'écraser un changement manuel)
      await prisma.user.update({
        where: { email: u.email },
        data: { prenom: u.prenom, nom: u.nom, role: u.role },
      })
      console.log(`  ~ ${u.email}  (existant, metadata mis à jour)`)
    } else {
      await prisma.user.create({
        data: { ...u, password: hash },
      })
      console.log(`  ✓ ${u.email}  [${u.role}]  (créé)`)
    }
  }

  console.log(`\n✅ Seed terminé — mot de passe par défaut : ${DEFAULT_PASSWORD}`)
  console.log("   ⚠  Changez les mots de passe en production.\n")
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
