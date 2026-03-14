"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

type ActionState = { error: string | null; success?: boolean }

// ─── Réassigner le responsable ────────────────────────────────────────────────

export async function assignerResponsable(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const entrepriseId  = formData.get("entreprise_id") as string
  const responsableId = formData.get("responsable_id") as string

  if (!entrepriseId) return { error: "ID entreprise manquant" }

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data:  { responsable_id: responsableId || null },
  })

  revalidatePath(`/entreprises/${entrepriseId}`)
  revalidatePath("/entreprises")
  return { error: null, success: true }
}

// ─── Ajouter une note ─────────────────────────────────────────────────────────

const noteSchema = z.object({
  contenu: z.string().min(1, "La note ne peut pas être vide").max(5000),
})

export async function ajouterNoteEntreprise(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const entrepriseId = formData.get("entreprise_id") as string
  if (!entrepriseId) return { error: "ID entreprise manquant" }

  const parsed = noteSchema.safeParse({ contenu: formData.get("contenu") })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  await prisma.note.create({
    data: {
      contenu:       parsed.data.contenu,
      auteur_id:     session.user.id,
      entreprise_id: entrepriseId,
    },
  })

  revalidatePath(`/entreprises/${entrepriseId}`)
  return { error: null, success: true }
}
