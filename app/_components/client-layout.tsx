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
  sidebarOpen = false,
  setSidebarOpen = () => {},
}: {
  clientName: string
  clientEmail: string | null | undefined
  children: React.ReactNode
  sidebarOpen?: boolean
  setSidebarOpen?: Dispatch<SetStateAction<boolean>>
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="relative min-h-screen bg-gray-50">
      <ClientSidebar
        clientName={clientName}
        clientEmail={clientEmail}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
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
