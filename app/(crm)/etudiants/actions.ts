"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { EtapeEtudiant, StatutEtudiant } from "@prisma/client"

type ActionState = { error: string | null }

// Normalise une chaîne : trim, ou null si vide
function s(val: FormDataEntryValue | null): string | null {
  const v = (val as string ?? "").trim()
  return v || null
}

// ─── Créer un étudiant ────────────────────────────────────────────────────────

const createEtudiantSchema = z.object({
  prenom:             z.string().min(1, "Prénom obligatoire").max(100),
  nom:                z.string().min(1, "Nom obligatoire").max(100),
  email:              z.string().email("Email invalide").optional(),
  telephone:          z.string().max(30).optional(),
  ville:              z.string().max(100).optional(),
  formation_id:       z.string().optional(),
  statut:             z.nativeEnum(StatutEtudiant),
  etape_process:      z.nativeEnum(EtapeEtudiant),
  conseiller_id:      z.string().optional(),
  entreprise_liee_id: z.string().optional(),
})

export async function creerEtudiant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const emailRaw = s(formData.get("email"))?.toLowerCase() ?? undefined

  const parsed = createEtudiantSchema.safeParse({
    prenom:             s(formData.get("prenom")),
    nom:                s(formData.get("nom")),
    email:              emailRaw,
    telephone:          s(formData.get("telephone")) ?? undefined,
    ville:              s(formData.get("ville")) ?? undefined,
    formation_id:       s(formData.get("formation_id")) ?? undefined,
    statut:             formData.get("statut"),
    etape_process:      formData.get("etape_process"),
    conseiller_id:      s(formData.get("conseiller_id")) ?? undefined,
    entreprise_liee_id: s(formData.get("entreprise_liee_id")) ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // Doublon email
  if (parsed.data.email) {
    const existing = await prisma.etudiant.findFirst({
      where: { email: parsed.data.email, deleted_at: null },
      select: { id: true },
    })
    if (existing) return { error: "Un étudiant avec cet email existe déjà" }
  }

  // Vérifier l'entreprise liée
  if (parsed.data.entreprise_liee_id) {
    const ent = await prisma.entreprise.findUnique({
      where: { id: parsed.data.entreprise_liee_id, deleted_at: null },
      select: { id: true },
    })
    if (!ent) return { error: "Entreprise liée introuvable" }
  }

  const { email, formation_id, conseiller_id, entreprise_liee_id, ...rest } = parsed.data

  const etudiant = await prisma.etudiant.create({
    data: {
      ...rest,
      email:              email ?? null,
      formation_id:       formation_id ?? null,
      conseiller_id:      conseiller_id ?? null,
      entreprise_liee_id: entreprise_liee_id ?? null,
    },
  })

  revalidatePath("/etudiants")
  revalidatePath("/dashboard")
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
