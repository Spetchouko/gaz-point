"use client"

import { useCallback, useState } from "react"
import { AdminNav } from "@/app/_components/admin-nav"
import { AdminTopBar } from "@/app/_components/admin-top-bar"
import { MiniFooter } from "@/app/_components/mini-footer"
import { cn } from "@/lib/utils"
import type { StaffNavRole } from "@/app/_components/admin-nav-items"

export default function AdminLayout({
  children,
}: LayoutProps<"/admin/protected">) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), [])

  const staffRole = "admin" as StaffNavRole

  return (
    <div className="min-h-screen bg-background flex">
      {/* Barre latérale de navigation (référence Outlook) */}
      <aside
        className={cn(
          "shrink-0 flex h-full flex-col border-r border-border bg-card hidden lg:flex transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <AdminNav
          role={staffRole}
          permissions={[]}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre supérieure moderne */}
        <AdminTopBar
          role={staffRole}
          permissions={[]}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Zone de travail : occupe toute la surface disponible */}
        <main className="admin-workarea__main flex flex-1 flex-col overflow-auto">
          <div className="admin-workarea__padding flex flex-1 flex-col">
            {children}
            <div className="mt-auto">
              <MiniFooter copyrightText="© Tous droits réservés. Fait pour faciliter l'accès au gaz au Cameroun." />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}