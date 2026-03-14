"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { StatutEntreprise } from "@prisma/client"

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

// ─── Modifier une entreprise ──────────────────────────────────────────────────

const modifierEntrepriseSchema = z.object({
  entreprise_id:  z.string().min(1),
  nom:            z.string().min(1, "Nom obligatoire").max(200),
  ville:          z.string().max(100).optional(),
  secteur:        z.string().max(100).optional(),
  telephone:      z.string().max(30).optional(),
  email_general:  z.string().email("Email invalide").optional().or(z.literal("")),
  statut:         z.nativeEnum(StatutEntreprise),
  responsable_id: z.string().optional(),
})

export async function modifierEntreprise(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = modifierEntrepriseSchema.safeParse({
    entreprise_id:  formData.get("entreprise_id"),
    nom:            formData.get("nom"),
    ville:          formData.get("ville") || undefined,
    secteur:        formData.get("secteur") || undefined,
    telephone:      formData.get("telephone") || undefined,
    email_general:  formData.get("email_general") || undefined,
    statut:         formData.get("statut"),
    responsable_id: formData.get("responsable_id") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { entreprise_id, email_general, responsable_id, ...rest } = parsed.data

  await prisma.entreprise.update({
    where: { id: entreprise_id },
    data: {
      ...rest,
      email_general:  email_general || null,
      responsable_id: responsable_id || null,
    },
  })

  revalidatePath(`/entreprises/${entreprise_id}`)
  revalidatePath("/entreprises")
  redirect(`/entreprises/${entreprise_id}`)
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
