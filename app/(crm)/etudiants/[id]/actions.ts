"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { EtapeEtudiant, StatutEtudiant, TypeRDV, StatutRDV } from "@prisma/client"

type ActionState = { error: string | null; success?: boolean }

// ─── Changer statut / étape ───────────────────────────────────────────────────

const statutSchema = z.object({
  etudiant_id:   z.string().min(1),
  statut:        z.nativeEnum(StatutEtudiant),
  etape_process: z.nativeEnum(EtapeEtudiant),
})

export async function changerStatutEtudiant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = statutSchema.safeParse({
    etudiant_id:   formData.get("etudiant_id"),
    statut:        formData.get("statut"),
    etape_process: formData.get("etape_process"),
  })
  if (!parsed.success) return { error: "Données invalides" }

  const { etudiant_id, statut, etape_process } = parsed.data

  await prisma.etudiant.update({
    where: { id: etudiant_id },
    data:  { statut, etape_process },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/etudiants")
  return { error: null, success: true }
}

// ─── Ajouter une note ─────────────────────────────────────────────────────────

const noteSchema = z.object({
  contenu: z.string().min(1, "La note ne peut pas être vide").max(5000),
})

export async function ajouterNoteEtudiant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const etudiantId = formData.get("etudiant_id") as string
  if (!etudiantId) return { error: "ID étudiant manquant" }

  const parsed = noteSchema.safeParse({ contenu: formData.get("contenu") })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  await prisma.note.create({
    data: {
      contenu:     parsed.data.contenu,
      auteur_id:   session.user.id,
      etudiant_id: etudiantId,
    },
  })

  revalidatePath(`/etudiants/${etudiantId}`)
  return { error: null, success: true }
}

// ─── Créer un RDV ─────────────────────────────────────────────────────────────

const rdvSchema = z.object({
  etudiant_id: z.string().min(1),
  type:        z.nativeEnum(TypeRDV),
  statut:      z.nativeEnum(StatutRDV),
  date:        z.string().optional(),
  notes:       z.string().max(2000).optional(),
})

export async function creerRDV(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = rdvSchema.safeParse({
    etudiant_id: formData.get("etudiant_id"),
    type:        formData.get("type"),
    statut:      formData.get("statut"),
    date:        formData.get("date") || undefined,
    notes:       formData.get("notes") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { etudiant_id, type, statut, date, notes } = parsed.data

  // Numéro RDV = max existant + 1
  const lastRdv = await prisma.rendezVous.findFirst({
    where:   { etudiant_id },
    orderBy: { numero_rdv: "desc" },
    select:  { numero_rdv: true },
  })
  const numero_rdv = (lastRdv?.numero_rdv ?? 0) + 1

  await prisma.rendezVous.create({
    data: {
      etudiant_id,
      type,
      statut,
      numero_rdv,
      date:  date ? new Date(date) : null,
      notes: notes ?? null,
      animateur_id: session.user.id,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  return { error: null, success: true }
}
