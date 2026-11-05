"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Cylinder,
  Calendar,
  User,
  Globe,
  LogOut,
  ChevronLeft,
  Store,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import type { Dispatch, SetStateAction } from "react"

type VendorNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  {
    href: "/dashboard/vendeur",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/vendeur/espace-pro",
    label: "Disponibilités",
    icon: Cylinder,
  },
  {
    href: "/dashboard/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/profil",
    label: "Mon profil",
    icon: User,
  },
  {
    href: "/",
    label: "Voir le site public",
    icon: Globe,
  },
]

export function VendorSidebar({
  role,
  vendorName,
  vendorEmail,
  collapsed,
  setCollapsed,
  sidebarOpen,
  setSidebarOpen,
}: {
  role: string | null | undefined
  vendorName: string
  vendorEmail: string | null | undefined
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/auth/connexion")
    router.refresh()
  }

  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  return (
    <nav
      aria-label="Navigation vendeur"
      className={cn(
        "fixed left-0 top-0 h-full z-49 flex flex-col border-r border-border bg-white shadow-lg transition-all duration-300",
        collapsed ? "w-16 md:w-16" : "w-64 md:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard/vendeur"
          className="flex items-center gap-2"
          onClick={handleNavClick}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-4" />
          </span>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight text-primary">
              GazPoints
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            className="size-8 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Réduire la sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto p-3 space-y-1">
        {VENDOR_NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-primary-foreground")} aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {vendorName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            {!collapsed && (
              <>
                <p className="truncate text-sm font-medium text-foreground">
                  {vendorName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {vendorEmail ?? "Vendeur"}
                </p>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center",
          )}
          aria-label="Se déconnecter"
        >
          <LogOut className="size-4" aria-hidden />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </nav>
  )
}
