"use client"

import { useActionState } from "react"
import { modifierContact } from "../../actions"

type ActionState = { error: string | null }

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"

export function EditContactForm({
  contact,
}: {
  contact: {
    id: string
    entreprise_id: string
    nom_complet: string
    prenom: string | null
    poste: string | null
    email: string | null
    telephone: string | null
    decideur: boolean
  }
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierContact,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="contact_id" value={contact.id} />
      <input type="hidden" name="entreprise_id" value={contact.entreprise_id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
        <input name="nom_complet" required defaultValue={contact.nom_complet} className={INPUT} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
        <input name="prenom" defaultValue={contact.prenom ?? ""} className={INPUT} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Poste</label>
        <input name="poste" defaultValue={contact.poste ?? ""} className={INPUT} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input name="email" type="email" defaultValue={contact.email ?? ""} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
          <input name="telephone" type="tel" defaultValue={contact.telephone ?? ""} className={INPUT} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Décideur</label>
        <select name="decideur" defaultValue={contact.decideur ? "true" : "false"} className={INPUT}>
          <option value="false">Non</option>
          <option value="true">Oui</option>
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
