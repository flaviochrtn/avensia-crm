import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { StatutEntreprise, StatutEtudiant } from "@prisma/client"

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

const STATUT_COLORS: Record<StatutEntreprise, string> = {
  NOUVEAU:          "bg-gray-100 text-gray-600",
  A_CONTACTER:      "bg-yellow-50 text-yellow-700",
  CONTACTE:         "bg-blue-100 text-blue-700",
  QUALIFIE:         "bg-indigo-100 text-indigo-700",
  BESOIN_OUVERT:    "bg-orange-100 text-orange-700",
  RDV_PLANIFIE:     "bg-purple-100 text-purple-700",
  PARTENAIRE_ACTIF: "bg-green-100 text-green-700",
  AUCUN_BESOIN:     "bg-gray-100 text-gray-400",
  PERDU:            "bg-red-100 text-red-600",
}

const STATUT_ETUDIANT_LABELS: Record<StatutEtudiant, string> = {
  EN_COURS:              "En cours",
  INSCRIT_EN_RECHERCHE:  "Inscrit — recherche",
  INSCRIT_ALTERNANCE:    "Inscrit — alternance",
  ABANDON:               "Abandon",
  NON_RETENU:            "Non retenu",
  INVALIDE:              "Invalide",
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  )
}

export default async function EntrepriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const entreprise = await prisma.entreprise.findUnique({
    where: { id, deleted_at: null },
    include: {
      responsable:    { select: { prenom: true, nom: true, email: true } },
      contacts:       { orderBy: { nom_complet: "asc" } },
      etudiants_lies: {
        where: { deleted_at: null },
        select: { id: true, prenom: true, nom: true, statut: true, formation: { select: { code: true } } },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      },
      notes: {
        orderBy: { created_at: "desc" },
        take: 10,
        include: { auteur: { select: { prenom: true, nom: true } } },
      },
    },
  })

  if (!entreprise) notFound()

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/entreprises" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{entreprise.nom}</h1>
        <div className="flex gap-2 mt-1 flex-wrap items-center">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUT_COLORS[entreprise.statut]}`}>
            {STATUT_LABELS[entreprise.statut]}
          </span>
          {entreprise.ville && (
            <span className="text-xs text-gray-500">{entreprise.ville}</span>
          )}
          {!entreprise.responsable && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
              Sans responsable
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Identité */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Identité</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Secteur"        value={entreprise.secteur} />
            <Field label="Type structure" value={entreprise.type_structure} />
            <Field label="Ville"          value={entreprise.ville} />
            <Field label="Adresse"        value={entreprise.adresse} />
            <Field label="Téléphone"      value={entreprise.telephone} />
            <Field label="Email"          value={entreprise.email_general} />
            <Field
              label="Site web"
              value={
                entreprise.site_web ? (
                  <a href={entreprise.site_web} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    {entreprise.site_web}
                  </a>
                ) : null
              }
            />
            <Field label="N° IDCC"        value={entreprise.numero_idcc} />
            <Field label="Campagne"       value={entreprise.campagne} />
          </dl>
        </section>

        {/* Suivi commercial */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Suivi commercial</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label="Responsable"
              value={
                entreprise.responsable
                  ? `${entreprise.responsable.prenom} ${entreprise.responsable.nom}`
                  : <span className="text-orange-600 font-medium">Non assigné</span>
              }
            />
            <Field
              label="Besoin alternant"
              value={
                entreprise.besoin_alternant === true  ? "Oui"
                : entreprise.besoin_alternant === false ? "Non"
                : null
              }
            />
            <Field label="Nombre postes" value={entreprise.nombre_postes > 0 ? entreprise.nombre_postes : null} />
            <Field label="Formations recherchées" value={entreprise.formations_recherchees} />
            <Field label="Profil recherché"       value={entreprise.profil_recherche} />
            <Field
              label="Premier contact"
              value={
                entreprise.date_premier_contact
                  ? new Date(entreprise.date_premier_contact).toLocaleDateString("fr-FR")
                  : null
              }
            />
            <Field
              label="Prochaine relance"
              value={
                entreprise.date_prochaine_relance
                  ? new Date(entreprise.date_prochaine_relance).toLocaleDateString("fr-FR")
                  : null
              }
            />
          </dl>
          {entreprise.commentaire && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Commentaire</p>
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3">
                {entreprise.commentaire}
              </p>
            </div>
          )}
        </section>

        {/* Contacts */}
        {entreprise.contacts.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Contacts ({entreprise.contacts.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {entreprise.contacts.map((c) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex gap-6 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.nom_complet}
                      {c.decideur && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                          Décideur
                        </span>
                      )}
                    </p>
                    {c.poste && <p className="text-xs text-gray-500">{c.poste}</p>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600 flex-wrap items-center">
                    {c.email && <span>{c.email}</span>}
                    {c.telephone && <span>{c.telephone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Étudiants liés */}
        {entreprise.etudiants_lies.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Étudiants liés ({entreprise.etudiants_lies.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {entreprise.etudiants_lies.map((e) => (
                <div key={e.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <Link
                    href={`/etudiants/${e.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {e.prenom} {e.nom}
                  </Link>
                  <div className="flex gap-2 items-center">
                    {e.formation && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {e.formation.code}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {STATUT_ETUDIANT_LABELS[e.statut]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {entreprise.notes.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Notes ({entreprise.notes.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {entreprise.notes.map((note) => (
                <div key={note.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-gray-800 whitespace-pre-line">{note.contenu}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {note.auteur ? `${note.auteur.prenom} ${note.auteur.nom} · ` : ""}
                    {new Date(note.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
