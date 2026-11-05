"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClientSidebar } from "./client-sidebar"
import type { Dispatch, SetStateAction } from "react"

export function ClientLayout({
  clientName,
  clientEmail,
  children,
  sidebarOpen: sidebarOpenProp,
  setSidebarOpen: setSidebarOpenProp,
}: {
  clientName: string
  clientEmail: string | null | undefined
  children: React.ReactNode
  sidebarOpen?: boolean
  setSidebarOpen?: Dispatch<SetStateAction<boolean>>
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isOpen = sidebarOpenProp ?? sidebarOpen
  const toggle = setSidebarOpenProp ?? setSidebarOpen

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Bouton hamburger mobile */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex items-center justify-center size-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors md:hidden"
        onClick={() => toggle((prev: boolean) => !prev)}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => toggle(false)}
          aria-hidden="true"
        />
      )}

      <ClientSidebar
        clientName={clientName}
        clientEmail={clientEmail}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sidebarOpen={isOpen}
        setSidebarOpen={toggle}
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
