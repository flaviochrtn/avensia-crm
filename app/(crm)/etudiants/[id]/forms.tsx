"use client"

import { useActionState, useEffect, useRef } from "react"
import { changerStatutEtudiant, ajouterNoteEtudiant, creerRDV } from "./actions"
import { EtapeEtudiant, StatutEtudiant, TypeRDV, StatutRDV } from "@prisma/client"

type ActionState = { error: string | null; success?: boolean }

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

const STATUT_LABELS: Record<StatutEtudiant, string> = {
  EN_COURS:              "En cours",
  INSCRIT_EN_RECHERCHE:  "Inscrit — en recherche",
  INSCRIT_ALTERNANCE:    "Inscrit — alternance",
  ABANDON:               "Abandon",
  NON_RETENU:            "Non retenu",
  INVALIDE:              "Invalide",
}

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

// ─── Changer statut / étape ───────────────────────────────────────────────────

export function StatutForm({
  etudiantId,
  statut,
  etape,
}: {
  etudiantId: string
  statut: StatutEtudiant
  etape: EtapeEtudiant
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changerStatutEtudiant,
    { error: null }
  )

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 mt-3">
      <input type="hidden" name="etudiant_id" value={etudiantId} />

      <div>
        <label className="block text-xs text-gray-500 mb-1">Étape</label>
        <select
          name="etape_process"
          defaultValue={etape}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {(Object.keys(ETAPE_LABELS) as EtapeEtudiant[]).map((val) => (
            <option key={val} value={val}>{ETAPE_LABELS[val]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Statut</label>
        <select
          name="statut"
          defaultValue={statut}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {(Object.keys(STATUT_LABELS) as StatutEtudiant[]).map((val) => (
            <option key={val} value={val}>{STATUT_LABELS[val]}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? "…" : "Enregistrer"}
      </button>

      {state.success && <span className="text-sm text-green-600">Mis à jour</span>}
      {state.error   && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  )
}

// ─── Ajouter une note ─────────────────────────────────────────────────────────

export function NoteEtudiantForm({ etudiantId }: { etudiantId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    ajouterNoteEtudiant,
    { error: null }
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="etudiant_id" value={etudiantId} />
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
        {state.success && <span className="text-sm text-green-600">Note ajoutée</span>}
        {state.error   && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

// ─── Créer un RDV ─────────────────────────────────────────────────────────────

export function RDVForm({ etudiantId }: { etudiantId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    creerRDV,
    { error: null }
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nouveau RDV</p>
      <input type="hidden" name="etudiant_id" value={etudiantId} />

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            name="type"
            required
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {(Object.keys(TYPE_RDV_LABELS) as TypeRDV[]).map((val) => (
              <option key={val} value={val}>{TYPE_RDV_LABELS[val]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select
            name="statut"
            defaultValue="PLANIFIE"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {(Object.keys(STATUT_RDV_LABELS) as StatutRDV[]).map((val) => (
              <option key={val} value={val}>{STATUT_RDV_LABELS[val]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Date (optionnelle)</label>
          <input
            name="date"
            type="datetime-local"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes (optionnelles)</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Observations, compte-rendu…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Enregistrement…" : "Créer le RDV"}
        </button>
        {state.success && <span className="text-sm text-green-600">RDV créé</span>}
        {state.error   && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}
