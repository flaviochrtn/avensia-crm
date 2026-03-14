import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  EtapeEtudiant,
  StatutEtudiant,
  Prisma,
} from "@prisma/client"

const PAGE_SIZE = 30

// Libellés lisibles
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

const STATUT_COLORS: Record<StatutEtudiant, string> = {
  EN_COURS:              "bg-blue-100 text-blue-800",
  INSCRIT_EN_RECHERCHE:  "bg-yellow-100 text-yellow-800",
  INSCRIT_ALTERNANCE:    "bg-green-100 text-green-800",
  ABANDON:               "bg-gray-100 text-gray-600",
  NON_RETENU:            "bg-red-100 text-red-700",
  INVALIDE:              "bg-red-50 text-red-400",
}

type SearchParams = Promise<{
  q?: string
  statut?: string
  etape?: string
  conseiller_id?: string
  page?: string
}>

export default async function EtudiantsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const q            = params.q?.trim() ?? ""
  const statut       = params.statut as StatutEtudiant | undefined
  const etape        = params.etape as EtapeEtudiant | undefined
  const conseiller_id = params.conseiller_id ?? ""
  const page         = Math.max(1, parseInt(params.page ?? "1", 10))
  const skip         = (page - 1) * PAGE_SIZE

  // Filtres Prisma
  const where: Prisma.EtudiantWhereInput = {
    deleted_at: null,
    ...(q && {
      OR: [
        { prenom: { contains: q, mode: "insensitive" } },
        { nom:    { contains: q, mode: "insensitive" } },
        { email:  { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(statut && { statut }),
    ...(etape  && { etape_process: etape }),
    ...(conseiller_id && { conseiller_id }),
  }

  const [etudiants, total, conseillers] = await Promise.all([
    prisma.etudiant.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      select: {
        id:            true,
        prenom:        true,
        nom:           true,
        email:         true,
        telephone:     true,
        etape_process: true,
        statut:        true,
        formation:     { select: { code: true } },
        conseiller:    { select: { id: true, prenom: true, nom: true } },
      },
    }),
    prisma.etudiant.count({ where }),
    prisma.user.findMany({
      select: { id: true, prenom: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Helpers pour conserver les autres params lors de la pagination
  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (q)            sp.set("q", q)
    if (statut)       sp.set("statut", statut)
    if (etape)        sp.set("etape", etape)
    if (conseiller_id) sp.set("conseiller_id", conseiller_id)
    sp.set("page", String(p))
    return `/etudiants?${sp.toString()}`
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Étudiants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} résultat{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap gap-3 mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Recherche nom, prénom, email…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <select
          name="statut"
          defaultValue={statut ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          name="etape"
          defaultValue={etape ?? ""}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">Toutes les étapes</option>
          {Object.entries(ETAPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          name="conseiller_id"
          defaultValue={conseiller_id}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">Tous les conseillers</option>
          {conseillers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
        >
          Filtrer
        </button>

        {(q || statut || etape || conseiller_id) && (
          <Link
            href="/etudiants"
            className="text-sm text-gray-500 hover:text-gray-800 py-1.5 px-2"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Téléphone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Formation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Étape</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Conseiller</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {etudiants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucun étudiant trouvé
                </td>
              </tr>
            )}
            {etudiants.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/etudiants/${e.id}`} className="hover:underline">
                    {e.prenom} {e.nom}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{e.telephone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{e.formation?.code ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {ETAPE_LABELS[e.etape_process]}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUT_COLORS[e.statut]}`}>
                    {STATUT_LABELS[e.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.conseiller ? `${e.conseiller.prenom} ${e.conseiller.nom}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm text-gray-600">
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100">
              ← Précédent
            </Link>
          ) : (
            <span className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-300">← Précédent</span>
          )}
          <span>Page {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageUrl(page + 1)} className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100">
              Suivant →
            </Link>
          ) : (
            <span className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-300">Suivant →</span>
          )}
        </div>
      )}
    </div>
  )
}
