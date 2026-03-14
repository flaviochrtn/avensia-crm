import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EditEntrepriseForm } from "../forms"

export default async function EditEntreprisePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [entreprise, users] = await Promise.all([
    prisma.entreprise.findUnique({
      where: { id, deleted_at: null },
      select: {
        id:             true,
        nom:            true,
        ville:          true,
        secteur:        true,
        telephone:      true,
        email_general:  true,
        statut:         true,
        responsable_id: true,
      },
    }),
    prisma.user.findMany({ select: { id: true, prenom: true, nom: true }, orderBy: { nom: "asc" } }),
  ])

  if (!entreprise) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href={`/entreprises/${id}`}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
      >
        ← Retour à la fiche
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{entreprise.nom}</h1>
      <p className="text-sm text-gray-500 mb-6">Modifier les informations</p>
      <EditEntrepriseForm entreprise={entreprise} users={users} />
    </div>
  )
}
