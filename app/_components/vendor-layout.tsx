"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DashboardMenuButton } from "./dashboard-menu-button"
import { VendorSidebar } from "./vendor-sidebar"

export function VendorLayout({
  role,
  vendorName,
  vendorEmail,
  children,
}: {
  role: string | null | undefined
  vendorName: string
  vendorEmail: string | null | undefined
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background relative">
      {/* Bouton de menu mobile — sous la navigation principale, côté gauche */}
      <DashboardMenuButton
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((p) => !p)}
        className="fixed left-4 top-16 z-50 md:hidden"
      />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar latérale — à gauche, dépliable vers la droite */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-background",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop : toujours présent
          "md:relative md:translate-x-0 md:w-64 md:flex md:inset-y-auto md:left-auto md:top-auto md:h-auto md:z-auto"
        )}
      >
        <VendorSidebar
          role={role}
          vendorName={vendorName}
          vendorEmail={vendorEmail}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </aside>

      {/* Contenu principal — s'adapte à l'ouverture/fermeture du menu */}
      <div className="min-w-0 flex-1 relative">
        <main className="overflow-auto">
          <div className="container mx-auto py-8 px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
