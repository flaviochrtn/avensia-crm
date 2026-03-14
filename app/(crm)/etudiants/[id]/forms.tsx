"use client"

import { useActionState, useEffect, useRef, useTransition } from "react"
import {
  changerStatutEtudiant, ajouterNoteEtudiant, creerRDV,
  modifierEtudiant, supprimerRDV,
  creerHistoriqueAlternance, supprimerHistoriqueAlternance,
} from "./actions"
import {
  EtapeEtudiant, StatutEtudiant, TypeRDV, StatutRDV,
  Sexe, TypeContrat, OrigineContact, StatutAlternance,
} from "@prisma/client"

type ActionState = { error: string | null; success?: boolean }

// ─── Labels ───────────────────────────────────────────────────────────────────

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

// Helper : formate une Date pour <input type="date">
function toDateInput(d: Date | null): string {
  if (!d) return ""
  return new Date(d).toISOString().split("T")[0]
}

// Helper : formate un booléen nullable pour un select tri-état
function toBoolSelect(v: boolean | null): string {
  if (v === true) return "true"
  if (v === false) return "false"
  return ""
}

const INPUT = "w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
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
        <select name="etape_process" defaultValue={etape} className={INPUT}>
          {(Object.keys(ETAPE_LABELS) as EtapeEtudiant[]).map((val) => (
            <option key={val} value={val}>{ETAPE_LABELS[val]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Statut</label>
        <select name="statut" defaultValue={statut} className={INPUT}>
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
          <select name="type" required className={INPUT}>
            {(Object.keys(TYPE_RDV_LABELS) as TypeRDV[]).map((val) => (
              <option key={val} value={val}>{TYPE_RDV_LABELS[val]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select name="statut" defaultValue="PLANIFIE" className={INPUT}>
            {(Object.keys(STATUT_RDV_LABELS) as StatutRDV[]).map((val) => (
              <option key={val} value={val}>{STATUT_RDV_LABELS[val]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Date (optionnelle)</label>
          <input name="date" type="datetime-local" className={INPUT} />
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

// ─── Supprimer un RDV ─────────────────────────────────────────────────────────

export function DeleteRdvButton({
  rdvId,
  etudiantId,
}: {
  rdvId: string
  etudiantId: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Supprimer ce rendez-vous ?")) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("rdv_id", rdvId)
      fd.append("etudiant_id", etudiantId)
      await supprimerRDV(fd)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 transition-colors"
    >
      {isPending ? "…" : "Supprimer"}
    </button>
  )
}

// ─── Éditer un étudiant (champs complets) ─────────────────────────────────────

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
    date_naissance: Date | null
    sexe: Sexe | null
    adresse: string | null
    ville: string | null
    permis: boolean | null
    vehicule: boolean | null
    situation_handicap: boolean | null
    formation_id: string | null
    type_contrat: TypeContrat | null
    diplome_actuel: string | null
    formation_actuelle: string | null
    specialisation: string | null
    etape_process: EtapeEtudiant
    statut: StatutEtudiant
    niveau_motivation: number | null
    niveau_test: string | null
    niveau_cours: string | null
    origine_contact: OrigineContact | null
    statut_motivation: string | null
    campagne: string | null
    apporteur_nom: string | null
    conseiller_id: string | null
    entreprise_liee_id: string | null
    date_premier_contact: Date | null
    date_prochaine_relance: Date | null
    note_prochaine_relance: string | null
    pack_suivi_alternance: string | null
    cv_url: string | null
    commentaire: string | null
    date_entree_formation: Date | null
    date_sortie_formation: Date | null
    date_rentree_officielle: Date | null
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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="etudiant_id" value={etudiant.id} />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Identité */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Identité</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prénom *</Label>
            <input name="prenom" required defaultValue={etudiant.prenom} className={INPUT} />
          </div>
          <div>
            <Label>Nom *</Label>
            <input name="nom" required defaultValue={etudiant.nom} className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <input name="email" type="email" defaultValue={etudiant.email ?? ""} className={INPUT} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <input name="telephone" type="tel" defaultValue={etudiant.telephone ?? ""} className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date de naissance</Label>
            <input name="date_naissance" type="date" defaultValue={toDateInput(etudiant.date_naissance)} className={INPUT} />
          </div>
          <div>
            <Label>Sexe</Label>
            <select name="sexe" defaultValue={etudiant.sexe ?? ""} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Adresse</Label>
          <input name="adresse" defaultValue={etudiant.adresse ?? ""} className={INPUT} />
        </div>

        <div>
          <Label>Ville</Label>
          <input name="ville" defaultValue={etudiant.ville ?? ""} className={INPUT} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Permis</Label>
            <select name="permis" defaultValue={toBoolSelect(etudiant.permis)} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
          <div>
            <Label>Véhicule</Label>
            <select name="vehicule" defaultValue={toBoolSelect(etudiant.vehicule)} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
          <div>
            <Label>Situation handicap</Label>
            <select name="situation_handicap" defaultValue={toBoolSelect(etudiant.situation_handicap)} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
        </div>
      </section>

      {/* Formation & Contrat */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Formation & Contrat</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Formation visée</Label>
            <select name="formation_id" defaultValue={etudiant.formation_id ?? ""} className={INPUT}>
              <option value="">— Aucune</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Type de contrat</Label>
            <select name="type_contrat" defaultValue={etudiant.type_contrat ?? ""} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="APPRENTISSAGE">Apprentissage</option>
              <option value="PROFESSIONNALISATION">Professionnalisation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Diplôme actuel</Label>
            <input name="diplome_actuel" defaultValue={etudiant.diplome_actuel ?? ""} className={INPUT} />
          </div>
          <div>
            <Label>Formation actuelle</Label>
            <input name="formation_actuelle" defaultValue={etudiant.formation_actuelle ?? ""} className={INPUT} />
          </div>
        </div>

        <div>
          <Label>Spécialisation</Label>
          <input name="specialisation" defaultValue={etudiant.specialisation ?? ""} className={INPUT} />
        </div>
      </section>

      {/* Suivi commercial */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Suivi commercial</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Étape *</Label>
            <select name="etape_process" defaultValue={etudiant.etape_process} className={INPUT}>
              {(Object.keys(ETAPE_LABELS) as EtapeEtudiant[]).map((v) => (
                <option key={v} value={v}>{ETAPE_LABELS[v]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Statut *</Label>
            <select name="statut" defaultValue={etudiant.statut} className={INPUT}>
              {(Object.keys(STATUT_LABELS) as StatutEtudiant[]).map((v) => (
                <option key={v} value={v}>{STATUT_LABELS[v]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Niveau motivation (1-10)</Label>
            <input
              name="niveau_motivation"
              type="number"
              min={1}
              max={10}
              defaultValue={etudiant.niveau_motivation ?? ""}
              className={INPUT}
            />
          </div>
          <div>
            <Label>Niveau test</Label>
            <input name="niveau_test" defaultValue={etudiant.niveau_test ?? ""} className={INPUT} />
          </div>
          <div>
            <Label>Niveau cours</Label>
            <input name="niveau_cours" defaultValue={etudiant.niveau_cours ?? ""} className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Origine contact</Label>
            <select name="origine_contact" defaultValue={etudiant.origine_contact ?? ""} className={INPUT}>
              <option value="">— Non renseigné</option>
              <option value="SALON_ETUDIANT">Salon étudiant</option>
              <option value="BOUCHE_A_OREILLE">Bouche à oreille</option>
              <option value="JPO">JPO</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="GOOGLE">Google</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="PARTENAIRE">Partenaire</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <Label>Statut motivation</Label>
            <input name="statut_motivation" defaultValue={etudiant.statut_motivation ?? ""} className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Campagne</Label>
            <input name="campagne" defaultValue={etudiant.campagne ?? ""} className={INPUT} />
          </div>
          <div>
            <Label>Apporteur</Label>
            <input name="apporteur_nom" defaultValue={etudiant.apporteur_nom ?? ""} className={INPUT} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Premier contact</Label>
            <input name="date_premier_contact" type="date" defaultValue={toDateInput(etudiant.date_premier_contact)} className={INPUT} />
          </div>
          <div>
            <Label>Prochaine relance</Label>
            <input name="date_prochaine_relance" type="date" defaultValue={toDateInput(etudiant.date_prochaine_relance)} className={INPUT} />
          </div>
        </div>

        <div>
          <Label>Note relance</Label>
          <input name="note_prochaine_relance" defaultValue={etudiant.note_prochaine_relance ?? ""} className={INPUT} />
        </div>
      </section>

      {/* Affectation */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Affectation</h2>

        <div>
          <Label>Conseiller</Label>
          <select name="conseiller_id" defaultValue={etudiant.conseiller_id ?? ""} className={INPUT}>
            <option value="">— Non assigné</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Entreprise liée</Label>
          <select name="entreprise_liee_id" defaultValue={etudiant.entreprise_liee_id ?? ""} className={INPUT}>
            <option value="">— Aucune</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}{e.ville ? ` — ${e.ville}` : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Parcours formation */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Parcours formation</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Date d&apos;entrée en formation</Label>
            <input name="date_entree_formation" type="date" defaultValue={toDateInput(etudiant.date_entree_formation)} className={INPUT} />
          </div>
          <div>
            <Label>Date de sortie</Label>
            <input name="date_sortie_formation" type="date" defaultValue={toDateInput(etudiant.date_sortie_formation)} className={INPUT} />
          </div>
          <div>
            <Label>Date rentrée officielle</Label>
            <input name="date_rentree_officielle" type="date" defaultValue={toDateInput(etudiant.date_rentree_officielle)} className={INPUT} />
          </div>
        </div>
      </section>

      {/* Divers */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Divers</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Pack suivi alternance</Label>
            <input name="pack_suivi_alternance" defaultValue={etudiant.pack_suivi_alternance ?? ""} className={INPUT} />
          </div>
          <div>
            <Label>CV URL</Label>
            <input name="cv_url" type="url" defaultValue={etudiant.cv_url ?? ""} className={INPUT} />
          </div>
        </div>

        <div>
          <Label>Commentaire</Label>
          <textarea
            name="commentaire"
            rows={4}
            defaultValue={etudiant.commentaire ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-y"
          />
        </div>
      </section>

      <div className="flex items-center gap-3 pb-6">
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

// ─── Ajouter un contrat d'alternance ─────────────────────────────────────────

type EntrepriseOption = { id: string; nom: string; ville: string | null }

const STATUT_ALT_LABELS: Record<StatutAlternance, string> = {
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ROMPUE:   "Rompue",
  ANNULEE:  "Annulée",
}

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  APPRENTISSAGE:      "Apprentissage",
  PROFESSIONNALISATION: "Professionnalisation",
}

export function AlternanceForm({
  etudiantId,
  entreprises,
}: {
  etudiantId: string
  entreprises: EntrepriseOption[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    creerHistoriqueAlternance,
    { error: null }
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nouveau contrat</p>
      <input type="hidden" name="etudiant_id" value={etudiantId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Entreprise (sélection)</label>
          <select name="entreprise_id" className={INPUT}>
            <option value="">— Aucune</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>{e.nom}{e.ville ? ` — ${e.ville}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ou nom libre</label>
          <input name="nom_entreprise_libre" placeholder="Nom de l'entreprise…" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type contrat</label>
          <select name="type_contrat" className={INPUT}>
            <option value="">— Non renseigné</option>
            {(Object.keys(TYPE_CONTRAT_LABELS) as TypeContrat[]).map((v) => (
              <option key={v} value={v}>{TYPE_CONTRAT_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Poste</label>
          <input name="poste" placeholder="Intitulé du poste…" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Début contrat</label>
          <input name="date_debut_contrat" type="date" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fin contrat</label>
          <input name="date_fin_contrat" type="date" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select name="statut" defaultValue="EN_COURS" className={INPUT}>
            {(Object.keys(STATUT_ALT_LABELS) as StatutAlternance[]).map((v) => (
              <option key={v} value={v}>{STATUT_ALT_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date rupture</label>
          <input name="date_rupture" type="date" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Motif rupture</label>
          <input name="motif_rupture" placeholder="Motif…" className={INPUT} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Commentaire</label>
        <textarea
          name="commentaire"
          rows={2}
          placeholder="Observations…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Enregistrement…" : "Ajouter le contrat"}
        </button>
        {state.success && <span className="text-sm text-green-600">Contrat ajouté</span>}
        {state.error   && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

// ─── Supprimer un contrat ─────────────────────────────────────────────────────

export function DeleteAlternanceButton({
  alternanceId,
  etudiantId,
}: {
  alternanceId: string
  etudiantId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Supprimer ce contrat ?")) return
        const fd = new FormData()
        fd.append("alternance_id", alternanceId)
        fd.append("etudiant_id", etudiantId)
        startTransition(() => supprimerHistoriqueAlternance(fd))
      }}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Supprimer"}
    </button>
  )
}
