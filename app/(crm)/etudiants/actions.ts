"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { EtapeEtudiant, StatutEtudiant } from "@prisma/client"

type ActionState = { error: string | null }

// ─── Créer un étudiant ────────────────────────────────────────────────────────

const createEtudiantSchema = z.object({
  prenom:        z.string().min(1, "Prénom obligatoire").max(100),
  nom:           z.string().min(1, "Nom obligatoire").max(100),
  email:         z.string().email("Email invalide").optional().or(z.literal("")),
  telephone:     z.string().max(30).optional(),
  ville:         z.string().max(100).optional(),
  formation_id:  z.string().optional(),
  statut:        z.nativeEnum(StatutEtudiant),
  etape_process: z.nativeEnum(EtapeEtudiant),
  conseiller_id: z.string().optional(),
})

export async function creerEtudiant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const raw = {
    prenom:        formData.get("prenom"),
    nom:           formData.get("nom"),
    email:         formData.get("email") || undefined,
    telephone:     formData.get("telephone") || undefined,
    ville:         formData.get("ville") || undefined,
    formation_id:  formData.get("formation_id") || undefined,
    statut:        formData.get("statut"),
    etape_process: formData.get("etape_process"),
    conseiller_id: formData.get("conseiller_id") || undefined,
  }

  const parsed = createEtudiantSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { email, formation_id, conseiller_id, ...rest } = parsed.data

  const etudiant = await prisma.etudiant.create({
    data: {
      ...rest,
      email:         email || null,
      formation_id:  formation_id || null,
      conseiller_id: conseiller_id || null,
    },
  })

  revalidatePath("/etudiants")
  redirect(`/etudiants/${etudiant.id}`)
}

// ─── Assigner un conseiller (liste) ───────────────────────────────────────────

export async function assignerConseiller(formData: FormData) {
  const session = await auth()
  if (!session) return

  const etudiantId   = formData.get("etudiant_id") as string
  const conseillerId = formData.get("conseiller_id") as string

  if (!etudiantId) return

  await prisma.etudiant.update({
    where: { id: etudiantId },
    data:  { conseiller_id: conseillerId || null },
  })

  revalidatePath("/etudiants")
  revalidatePath(`/etudiants/${etudiantId}`)
  revalidatePath("/dashboard")
}
