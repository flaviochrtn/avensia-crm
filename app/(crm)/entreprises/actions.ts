"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { StatutEntreprise } from "@prisma/client"

type ActionState = { error: string | null }

function s(val: FormDataEntryValue | null): string | null {
  const v = (val as string ?? "").trim()
  return v || null
}

// ─── Créer une entreprise ─────────────────────────────────────────────────────

const createEntrepriseSchema = z.object({
  nom:            z.string().min(1, "Nom obligatoire").max(200),
  ville:          z.string().max(100).optional(),
  secteur:        z.string().max(100).optional(),
  telephone:      z.string().max(30).optional(),
  email_general:  z.string().email("Email invalide").optional(),
  statut:         z.nativeEnum(StatutEntreprise),
  responsable_id: z.string().optional(),
})

export async function creerEntreprise(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const emailRaw = s(formData.get("email_general"))?.toLowerCase() ?? undefined

  const parsed = createEntrepriseSchema.safeParse({
    nom:            s(formData.get("nom")),
    ville:          s(formData.get("ville")) ?? undefined,
    secteur:        s(formData.get("secteur")) ?? undefined,
    telephone:      s(formData.get("telephone")) ?? undefined,
    email_general:  emailRaw,
    statut:         formData.get("statut"),
    responsable_id: s(formData.get("responsable_id")) ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // Doublon email_general
  if (parsed.data.email_general) {
    const existing = await prisma.entreprise.findFirst({
      where: { email_general: parsed.data.email_general, deleted_at: null },
      select: { id: true },
    })
    if (existing) return { error: "Une entreprise avec cet email existe déjà" }
  }

  const { email_general, responsable_id, ...rest } = parsed.data

  const entreprise = await prisma.entreprise.create({
    data: {
      ...rest,
      email_general:  email_general ?? null,
      responsable_id: responsable_id ?? null,
    },
  })

  revalidatePath("/entreprises")
  revalidatePath("/dashboard")
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
