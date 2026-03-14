import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { EtapeEtudiant, StatutEtudiant, StatutRDV, TypeRDV } from "@prisma/client"
import { StatutForm, NoteEtudiantForm, RDVForm } from "./forms"

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

const STATUT_RDV_COLORS: Record<StatutRDV, string> = {
  PLANIFIE: "bg-blue-100 text-blue-700",
  FAIT:     "bg-green-100 text-green-700",
  ANNULE:   "bg-gray-100 text-gray-500",
  NO_SHOW:  "bg-red-100 text-red-600",
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  )
}

export default async function EtudiantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const etudiant = await prisma.etudiant.findUnique({
    where: { id, deleted_at: null },
    include: {
      formation:       true,
      conseiller:      { select: { prenom: true, nom: true, email: true } },
      entreprise_liee: { select: { id: true, nom: true, ville: true } },
      rdvs:            { orderBy: { numero_rdv: "asc" } },
      notes: {
        orderBy: { created_at: "desc" },
        take: 10,
        include: { auteur: { select: { prenom: true, nom: true } } },
      },
    },
  })

  if (!etudiant) notFound()

  const dateNaissance = etudiant.date_naissance
    ? new Date(etudiant.date_naissance).toLocaleDateString("fr-FR")
    : null

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/etudiants" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">
            {etudiant.prenom} {etudiant.nom}
          </h1>
          {etudiant.formation && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded self-center">
              {etudiant.formation.code}
            </span>
          )}
        </div>
        <StatutForm
          etudiantId={etudiant.id}
          statut={etudiant.statut}
          etape={etudiant.etape_process}
        />
      </div>

      <div className="space-y-5">
        {/* Identité */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Identité</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Email" value={etudiant.email} />
            <Field label="Téléphone" value={etudiant.telephone} />
            <Field label="Date de naissance" value={dateNaissance} />
            <Field label="Ville" value={etudiant.ville} />
            <Field label="Adresse" value={etudiant.adresse} />
            <Field label="Sexe" value={etudiant.sexe} />
            <Field label="Permis" value={etudiant.permis === true ? "Oui" : etudiant.permis === false ? "Non" : null} />
            <Field label="Véhicule" value={etudiant.vehicule === true ? "Oui" : etudiant.vehicule === false ? "Non" : null} />
            <Field
              label="Situation handicap"
              value={
                etudiant.situation_handicap === true  ? "Oui"
                : etudiant.situation_handicap === false ? "Non"
                : "Non renseigné"
              }
            />
          </dl>
        </section>

        {/* Infos commerciales */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Infos commerciales</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Formation visée" value={etudiant.formation?.nom} />
            <Field label="Type contrat" value={etudiant.type_contrat} />
            <Field label="Diplôme actuel" value={etudiant.diplome_actuel} />
            <Field label="Formation actuelle" value={etudiant.formation_actuelle} />
            <Field label="Spécialisation" value={etudiant.specialisation} />
            <Field label="Origine contact" value={etudiant.origine_contact} />
            <Field label="Niveau motivation" value={etudiant.niveau_motivation} />
            <Field label="Niveau test" value={etudiant.niveau_test} />
            <Field label="Campagne" value={etudiant.campagne} />
            <Field
              label="Prochaine relance"
              value={
                etudiant.date_prochaine_relance
                  ? new Date(etudiant.date_prochaine_relance).toLocaleDateString("fr-FR")
                  : null
              }
            />
            <Field label="Note relance" value={etudiant.note_prochaine_relance} />
          </dl>
        </section>

        {/* Suivi */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Suivi</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label="Conseiller"
              value={
                etudiant.conseiller
                  ? `${etudiant.conseiller.prenom} ${etudiant.conseiller.nom}`
                  : null
              }
            />
            <Field
              label="Entreprise liée"
              value={
                etudiant.entreprise_liee ? (
                  <Link
                    href={`/entreprises/${etudiant.entreprise_liee.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {etudiant.entreprise_liee.nom}
                    {etudiant.entreprise_liee.ville ? ` — ${etudiant.entreprise_liee.ville}` : ""}
                  </Link>
                ) : null
              }
            />
          </dl>
          {etudiant.commentaire && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Commentaire</p>
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3">
                {etudiant.commentaire}
              </p>
            </div>
          )}
        </section>

        {/* RDVs */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Rendez-vous {etudiant.rdvs.length > 0 && `(${etudiant.rdvs.length})`}
          </h2>
          {etudiant.rdvs.length > 0 && (
            <div className="divide-y divide-gray-100">
              {etudiant.rdvs.map((rdv) => (
                <div key={rdv.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">
                      {rdv.numero_rdv ? `RDV #${rdv.numero_rdv} — ` : ""}
                      {TYPE_RDV_LABELS[rdv.type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUT_RDV_COLORS[rdv.statut]}`}>
                      {STATUT_RDV_LABELS[rdv.statut]}
                    </span>
                  </div>
                  {rdv.date && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(rdv.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {rdv.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">{rdv.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <RDVForm etudiantId={etudiant.id} />
        </section>

        {/* Notes */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Notes {etudiant.notes.length > 0 && `(${etudiant.notes.length})`}
          </h2>
          {etudiant.notes.length > 0 && (
            <div className="divide-y divide-gray-100 mb-2">
              {etudiant.notes.map((note) => (
                <div key={note.id} className="py-3 first:pt-0">
                  <p className="text-sm text-gray-800 whitespace-pre-line">{note.contenu}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {note.auteur ? `${note.auteur.prenom} ${note.auteur.nom} · ` : ""}
                    {new Date(note.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <NoteEtudiantForm etudiantId={etudiant.id} />
        </section>
      </div>
    </div>
  )
}
