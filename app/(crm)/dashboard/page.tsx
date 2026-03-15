import { prisma } from "@/lib/prisma"
import Link from "next/link"

const FORMATIONS_RENTREE = [
  { label: "NDRC 1",          code: "BTS_NDRC_1" },
  { label: "NDRC 2",          code: "BTS_NDRC_2" },
  { label: "MCO 1",           code: "BTS_MCO_1" },
  { label: "MCO 2",           code: "BTS_MCO_2" },
  { label: "SAM 1",           code: "BTS_SAM_1" },
  { label: "Bachelor RDC 3",  code: "BACHELOR_RDC" },
  { label: "Bachelor RH 3",   code: "BACHELOR_RH" },
] as const

export default async function DashboardPage() {
  const now = new Date()

  const [
    etudiantsActifs,
    entreprisesSansResponsable,
    etudiantsSansConseiller,
    rdvsAVenir,
  ] = await Promise.all([
    prisma.etudiant.count({
      where: {
        deleted_at: null,
        statut: { in: ["EN_COURS", "INSCRIT_EN_RECHERCHE", "INSCRIT_ALTERNANCE"] },
      },
    }),
    prisma.entreprise.count({
      where: { deleted_at: null, responsable_id: null },
    }),
    prisma.etudiant.count({
      where: { deleted_at: null, conseiller_id: null },
    }),
    prisma.rendezVous.count({
      where: { statut: "PLANIFIE", date: { gt: now } },
    }),
  ])

  // Effectifs rentrée septembre 2026 — une seule requête
  const formationsAvecEffectifs = await prisma.formation.findMany({
    where: {
      code: { in: FORMATIONS_RENTREE.map((f) => f.code) },
    },
    select: {
      code: true,
      _count: {
        select: {
          etudiants: {
            where: {
              deleted_at: null,
              statut: { in: ["INSCRIT_EN_RECHERCHE", "INSCRIT_ALTERNANCE"] },
            },
          },
        },
      },
    },
  })

  // Map code → count (0 si la formation n'existe pas encore en base)
  const effectifsMap = Object.fromEntries(
    formationsAvecEffectifs.map((f) => [f.code, f._count.etudiants])
  )

  const kpis = [
    {
      label: "Étudiants actifs",
      value: etudiantsActifs,
      href:  "/etudiants?statut=EN_COURS",
      color: "text-blue-700",
      bg:    "bg-blue-50 border-blue-200",
    },
    {
      label: "Entreprises sans responsable",
      value: entreprisesSansResponsable,
      href:  "/entreprises?responsable_id=none",
      color: entreprisesSansResponsable > 0 ? "text-orange-700" : "text-green-700",
      bg:    entreprisesSansResponsable > 0 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200",
    },
    {
      label: "Étudiants sans conseiller",
      value: etudiantsSansConseiller,
      href:  "/etudiants?conseiller_id=none",
      color: etudiantsSansConseiller > 0 ? "text-orange-700" : "text-green-700",
      bg:    etudiantsSansConseiller > 0 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200",
    },
    {
      label: "RDVs à venir",
      value: rdvsAVenir,
      href:  "/rdvs",
      color: "text-purple-700",
      bg:    "bg-purple-50 border-purple-200",
    },
  ]

  const aTraiter = [
    entreprisesSansResponsable > 0 && {
      label:  `${entreprisesSansResponsable} entreprise${entreprisesSansResponsable > 1 ? "s" : ""} sans responsable`,
      href:   "/entreprises?responsable_id=none",
    },
    etudiantsSansConseiller > 0 && {
      label:  `${etudiantsSansConseiller} étudiant${etudiantsSansConseiller > 1 ? "s" : ""} sans conseiller`,
      href:   "/etudiants?conseiller_id=none",
    },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`block border rounded-lg p-5 hover:shadow-sm transition-shadow ${kpi.bg}`}
          >
            <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </Link>
        ))}
      </div>

      {/* Effectifs rentrée septembre 2026 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Effectifs rentrée septembre 2026
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {FORMATIONS_RENTREE.map(({ label, code }) => (
            <Link
              key={code}
              href={`/etudiants?formation_code=${code}&rentree=2026`}
              className="flex flex-col items-center justify-center border border-indigo-100 bg-indigo-50 rounded-lg p-4 hover:shadow-sm transition-shadow text-center"
            >
              <span className="text-2xl font-bold text-indigo-700">
                {effectifsMap[code] ?? 0}
              </span>
              <span className="text-xs text-gray-500 mt-1 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* À traiter */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-md">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">À traiter</h2>
        {aTraiter.length === 0 ? (
          <p className="text-sm text-green-600">Aucun élément en attente ✓</p>
        ) : (
          <ul className="space-y-2">
            {aTraiter.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-orange-700 hover:text-orange-900 hover:underline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
