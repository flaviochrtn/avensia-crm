"use client"

import { useActionState } from "react"
import { creerEntreprise } from "../actions"
import { StatutEntreprise } from "@prisma/client"
import Link from "next/link"

type User = { id: string; prenom: string; nom: string }
type ActionState = { error: string | null }

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

export function CreateEntrepriseForm({ users }: { users: User[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    creerEntreprise,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
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
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
          <input
            name="ville"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Secteur</label>
          <input
            name="secteur"
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
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            name="email_general"
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
        <select
          name="statut"
          defaultValue="NOUVEAU"
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
          {isPending ? "Création…" : "Créer l'entreprise"}
        </button>
        <Link href="/entreprises" className="text-sm text-gray-500 hover:text-gray-800">
          Annuler
        </Link>
      </div>
    </form>
  )
}
