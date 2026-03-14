"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { StatutEntreprise } from "@prisma/client"

type ActionState = { error: string | null }

// ─── Créer une entreprise ─────────────────────────────────────────────────────

const createEntrepriseSchema = z.object({
  nom:            z.string().min(1, "Nom obligatoire").max(200),
  ville:          z.string().max(100).optional(),
  secteur:        z.string().max(100).optional(),
  telephone:      z.string().max(30).optional(),
  email_general:  z.string().email("Email invalide").optional().or(z.literal("")),
  statut:         z.nativeEnum(StatutEntreprise),
  responsable_id: z.string().optional(),
})

export async function creerEntreprise(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = createEntrepriseSchema.safeParse({
    nom:            formData.get("nom"),
    ville:          formData.get("ville") || undefined,
    secteur:        formData.get("secteur") || undefined,
    telephone:      formData.get("telephone") || undefined,
    email_general:  formData.get("email_general") || undefined,
    statut:         formData.get("statut"),
    responsable_id: formData.get("responsable_id") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { email_general, responsable_id, ...rest } = parsed.data

  const entreprise = await prisma.entreprise.create({
    data: {
      ...rest,
      email_general:  email_general || null,
      responsable_id: responsable_id || null,
    },
  })

  revalidatePath("/entreprises")
  redirect(`/entreprises/${entreprise.id}`)
}

// ─── Assigner un responsable (liste) ─────────────────────────────────────────

export async function assignerResponsableListe(formData: FormData) {
  const session = await auth()
  if (!session) return

  const entrepriseId  = formData.get("entreprise_id") as string
  const responsableId = formData.get("responsable_id") as string

  if (!entrepriseId) return

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data:  { responsable_id: responsableId || null },
  })

  revalidatePath("/entreprises")
  revalidatePath(`/entreprises/${entrepriseId}`)
  revalidatePath("/dashboard")
}
