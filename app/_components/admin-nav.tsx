"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import React from "react"
import type { ComponentType } from "react"
import {
  getAdminNavSections,
  type NavSection,
  type StaffNavRole,
} from "@/app/_components/admin-nav-items"

export function AdminNav({
  role,
  permissions,
  collapsed,
  onToggleCollapse,
}: {
  role: StaffNavRole
  permissions: string[]
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined
  const roleLabel = role === "collaborateur" ? "Collaborateur" : "Administrateur"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A"
  const sections = getAdminNavSections(role, permissions)

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const isSectionActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.href))

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.key))
  )

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isSectionOpen = (key: string) => openSections.has(key)

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

  const linkBase =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
  const activeCls = "bg-primary text-primary-foreground"
  const inactiveCls = "text-muted-foreground hover:bg-muted hover:text-foreground"

  const renderItems = (items: NavSection["items"], indent: number) => {
    return items.map((item) => {
      const active = isActive(item.href)
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              linkBase,
              `pl-${indent === 0 ? 3 : 9}`,
              active ? activeCls : inactiveCls
            )}
          >
            {renderIcon(item.icon)}
            {!collapsed && item.label}
          </Link>
        </li>
      )
    })
  }

  return (
    <nav aria-label="Navigation administration" className="flex h-full flex-col">
      {/* En-tête de la barre latérale : logo + nom de l'application */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-center px-1" : "px-3 font-bold text-lg tracking-tight"
          )}
          title="GAZ POINT Admin"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className={cn("text-sm font-semibold", collapsed ? "hidden" : "")}>
              {initial}
            </span>
          </span>
          {!collapsed && <span>GAZ POINT Admin</span>}
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
      <ul className="flex-1 overflow-y-auto p-1 space-y-1">
        {sections.map((section) => {
          const active = isSectionActive(section)
          const open = isSectionOpen(section.key)
          const showItems = collapsed || open

          return (
            <React.Fragment key={section.key}>
              {!collapsed && (
                <div
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted cursor-pointer select-none",
                    active ? "text-primary font-bold" : ""
                  )}
                  role="button"
                  aria-expanded={open}
                  aria-label={section.label}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleSection(section.key)
                    }
                  }}
                >
                  {section.label}
                  <ChevronDown
                    className={cn("ml-auto size-3.5 transition-transform duration-200", open && "rotate-180")}
                    aria-hidden
                  />
                </div>
              )}

              {showItems ? (
                <ul className="space-y-0.5">
                  {renderItems(section.items, 0)}
                </ul>
              ) : null}
            </React.Fragment>
          )
        })}
      </ul>

      {/* Pied de barre latérale : profil + déconnexion */}
      <div className="border-t border-border p-1 space-y-1">
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
                {user?.name ?? "Utilisateur"}
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
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
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
