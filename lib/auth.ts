import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Étend les types Auth.js pour exposer id et role dans la session
declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"]
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user || !user.actif) return null

        const passwordValid = await bcrypt.compare(password, user.password)
        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // `user` vient du authorize() — on y a mis role explicitement
        token.role = (user as { id: string; role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = (token.role as string) ?? "COMMERCIAL"
      return session
    },
  },
})
