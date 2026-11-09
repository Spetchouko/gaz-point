"use client"

import { DashboardShell } from "./dashboard-shell"
import { MiniFooter } from "./mini-footer"
import { ToastProvider } from "./toast-provider"

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
  const dashboardRole = role === "vendor" ? "vendor" : "client"

  return (
    <DashboardShell role={dashboardRole}>
      {children}
      <MiniFooter />
      <ToastProvider />
    </DashboardShell>
  )
}
