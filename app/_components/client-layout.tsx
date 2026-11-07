"use client"

import { DashboardShell } from "./dashboard-shell"

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
    </DashboardShell>
  )
}
