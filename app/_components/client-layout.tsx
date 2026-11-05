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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isOpen = sidebarOpenProp ?? sidebarOpen
  const toggle = setSidebarOpenProp ?? setSidebarOpen

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={cn(
          "hidden w-64 flex-col border-r border-border bg-card lg:flex transition-all duration-300",
          isOpen && "lg:flex",
          !isOpen && "lg:hidden",
        )}
      >
        <ClientSidebar
          clientName={clientName}
          clientEmail={clientEmail}
          collapsed={false}
          setCollapsed={() => {}}
          sidebarOpen={isOpen}
          setSidebarOpen={toggle}
        />
      </aside>
      <div className="min-w-0 flex-1 lg:max-w-[calc(100%-16rem)] relative">
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

        <main className="overflow-auto">
          <div className="container mx-auto py-8 px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
