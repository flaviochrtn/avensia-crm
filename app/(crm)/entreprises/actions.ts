"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function assignerResponsableListe(formData: FormData) {
  const session = await auth()
  if (!session) return

  const entrepriseId  = formData.get("entreprise_id") as string
  const responsableId = formData.get("responsable_id") as string

  if (!entrepriseId) return

  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data:  { responsable_id: responsableId || null },
  })

  revalidatePath("/entreprises")
  revalidatePath(`/entreprises/${entrepriseId}`)
  revalidatePath("/dashboard")
}
