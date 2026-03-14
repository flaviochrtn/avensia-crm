import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EditContactForm } from "../EditContactForm"

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string; contactId: string }>
}) {
  const { id, contactId } = await params

  const [entreprise, contact] = await Promise.all([
    prisma.entreprise.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, nom: true },
    }),
    prisma.contactEntreprise.findUnique({
      where: { id: contactId },
      select: {
        id:           true,
        entreprise_id: true,
        nom_complet:  true,
        prenom:       true,
        poste:        true,
        email:        true,
        telephone:    true,
        decideur:     true,
      },
    }),
  ])

  if (!entreprise || !contact || contact.entreprise_id !== id) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href={`/entreprises/${id}`}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
      >
        ← Retour à la fiche
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{entreprise.nom}</h1>
      <p className="text-sm text-gray-500 mb-6">Modifier le contact — {contact.nom_complet}</p>
      <EditContactForm contact={contact} />
    </div>
  )
}
