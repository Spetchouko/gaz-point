"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import React from "react"
import type { ComponentType } from "react"
import {
  getClientNavItems,
  getVendorNavItems,
  type DashboardNavItem,
  type DashboardRole,
} from "./dashboard-nav-items"

export function DashboardNav({
  role,
  collapsed,
  onToggleCollapse,
}: {
  role: DashboardRole
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined
  const items = role === "vendor" ? getVendorNavItems() : getClientNavItems()

  const roleLabel = role === "vendor" ? "Vendeur" : "Usager"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U"
  const userName = user?.name ?? (role === "vendor" ? "Vendeur" : "Usager")

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const renderIcon = (Icon: ComponentType<{ className?: string }>) => {
    if (collapsed) {
      return (
        <div className="flex size-8 shrink-0 items-center justify-center">
          <Icon className="size-4" aria-hidden />
        </div>
      )
    }
    return <Icon className="size-4 shrink-0" aria-hidden />
  }

  const isSectionActive = (section: { items: DashboardNavItem[] }) =>
    section.items.some((item) => isActive(item.href))

  const sections: { key: string; label: string; items: DashboardNavItem[] }[] = [
    { key: "navigation", label: "Navigation", items },
  ]

  return (
    <nav aria-label="Navigation du dashboard" className="flex h-full flex-col">
      {/* En-tête de la barre latérale : logo + nom de l'application */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-center px-1" : "px-3 font-bold text-lg tracking-tight"
          )}
          title="GAZ POINT"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className={cn("text-sm font-semibold", collapsed ? "hidden" : "")}>
              {initial}
            </span>
          </span>
          {!collapsed && <span>GazPoints</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground"
          title={collapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {/* Sections de navigation */}
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.map((section) => {
          const active = isSectionActive(section)
          return (
            <React.Fragment key={section.key}>
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {renderIcon(item.icon)}
                    {!collapsed && item.label}
                  </Link>
                </li>
              ))}
            </React.Fragment>
          )
        })}
      </ul>

      {/* Pied de barre latérale : profil + déconnexion */}
      <div className="border-t border-border p-2 space-y-1">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-muted",
            collapsed ? "justify-center px-1" : "px-3"
          )}
          role="button"
          tabIndex={0}
          aria-label="Profil utilisateur"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-1" : "px-3"
          )}
        >
          <LogOut className="size-4" aria-hidden />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </nav>
  )
}