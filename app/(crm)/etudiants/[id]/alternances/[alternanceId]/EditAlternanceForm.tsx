"use client"

import { useActionState } from "react"
import { modifierHistoriqueAlternance } from "../../actions"
import { StatutAlternance, TypeContrat } from "@prisma/client"

type ActionState = { error: string | null }
type EntrepriseOption = { id: string; nom: string; ville: string | null }

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"

const STATUT_ALT_LABELS: Record<StatutAlternance, string> = {
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ROMPUE:   "Rompue",
  ANNULEE:  "Annulée",
}

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  APPRENTISSAGE:        "Apprentissage",
  PROFESSIONNALISATION: "Professionnalisation",
}

function toDateInput(d: Date | null): string {
  if (!d) return ""
  return new Date(d).toISOString().slice(0, 10)
}

export function EditAlternanceForm({
  alternance,
  entreprises,
}: {
  alternance: {
    id: string
    etudiant_id: string
    entreprise_id: string | null
    nom_entreprise_libre: string | null
    type_contrat: TypeContrat | null
    poste: string | null
    date_debut_contrat: Date | null
    date_fin_contrat: Date | null
    date_rupture: Date | null
    motif_rupture: string | null
    statut: StatutAlternance
    commentaire: string | null
  }
  entreprises: EntrepriseOption[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierHistoriqueAlternance,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="alternance_id" value={alternance.id} />
      <input type="hidden" name="etudiant_id" value={alternance.etudiant_id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entreprise (sélection)</label>
          <select name="entreprise_id" defaultValue={alternance.entreprise_id ?? ""} className={INPUT}>
            <option value="">— Aucune</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>{e.nom}{e.ville ? ` — ${e.ville}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ou nom libre</label>
          <input name="nom_entreprise_libre" defaultValue={alternance.nom_entreprise_libre ?? ""} placeholder="Nom de l'entreprise…" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type contrat</label>
          <select name="type_contrat" defaultValue={alternance.type_contrat ?? ""} className={INPUT}>
            <option value="">— Non renseigné</option>
            {(Object.keys(TYPE_CONTRAT_LABELS) as TypeContrat[]).map((v) => (
              <option key={v} value={v}>{TYPE_CONTRAT_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Poste</label>
          <input name="poste" defaultValue={alternance.poste ?? ""} placeholder="Intitulé du poste…" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Début contrat</label>
          <input name="date_debut_contrat" type="date" defaultValue={toDateInput(alternance.date_debut_contrat)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fin contrat</label>
          <input name="date_fin_contrat" type="date" defaultValue={toDateInput(alternance.date_fin_contrat)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select name="statut" defaultValue={alternance.statut} className={INPUT}>
            {(Object.keys(STATUT_ALT_LABELS) as StatutAlternance[]).map((v) => (
              <option key={v} value={v}>{STATUT_ALT_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date rupture</label>
          <input name="date_rupture" type="date" defaultValue={toDateInput(alternance.date_rupture)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Motif rupture</label>
          <input name="motif_rupture" defaultValue={alternance.motif_rupture ?? ""} placeholder="Motif…" className={INPUT} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
        <textarea
          name="commentaire"
          rows={3}
          defaultValue={alternance.commentaire ?? ""}
          placeholder="Observations…"
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
