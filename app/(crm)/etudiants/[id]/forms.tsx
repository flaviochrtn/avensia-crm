"use client"

import { useActionState, useEffect, useRef } from "react"
import { changerStatutEtudiant, ajouterNoteEtudiant, creerRDV, modifierEtudiant } from "./actions"
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

// ─── Éditer un étudiant ───────────────────────────────────────────────────────

type Formation  = { id: string; code: string; nom: string }
type User       = { id: string; prenom: string; nom: string }
type Entreprise = { id: string; nom: string; ville: string | null }

export function EditEtudiantForm({
  etudiant,
  formations,
  users,
  entreprises,
}: {
  etudiant: {
    id: string
    prenom: string
    nom: string
    email: string | null
    telephone: string | null
    ville: string | null
    formation_id: string | null
    statut: StatutEtudiant
    etape_process: EtapeEtudiant
    conseiller_id: string | null
    entreprise_liee_id: string | null
  }
  formations: Formation[]
  users: User[]
  entreprises: Entreprise[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    modifierEtudiant,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="etudiant_id" value={etudiant.id} />

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
            defaultValue={etudiant.prenom}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
          <input
            name="nom"
            required
            defaultValue={etudiant.nom}
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
            defaultValue={etudiant.email ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
          <input
            name="telephone"
            type="tel"
            defaultValue={etudiant.telephone ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
        <input
          name="ville"
          defaultValue={etudiant.ville ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Formation</label>
        <select
          name="formation_id"
          defaultValue={etudiant.formation_id ?? ""}
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
            defaultValue={etudiant.statut}
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
            defaultValue={etudiant.etape_process}
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
          defaultValue={etudiant.conseiller_id ?? ""}
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
          defaultValue={etudiant.entreprise_liee_id ?? ""}
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
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  )
}
