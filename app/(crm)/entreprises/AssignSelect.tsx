"use client"

import { useRef, useTransition } from "react"
import { assignerResponsableListe } from "./actions"

type User = { id: string; prenom: string; nom: string }

export function AssignResponsableSelect({
  entrepriseId,
  responsableId,
  users,
}: {
  entrepriseId: string
  responsableId: string | null
  users: User[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      ref={formRef}
      action={assignerResponsableListe}
      className="inline"
    >
      <input type="hidden" name="entreprise_id" value={entrepriseId} />
      <select
        name="responsable_id"
        defaultValue={responsableId ?? ""}
        disabled={isPending}
        onChange={() =>
          startTransition(() => {
            formRef.current?.requestSubmit()
          })
        }
        className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 ${
          !responsableId
            ? "border-orange-300 bg-orange-50 text-orange-700"
            : "border-gray-200 bg-white text-gray-700"
        } ${isPending ? "opacity-50" : ""}`}
      >
        <option value="">— Non assigné</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.prenom} {u.nom}
          </option>
        ))}
      </select>
    </form>
  )
}
