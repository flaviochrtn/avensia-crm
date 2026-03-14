"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { StatutEntreprise } from "@prisma/client"

type ActionState = { error: string | null; success?: boolean }

function s(val: FormDataEntryValue | null): string | null {
  const v = (val as string ?? "").trim()
  return v || null
}

const bool = (v: string | null): boolean | null =>
  v === "true" ? true : v === "false" ? false : null

const toDate = (v: string | null): Date | null => {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// ─── Réassigner le responsable (fiche) ───────────────────────────────────────

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
  revalidatePath("/dashboard")
  return { error: null, success: true }
}

// ─── Modifier une entreprise (champs complets) ────────────────────────────────

const modifierEntrepriseSchema = z.object({
  entreprise_id:          z.string().min(1),
  nom:                    z.string().min(1, "Nom obligatoire").max(200),
  ville:                  z.string().max(100).optional(),
  secteur:                z.string().max(100).optional(),
  type_structure:         z.string().max(100).optional(),
  adresse:                z.string().max(500).optional(),
  telephone:              z.string().max(30).optional(),
  email_general:          z.string().email("Email invalide").optional(),
  site_web:               z.string().max(500).optional(),
  linkedin:               z.string().max(500).optional(),
  statut:                 z.nativeEnum(StatutEntreprise),
  besoin_alternant:       z.enum(["true", "false", ""]).optional(),
  nombre_postes:          z.string().optional(),
  formations_recherchees: z.string().max(500).optional(),
  profil_recherche:       z.string().max(500).optional(),
  numero_idcc:            z.string().max(50).optional(),
  campagne:               z.string().max(100).optional(),
  date_premier_contact:   z.string().optional(),
  date_prochaine_relance: z.string().optional(),
  responsable_id:         z.string().optional(),
  commentaire:            z.string().max(5000).optional(),
})

export async function modifierEntreprise(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const emailRaw = s(formData.get("email_general"))?.toLowerCase() ?? undefined

  const parsed = modifierEntrepriseSchema.safeParse({
    entreprise_id:          formData.get("entreprise_id"),
    nom:                    s(formData.get("nom")),
    ville:                  s(formData.get("ville")) ?? undefined,
    secteur:                s(formData.get("secteur")) ?? undefined,
    type_structure:         s(formData.get("type_structure")) ?? undefined,
    adresse:                s(formData.get("adresse")) ?? undefined,
    telephone:              s(formData.get("telephone")) ?? undefined,
    email_general:          emailRaw,
    site_web:               s(formData.get("site_web")) ?? undefined,
    linkedin:               s(formData.get("linkedin")) ?? undefined,
    statut:                 formData.get("statut"),
    besoin_alternant:       formData.get("besoin_alternant") as string,
    nombre_postes:          s(formData.get("nombre_postes")) ?? undefined,
    formations_recherchees: s(formData.get("formations_recherchees")) ?? undefined,
    profil_recherche:       s(formData.get("profil_recherche")) ?? undefined,
    numero_idcc:            s(formData.get("numero_idcc")) ?? undefined,
    campagne:               s(formData.get("campagne")) ?? undefined,
    date_premier_contact:   s(formData.get("date_premier_contact")) ?? undefined,
    date_prochaine_relance: s(formData.get("date_prochaine_relance")) ?? undefined,
    responsable_id:         s(formData.get("responsable_id")) ?? undefined,
    commentaire:            s(formData.get("commentaire")) ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const {
    entreprise_id, email_general, responsable_id,
    besoin_alternant: besoinStr, nombre_postes,
    date_premier_contact, date_prochaine_relance,
    ...rest
  } = parsed.data

  // Vérifier existence
  const existing = await prisma.entreprise.findUnique({
    where: { id: entreprise_id, deleted_at: null },
    select: { id: true },
  })
  if (!existing) return { error: "Entreprise introuvable" }

  // Doublon email
  if (email_general) {
    const doublon = await prisma.entreprise.findFirst({
      where: { email_general, deleted_at: null, NOT: { id: entreprise_id } },
      select: { id: true },
    })
    if (doublon) return { error: "Cet email est déjà utilisé par une autre entreprise" }
  }

  // Vérification FK responsable
  if (responsable_id) {
    const r = await prisma.user.findUnique({ where: { id: responsable_id }, select: { id: true } })
    if (!r) return { error: "Responsable introuvable" }
  }

  await prisma.entreprise.update({
    where: { id: entreprise_id },
    data: {
      ...rest,
      email_general:          email_general ?? null,
      responsable_id:         responsable_id ?? null,
      besoin_alternant:       bool(besoinStr ?? null),
      nombre_postes:          nombre_postes ? (parseInt(nombre_postes, 10) || 0) : 0,
      date_premier_contact:   toDate(date_premier_contact ?? null),
      date_prochaine_relance: toDate(date_prochaine_relance ?? null),
    },
  })

  revalidatePath(`/entreprises/${entreprise_id}`)
  revalidatePath("/entreprises")
  revalidatePath("/dashboard")
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

// ─── Modifier un contact ──────────────────────────────────────────────────────

const modifierContactSchema = z.object({
  contact_id:    z.string().min(1),
  entreprise_id: z.string().min(1),
  nom_complet:   z.string().min(1, "Nom obligatoire").max(200),
  prenom:        z.string().max(100).optional(),
  poste:         z.string().max(200).optional(),
  email:         z.string().email("Email invalide").optional(),
  telephone:     z.string().max(30).optional(),
  decideur:      z.enum(["true", "false"]).optional(),
})

export async function modifierContact(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const emailRaw = s(formData.get("email"))?.toLowerCase() ?? undefined

  const parsed = modifierContactSchema.safeParse({
    contact_id:    formData.get("contact_id"),
    entreprise_id: formData.get("entreprise_id"),
    nom_complet:   s(formData.get("nom_complet")),
    prenom:        s(formData.get("prenom")) ?? undefined,
    poste:         s(formData.get("poste")) ?? undefined,
    email:         emailRaw,
    telephone:     s(formData.get("telephone")) ?? undefined,
    decideur:      formData.get("decideur") as string,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { contact_id, entreprise_id, email, decideur: decideurStr, ...rest } = parsed.data

  // Vérifier appartenance
  const contact = await prisma.contactEntreprise.findUnique({
    where:  { id: contact_id },
    select: { id: true, entreprise_id: true },
  })
  if (!contact || contact.entreprise_id !== entreprise_id) return { error: "Contact introuvable" }

  await prisma.contactEntreprise.update({
    where: { id: contact_id },
    data: {
      ...rest,
      email:    email ?? null,
      decideur: decideurStr === "true",
    },
  })

  revalidatePath(`/entreprises/${entreprise_id}`)
  redirect(`/entreprises/${entreprise_id}`)
}

// ─── Supprimer un contact ─────────────────────────────────────────────────────

export async function supprimerContact(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session) return

  const contactId    = formData.get("contact_id") as string
  const entrepriseId = formData.get("entreprise_id") as string
  if (!contactId || !entrepriseId) return

  const contact = await prisma.contactEntreprise.findUnique({
    where:  { id: contactId },
    select: { id: true, entreprise_id: true },
  })
  if (!contact || contact.entreprise_id !== entrepriseId) return

  await prisma.contactEntreprise.delete({ where: { id: contactId } })

  revalidatePath(`/entreprises/${entrepriseId}`)
}
