"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/etudiants",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email ou mot de passe incorrect." }
        default:
          return { error: "Une erreur est survenue. Réessayez." }
      }
    }
    // NEXT_REDIRECT — laisser Next.js gérer
    throw error
  }
  return { error: null }
}
