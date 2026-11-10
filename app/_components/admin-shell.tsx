"use client"

import { useCallback, useState } from "react"
import { DashboardNav } from "./dashboard-nav"
import { DashboardTopBar } from "./dashboard-top-bar"
import { MiniFooter } from "./mini-footer"
import type { DashboardRole } from "./dashboard-nav-items"
import { cn } from "@/lib/utils"

export function AdminShell({
  role,
  permissions,
  children,
}: {
  role: string
  permissions: string[]
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), [])

  const dashboardRole = role as DashboardRole

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Barre latérale de navigation (desktop uniquement) */}
      <aside
        className={cn(
          "shrink-0 flex h-full flex-col border-r border-border bg-card hidden lg:flex transition-width duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <DashboardNav
          role={dashboardRole}
          permissions={permissions}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre supérieure moderne */}
        <DashboardTopBar
          role={dashboardRole}
          permissions={permissions}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Zone de travail : occupe toute la surface disponible */}
        <main className="admin-workarea__main flex-1 overflow-auto">
          <div className="admin-workarea__padding">{children}</div>
        </main>
      </div>
      <MiniFooter />
    </div>
  )
}
