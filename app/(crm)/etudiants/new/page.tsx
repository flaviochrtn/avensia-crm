import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CreateEtudiantForm } from "./CreateEtudiantForm"

export default async function NouvelEtudiantPage() {
  const [formations, users, entreprises] = await Promise.all([
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ select: { id: true, prenom: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.entreprise.findMany({
      where:   { deleted_at: null },
      select:  { id: true, nom: true, ville: true },
      orderBy: [{ nom: "asc" }, { ville: "asc" }],
    }),
  ])

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/etudiants" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← Retour à la liste
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nouvel étudiant</h1>
      <CreateEtudiantForm formations={formations} users={users} entreprises={entreprises} />
    </div>
  )
}
