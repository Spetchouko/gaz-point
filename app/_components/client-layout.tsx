"use client"

import { DashboardShell } from "./dashboard-shell"
import { MiniFooter } from "./mini-footer"

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
    <DashboardShell role="client">
      {children}
      <MiniFooter />
    </DashboardShell>
  )
}
