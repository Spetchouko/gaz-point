"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClientSidebar } from "./client-sidebar"

export function ClientLayout({
  clientName,
  clientEmail,
  children,
}: {
  clientName: string
  clientEmail: string | null | undefined
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Overlay mobile est maintenant géré par la page */}
      {false && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <ClientSidebar
        clientName={clientName}
        clientEmail={clientEmail}
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
