import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import Link from "next/link"

const NAV = [
  { href: "/dashboard",  label: "Tableau de bord" },
  { href: "/etudiants",  label: "Étudiants" },
  { href: "/entreprises", label: "Entreprises" },
]

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const user = session.user

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col bg-gray-900 text-white">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-700">
          <span className="text-sm font-semibold tracking-wide">Avensia CRM</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-700 text-xs text-gray-400">
          <p className="font-medium text-gray-200 truncate">{user.name}</p>
          <p className="truncate mb-3">{user.role}</p>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
