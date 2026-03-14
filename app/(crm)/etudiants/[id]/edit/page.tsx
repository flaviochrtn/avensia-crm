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

  const [etudiant, formations, users, entreprises] = await Promise.all([
    prisma.etudiant.findUnique({
      where: { id, deleted_at: null },
      select: {
        id:                     true,
        prenom:                 true,
        nom:                    true,
        email:                  true,
        telephone:              true,
        date_naissance:         true,
        sexe:                   true,
        adresse:                true,
        ville:                  true,
        permis:                 true,
        vehicule:               true,
        situation_handicap:     true,
        formation_id:           true,
        type_contrat:           true,
        diplome_actuel:         true,
        formation_actuelle:     true,
        specialisation:         true,
        etape_process:          true,
        statut:                 true,
        niveau_motivation:      true,
        niveau_test:            true,
        niveau_cours:           true,
        origine_contact:        true,
        statut_motivation:      true,
        campagne:               true,
        apporteur_nom:          true,
        conseiller_id:          true,
        entreprise_liee_id:     true,
        date_premier_contact:   true,
        date_prochaine_relance: true,
        note_prochaine_relance: true,
        pack_suivi_alternance:  true,
        cv_url:                 true,
        commentaire:            true,
        date_entree_formation:   true,
        date_sortie_formation:   true,
        date_rentree_officielle: true,
      },
    }),
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ select: { id: true, prenom: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.entreprise.findMany({
      where:   { deleted_at: null },
      select:  { id: true, nom: true, ville: true },
      orderBy: [{ nom: "asc" }, { ville: "asc" }],
    }),
  ])

  if (!etudiant) notFound()

  return (
    <div className="p-6 max-w-3xl">
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
      <EditEtudiantForm
        etudiant={etudiant}
        formations={formations}
        users={users}
        entreprises={entreprises}
      />
    </div>
  )
}
