export default function EntrepriseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Fiche entreprise</h1>
      <p className="mt-2 text-gray-500">ID : {params.id} — à implémenter</p>
    </main>
  )
}
