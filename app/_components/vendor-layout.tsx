"use client"

import { useState } from "react"
import { Menu, X, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Bouton hamburger retiré de la barre de navigation générale */}
      {/* L'état de sidebar est maintenant géré par la page dashboard */}

      <VendorSidebar
        role={role}
        vendorName={vendorName}
        vendorEmail={vendorEmail}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sidebarOpen={false}
        setSidebarOpen={() => {}}
      />

      <main
        className={cn(
          "flex-1 min-h-screen bg-gray-50 transition-all duration-300",
          collapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {children}
      </main>
    </div>
  )
}
