import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EditAlternanceForm } from "../EditAlternanceForm"

export default async function EditAlternancePage({
  params,
}: {
  params: Promise<{ id: string; alternanceId: string }>
}) {
  const { id, alternanceId } = await params

  const [etudiant, alternance, entreprises] = await Promise.all([
    prisma.etudiant.findUnique({
      where: { id, deleted_at: null },
      select: { id: true, prenom: true, nom: true },
    }),
    prisma.historiqueAlternance.findUnique({
      where: { id: alternanceId },
      select: {
        id:                   true,
        etudiant_id:          true,
        entreprise_id:        true,
        nom_entreprise_libre: true,
        type_contrat:         true,
        poste:                true,
        date_debut_contrat:   true,
        date_fin_contrat:     true,
        date_rupture:         true,
        motif_rupture:        true,
        statut:               true,
        commentaire:          true,
      },
    }),
    prisma.entreprise.findMany({
      where:   { deleted_at: null },
      select:  { id: true, nom: true, ville: true },
      orderBy: [{ nom: "asc" }],
    }),
  ])

  if (!etudiant || !alternance || alternance.etudiant_id !== id) notFound()

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
      <p className="text-sm text-gray-500 mb-6">Modifier le contrat d&apos;alternance</p>
      <EditAlternanceForm alternance={alternance} entreprises={entreprises} />
    </div>
  )
}
