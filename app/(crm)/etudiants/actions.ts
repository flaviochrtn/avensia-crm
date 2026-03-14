"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function assignerConseiller(formData: FormData) {
  const session = await auth()
  if (!session) return

  const etudiantId   = formData.get("etudiant_id") as string
  const conseillerId = formData.get("conseiller_id") as string

  if (!etudiantId) return

  await prisma.etudiant.update({
    where: { id: etudiantId },
    data:  { conseiller_id: conseillerId || null },
  })

  revalidatePath("/etudiants")
  revalidatePath(`/etudiants/${etudiantId}`)
  revalidatePath("/dashboard")
}
