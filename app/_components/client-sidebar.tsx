"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  LogOut,
  ChevronLeft,
  Store,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import type { Dispatch, SetStateAction } from "react"

type ClientNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard",
    label: "Trouver du gaz",
    icon: Search,
  },
  {
    href: "/dashboard/reservations",
    label: "Historique de mes activités",
    icon: Calendar,
  },
]

export function ClientSidebar({
  clientName,
  clientEmail,
  collapsed,
  setCollapsed,
  sidebarOpen,
  setSidebarOpen,
}: {
  clientName: string
  clientEmail: string | null | undefined
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
    router.push("/")
    router.refresh()
  }

  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  return (
    <nav
      aria-label="Navigation client"
      className={cn(
        "fixed left-0 top-0 h-full z-49 flex flex-col border-r border-border bg-white shadow-lg transition-all duration-300",
        collapsed ? "w-16 md:w-16" : "w-64 md:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard"
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
        {/* Groupe : Mon espace */}
        <li className="px-2 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 mb-2">
            Mon espace
          </p>
        </li>
        {CLIENT_NAV_ITEMS.slice(0, 1).map((item) => {
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

        {/* Groupe : Recherche de gaz */}
        <li className="px-2 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 mb-2">
            Recherche de gaz
          </p>
        </li>
        {CLIENT_NAV_ITEMS.slice(1, 2).map((item) => {
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

        {/* Groupe : Mes activités */}
        <li className="px-2 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 mb-2">
            Mes activités
          </p>
        </li>
        {CLIENT_NAV_ITEMS.slice(2, 3).map((item) => {
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
            {clientName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            {!collapsed && (
              <>
                <p className="truncate text-sm font-medium text-foreground">
                  {clientName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {clientEmail ?? "Usager"}
                </p>
              </>
            )}
          </div>
        </div>
        <li className="px-2 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 mb-2">
            Autres
          </p>
        </li>
        <Link
          href="/"
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">Retour à l'accueil</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Se déconnecter"
        >
          <LogOut className="size-4" aria-hidden />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </nav>
  )
}
