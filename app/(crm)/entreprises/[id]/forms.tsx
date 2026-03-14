"use client"

import { useActionState, useEffect, useRef, useTransition } from "react"
import { assignerResponsable, ajouterNoteEntreprise, modifierEntreprise, supprimerContact } from "./actions"
import { StatutEntreprise } from "@prisma/client"

type User = { id: string; prenom: string; nom: string }
type ActionState = { error: string | null; success?: boolean }

const STATUT_LABELS: Record<StatutEntreprise, string> = {
  NOUVEAU:          "Nouveau",
  A_CONTACTER:      "À contacter",
  CONTACTE:         "Contacté",
  QUALIFIE:         "Qualifié",
  BESOIN_OUVERT:    "Besoin ouvert",
  RDV_PLANIFIE:     "RDV planifié",
  PARTENAIRE_ACTIF: "Partenaire actif",
  AUCUN_BESOIN:     "Aucun besoin",
  PERDU:            "Perdu",
}

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"

function toDateInput(d: Date | null): string {
  if (!d) return ""
  return new Date(d).toISOString().slice(0, 10)
}

// ─── Réassigner le responsable ────────────────────────────────────────────────

export function ResponsableForm({
  entrepriseId,
  responsableId,
  users,
}: {
  entrepriseId: string
  responsableId: string | null
  users: User[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    assignerResponsable,
    { error: null }
  )

  return (
    <form action={formAction} className="flex items-center gap-2 mt-3">
      <input type="hidden" name="entreprise_id" value={entrepriseId} />
      <select
        name="responsable_id"
        defaultValue={responsableId ?? ""}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="">— Non assigné</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.prenom} {u.nom}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? "…" : "Enregistrer"}
      </button>
      {state.success && (
        <span className="text-sm text-green-600">Responsable mis à jour</span>
      )}
      {state.error && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}
    </form>
  )
}

// ─── Ajouter une note ─────────────────────────────────────────────────────────

export function NoteEntrepriseForm({ entrepriseId }: { entrepriseId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    ajouterNoteEntreprise,
    { error: null }
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="entreprise_id" value={entrepriseId} />
      <textarea
        name="contenu"
        rows={3}
        placeholder="Ajouter une note…"
        required
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Enregistrement…" : "Ajouter la note"}
        </button>
        {state.success && (
          <span className="text-sm text-green-600">Note ajoutée</span>
        )}
        {state.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  )
}

// ─── Supprimer un contact ─────────────────────────────────────────────────────

export function DeleteContactButton({
  contactId,
  entrepriseId,
}: {
  contactId: string
  entrepriseId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Supprimer ce contact ?")) return
        const fd = new FormData()
        fd.append("contact_id", contactId)
        fd.append("entreprise_id", entrepriseId)
        startTransition(() => supprimerContact(fd))
      }}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Supprimer"}
    </button>
  )
}

// ─── Éditer une entreprise (tous les champs) ──────────────────────────────────

export function EditEntrepriseForm({
  entreprise,
  users,
}: {
  entreprise: {
    id: string
    nom: string
    ville: string | null
    secteur: string | null
    type_structure: string | null
    adresse: string | null
    telephone: string | null
    email_general: string | null
    site_web: string | null
    linkedin: string | null
    statut: StatutEntreprise
    besoin_alternant: boolean | null
    nombre_postes: number
    formations_recherchees: string | null
    profil_recherche: string | null
    numero_idcc: string | null
    campagne: string | null
    date_premier_contact: Date | null
    date_prochaine_relance: Date | null
    responsable_id: string | null
    commentaire: string | null
  }
  users: User[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierEntreprise,
    { error: null }
  )

  const besoinDefault =
    entreprise.besoin_alternant === true  ? "true"
    : entreprise.besoin_alternant === false ? "false"
    : ""

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="entreprise_id" value={entreprise.id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {/* ── Identité ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identité</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
            <input name="nom" required defaultValue={entreprise.nom} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <input name="ville" defaultValue={entreprise.ville ?? ""} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Secteur</label>
              <input name="secteur" defaultValue={entreprise.secteur ?? ""} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de structure</label>
              <input name="type_structure" defaultValue={entreprise.type_structure ?? ""} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° IDCC</label>
              <input name="numero_idcc" defaultValue={entreprise.numero_idcc ?? ""} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
            <input name="adresse" defaultValue={entreprise.adresse ?? ""} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input name="telephone" type="tel" defaultValue={entreprise.telephone ?? ""} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email général</label>
              <input name="email_general" type="email" defaultValue={entreprise.email_general ?? ""} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Site web</label>
              <input name="site_web" defaultValue={entreprise.site_web ?? ""} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
              <input name="linkedin" defaultValue={entreprise.linkedin ?? ""} className={INPUT} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Suivi commercial ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Suivi commercial</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select name="statut" defaultValue={entreprise.statut} className={INPUT}>
                {(Object.keys(STATUT_LABELS) as StatutEntreprise[]).map((v) => (
                  <option key={v} value={v}>{STATUT_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
              <select name="responsable_id" defaultValue={entreprise.responsable_id ?? ""} className={INPUT}>
                <option value="">— Non assigné</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Besoin alternant</label>
              <select name="besoin_alternant" defaultValue={besoinDefault} className={INPUT}>
                <option value="">— Non renseigné</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de postes</label>
              <input
                name="nombre_postes"
                type="number"
                min="0"
                defaultValue={entreprise.nombre_postes > 0 ? entreprise.nombre_postes : ""}
                className={INPUT}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Formations recherchées</label>
            <input name="formations_recherchees" defaultValue={entreprise.formations_recherchees ?? ""} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Profil recherché</label>
            <input name="profil_recherche" defaultValue={entreprise.profil_recherche ?? ""} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date premier contact</label>
              <input name="date_premier_contact" type="date" defaultValue={toDateInput(entreprise.date_premier_contact)} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prochaine relance</label>
              <input name="date_prochaine_relance" type="date" defaultValue={toDateInput(entreprise.date_prochaine_relance)} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Campagne</label>
            <input name="campagne" defaultValue={entreprise.campagne ?? ""} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
            <textarea
              name="commentaire"
              rows={4}
              defaultValue={entreprise.commentaire ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  )
}
