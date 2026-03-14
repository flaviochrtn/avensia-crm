"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  EtapeEtudiant, StatutEtudiant,
  TypeRDV, StatutRDV,
  Sexe, TypeContrat, OrigineContact, StatutAlternance,
} from "@prisma/client"

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
  revalidatePath("/dashboard")
  return { error: null, success: true }
}

// ─── Modifier un étudiant (champs complets) ───────────────────────────────────

const modifierEtudiantSchema = z.object({
  etudiant_id:            z.string().min(1),
  prenom:                 z.string().min(1, "Prénom obligatoire").max(100),
  nom:                    z.string().min(1, "Nom obligatoire").max(100),
  email:                  z.string().email("Email invalide").optional(),
  telephone:              z.string().max(30).optional(),
  date_naissance:         z.string().optional(),
  sexe:                   z.preprocess(v => v || undefined, z.nativeEnum(Sexe).optional()),
  adresse:                z.string().max(500).optional(),
  ville:                  z.string().max(100).optional(),
  permis:                 z.enum(["true", "false", ""]).optional(),
  vehicule:               z.enum(["true", "false", ""]).optional(),
  situation_handicap:     z.enum(["true", "false", ""]).optional(),
  formation_id:           z.string().optional(),
  type_contrat:           z.preprocess(v => v || undefined, z.nativeEnum(TypeContrat).optional()),
  diplome_actuel:         z.string().max(200).optional(),
  formation_actuelle:     z.string().max(200).optional(),
  specialisation:         z.string().max(200).optional(),
  etape_process:          z.nativeEnum(EtapeEtudiant),
  statut:                 z.nativeEnum(StatutEtudiant),
  niveau_motivation:      z.string().optional(),
  niveau_test:            z.string().max(50).optional(),
  niveau_cours:           z.string().max(50).optional(),
  origine_contact:        z.preprocess(v => v || undefined, z.nativeEnum(OrigineContact).optional()),
  statut_motivation:      z.string().max(100).optional(),
  campagne:               z.string().max(100).optional(),
  apporteur_nom:          z.string().max(100).optional(),
  conseiller_id:          z.string().optional(),
  entreprise_liee_id:     z.string().optional(),
  date_premier_contact:   z.string().optional(),
  date_prochaine_relance: z.string().optional(),
  note_prochaine_relance: z.string().max(500).optional(),
  date_entree_formation:   z.string().optional(),
  date_sortie_formation:   z.string().optional(),
  date_rentree_officielle: z.string().optional(),
  pack_suivi_alternance:  z.string().max(200).optional(),
  cv_url:                 z.string().max(500).optional(),
  commentaire:            z.string().max(5000).optional(),
})

export async function modifierEtudiant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const emailRaw = s(formData.get("email"))?.toLowerCase() ?? undefined

  const parsed = modifierEtudiantSchema.safeParse({
    etudiant_id:            formData.get("etudiant_id"),
    prenom:                 s(formData.get("prenom")),
    nom:                    s(formData.get("nom")),
    email:                  emailRaw,
    telephone:              s(formData.get("telephone")) ?? undefined,
    date_naissance:         s(formData.get("date_naissance")) ?? undefined,
    sexe:                   s(formData.get("sexe")) ?? undefined,
    adresse:                s(formData.get("adresse")) ?? undefined,
    ville:                  s(formData.get("ville")) ?? undefined,
    permis:                 formData.get("permis") as string,
    vehicule:               formData.get("vehicule") as string,
    situation_handicap:     formData.get("situation_handicap") as string,
    formation_id:           s(formData.get("formation_id")) ?? undefined,
    type_contrat:           s(formData.get("type_contrat")) ?? undefined,
    diplome_actuel:         s(formData.get("diplome_actuel")) ?? undefined,
    formation_actuelle:     s(formData.get("formation_actuelle")) ?? undefined,
    specialisation:         s(formData.get("specialisation")) ?? undefined,
    etape_process:          formData.get("etape_process"),
    statut:                 formData.get("statut"),
    niveau_motivation:      s(formData.get("niveau_motivation")) ?? undefined,
    niveau_test:            s(formData.get("niveau_test")) ?? undefined,
    niveau_cours:           s(formData.get("niveau_cours")) ?? undefined,
    origine_contact:        s(formData.get("origine_contact")) ?? undefined,
    statut_motivation:      s(formData.get("statut_motivation")) ?? undefined,
    campagne:               s(formData.get("campagne")) ?? undefined,
    apporteur_nom:          s(formData.get("apporteur_nom")) ?? undefined,
    conseiller_id:          s(formData.get("conseiller_id")) ?? undefined,
    entreprise_liee_id:     s(formData.get("entreprise_liee_id")) ?? undefined,
    date_premier_contact:   s(formData.get("date_premier_contact")) ?? undefined,
    date_prochaine_relance: s(formData.get("date_prochaine_relance")) ?? undefined,
    note_prochaine_relance: s(formData.get("note_prochaine_relance")) ?? undefined,
    date_entree_formation:   s(formData.get("date_entree_formation")) ?? undefined,
    date_sortie_formation:   s(formData.get("date_sortie_formation")) ?? undefined,
    date_rentree_officielle: s(formData.get("date_rentree_officielle")) ?? undefined,
    pack_suivi_alternance:  s(formData.get("pack_suivi_alternance")) ?? undefined,
    cv_url:                 s(formData.get("cv_url")) ?? undefined,
    commentaire:            s(formData.get("commentaire")) ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const {
    etudiant_id, email,
    permis: permisStr, vehicule: vehiculeStr, situation_handicap: handicapStr,
    formation_id, type_contrat, conseiller_id, entreprise_liee_id,
    date_naissance, date_premier_contact, date_prochaine_relance,
    date_entree_formation, date_sortie_formation, date_rentree_officielle,
    niveau_motivation,
    ...rest
  } = parsed.data

  // Vérifier que l'étudiant existe
  const existing = await prisma.etudiant.findFirst({
    where: { id: etudiant_id, deleted_at: null },
    select: { id: true },
  })
  if (!existing) return { error: "Étudiant introuvable" }

  // Doublon email
  if (email) {
    const doublon = await prisma.etudiant.findFirst({
      where: { email, deleted_at: null, NOT: { id: etudiant_id } },
      select: { id: true },
    })
    if (doublon) return { error: "Cet email est déjà utilisé par un autre étudiant" }
  }

  // Vérifications FK
  if (formation_id) {
    const f = await prisma.formation.findUnique({ where: { id: formation_id }, select: { id: true } })
    if (!f) return { error: "Formation introuvable" }
  }
  if (conseiller_id) {
    const c = await prisma.user.findUnique({ where: { id: conseiller_id }, select: { id: true } })
    if (!c) return { error: "Conseiller introuvable" }
  }
  if (entreprise_liee_id) {
    const e = await prisma.entreprise.findFirst({
      where: { id: entreprise_liee_id, deleted_at: null },
      select: { id: true },
    })
    if (!e) return { error: "Entreprise liée introuvable" }
  }

  await prisma.etudiant.update({
    where: { id: etudiant_id },
    data: {
      ...rest,
      email:                  email ?? null,
      permis:                 bool(permisStr ?? null),
      vehicule:               bool(vehiculeStr ?? null),
      situation_handicap:     bool(handicapStr ?? null),
      formation_id:           formation_id ?? null,
      type_contrat:           type_contrat ?? null,
      conseiller_id:          conseiller_id ?? null,
      entreprise_liee_id:     entreprise_liee_id ?? null,
      date_naissance:         toDate(date_naissance ?? null),
      date_premier_contact:   toDate(date_premier_contact ?? null),
      date_prochaine_relance: toDate(date_prochaine_relance ?? null),
      date_entree_formation:   toDate(date_entree_formation ?? null),
      date_sortie_formation:   toDate(date_sortie_formation ?? null),
      date_rentree_officielle: toDate(date_rentree_officielle ?? null),
      niveau_motivation:      niveau_motivation ? (parseInt(niveau_motivation, 10) || null) : null,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/etudiants")
  revalidatePath("/dashboard")
  redirect(`/etudiants/${etudiant_id}`)
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
      date:         date ? new Date(date) : null,
      notes:        notes ?? null,
      animateur_id: session.user.id,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/dashboard")
  return { error: null, success: true }
}

// ─── Modifier un RDV ──────────────────────────────────────────────────────────

const modifierRdvSchema = z.object({
  rdv_id:      z.string().min(1),
  etudiant_id: z.string().min(1),
  type:        z.nativeEnum(TypeRDV),
  statut:      z.nativeEnum(StatutRDV),
  date:        z.string().optional(),
  notes:       z.string().max(2000).optional(),
})

export async function modifierRDV(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = modifierRdvSchema.safeParse({
    rdv_id:      formData.get("rdv_id"),
    etudiant_id: formData.get("etudiant_id"),
    type:        formData.get("type"),
    statut:      formData.get("statut"),
    date:        formData.get("date") || undefined,
    notes:       s(formData.get("notes")) ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { rdv_id, etudiant_id, type, statut, date, notes } = parsed.data

  const rdv = await prisma.rendezVous.findUnique({
    where:  { id: rdv_id },
    select: { id: true, etudiant_id: true },
  })
  if (!rdv) return { error: "RDV introuvable" }
  if (rdv.etudiant_id !== etudiant_id) return { error: "RDV introuvable" }

  await prisma.rendezVous.update({
    where: { id: rdv_id },
    data: {
      type,
      statut,
      date:  date ? new Date(date) : null,
      notes: notes ?? null,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/dashboard")
  redirect(`/etudiants/${etudiant_id}`)
}

// ─── Supprimer un RDV ─────────────────────────────────────────────────────────

export async function supprimerRDV(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session) return

  const rdvId      = formData.get("rdv_id") as string
  const etudiantId = formData.get("etudiant_id") as string
  if (!rdvId || !etudiantId) return

  const rdv = await prisma.rendezVous.findUnique({
    where:  { id: rdvId },
    select: { id: true, etudiant_id: true },
  })
  if (!rdv || rdv.etudiant_id !== etudiantId) return

  await prisma.rendezVous.delete({ where: { id: rdvId } })

  revalidatePath(`/etudiants/${etudiantId}`)
  revalidatePath("/dashboard")
}

// ─── CRUD Historique Alternance ───────────────────────────────────────────────

const alternanceSchema = z.object({
  etudiant_id:          z.string().min(1),
  entreprise_id:        z.string().optional(),
  nom_entreprise_libre: z.string().max(200).optional(),
  type_contrat:         z.preprocess(v => v || undefined, z.nativeEnum(TypeContrat).optional()),
  poste:                z.string().max(200).optional(),
  date_debut_contrat:   z.string().optional(),
  date_fin_contrat:     z.string().optional(),
  date_rupture:         z.string().optional(),
  motif_rupture:        z.string().max(500).optional(),
  statut:               z.nativeEnum(StatutAlternance),
  commentaire:          z.string().max(2000).optional(),
})

function parseAlternanceFormData(formData: FormData) {
  return alternanceSchema.safeParse({
    etudiant_id:          formData.get("etudiant_id"),
    entreprise_id:        s(formData.get("entreprise_id")) ?? undefined,
    nom_entreprise_libre: s(formData.get("nom_entreprise_libre")) ?? undefined,
    type_contrat:         s(formData.get("type_contrat")) ?? undefined,
    poste:                s(formData.get("poste")) ?? undefined,
    date_debut_contrat:   s(formData.get("date_debut_contrat")) ?? undefined,
    date_fin_contrat:     s(formData.get("date_fin_contrat")) ?? undefined,
    date_rupture:         s(formData.get("date_rupture")) ?? undefined,
    motif_rupture:        s(formData.get("motif_rupture")) ?? undefined,
    statut:               formData.get("statut") ?? "EN_COURS",
    commentaire:          s(formData.get("commentaire")) ?? undefined,
  })
}

export async function creerHistoriqueAlternance(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const parsed = parseAlternanceFormData(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { etudiant_id, entreprise_id, nom_entreprise_libre, type_contrat, poste,
          date_debut_contrat, date_fin_contrat, date_rupture, motif_rupture,
          statut, commentaire } = parsed.data

  if (!entreprise_id && !nom_entreprise_libre) {
    return { error: "Renseignez l'entreprise ou son nom libre" }
  }

  if (entreprise_id) {
    const e = await prisma.entreprise.findFirst({ where: { id: entreprise_id, deleted_at: null }, select: { id: true } })
    if (!e) return { error: "Entreprise introuvable" }
  }

  await prisma.historiqueAlternance.create({
    data: {
      etudiant_id,
      entreprise_id:        entreprise_id ?? null,
      nom_entreprise_libre: nom_entreprise_libre ?? null,
      type_contrat:         type_contrat ?? null,
      poste:                poste ?? null,
      date_debut_contrat:   toDate(date_debut_contrat ?? null),
      date_fin_contrat:     toDate(date_fin_contrat ?? null),
      date_rupture:         toDate(date_rupture ?? null),
      motif_rupture:        motif_rupture ?? null,
      statut,
      commentaire:          commentaire ?? null,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/etudiants")
  return { error: null, success: true }
}

export async function modifierHistoriqueAlternance(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session) return { error: "Non autorisé" }

  const alternanceId = formData.get("alternance_id") as string
  if (!alternanceId) return { error: "ID manquant" }

  const parsed = parseAlternanceFormData(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { etudiant_id, entreprise_id, nom_entreprise_libre, type_contrat, poste,
          date_debut_contrat, date_fin_contrat, date_rupture, motif_rupture,
          statut, commentaire } = parsed.data

  if (!entreprise_id && !nom_entreprise_libre) {
    return { error: "Renseignez l'entreprise ou son nom libre" }
  }

  const existing = await prisma.historiqueAlternance.findUnique({
    where:  { id: alternanceId },
    select: { id: true, etudiant_id: true },
  })
  if (!existing || existing.etudiant_id !== etudiant_id) return { error: "Contrat introuvable" }

  if (entreprise_id) {
    const e = await prisma.entreprise.findFirst({ where: { id: entreprise_id, deleted_at: null }, select: { id: true } })
    if (!e) return { error: "Entreprise introuvable" }
  }

  await prisma.historiqueAlternance.update({
    where: { id: alternanceId },
    data: {
      entreprise_id:        entreprise_id ?? null,
      nom_entreprise_libre: nom_entreprise_libre ?? null,
      type_contrat:         type_contrat ?? null,
      poste:                poste ?? null,
      date_debut_contrat:   toDate(date_debut_contrat ?? null),
      date_fin_contrat:     toDate(date_fin_contrat ?? null),
      date_rupture:         toDate(date_rupture ?? null),
      motif_rupture:        motif_rupture ?? null,
      statut,
      commentaire:          commentaire ?? null,
    },
  })

  revalidatePath(`/etudiants/${etudiant_id}`)
  revalidatePath("/etudiants")
  redirect(`/etudiants/${etudiant_id}`)
}

export async function supprimerHistoriqueAlternance(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session) return

  const alternanceId = formData.get("alternance_id") as string
  const etudiantId   = formData.get("etudiant_id") as string
  if (!alternanceId || !etudiantId) return

  const existing = await prisma.historiqueAlternance.findUnique({
    where:  { id: alternanceId },
    select: { id: true, etudiant_id: true },
  })
  if (!existing || existing.etudiant_id !== etudiantId) return

  await prisma.historiqueAlternance.delete({ where: { id: alternanceId } })

  revalidatePath(`/etudiants/${etudiantId}`)
  revalidatePath("/etudiants")
}
