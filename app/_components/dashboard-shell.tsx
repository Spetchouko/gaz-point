"use client"

import { useCallback, useState } from "react"
import { DashboardNav } from "./dashboard-nav"
import { DashboardTopBar } from "./dashboard-top-bar"
import type { DashboardRole } from "./dashboard-nav-items"
import { cn } from "@/lib/utils"

export function DashboardShell({
  role,
  children,
}: {
  role: DashboardRole
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), [])

  return (
    <div className="min-h-screen bg-background flex">
      {/* Barre latérale de navigation (référence Outlook) */}
      <aside
        className={cn(
          "shrink-0 flex h-full flex-col border-r border-border bg-card hidden lg:flex transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <DashboardNav
          role={role}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre supérieure moderne */}
        <DashboardTopBar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Zone de travail : occupe toute la surface disponible */}
        <main className="admin-workarea__main">
          <div className="admin-workarea__padding">{children}</div>
        </main>
      </div>
    </div>
  )
}
