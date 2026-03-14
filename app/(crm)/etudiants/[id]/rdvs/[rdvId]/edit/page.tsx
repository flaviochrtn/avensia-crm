import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EditRdvForm } from "../EditRdvForm"

const TYPE_RDV_LABELS: Record<string, string> = {
  APPEL:                "Appel",
  ENTRETIEN_ADMISSION:  "Entretien d'admission",
  TEST_POSITIONNEMENT:  "Test de positionnement",
  RDV_PHYSIQUE:         "RDV physique",
  ENTRETIEN_ENTREPRISE: "Entretien entreprise",
  AUTRE:                "Autre",
}

export default async function EditRdvPage({
  params,
}: {
  params: Promise<{ id: string; rdvId: string }>
}) {
  const { id, rdvId } = await params

  const [etudiant, rdv] = await Promise.all([
    prisma.etudiant.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, prenom: true, nom: true },
    }),
    prisma.rendezVous.findUnique({
      where: { id: rdvId },
      select: {
        id:          true,
        etudiant_id: true,
        numero_rdv:  true,
        type:        true,
        statut:      true,
        date:        true,
        notes:       true,
      },
    }),
  ])

  if (!etudiant || !rdv || !rdv.etudiant_id || rdv.etudiant_id !== id) notFound()
  const rdvSafe = { ...rdv, etudiant_id: rdv.etudiant_id }

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
      <p className="text-sm text-gray-500 mb-6">
        Modifier RDV #{rdv.numero_rdv} — {TYPE_RDV_LABELS[rdv.type] ?? rdv.type}
      </p>
      <EditRdvForm rdv={rdvSafe} />
    </div>
  )
}
