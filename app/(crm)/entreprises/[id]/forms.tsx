"use client"

import { useActionState, useEffect, useRef } from "react"
import { assignerResponsable, ajouterNoteEntreprise } from "./actions"

type User = { id: string; prenom: string; nom: string }
type ActionState = { error: string | null; success?: boolean }

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
