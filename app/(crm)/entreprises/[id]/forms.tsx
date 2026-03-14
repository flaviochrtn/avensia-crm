"use client"

import { useActionState, useEffect, useRef } from "react"
import { assignerResponsable, ajouterNoteEntreprise, modifierEntreprise } from "./actions"
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

// ─── Éditer une entreprise ────────────────────────────────────────────────────

export function EditEntrepriseForm({
  entreprise,
  users,
}: {
  entreprise: {
    id: string
    nom: string
    ville: string | null
    secteur: string | null
    telephone: string | null
    email_general: string | null
    statut: StatutEntreprise
    responsable_id: string | null
  }
  users: User[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierEntreprise,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="entreprise_id" value={entreprise.id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
        <input
          name="nom"
          required
          defaultValue={entreprise.nom}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
          <input
            name="ville"
            defaultValue={entreprise.ville ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Secteur</label>
          <input
            name="secteur"
            defaultValue={entreprise.secteur ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
          <input
            name="telephone"
            type="tel"
            defaultValue={entreprise.telephone ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            name="email_general"
            type="email"
            defaultValue={entreprise.email_general ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
        <select
          name="statut"
          defaultValue={entreprise.statut}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {(Object.keys(STATUT_LABELS) as StatutEntreprise[]).map((v) => (
            <option key={v} value={v}>{STATUT_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
        <select
          name="responsable_id"
          defaultValue={entreprise.responsable_id ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">— Non assigné</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
          ))}
        </select>
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
