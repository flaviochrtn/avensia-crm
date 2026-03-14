import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { StatutEntreprise, Prisma } from "@prisma/client"
import { AssignResponsableSelect } from "./AssignSelect"

const PAGE_SIZE = 30

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

type SearchParams = Promise<{
  q?: string
  statut?: string
  ville?: string
  responsable_id?: string
  page?: string
}>

export default async function EntreprisesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params        = await searchParams
  const q             = params.q?.trim() ?? ""
  const statut        = params.statut as StatutEntreprise | undefined
  const ville         = params.ville?.trim() ?? ""
  const responsable_id = params.responsable_id ?? ""
  const page          = Math.max(1, parseInt(params.page ?? "1", 10))
  const skip          = (page - 1) * PAGE_SIZE

  const where: Prisma.EntrepriseWhereInput = {
    deleted_at: null,
    ...(q && {
      OR: [
        { nom:     { contains: q, mode: "insensitive" } },
        { secteur: { contains: q, mode: "insensitive" } },
        { ville:   { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(statut          && { statut }),
    ...(ville           && { ville: { contains: ville, mode: "insensitive" } }),
    ...(responsable_id === "none"
      ? { responsable_id: null }
      : responsable_id
      ? { responsable_id }
      : {}),
  }

  const [entreprises, total, villes, responsables] = await Promise.all([
    prisma.entreprise.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { nom: "asc" },
      select: {
        id:             true,
        nom:            true,
        ville:          true,
        secteur:        true,
        statut:         true,
        responsable:    { select: { id: true, prenom: true, nom: true } },
        _count:         { select: { contacts: true } },
      },
    }),
    prisma.entreprise.count({ where }),
    // Villes distinctes pour le filtre
    prisma.entreprise.findMany({
      where: { deleted_at: null, ville: { not: null } },
      select: { ville: true },
      distinct: ["ville"],
      orderBy: { ville: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, prenom: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (q)              sp.set("q", q)
    if (statut)         sp.set("statut", statut)
    if (ville)          sp.set("ville", ville)
    if (responsable_id) sp.set("responsable_id", responsable_id)
    sp.set("page", String(p))
    return `/entreprises?${sp.toString()}`
  }

  const sansResponsable = entreprises.filter((e) => !e.responsable).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Entreprises</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} résultat{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Alerte sans responsable */}
      {!responsable_id && sansResponsable > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800 flex items-center justify-between">
          <span>
            <strong>{sansResponsable}</strong> entreprise{sansResponsable > 1 ? "s" : ""} sans responsable sur cette page
          </span>
          <Link
            href="/entreprises?responsable_id=none"
            className="text-orange-700 underline hover:text-orange-900 text-xs ml-4 shrink-0"
          >
            Voir toutes →
          </Link>
        </div>
      )}

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap gap-3 mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Recherche nom, secteur, ville…"
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
          name="ville"
          defaultValue={ville}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v.ville} value={v.ville ?? ""}>{v.ville}</option>
          ))}
        </select>

        <select
          name="responsable_id"
          defaultValue={responsable_id}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">Tous les responsables</option>
          <option value="none">— Sans responsable</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>
              {r.prenom} {r.nom}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
        >
          Filtrer
        </button>

        {(q || statut || ville || responsable_id) && (
          <Link
            href="/entreprises"
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Secteur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Responsable</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contacts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entreprises.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucune entreprise trouvée
                </td>
              </tr>
            )}
            {entreprises.map((e) => (
              <tr
                key={e.id}
                className={`hover:bg-gray-50 transition-colors ${!e.responsable ? "bg-orange-50/40" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/entreprises/${e.id}`} className="hover:underline">
                    {e.nom}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.ville ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{e.secteur ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUT_COLORS[e.statut]}`}>
                    {STATUT_LABELS[e.statut]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AssignResponsableSelect
                    entrepriseId={e.id}
                    responsableId={e.responsable?.id ?? null}
                    users={responsables}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">{e._count.contacts}</td>
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
