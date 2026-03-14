"use client"

import { useActionState } from "react"
import { modifierRDV } from "../../actions"
import { TypeRDV, StatutRDV } from "@prisma/client"

type ActionState = { error: string | null }

const TYPE_RDV_LABELS: Record<TypeRDV, string> = {
  APPEL:                "Appel",
  ENTRETIEN_ADMISSION:  "Entretien d'admission",
  TEST_POSITIONNEMENT:  "Test de positionnement",
  RDV_PHYSIQUE:         "RDV physique",
  ENTRETIEN_ENTREPRISE: "Entretien entreprise",
  AUTRE:                "Autre",
}

const STATUT_RDV_LABELS: Record<StatutRDV, string> = {
  PLANIFIE: "Planifié",
  FAIT:     "Fait",
  ANNULE:   "Annulé",
  NO_SHOW:  "No-show",
}

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"

export function EditRdvForm({
  rdv,
}: {
  rdv: {
    id: string
    etudiant_id: string
    type: TypeRDV
    statut: StatutRDV
    date: Date | null
    notes: string | null
  }
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierRDV,
    { error: null }
  )

  // Formatage de la date pour datetime-local : YYYY-MM-DDTHH:MM
  const dateDefault = rdv.date
    ? new Date(rdv.date).toISOString().slice(0, 16)
    : ""

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="rdv_id" value={rdv.id} />
      <input type="hidden" name="etudiant_id" value={rdv.etudiant_id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <select name="type" defaultValue={rdv.type} className={INPUT}>
          {(Object.keys(TYPE_RDV_LABELS) as TypeRDV[]).map((v) => (
            <option key={v} value={v}>{TYPE_RDV_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
        <select name="statut" defaultValue={rdv.statut} className={INPUT}>
          {(Object.keys(STATUT_RDV_LABELS) as StatutRDV[]).map((v) => (
            <option key={v} value={v}>{STATUT_RDV_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Date (optionnelle)</label>
        <input name="date" type="datetime-local" defaultValue={dateDefault} className={INPUT} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={rdv.notes ?? ""}
          placeholder="Observations, compte-rendu…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
        />
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
