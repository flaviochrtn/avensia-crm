import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EditEtudiantForm } from "../forms"

export default async function EditEtudiantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [etudiant, formations, users] = await Promise.all([
    prisma.etudiant.findUnique({
      where: { id, deleted_at: null },
      select: {
        id:            true,
        prenom:        true,
        nom:           true,
        email:         true,
        telephone:     true,
        ville:         true,
        formation_id:  true,
        statut:        true,
        etape_process: true,
        conseiller_id: true,
      },
    }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ select: { id: true, prenom: true, nom: true }, orderBy: { nom: "asc" } }),
  ])

  if (!etudiant) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href={`/etudiants/${id}`}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
      >
        ← Retour à la fiche
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {etudiant.prenom} {etudiant.nom}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Modifier les informations</p>
      <EditEtudiantForm etudiant={etudiant} formations={formations} users={users} />
    </div>
  )
}
