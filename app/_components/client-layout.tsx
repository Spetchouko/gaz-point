"use client"

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
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={cn(
          "hidden w-64 flex-col border-r border-border bg-card lg:flex transition-all duration-300",
        )}
      >
        <ClientSidebar
          clientName={clientName}
          clientEmail={clientEmail}
          collapsed={false}
          setCollapsed={() => {}}
        />
      </aside>
      <div className="min-w-0 flex-1 lg:max-w-[calc(100%-16rem)] relative">
        <main className="overflow-auto">
          <div className="container mx-auto py-8 px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
