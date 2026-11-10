"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Heart,
  FileText,
  MessageSquarePlus,
  User,
  LogOut,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type ClientNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/dashboard/historique-codes",
    label: "Historique des codes",
    icon: FileText,
  },
  {
    href: "/avis",
    label: "Donner mon avis",
    icon: MessageSquarePlus,
  },
  {
    href: "/profil",
    label: "Mon profil",
    icon: User,
  },
]

export function ClientSidebar({
  clientName,
  clientEmail,
  sidebarOpen,
  setSidebarOpen,
}: {
  clientName: string
  clientEmail: string | null | undefined
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const handleNavClick = (href: string) => {
    setSidebarOpen(false)
    if (href.startsWith("http")) return
    router.push(href)
  }

  const initials = clientName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

  return (
    <nav aria-label="Navigation client" className="flex h-full flex-col">
      {/* En-tête du sidebar avec le logo GazPoints */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
          onClick={() => {
            setSidebarOpen(false)
            router.push("/dashboard")
          }}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-sm font-semibold">{initials}</span>
          </span>
          <span className={cn("font-bold tracking-tight", sidebarOpen ? "" : "hidden")}>
            GazPoints
          </span>
        </Link>
        <button
          type="button"
          className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
        >
          <span className="sr-only">Fermer</span>
        </button>
      </div>

      {/* Rubriques de navigation */}
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {CLIENT_NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4 shrink-0", sidebarOpen ? "" : "hidden")} aria-hidden />
                <span className={sidebarOpen ? "" : "hidden"}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Pied de sidebar : compte utilisateur + déconnexion */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-medium text-foreground", sidebarOpen ? "" : "hidden")}>
              {clientName}
            </p>
            <p className={cn("truncate text-xs text-muted-foreground", sidebarOpen ? "" : "hidden")}>
              {clientEmail ?? "Usager"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            sidebarOpen ? "" : "flex-col items-start gap-1 py-1"
          )}
          aria-label="Se déconnecter"
        >
          <LogOut className={cn("size-4 shrink-0", sidebarOpen ? "" : "hidden")} aria-hidden />
          <span className={sidebarOpen ? "" : "hidden"}>Déconnexion</span>
        </button>
      </div>
    </nav>
  )
}
