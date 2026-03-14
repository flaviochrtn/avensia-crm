import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CreateEntrepriseForm } from "./CreateEntrepriseForm"

export default async function NouvelleEntreprisePage() {
  const users = await prisma.user.findMany({
    select: { id: true, prenom: true, nom: true },
    orderBy: { nom: "asc" },
  })

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/entreprises" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← Retour à la liste
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nouvelle entreprise</h1>
      <CreateEntrepriseForm users={users} />
    </div>
  )
}
