"use client"

import { useActionState } from "react"
import { creerEtudiant } from "../actions"
import { EtapeEtudiant, StatutEtudiant } from "@prisma/client"
import Link from "next/link"

type Formation  = { id: string; code: string; nom: string }
type User       = { id: string; prenom: string; nom: string }
type Entreprise = { id: string; nom: string; ville: string | null }
type ActionState = { error: string | null }

const STATUT_LABELS: Record<StatutEtudiant, string> = {
  EN_COURS:              "En cours",
  INSCRIT_EN_RECHERCHE:  "Inscrit — en recherche",
  INSCRIT_ALTERNANCE:    "Inscrit — alternance",
  ABANDON:               "Abandon",
  NON_RETENU:            "Non retenu",
  INVALIDE:              "Invalide",
}

const ETAPE_LABELS: Record<EtapeEtudiant, string> = {
  NOUVEAU:           "Nouveau",
  CONTACTE:          "Contacté",
  RDV0_PLANIFIE:     "RDV0 planifié",
  RDV0_FAIT:         "RDV0 fait",
  RDV1_PLANIFIE:     "RDV1 planifié",
  RDV1_FAIT:         "RDV1 fait",
  RDV2_PLANIFIE:     "RDV2 planifié",
  RDV2_FAIT:         "RDV2 fait",
  DOSSIER_EN_COURS:  "Dossier en cours",
  INSCRIT:           "Inscrit",
}

export function CreateEtudiantForm({
  formations,
  users,
  entreprises,
}: {
  formations: Formation[]
  users: User[]
  entreprises: Entreprise[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    creerEtudiant,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
          <input
            name="prenom"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
          <input
            name="nom"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            name="email"
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
          <input
            name="telephone"
            type="tel"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
        <input
          name="ville"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Formation</label>
        <select
          name="formation_id"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">— Aucune</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select
            name="statut"
            defaultValue="EN_COURS"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {(Object.keys(STATUT_LABELS) as StatutEtudiant[]).map((v) => (
              <option key={v} value={v}>{STATUT_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Étape</label>
          <select
            name="etape_process"
            defaultValue="NOUVEAU"
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {(Object.keys(ETAPE_LABELS) as EtapeEtudiant[]).map((v) => (
              <option key={v} value={v}>{ETAPE_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Conseiller</label>
        <select
          name="conseiller_id"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">— Non assigné</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Entreprise liée</label>
        <select
          name="entreprise_liee_id"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">— Aucune</option>
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}{e.ville ? ` — ${e.ville}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Création…" : "Créer l'étudiant"}
        </button>
        <Link href="/etudiants" className="text-sm text-gray-500 hover:text-gray-800">
          Annuler
        </Link>
      </div>
    </form>
  )
}
