"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DashboardMenuButton } from "./dashboard-menu-button"
import { DashboardSidebar } from "./dashboard-sidebar"
import {
  LayoutDashboard,
  MapPin,
  Cylinder,
  Shield,
  LogOut,
} from "lucide-react"

const VENDOR_NAV_ITEMS: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
    href: "/dashboard/vendeur/disponibilites",
    label: "Disponibilités de gaz",
    icon: Cylinder,
  },
  {
    href: "/dashboard/vendeur/consignations",
    label: "Mes commandes et consignes",
    icon: Shield,
  },
  {
    href: "/dashboard/vendeur/profil",
    label: "Mon profil",
    icon: Shield,
  },
]

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
        <DashboardSidebar
          role={role}
          userName={vendorName}
          userEmail={vendorEmail}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navItems={VENDOR_NAV_ITEMS}
        />
      </aside>

      {/* Contenu principal — pas d'espace blanc inutile en haut */}
      <div className="min-w-0 flex-1 relative">
        <main className="overflow-auto">
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
