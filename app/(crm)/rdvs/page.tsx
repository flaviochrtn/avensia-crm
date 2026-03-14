import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { TypeRDV } from "@prisma/client"

const TYPE_RDV_LABELS: Record<TypeRDV, string> = {
  APPEL:                "Appel",
  ENTRETIEN_ADMISSION:  "Entretien d'admission",
  TEST_POSITIONNEMENT:  "Test de positionnement",
  RDV_PHYSIQUE:         "RDV physique",
  ENTRETIEN_ENTREPRISE: "Entretien entreprise",
  AUTRE:                "Autre",
}

export default async function RdvsPage() {
  const now = new Date()

  const rdvs = await prisma.rendezVous.findMany({
    where: {
      statut: "PLANIFIE",
      date:   { not: null, gt: now },
    },
    orderBy: { date: "asc" },
    include: {
      etudiant:   { select: { id: true, prenom: true, nom: true } },
      entreprise: { select: { id: true, nom: true, ville: true } },
      animateur:  { select: { prenom: true, nom: true } },
    },
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">RDVs à venir</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {rdvs.length} rendez-vous{rdvs.length !== 1 ? "" : ""}
        </p>
      </div>

      {rdvs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-10 text-center text-sm text-gray-400">
          Aucun rendez-vous planifié à venir
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Heure</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Étudiant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Entreprise</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Animateur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rdvs.map((rdv) => {
                const date = rdv.date!
                const dateStr = date.toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day:     "numeric",
                  month:   "short",
                })
                const heureStr = date.toLocaleTimeString("fr-FR", {
                  hour:   "2-digit",
                  minute: "2-digit",
                })

                return (
                  <tr key={rdv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {heureStr}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {TYPE_RDV_LABELS[rdv.type]}
                    </td>
                    <td className="px-4 py-3">
                      {rdv.etudiant ? (
                        <Link
                          href={`/etudiants/${rdv.etudiant.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {rdv.etudiant.prenom} {rdv.etudiant.nom}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rdv.entreprise ? (
                        <Link
                          href={`/entreprises/${rdv.entreprise.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {rdv.entreprise.nom}
                          {rdv.entreprise.ville ? (
                            <span className="text-gray-400 font-normal"> — {rdv.entreprise.ville}</span>
                          ) : null}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {rdv.animateur
                        ? `${rdv.animateur.prenom} ${rdv.animateur.nom}`
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {rdv.notes ?? "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
