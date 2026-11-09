"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  MapPin,
  Cylinder,
  Shield,
  LogOut,
  Package,
  Truck,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type VendorNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  {
    href: "/dashboard/vendeur",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/vendeur/points-de-vente",
    label: "Mon point de vente",
    icon: MapPin,
  },
  {
    href: "/dashboard/vendeur/mes-bouteilles",
    label: "Mes bouteilles",
    icon: Package,
  },
  {
    href: "/dashboard/vendeur/disponibilites",
    label: "Mes disponibilités",
    icon: Cylinder,
  },
  {
    href: "/dashboard/vendeur/mes-services",
    label: "Mes services",
    icon: Truck,
  },
  {
    href: "/dashboard/vendeur/reservations",
    label: "Mes réservations",
    icon: Shield,
  },
  {
    href: "/dashboard/vendeur/profil",
    label: "Mon profil",
    icon: Shield,
  },
]

export function VendorSidebar({
  role,
  vendorName,
  vendorEmail,
  sidebarOpen,
  setSidebarOpen,
}: {
  role: string | null | undefined
  vendorName: string
  vendorEmail: string | null | undefined
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === "/dashboard/vendeur"
      ? pathname === "/dashboard/vendeur"
      : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const handleNavClick = (href: string) => {
    setSidebarOpen(false)
    router.push(href)
  }

  const initials = vendorName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

  return (
    <nav aria-label="Navigation vendeur" className="flex h-full flex-col">
      {/* En-tête du sidebar avec le nom de l'établissement */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard/vendeur"
          className="flex items-center gap-2 font-bold text-lg"
          onClick={() => {
            setSidebarOpen(false)
            router.push("/dashboard/vendeur")
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
        {VENDOR_NAV_ITEMS.map((item) => {
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
              {vendorName}
            </p>
            <p className={cn("truncate text-xs text-muted-foreground", sidebarOpen ? "" : "hidden")}>
              {vendorEmail ?? "Vendeur"}
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
